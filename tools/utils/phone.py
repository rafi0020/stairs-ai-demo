"""
Stairs-AI Demo - Phone usage heuristic detection
"""
import math
from typing import Optional

from .types import PersonPose, PhoneHeuristicResult

# Default threshold for phone detection (normalized distance)
PHONE_DETECTION_THRESHOLD = 0.05


def compute_landmark_distance(pose: PersonPose, lm1: str, lm2: str) -> Optional[float]:
    """
    Compute normalized Euclidean distance between two landmarks.
    
    Uses normalized coordinates (0-1) for consistency across different
    crop sizes and frame resolutions.
    
    Args:
        pose: PersonPose object with landmarks
        lm1: First landmark name
        lm2: Second landmark name
        
    Returns:
        Normalized distance or None if landmarks not available
    """
    l1 = pose.get_landmark(lm1)
    l2 = pose.get_landmark(lm2)
    
    if l1 is None or l2 is None:
        return None
    
    # Check visibility threshold
    if l1.visibility < 0.3 or l2.visibility < 0.3:
        return None
    
    # Euclidean distance in normalized coordinates
    dx = l1.x - l2.x
    dy = l1.y - l2.y
    
    return math.sqrt(dx * dx + dy * dy)


def detect_phone_usage(pose: PersonPose, 
                       threshold: float = PHONE_DETECTION_THRESHOLD) -> PhoneHeuristicResult:
    """
    Detect if person appears to be using a phone.
    
    Heuristic: Check if either wrist is very close to the corresponding ear,
    which suggests the person is holding a phone to their ear.
    
    Args:
        pose: PersonPose object with landmarks
        threshold: Distance threshold in normalized coordinates
        
    Returns:
        PhoneHeuristicResult with detection details
    """
    result = PhoneHeuristicResult(threshold_used=threshold)
    
    # Compute left side distance (left wrist to left ear)
    left_dist = compute_landmark_distance(pose, "left_wrist", "left_ear")
    result.left_wrist_to_ear_dist = left_dist
    
    # Compute right side distance (right wrist to right ear)
    right_dist = compute_landmark_distance(pose, "right_wrist", "right_ear")
    result.right_wrist_to_ear_dist = right_dist
    
    # Determine if phone usage detected
    left_triggered = left_dist is not None and left_dist < threshold
    right_triggered = right_dist is not None and right_dist < threshold
    
    if left_triggered or right_triggered:
        result.is_using_phone = True
        
        if left_triggered and right_triggered:
            # Both triggered - use the closer one
            if left_dist <= right_dist:
                result.triggered_side = "left"
            else:
                result.triggered_side = "right"
        elif left_triggered:
            result.triggered_side = "left"
        else:
            result.triggered_side = "right"
    
    return result


def recompute_phone_with_threshold(
    left_dist: Optional[float],
    right_dist: Optional[float],
    threshold: float
) -> dict:
    """
    Recompute phone detection with a different threshold.
    
    This function is designed for the static UI to enable parameter tuning
    without re-running ML inference.
    
    Args:
        left_dist: Pre-computed left wrist-to-ear distance
        right_dist: Pre-computed right wrist-to-ear distance
        threshold: New threshold to apply
        
    Returns:
        Dict with recomputed phone detection results
    """
    left_triggered = left_dist is not None and left_dist < threshold
    right_triggered = right_dist is not None and right_dist < threshold
    
    is_using_phone = left_triggered or right_triggered
    
    triggered_side = None
    if left_triggered and right_triggered:
        triggered_side = "left" if left_dist <= right_dist else "right"
    elif left_triggered:
        triggered_side = "left"
    elif right_triggered:
        triggered_side = "right"
    
    return {
        "is_using_phone": is_using_phone,
        "left_wrist_to_ear_dist": left_dist,
        "right_wrist_to_ear_dist": right_dist,
        "threshold_used": threshold,
        "triggered_side": triggered_side
    }
