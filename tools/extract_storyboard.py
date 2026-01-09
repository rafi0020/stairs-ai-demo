#!/usr/bin/env python3
"""
Stairs-AI Demo - Extract storyboard thumbnails from video

Generates chapter thumbnails at specified timestamps and creates
storyboard.json for the web UI.
"""

import argparse
import cv2
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Any


# Default chapters based on the demo video scenario
DEFAULT_CHAPTERS = [
    {
        "label": "Single Person (Baseline)",
        "start_sec": 0.0,
        "end_sec": 1.8,
        "thumbnail_time": 0.5,
        "expected_focus": "non_compliance",
        "description": "One person ascending stairs, not holding rail - establishes non-compliance baseline."
    },
    {
        "label": "Multi-Person + Occlusion",
        "start_sec": 1.8,
        "end_sec": 5.8,
        "thumbnail_time": 2.5,
        "expected_focus": "occlusion",
        "description": "Second person enters from bottom-right. Two persons present with frequent occlusion near rail region."
    },
    {
        "label": "Phone-Like Gesture",
        "start_sec": 4.0,
        "end_sec": 8.0,
        "thumbnail_time": 5.0,
        "expected_focus": "phone_detection",
        "description": "Nearer person raises hand to ear/face area - demonstrates phone posture proxy and its limitations."
    },
    {
        "label": "Rail Contact Intermittent",
        "start_sec": 5.0,
        "end_sec": 6.7,
        "thumbnail_time": 5.8,
        "expected_focus": "mask_sensitivity",
        "description": "Rail contact detection fluctuates - ideal for demonstrating mask geometry sensitivity and debounce."
    },
    {
        "label": "Single Person End",
        "start_sec": 6.7,
        "end_sec": 8.0,
        "thumbnail_time": 7.2,
        "expected_focus": "state_stabilization",
        "description": "Far person exits, nearer person remains. Rail/phone classification fluctuates - shows explainability value."
    }
]


def extract_frame_at_time(video_path: str, time_sec: float) -> Any:
    """
    Extract a single frame from video at specified time.
    
    Args:
        video_path: Path to video file
        time_sec: Time in seconds
        
    Returns:
        Frame image (numpy array) or None if failed
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return None
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_num = int(time_sec * fps)
    
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
    ret, frame = cap.read()
    cap.release()
    
    return frame if ret else None


def create_thumbnail(frame, max_width: int = 400) -> Any:
    """Resize frame to thumbnail size"""
    if frame is None:
        return None
    
    h, w = frame.shape[:2]
    if w > max_width:
        scale = max_width / w
        new_w = max_width
        new_h = int(h * scale)
        frame = cv2.resize(frame, (new_w, new_h))
    
    return frame


def extract_storyboard(
    video_path: str,
    output_dir: str,
    chapters: List[Dict[str, Any]] = None,
    thumbnail_width: int = 400
) -> Dict[str, Any]:
    """
    Extract storyboard thumbnails and generate metadata.
    
    Args:
        video_path: Path to input video
        output_dir: Directory to save thumbnails
        chapters: Chapter definitions (uses DEFAULT_CHAPTERS if None)
        thumbnail_width: Maximum thumbnail width
        
    Returns:
        Storyboard data dict
    """
    if chapters is None:
        chapters = DEFAULT_CHAPTERS
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Get video info
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    storyboard_chapters = []
    
    for i, chapter in enumerate(chapters):
        thumbnail_time = chapter.get("thumbnail_time", chapter["start_sec"])
        
        # Extract frame
        frame = extract_frame_at_time(video_path, thumbnail_time)
        
        if frame is not None:
            # Create thumbnail
            thumb = create_thumbnail(frame, thumbnail_width)
            
            # Save thumbnail
            thumb_filename = f"chapter_{i:02d}_{chapter['label'].lower().replace(' ', '_').replace('(', '').replace(')', '')}.jpg"
            thumb_path = os.path.join(output_dir, thumb_filename)
            cv2.imwrite(thumb_path, thumb, [cv2.IMWRITE_JPEG_QUALITY, 90])
            
            relative_path = f"screenshots/{thumb_filename}"
        else:
            relative_path = ""
            print(f"Warning: Could not extract frame at {thumbnail_time}s for chapter '{chapter['label']}'")
        
        storyboard_chapters.append({
            "id": i,
            "label": chapter["label"],
            "start_sec": chapter["start_sec"],
            "end_sec": chapter["end_sec"],
            "thumbnail_time": thumbnail_time,
            "thumbnail_path": relative_path,
            "expected_focus": chapter["expected_focus"],
            "description": chapter.get("description", "")
        })
    
    storyboard = {
        "video": {
            "path": video_path,
            "duration_sec": duration,
            "fps": fps,
            "width": width,
            "height": height,
            "total_frames": total_frames
        },
        "chapters": storyboard_chapters,
        "default_chapter_index": 0
    }
    
    return storyboard


def main():
    parser = argparse.ArgumentParser(description="Extract storyboard thumbnails from video")
    parser.add_argument("--video", type=str, required=True,
                        help="Path to input video file")
    parser.add_argument("--out", type=str, default="assets/screenshots",
                        help="Output directory for thumbnails")
    parser.add_argument("--storyboard-json", type=str, default=None,
                        help="Path to save storyboard.json (default: web/public/demo/storyboard.json)")
    parser.add_argument("--thumbnail-width", type=int, default=400,
                        help="Maximum thumbnail width")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.video):
        print(f"Error: Video file not found: {args.video}")
        sys.exit(1)
    
    print(f"Extracting storyboard from: {args.video}")
    print(f"Saving thumbnails to: {args.out}")
    
    storyboard = extract_storyboard(
        args.video,
        args.out,
        thumbnail_width=args.thumbnail_width
    )
    
    # Save storyboard.json
    storyboard_path = args.storyboard_json
    if storyboard_path is None:
        # Save to web/public/demo/ and also to root for local reference
        web_demo_dir = "web/public/demo"
        Path(web_demo_dir).mkdir(parents=True, exist_ok=True)
        storyboard_path = os.path.join(web_demo_dir, "storyboard.json")
    
    Path(storyboard_path).parent.mkdir(parents=True, exist_ok=True)
    
    with open(storyboard_path, 'w') as f:
        json.dump(storyboard, f, indent=2)
    
    print(f"\nStoryboard saved to: {storyboard_path}")
    print(f"Extracted {len(storyboard['chapters'])} chapter thumbnails:")
    for ch in storyboard['chapters']:
        print(f"  - {ch['label']} ({ch['start_sec']:.1f}s - {ch['end_sec']:.1f}s)")


if __name__ == "__main__":
    main()
