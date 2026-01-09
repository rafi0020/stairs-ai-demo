"""
Stairs-AI Demo - Pose estimation using MediaPipe
"""
import cv2
import numpy as np
from typing import Optional, Dict, List, Tuple
import mediapipe as mp

from .types import (
    BoundingBox, PersonPose, PoseLandmark, 
    POSE_LANDMARKS, HAND_LANDMARKS
)


class PoseEstimator:
    """MediaPipe Pose estimator for person crops"""
    
    def __init__(self, 
                 static_image_mode: bool = True,
                 model_complexity: int = 1,
                 min_detection_confidence: float = 0.5,
                 min_tracking_confidence: float = 0.5):
        """
        Initialize MediaPipe Pose.
        
        Args:
            static_image_mode: Whether to treat each image independently
            model_complexity: 0, 1, or 2 (higher = more accurate but slower)
            min_detection_confidence: Minimum detection confidence
            min_tracking_confidence: Minimum tracking confidence
        """
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            enable_segmentation=False,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
    
    def extract_crop(self, 
                     frame: np.ndarray, 
                     bbox: BoundingBox, 
                     padding: float = 0.1) -> Tuple[np.ndarray, Dict[str, int]]:
        """
        Extract person crop from frame with padding.
        
        Args:
            frame: Full frame image
            bbox: Person bounding box
            padding: Padding ratio to add around bbox
            
        Returns:
            Tuple of (crop_image, crop_info_dict)
        """
        h, w = frame.shape[:2]
        
        # Calculate padding
        pad_w = int(bbox.width * padding)
        pad_h = int(bbox.height * padding)
        
        # Clamp to frame bounds
        x1 = max(0, bbox.x1 - pad_w)
        y1 = max(0, bbox.y1 - pad_h)
        x2 = min(w, bbox.x2 + pad_w)
        y2 = min(h, bbox.y2 + pad_h)
        
        crop = frame[y1:y2, x1:x2].copy()
        
        crop_info = {
            "crop_x1": x1,
            "crop_y1": y1,
            "crop_x2": x2,
            "crop_y2": y2,
            "crop_width": x2 - x1,
            "crop_height": y2 - y1,
            "padding_used": padding
        }
        
        return crop, crop_info
    
    def estimate_pose(self, 
                      crop: np.ndarray, 
                      crop_info: Dict[str, int],
                      frame_width: int,
                      frame_height: int) -> Optional[PersonPose]:
        """
        Run pose estimation on person crop and map to full frame.
        
        Args:
            crop: Cropped person image
            crop_info: Crop metadata from extract_crop
            frame_width: Full frame width
            frame_height: Full frame height
            
        Returns:
            PersonPose object or None if detection failed
        """
        # Convert BGR to RGB for MediaPipe
        crop_rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        
        # Run pose estimation
        results = self.pose.process(crop_rgb)
        
        if not results.pose_landmarks:
            return None
        
        landmarks_dict: Dict[str, PoseLandmark] = {}
        raw_landmarks: List[PoseLandmark] = []
        
        crop_h, crop_w = crop.shape[:2]
        
        for idx, landmark in enumerate(results.pose_landmarks.landmark):
            # Normalized coordinates within crop
            norm_x = landmark.x
            norm_y = landmark.y
            
            # Map to full frame coordinates
            frame_x = int(crop_info["crop_x1"] + norm_x * crop_w)
            frame_y = int(crop_info["crop_y1"] + norm_y * crop_h)
            
            # Clamp to frame bounds
            frame_x = max(0, min(frame_width - 1, frame_x))
            frame_y = max(0, min(frame_height - 1, frame_y))
            
            lm = PoseLandmark(
                x=norm_x,
                y=norm_y,
                z=landmark.z,
                visibility=landmark.visibility,
                frame_x=frame_x,
                frame_y=frame_y
            )
            
            raw_landmarks.append(lm)
            
            # Add named landmark
            if idx in POSE_LANDMARKS:
                landmarks_dict[POSE_LANDMARKS[idx]] = lm
        
        return PersonPose(landmarks=landmarks_dict, raw_landmarks=raw_landmarks)
    
    def get_hand_points(self, pose: PersonPose) -> Dict[str, Tuple[int, int]]:
        """
        Extract hand-related landmark points for rail hit-testing.
        
        Returns:
            Dict mapping landmark name to (x, y) frame coordinates
        """
        points = {}
        for lm_name in HAND_LANDMARKS:
            lm = pose.get_landmark(lm_name)
            if lm and lm.frame_x is not None and lm.visibility > 0.3:
                points[lm_name] = (lm.frame_x, lm.frame_y)
        return points
    
    def close(self):
        """Release MediaPipe resources"""
        self.pose.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
