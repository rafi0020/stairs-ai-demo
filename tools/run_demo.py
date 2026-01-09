#!/usr/bin/env python3
"""
Stairs-AI Demo - Main inference and export pipeline

Runs complete inference pipeline on a video file and exports:
- events.jsonl: Committed state change events
- evidence_frames/: Saved frames on state commits
- frame_packets.jsonl: Per-frame whitebox data for UI
- summary.json: Aggregate statistics
- preview_annotated.mp4: Annotated video (optional)
"""

import argparse
import cv2
import time
import os
import sys
from pathlib import Path
from typing import List, Optional
from tqdm import tqdm

# Add tools directory to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.types import (
    BoundingBox, PersonAnalysis, FrameMetrics, FramePacket,
    RailHitTestResult, ComplianceStatus, HAND_LANDMARKS
)
from utils.masks import RailMaskManager
from utils.pose import PoseEstimator
from utils.phone import detect_phone_usage, PHONE_DETECTION_THRESHOLD
from utils.state_machine import DebounceStateMachine, MIN_STATE_DURATION
from utils.overlay import draw_full_overlay
from utils.events import EventLogger, generate_evidence_filename
from utils.io import save_jsonl, save_json, create_summary


# YOLO configuration
YOLO_CONF_THRESHOLD = 0.50
YOLO_PERSON_CLASS = 0  # COCO person class


def load_yolo_model():
    """Load YOLO model for person detection"""
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")  # Use nano model for speed
    return model


def detect_persons(model, frame, conf_threshold: float = YOLO_CONF_THRESHOLD) -> List[BoundingBox]:
    """
    Run YOLO person detection on frame.
    
    Args:
        model: YOLO model
        frame: Input frame (BGR)
        conf_threshold: Confidence threshold
        
    Returns:
        List of BoundingBox for detected persons
    """
    results = model(frame, conf=conf_threshold, classes=[YOLO_PERSON_CLASS], verbose=False)
    
    bboxes = []
    for result in results:
        if result.boxes is None:
            continue
        
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
            conf = float(box.conf[0].cpu().numpy())
            
            bboxes.append(BoundingBox(
                x1=int(x1),
                y1=int(y1),
                x2=int(x2),
                y2=int(y2),
                confidence=conf
            ))
    
    # Sort by x-coordinate for consistent person IDs
    bboxes.sort(key=lambda b: b.x1)
    
    return bboxes


def perform_rail_hit_test(
    pose,
    mask_manager: RailMaskManager
) -> RailHitTestResult:
    """
    Test if person's hands are in rail mask polygon.
    
    Args:
        pose: PersonPose object
        mask_manager: RailMaskManager with loaded polygons
        
    Returns:
        RailHitTestResult with hit details
    """
    result = RailHitTestResult()
    
    if pose is None:
        return result
    
    # Check hand-related landmarks
    left_hit = False
    right_hit = False
    
    for lm_name in HAND_LANDMARKS:
        lm = pose.get_landmark(lm_name)
        if lm is None or lm.frame_x is None:
            continue
        
        if lm.visibility < 0.3:
            continue
        
        in_polygon, hit_ids = mask_manager.point_in_any_polygon(lm.frame_x, lm.frame_y)
        
        if in_polygon:
            result.hit_points[lm_name] = [lm.frame_x, lm.frame_y]
            result.hit_polygon_ids.extend([pid for pid in hit_ids if pid not in result.hit_polygon_ids])
            
            if "left" in lm_name:
                left_hit = True
                if "wrist" in lm_name:
                    result.left_wrist_in_rail = True
            else:
                right_hit = True
                if "wrist" in lm_name:
                    result.right_wrist_in_rail = True
    
    result.left_hand_in_rail = left_hit
    result.right_hand_in_rail = right_hit
    result.any_hand_in_rail = left_hit or right_hit
    
    return result


def compute_frame_metrics(persons: List[PersonAnalysis]) -> FrameMetrics:
    """
    Compute aggregated frame-level metrics.
    
    Args:
        persons: List of analyzed persons
        
    Returns:
        FrameMetrics
    """
    total = len(persons)
    
    if total == 0:
        return FrameMetrics(
            total_people=0,
            people_holding_rail=0,
            people_using_phone=0,
            compliance=ComplianceStatus.NO_PERSONS,
            phone_talking=0
        )
    
    holding_rail = sum(1 for p in persons if p.rail_hit and p.rail_hit.any_hand_in_rail)
    using_phone = sum(1 for p in persons if p.phone_result and p.phone_result.is_using_phone)
    
    # Compliance: 0 = all holding, 1 = some not holding, 2 = no persons
    if holding_rail == total:
        compliance = ComplianceStatus.COMPLIANT
    else:
        compliance = ComplianceStatus.NON_COMPLIANT
    
    # Phone talking: 1 if anyone using phone
    phone_talking = 1 if using_phone > 0 else 0
    
    return FrameMetrics(
        total_people=total,
        people_holding_rail=holding_rail,
        people_using_phone=using_phone,
        compliance=int(compliance),
        phone_talking=phone_talking
    )


def process_frame(
    frame,
    frame_idx: int,
    time_sec: float,
    yolo_model,
    pose_estimator: PoseEstimator,
    mask_manager: RailMaskManager,
    phone_threshold: float = PHONE_DETECTION_THRESHOLD
) -> tuple:
    """
    Process a single frame through the full pipeline.
    
    Returns:
        Tuple of (persons_list, frame_metrics)
    """
    h, w = frame.shape[:2]
    
    # Step 1: YOLO detection
    bboxes = detect_persons(yolo_model, frame)
    
    persons = []
    
    for idx, bbox in enumerate(bboxes):
        # Step 2: Extract crop and run pose
        crop, crop_info = pose_estimator.extract_crop(frame, bbox)
        pose = pose_estimator.estimate_pose(crop, crop_info, w, h)
        
        # Step 3: Rail hit test
        rail_hit = perform_rail_hit_test(pose, mask_manager)
        
        # Step 4: Phone heuristic
        phone_result = None
        if pose:
            phone_result = detect_phone_usage(pose, threshold=phone_threshold)
        
        person = PersonAnalysis(
            person_id=idx,
            bbox=bbox,
            pose=pose,
            rail_hit=rail_hit,
            phone_result=phone_result
        )
        persons.append(person)
    
    # Step 5: Aggregate metrics
    metrics = compute_frame_metrics(persons)
    
    return persons, metrics


def main():
    parser = argparse.ArgumentParser(description="Stairs-AI Demo Pipeline")
    parser.add_argument("--video", type=str, required=True,
                        help="Path to input video file")
    parser.add_argument("--masks", type=str, default="rail_masks.json",
                        help="Path to rail masks JSON")
    parser.add_argument("--out", type=str, default="demo_output",
                        help="Output directory")
    parser.add_argument("--save-preview-video", action="store_true",
                        help="Save annotated preview video")
    parser.add_argument("--phone-threshold", type=float, default=PHONE_DETECTION_THRESHOLD,
                        help="Phone detection threshold")
    parser.add_argument("--debounce-duration", type=float, default=MIN_STATE_DURATION,
                        help="Minimum state duration for debounce")
    parser.add_argument("--yolo-conf", type=float, default=YOLO_CONF_THRESHOLD,
                        help="YOLO confidence threshold")
    parser.add_argument("--skip-frames", type=int, default=1,
                        help="Process every Nth frame (1 = all frames)")
    
    args = parser.parse_args()
    
    # Validate input
    if not os.path.exists(args.video):
        print(f"Error: Video file not found: {args.video}")
        sys.exit(1)
    
    if not os.path.exists(args.masks):
        print(f"Warning: Masks file not found: {args.masks}, using default")
        from utils.masks import create_default_masks
        create_default_masks(args.masks)
    
    # Create output directory
    Path(args.out).mkdir(parents=True, exist_ok=True)
    
    # Load components
    print("Loading models...")
    yolo_model = load_yolo_model()
    mask_manager = RailMaskManager(args.masks)
    pose_estimator = PoseEstimator()
    state_machine = DebounceStateMachine(min_duration=args.debounce_duration)
    event_logger = EventLogger(args.out)
    
    # Open video
    cap = cv2.VideoCapture(args.video)
    if not cap.isOpened():
        print(f"Error: Could not open video: {args.video}")
        sys.exit(1)
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0
    
    print(f"Video: {args.video}")
    print(f"  Resolution: {width}x{height}")
    print(f"  FPS: {fps}")
    print(f"  Frames: {total_frames}")
    print(f"  Duration: {duration:.2f}s")
    
    # Setup video writer for preview
    video_writer = None
    if args.save_preview_video:
        preview_path = os.path.join(args.out, "preview_annotated.mp4")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        video_writer = cv2.VideoWriter(preview_path, fourcc, fps, (width, height))
    
    # Process frames
    frame_packets = []
    all_events = []
    
    config = {
        "yolo_conf": args.yolo_conf,
        "phone_threshold": args.phone_threshold,
        "debounce_duration": args.debounce_duration,
        "skip_frames": args.skip_frames
    }
    
    print("\nProcessing frames...")
    start_time = time.time()
    
    with tqdm(total=total_frames, unit="frames") as pbar:
        frame_idx = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            time_sec = frame_idx / fps if fps > 0 else 0
            
            # Skip frames if requested
            if frame_idx % args.skip_frames != 0:
                frame_idx += 1
                pbar.update(1)
                continue
            
            # Process frame
            persons, metrics = process_frame(
                frame, frame_idx, time_sec,
                yolo_model, pose_estimator, mask_manager,
                args.phone_threshold
            )
            
            # Update state machine
            sm_debug = state_machine.update(metrics, time_sec, frame_idx)
            
            # Check for event commit
            event = None
            evidence_saved = False
            evidence_filename = None
            
            if sm_debug.would_commit:
                evidence_filename = generate_evidence_filename(time_sec, metrics)
                
                # Create annotated frame for evidence
                annotated = frame.copy()
                draw_full_overlay(annotated, persons, metrics, mask_manager, time_sec, frame_idx)
                
                event = state_machine.commit_if_ready(
                    metrics, time_sec, frame_idx, evidence_filename
                )
                
                if event:
                    event_logger.log_event(event, annotated)
                    all_events.append(event.to_dict())
                    evidence_saved = True
            
            # Create frame packet for whitebox export
            packet = FramePacket(
                frame_index=frame_idx,
                time_sec=time_sec,
                metrics=metrics,
                persons=persons,
                state_machine=sm_debug,
                event_committed=event is not None,
                evidence_saved=evidence_saved,
                evidence_filename=evidence_filename
            )
            frame_packets.append(packet.to_dict())
            
            # Draw overlay for preview video
            if video_writer:
                annotated = frame.copy()
                draw_full_overlay(annotated, persons, metrics, mask_manager, time_sec, frame_idx)
                video_writer.write(annotated)
            
            frame_idx += 1
            pbar.update(1)
    
    processing_time = time.time() - start_time
    
    # Cleanup
    cap.release()
    if video_writer:
        video_writer.release()
    pose_estimator.close()
    
    # Save outputs
    print("\nSaving outputs...")
    
    # Frame packets
    packets_path = os.path.join(args.out, "frame_packets.jsonl")
    save_jsonl(frame_packets, packets_path)
    print(f"  Saved {len(frame_packets)} frame packets to {packets_path}")
    
    # Summary
    summary = create_summary(
        frame_packets=frame_packets,
        events=all_events,
        video_path=args.video,
        video_duration=duration,
        video_fps=fps,
        total_frames=total_frames,
        processing_time=processing_time,
        config=config
    )
    summary_path = os.path.join(args.out, "summary.json")
    save_json(summary, summary_path)
    print(f"  Saved summary to {summary_path}")
    
    # Print summary
    print("\n" + "="*50)
    print("PROCESSING COMPLETE")
    print("="*50)
    print(f"Total frames: {total_frames}")
    print(f"Processing time: {processing_time:.2f}s ({total_frames/processing_time:.1f} fps)")
    print(f"Events committed: {len(all_events)}")
    print(f"Compliance ratio: {summary['ratios']['compliance_ratio']:.2%}")
    print(f"Phone detected ratio: {summary['ratios']['phone_ratio']:.2%}")
    
    if args.save_preview_video:
        print(f"\nPreview video saved to: {os.path.join(args.out, 'preview_annotated.mp4')}")
    
    print(f"\nOutputs saved to: {args.out}/")


if __name__ == "__main__":
    main()
