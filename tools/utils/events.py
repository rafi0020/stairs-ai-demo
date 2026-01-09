"""
Stairs-AI Demo - Event handling and evidence saving
"""
import cv2
import os
from pathlib import Path
from typing import Optional
from datetime import datetime

from .types import Event, FrameMetrics
import numpy as np


def generate_evidence_filename(timestamp: float,
                               metrics: FrameMetrics) -> str:
    """
    Generate evidence filename following project convention.
    
    Format: {timestamp}_{total_people}_{people_holding_rail}_{people_using_phone}_{compliance}_{phone_talking}.jpg
    
    Args:
        timestamp: Time in seconds
        metrics: Frame-level metrics
        
    Returns:
        Filename string
    """
    # Convert timestamp to fixed-width string (4 decimal places)
    ts_str = f"{timestamp:.4f}".replace(".", "_")
    
    filename = (
        f"{ts_str}_"
        f"{metrics.total_people}_"
        f"{metrics.people_holding_rail}_"
        f"{metrics.people_using_phone}_"
        f"{metrics.compliance}_"
        f"{metrics.phone_talking}.jpg"
    )
    
    return filename


def save_evidence_frame(frame: np.ndarray,
                        output_dir: str,
                        filename: str,
                        quality: int = 95) -> str:
    """
    Save evidence frame to disk.
    
    Args:
        frame: Frame image (BGR)
        output_dir: Directory to save to
        filename: Filename to use
        quality: JPEG quality (0-100)
        
    Returns:
        Full path to saved file
    """
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    filepath = os.path.join(output_dir, filename)
    
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    cv2.imwrite(filepath, frame, encode_params)
    
    return filepath


def event_to_api_payload(event: Event,
                         image_path: Optional[str] = None) -> dict:
    """
    Convert event to API-compatible payload.
    
    Compatible with the project's send_api.py approach.
    
    Args:
        event: Event object
        image_path: Path to evidence image
        
    Returns:
        Dict suitable for API POST
    """
    return {
        "timestamp": event.timestamp,
        "datetime": datetime.utcnow().isoformat(),
        "total_people": event.total_people,
        "people_holding_rail": event.people_holding_rail,
        "people_using_phone": event.people_using_phone,
        "compliance_status": event.compliance,
        "phone_talking_status": event.phone_talking,
        "evidence_filename": event.evidence_filename,
        "image_path": image_path
    }


class EventLogger:
    """Handles event logging and evidence saving"""
    
    def __init__(self, output_dir: str):
        """
        Initialize event logger.
        
        Args:
            output_dir: Base output directory
        """
        self.output_dir = output_dir
        self.evidence_dir = os.path.join(output_dir, "evidence_frames")
        self.events_file = os.path.join(output_dir, "events.jsonl")
        
        Path(self.evidence_dir).mkdir(parents=True, exist_ok=True)
    
    def log_event(self,
                  event: Event,
                  frame: np.ndarray) -> str:
        """
        Log event and save evidence frame.
        
        Args:
            event: Event to log
            frame: Evidence frame to save
            
        Returns:
            Path to saved evidence frame
        """
        import json
        
        # Save evidence frame
        evidence_path = save_evidence_frame(
            frame, self.evidence_dir, event.evidence_filename
        )
        
        # Append to JSONL file
        with open(self.events_file, 'a') as f:
            event_dict = event.to_dict()
            f.write(json.dumps(event_dict) + "\n")
        
        return evidence_path
