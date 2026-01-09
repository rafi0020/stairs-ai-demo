"""
Stairs-AI Demo - Video overlay and visualization utilities
"""
import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional

from .types import (
    PersonAnalysis, FrameMetrics, BoundingBox,
    POSE_CONNECTIONS, ComplianceStatus
)
from .masks import RailMaskManager


# Color definitions (BGR format for OpenCV)
COLORS = {
    "compliant": (0, 255, 0),      # Green
    "non_compliant": (0, 0, 255),  # Red
    "no_persons": (128, 128, 128), # Gray
    "phone": (0, 165, 255),        # Orange
    "rail": (0, 255, 0),           # Green
    "skeleton": (255, 255, 0),     # Cyan
    "bbox": (255, 255, 255),       # White
    "text_bg": (0, 0, 0),          # Black
    "hand_hit": (0, 255, 255),     # Yellow
}


def draw_bbox(frame: np.ndarray, 
              bbox: BoundingBox, 
              color: Tuple[int, int, int],
              label: str = "",
              thickness: int = 2) -> None:
    """Draw bounding box with optional label"""
    cv2.rectangle(frame, (bbox.x1, bbox.y1), (bbox.x2, bbox.y2), color, thickness)
    
    if label:
        # Draw label background
        (text_w, text_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, 
                      (bbox.x1, bbox.y1 - text_h - 8),
                      (bbox.x1 + text_w + 4, bbox.y1),
                      COLORS["text_bg"], -1)
        cv2.putText(frame, label, (bbox.x1 + 2, bbox.y1 - 4),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)


def draw_skeleton(frame: np.ndarray,
                  landmarks: Dict[str, dict],
                  color: Tuple[int, int, int] = COLORS["skeleton"],
                  point_radius: int = 4,
                  line_thickness: int = 2) -> None:
    """Draw pose skeleton on frame"""
    # Draw connections
    for start_name, end_name in POSE_CONNECTIONS:
        start = landmarks.get(start_name)
        end = landmarks.get(end_name)
        
        if start and end and start.get("frame_x") and end.get("frame_x"):
            pt1 = (start["frame_x"], start["frame_y"])
            pt2 = (end["frame_x"], end["frame_y"])
            cv2.line(frame, pt1, pt2, color, line_thickness)
    
    # Draw landmark points
    for name, lm in landmarks.items():
        if lm and lm.get("frame_x"):
            pt = (lm["frame_x"], lm["frame_y"])
            cv2.circle(frame, pt, point_radius, color, -1)


def draw_rail_polygons(frame: np.ndarray,
                       mask_manager: RailMaskManager,
                       alpha: float = 0.3) -> np.ndarray:
    """Draw semi-transparent rail mask polygons"""
    overlay = frame.copy()
    
    for poly in mask_manager.get_all_polygons():
        points = np.array(poly["points"], dtype=np.int32)
        color = tuple(poly.get("color", [0, 255, 0]))
        
        # Fill polygon with transparency
        cv2.fillPoly(overlay, [points], color)
        
        # Draw polygon outline
        cv2.polylines(frame, [points], True, color, 2)
    
    # Blend overlay
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)
    
    return frame


def draw_hand_hits(frame: np.ndarray,
                   hit_points: Dict[str, List[int]],
                   color: Tuple[int, int, int] = COLORS["hand_hit"],
                   radius: int = 8) -> None:
    """Highlight hand points that hit the rail mask"""
    for name, point in hit_points.items():
        if point and len(point) == 2:
            cv2.circle(frame, tuple(point), radius, color, -1)
            cv2.circle(frame, tuple(point), radius + 2, (255, 255, 255), 2)


def draw_phone_indicator(frame: np.ndarray,
                         bbox: BoundingBox,
                         triggered_side: Optional[str],
                         distance: Optional[float]) -> None:
    """Draw phone usage indicator near person"""
    if triggered_side is None:
        return
    
    icon_x = bbox.x2 + 10
    icon_y = bbox.y1 + 30
    
    # Draw phone icon (simplified)
    cv2.rectangle(frame, (icon_x, icon_y), (icon_x + 20, icon_y + 35), 
                  COLORS["phone"], -1)
    cv2.rectangle(frame, (icon_x, icon_y), (icon_x + 20, icon_y + 35),
                  (255, 255, 255), 1)
    
    # Draw side indicator
    side_text = f"📱{triggered_side[0].upper()}"
    cv2.putText(frame, side_text, (icon_x - 5, icon_y + 50),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, COLORS["phone"], 1)


def draw_status_panel(frame: np.ndarray,
                      metrics: FrameMetrics,
                      time_sec: float,
                      frame_idx: int) -> None:
    """Draw status panel overlay"""
    h, w = frame.shape[:2]
    panel_h = 100
    panel_w = 350
    
    # Draw panel background
    cv2.rectangle(frame, (10, 10), (10 + panel_w, 10 + panel_h),
                  COLORS["text_bg"], -1)
    cv2.rectangle(frame, (10, 10), (10 + panel_w, 10 + panel_h),
                  (255, 255, 255), 1)
    
    # Compliance status
    if metrics.compliance == ComplianceStatus.COMPLIANT:
        status_text = "COMPLIANT"
        status_color = COLORS["compliant"]
    elif metrics.compliance == ComplianceStatus.NON_COMPLIANT:
        status_text = "NON-COMPLIANT"
        status_color = COLORS["non_compliant"]
    else:
        status_text = "NO PERSONS"
        status_color = COLORS["no_persons"]
    
    # Draw status
    cv2.putText(frame, status_text, (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, status_color, 2)
    
    # Draw metrics
    metrics_text = f"People: {metrics.total_people} | Rail: {metrics.people_holding_rail} | Phone: {metrics.people_using_phone}"
    cv2.putText(frame, metrics_text, (20, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    
    # Draw time/frame
    time_text = f"Time: {time_sec:.2f}s | Frame: {frame_idx}"
    cv2.putText(frame, time_text, (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)


def draw_full_overlay(frame: np.ndarray,
                      persons: List[PersonAnalysis],
                      metrics: FrameMetrics,
                      mask_manager: RailMaskManager,
                      time_sec: float,
                      frame_idx: int,
                      show_rail_mask: bool = True) -> np.ndarray:
    """
    Draw complete overlay with all visualizations.
    
    Args:
        frame: Input frame (will be modified in place)
        persons: List of person analysis results
        metrics: Frame-level metrics
        mask_manager: Rail mask manager
        time_sec: Current time
        frame_idx: Current frame index
        show_rail_mask: Whether to draw rail mask overlay
        
    Returns:
        Annotated frame
    """
    # Draw rail mask
    if show_rail_mask:
        draw_rail_polygons(frame, mask_manager)
    
    # Draw each person
    for person in persons:
        # Determine bbox color based on rail holding
        if person.rail_hit and person.rail_hit.any_hand_in_rail:
            bbox_color = COLORS["compliant"]
        else:
            bbox_color = COLORS["non_compliant"]
        
        # Build label
        labels = [f"P{person.person_id}"]
        if person.rail_hit and person.rail_hit.any_hand_in_rail:
            labels.append("RAIL")
        if person.phone_result and person.phone_result.is_using_phone:
            labels.append("PHONE")
        
        label = " | ".join(labels)
        draw_bbox(frame, person.bbox, bbox_color, label)
        
        # Draw skeleton
        if person.pose:
            draw_skeleton(frame, {k: v.to_dict() for k, v in person.pose.landmarks.items()})
        
        # Draw hand hits
        if person.rail_hit and person.rail_hit.hit_points:
            draw_hand_hits(frame, person.rail_hit.hit_points)
        
        # Draw phone indicator
        if person.phone_result and person.phone_result.is_using_phone:
            draw_phone_indicator(frame, person.bbox,
                                 person.phone_result.triggered_side,
                                 person.phone_result.left_wrist_to_ear_dist or 
                                 person.phone_result.right_wrist_to_ear_dist)
    
    # Draw status panel
    draw_status_panel(frame, metrics, time_sec, frame_idx)
    
    return frame


def create_person_crop_strip(frame: np.ndarray,
                             persons: List[PersonAnalysis],
                             strip_height: int = 150) -> np.ndarray:
    """
    Create horizontal strip of person crops for visualization.
    
    Args:
        frame: Original frame
        persons: List of detected persons
        strip_height: Height of the strip
        
    Returns:
        Horizontal strip image
    """
    if not persons:
        # Return empty strip
        return np.zeros((strip_height, 300, 3), dtype=np.uint8)
    
    crops = []
    for person in persons:
        bbox = person.bbox
        crop = frame[bbox.y1:bbox.y2, bbox.x1:bbox.x2].copy()
        
        if crop.size == 0:
            continue
        
        # Resize to strip height
        aspect = crop.shape[1] / crop.shape[0]
        new_width = int(strip_height * aspect)
        crop_resized = cv2.resize(crop, (new_width, strip_height))
        
        # Add border based on compliance
        if person.rail_hit and person.rail_hit.any_hand_in_rail:
            border_color = COLORS["compliant"]
        else:
            border_color = COLORS["non_compliant"]
        
        crop_bordered = cv2.copyMakeBorder(crop_resized, 3, 3, 3, 3,
                                           cv2.BORDER_CONSTANT, value=border_color)
        crops.append(crop_bordered)
    
    if not crops:
        return np.zeros((strip_height + 6, 300, 3), dtype=np.uint8)
    
    # Concatenate horizontally
    strip = np.hstack(crops)
    
    return strip
