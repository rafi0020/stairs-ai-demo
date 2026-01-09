#!/usr/bin/env python3
"""
Stairs-AI Demo - Convert demo output to static site payload

Transforms demo_output/* into web/public/demo/* for GitHub Pages deployment.
"""

import argparse
import json
import os
import shutil
import sys
from pathlib import Path
from typing import Dict, Any


def load_jsonl(filepath: str) -> list:
    """Load JSONL file"""
    data = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                data.append(json.loads(line))
    return data


def save_json(data: Any, filepath: str, indent: int = 2) -> None:
    """Save as formatted JSON"""
    Path(filepath).parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=indent)


def chunk_frame_packets(
    packets: list,
    chunk_size: int = 50
) -> Dict[str, Any]:
    """
    Optionally chunk frame packets into multiple files for large videos.
    
    Returns manifest with chunk info.
    """
    if len(packets) <= chunk_size * 2:
        # Small enough to keep as single file
        return {"chunked": False, "data": packets}
    
    chunks = []
    for i in range(0, len(packets), chunk_size):
        chunk = packets[i:i + chunk_size]
        chunks.append({
            "start_index": i,
            "end_index": i + len(chunk) - 1,
            "count": len(chunk)
        })
    
    return {
        "chunked": True,
        "chunk_size": chunk_size,
        "total_packets": len(packets),
        "chunks": chunks,
        "data": packets  # Still include all data for simplicity
    }


def create_static_payload(
    input_dir: str,
    output_dir: str,
    include_screenshots: bool = True
) -> Dict[str, str]:
    """
    Convert demo output to static site payload.
    
    Args:
        input_dir: Path to demo_output directory
        output_dir: Path to web/public/demo directory
        include_screenshots: Whether to copy screenshot assets
        
    Returns:
        Dict of created file paths
    """
    created = {}
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # 1. Convert events.jsonl to events.json
    events_jsonl = os.path.join(input_dir, "events.jsonl")
    if os.path.exists(events_jsonl):
        events = load_jsonl(events_jsonl)
        events_json = os.path.join(output_dir, "events.json")
        save_json(events, events_json)
        created["events"] = events_json
        print(f"  Converted events: {len(events)} events")
    else:
        # Create empty events file
        events_json = os.path.join(output_dir, "events.json")
        save_json([], events_json)
        created["events"] = events_json
        print("  No events found, created empty events.json")
    
    # 2. Copy summary.json
    summary_src = os.path.join(input_dir, "summary.json")
    if os.path.exists(summary_src):
        summary_dst = os.path.join(output_dir, "summary.json")
        shutil.copy(summary_src, summary_dst)
        created["summary"] = summary_dst
        print("  Copied summary.json")
    
    # 3. Convert frame_packets.jsonl to frame_packets.json
    packets_jsonl = os.path.join(input_dir, "frame_packets.jsonl")
    if os.path.exists(packets_jsonl):
        packets = load_jsonl(packets_jsonl)
        packets_json = os.path.join(output_dir, "frame_packets.json")
        save_json(packets, packets_json)
        created["frame_packets"] = packets_json
        print(f"  Converted frame_packets: {len(packets)} packets")
    
    # 4. Copy evidence frames
    evidence_src = os.path.join(input_dir, "evidence_frames")
    evidence_dst = os.path.join(output_dir, "evidence_frames")
    if os.path.exists(evidence_src):
        if os.path.exists(evidence_dst):
            shutil.rmtree(evidence_dst)
        shutil.copytree(evidence_src, evidence_dst)
        
        num_files = len([f for f in os.listdir(evidence_dst) if f.endswith('.jpg')])
        created["evidence_frames"] = evidence_dst
        print(f"  Copied evidence frames: {num_files} files")
    else:
        Path(evidence_dst).mkdir(parents=True, exist_ok=True)
        created["evidence_frames"] = evidence_dst
    
    # 5. Copy storyboard.json if not already in output
    storyboard_dst = os.path.join(output_dir, "storyboard.json")
    if not os.path.exists(storyboard_dst):
        # Try to find storyboard in common locations
        storyboard_locations = [
            os.path.join(input_dir, "storyboard.json"),
            "storyboard.json",
            os.path.join("web", "public", "demo", "storyboard.json")
        ]
        
        for loc in storyboard_locations:
            if os.path.exists(loc) and loc != storyboard_dst:
                shutil.copy(loc, storyboard_dst)
                created["storyboard"] = storyboard_dst
                print("  Copied storyboard.json")
                break
    
    # 6. Copy screenshots if requested
    if include_screenshots:
        screenshots_src = "assets/screenshots"
        screenshots_dst = os.path.join(output_dir, "screenshots")
        
        if os.path.exists(screenshots_src):
            if os.path.exists(screenshots_dst):
                shutil.rmtree(screenshots_dst)
            shutil.copytree(screenshots_src, screenshots_dst)
            
            num_files = len([f for f in os.listdir(screenshots_dst) if f.endswith('.jpg')])
            created["screenshots"] = screenshots_dst
            print(f"  Copied screenshots: {num_files} files")
    
    # 7. Create manifest for the static site
    manifest = {
        "version": "1.0",
        "generated_at": __import__("datetime").datetime.utcnow().isoformat(),
        "files": {
            "events": "events.json",
            "summary": "summary.json",
            "frame_packets": "frame_packets.json",
            "storyboard": "storyboard.json",
            "evidence_frames_dir": "evidence_frames",
            "screenshots_dir": "screenshots"
        }
    }
    
    manifest_path = os.path.join(output_dir, "manifest.json")
    save_json(manifest, manifest_path)
    created["manifest"] = manifest_path
    
    return created


def main():
    parser = argparse.ArgumentParser(description="Convert demo output to static site payload")
    parser.add_argument("--input", "-i", type=str, default="demo_output",
                        help="Input directory (demo_output)")
    parser.add_argument("--output", "-o", type=str, default="web/public/demo",
                        help="Output directory (web/public/demo)")
    parser.add_argument("--no-screenshots", action="store_true",
                        help="Skip copying screenshots")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input):
        print(f"Error: Input directory not found: {args.input}")
        print("Run tools/run_demo.py first to generate demo output.")
        sys.exit(1)
    
    print(f"Converting demo output to static site payload...")
    print(f"  Input:  {args.input}")
    print(f"  Output: {args.output}")
    print()
    
    created = create_static_payload(
        args.input,
        args.output,
        include_screenshots=not args.no_screenshots
    )
    
    print()
    print("Static site payload created successfully!")
    print(f"Output directory: {args.output}")
    
    # List created files
    print("\nCreated files:")
    for name, path in created.items():
        if os.path.isdir(path):
            num_files = len(os.listdir(path))
            print(f"  {name}: {path} ({num_files} files)")
        else:
            size = os.path.getsize(path)
            print(f"  {name}: {path} ({size:,} bytes)")


if __name__ == "__main__":
    main()
