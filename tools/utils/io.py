"""
Stairs-AI Demo - I/O utilities for data export
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


def save_jsonl(data: List[Dict[str, Any]], filepath: str) -> None:
    """Save list of dicts as JSONL (one JSON object per line)"""
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w') as f:
        for item in data:
            f.write(json.dumps(item) + "\n")


def load_jsonl(filepath: str) -> List[Dict[str, Any]]:
    """Load JSONL file into list of dicts"""
    data = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def save_json(data: Any, filepath: str, indent: int = 2) -> None:
    """Save data as formatted JSON"""
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=indent)


def load_json(filepath: str) -> Any:
    """Load JSON file"""
    with open(filepath, 'r') as f:
        return json.load(f)


def create_summary(
    frame_packets: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    video_path: str,
    video_duration: float,
    video_fps: float,
    total_frames: int,
    processing_time: float,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create summary statistics for the demo run.
    
    Args:
        frame_packets: All frame packet data
        events: All committed events
        video_path: Path to input video
        video_duration: Video duration in seconds
        video_fps: Video FPS
        total_frames: Total number of frames processed
        processing_time: Total processing time in seconds
        config: Configuration parameters used
        
    Returns:
        Summary dict
    """
    # Aggregate counts
    total_people_detected = sum(p["metrics"]["total_people"] for p in frame_packets)
    frames_with_people = sum(1 for p in frame_packets if p["metrics"]["total_people"] > 0)
    
    # Compliance stats
    compliant_frames = sum(1 for p in frame_packets if p["metrics"]["compliance"] == 0)
    non_compliant_frames = sum(1 for p in frame_packets if p["metrics"]["compliance"] == 1)
    no_person_frames = sum(1 for p in frame_packets if p["metrics"]["compliance"] == 2)
    
    # Phone stats
    phone_frames = sum(1 for p in frame_packets if p["metrics"]["phone_talking"] == 1)
    
    # Rail holding stats
    rail_holding_frames = sum(1 for p in frame_packets if p["metrics"]["people_holding_rail"] > 0)
    
    # Calculate ratios
    if frames_with_people > 0:
        compliance_ratio = compliant_frames / frames_with_people
        phone_ratio = phone_frames / frames_with_people
    else:
        compliance_ratio = 0.0
        phone_ratio = 0.0
    
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "video": {
            "path": video_path,
            "duration_sec": round(video_duration, 4),
            "fps": video_fps,
            "total_frames": total_frames
        },
        "processing": {
            "time_sec": round(processing_time, 2),
            "fps_achieved": round(total_frames / processing_time, 2) if processing_time > 0 else 0
        },
        "config": config,
        "counts": {
            "total_person_detections": total_people_detected,
            "frames_with_people": frames_with_people,
            "compliant_frames": compliant_frames,
            "non_compliant_frames": non_compliant_frames,
            "no_person_frames": no_person_frames,
            "phone_detected_frames": phone_frames,
            "rail_holding_frames": rail_holding_frames,
            "events_committed": len(events)
        },
        "ratios": {
            "compliance_ratio": round(compliance_ratio, 4),
            "phone_ratio": round(phone_ratio, 4),
            "frames_with_people_ratio": round(frames_with_people / total_frames, 4) if total_frames > 0 else 0
        },
        "events_summary": [
            {
                "timestamp": e["timestamp"],
                "compliance": e["compliance"],
                "phone_talking": e["phone_talking"]
            }
            for e in events
        ]
    }


def convert_for_static_site(
    demo_output_dir: str,
    static_output_dir: str
) -> Dict[str, str]:
    """
    Convert demo output to static site payload format.
    
    Args:
        demo_output_dir: Path to demo_output directory
        static_output_dir: Path to web/public/demo directory
        
    Returns:
        Dict of created file paths
    """
    import shutil
    
    created_files = {}
    
    Path(static_output_dir).mkdir(parents=True, exist_ok=True)
    
    # Convert events.jsonl to events.json (array)
    events_jsonl = os.path.join(demo_output_dir, "events.jsonl")
    if os.path.exists(events_jsonl):
        events = load_jsonl(events_jsonl)
        events_json_path = os.path.join(static_output_dir, "events.json")
        save_json(events, events_json_path)
        created_files["events"] = events_json_path
    
    # Copy summary.json
    summary_path = os.path.join(demo_output_dir, "summary.json")
    if os.path.exists(summary_path):
        dest = os.path.join(static_output_dir, "summary.json")
        shutil.copy(summary_path, dest)
        created_files["summary"] = dest
    
    # Convert frame_packets.jsonl to frame_packets.json
    packets_jsonl = os.path.join(demo_output_dir, "frame_packets.jsonl")
    if os.path.exists(packets_jsonl):
        packets = load_jsonl(packets_jsonl)
        packets_json_path = os.path.join(static_output_dir, "frame_packets.json")
        save_json(packets, packets_json_path)
        created_files["frame_packets"] = packets_json_path
    
    # Copy evidence frames
    evidence_src = os.path.join(demo_output_dir, "evidence_frames")
    evidence_dest = os.path.join(static_output_dir, "evidence_frames")
    if os.path.exists(evidence_src):
        if os.path.exists(evidence_dest):
            shutil.rmtree(evidence_dest)
        shutil.copytree(evidence_src, evidence_dest)
        created_files["evidence_frames"] = evidence_dest
    
    return created_files
