"""
Stairs-AI Demo - Type definitions and data structures
"""
from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Dict, Any
from enum import IntEnum


class ComplianceStatus(IntEnum):
    """Compliance status codes"""
    COMPLIANT = 0       # All persons holding rail
    NON_COMPLIANT = 1   # At least one person not holding rail
    NO_PERSONS = 2      # No persons detected


@dataclass
class BoundingBox:
    """Person bounding box from YOLO detection"""
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    
    @property
    def width(self) -> int:
        return self.x2 - self.x1
    
    @property
    def height(self) -> int:
        return self.y2 - self.y1
    
    @property
    def center(self) -> Tuple[int, int]:
        return ((self.x1 + self.x2) // 2, (self.y1 + self.y2) // 2)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "x1": self.x1,
            "y1": self.y1,
            "x2": self.x2,
            "y2": self.y2,
            "confidence": round(self.confidence, 4),
            "width": self.width,
            "height": self.height,
            "center": list(self.center)
        }


@dataclass
class PoseLandmark:
    """Single pose landmark"""
    x: float  # Normalized 0-1
    y: float  # Normalized 0-1
    z: float  # Depth estimate
    visibility: float
    
    # Full-frame coordinates
    frame_x: Optional[int] = None
    frame_y: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "x": round(self.x, 4),
            "y": round(self.y, 4),
            "z": round(self.z, 4),
            "visibility": round(self.visibility, 4),
            "frame_x": self.frame_x,
            "frame_y": self.frame_y
        }


@dataclass
class PersonPose:
    """Full pose data for a person"""
    landmarks: Dict[str, PoseLandmark]  # Named landmarks
    raw_landmarks: List[PoseLandmark] = field(default_factory=list)
    
    def get_landmark(self, name: str) -> Optional[PoseLandmark]:
        return self.landmarks.get(name)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "landmarks": {k: v.to_dict() for k, v in self.landmarks.items()},
            "raw_landmarks": [lm.to_dict() for lm in self.raw_landmarks]
        }


@dataclass
class RailHitTestResult:
    """Result of rail polygon hit-test for a person"""
    any_hand_in_rail: bool = False
    left_hand_in_rail: bool = False
    right_hand_in_rail: bool = False
    left_wrist_in_rail: bool = False
    right_wrist_in_rail: bool = False
    hit_polygon_ids: List[str] = field(default_factory=list)
    hit_points: Dict[str, List[int]] = field(default_factory=dict)  # landmark_name -> [x, y]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "any_hand_in_rail": self.any_hand_in_rail,
            "left_hand_in_rail": self.left_hand_in_rail,
            "right_hand_in_rail": self.right_hand_in_rail,
            "left_wrist_in_rail": self.left_wrist_in_rail,
            "right_wrist_in_rail": self.right_wrist_in_rail,
            "hit_polygon_ids": self.hit_polygon_ids,
            "hit_points": self.hit_points
        }


@dataclass
class PhoneHeuristicResult:
    """Result of phone-usage heuristic for a person"""
    is_using_phone: bool = False
    left_wrist_to_ear_dist: Optional[float] = None
    right_wrist_to_ear_dist: Optional[float] = None
    threshold_used: float = 0.05
    triggered_side: Optional[str] = None  # "left", "right", or None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_using_phone": self.is_using_phone,
            "left_wrist_to_ear_dist": round(self.left_wrist_to_ear_dist, 4) if self.left_wrist_to_ear_dist else None,
            "right_wrist_to_ear_dist": round(self.right_wrist_to_ear_dist, 4) if self.right_wrist_to_ear_dist else None,
            "threshold_used": self.threshold_used,
            "triggered_side": self.triggered_side
        }


@dataclass
class PersonAnalysis:
    """Complete analysis for a single detected person"""
    person_id: int
    bbox: BoundingBox
    pose: Optional[PersonPose] = None
    rail_hit: Optional[RailHitTestResult] = None
    phone_result: Optional[PhoneHeuristicResult] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "person_id": self.person_id,
            "bbox": self.bbox.to_dict(),
            "pose": self.pose.to_dict() if self.pose else None,
            "rail_hit": self.rail_hit.to_dict() if self.rail_hit else None,
            "phone_result": self.phone_result.to_dict() if self.phone_result else None
        }


@dataclass
class FrameMetrics:
    """Aggregated metrics for a frame"""
    total_people: int = 0
    people_holding_rail: int = 0
    people_using_phone: int = 0
    compliance: int = 2  # ComplianceStatus
    phone_talking: int = 0
    
    def to_dict(self) -> Dict[str, int]:
        return {
            "total_people": self.total_people,
            "people_holding_rail": self.people_holding_rail,
            "people_using_phone": self.people_using_phone,
            "compliance": self.compliance,
            "phone_talking": self.phone_talking
        }


@dataclass
class StateMachineDebug:
    """Debug info for the debounce state machine"""
    current_raw_state: Tuple[int, int]  # (compliance, phone_talking)
    last_stable_state: Optional[Tuple[int, int]]
    time_in_current_state: float
    min_state_duration: float
    would_commit: bool
    state_changed: bool
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_raw_state": list(self.current_raw_state),
            "last_stable_state": list(self.last_stable_state) if self.last_stable_state else None,
            "time_in_current_state": round(self.time_in_current_state, 4),
            "min_state_duration": self.min_state_duration,
            "would_commit": self.would_commit,
            "state_changed": self.state_changed
        }


@dataclass
class FramePacket:
    """Complete frame analysis packet for whitebox export"""
    frame_index: int
    time_sec: float
    metrics: FrameMetrics
    persons: List[PersonAnalysis]
    state_machine: Optional[StateMachineDebug] = None
    event_committed: bool = False
    evidence_saved: bool = False
    evidence_filename: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_index": self.frame_index,
            "time_sec": round(self.time_sec, 4),
            "metrics": self.metrics.to_dict(),
            "persons": [p.to_dict() for p in self.persons],
            "state_machine": self.state_machine.to_dict() if self.state_machine else None,
            "event_committed": self.event_committed,
            "evidence_saved": self.evidence_saved,
            "evidence_filename": self.evidence_filename
        }


@dataclass
class Event:
    """A committed state change event"""
    timestamp: float
    frame_index: int
    total_people: int
    people_holding_rail: int
    people_using_phone: int
    compliance: int
    phone_talking: int
    evidence_filename: str
    previous_state: Optional[Tuple[int, int]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": round(self.timestamp, 4),
            "frame_index": self.frame_index,
            "total_people": self.total_people,
            "people_holding_rail": self.people_holding_rail,
            "people_using_phone": self.people_using_phone,
            "compliance": self.compliance,
            "phone_talking": self.phone_talking,
            "evidence_filename": self.evidence_filename,
            "previous_state": list(self.previous_state) if self.previous_state else None
        }


@dataclass
class StoryboardChapter:
    """A chapter/segment in the demo storyboard"""
    label: str
    start_sec: float
    end_sec: float
    thumbnail_path: str
    expected_focus: str
    description: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "start_sec": self.start_sec,
            "end_sec": self.end_sec,
            "thumbnail_path": self.thumbnail_path,
            "expected_focus": self.expected_focus,
            "description": self.description
        }


# MediaPipe landmark indices
POSE_LANDMARKS = {
    0: "nose",
    1: "left_eye_inner",
    2: "left_eye",
    3: "left_eye_outer",
    4: "right_eye_inner",
    5: "right_eye",
    6: "right_eye_outer",
    7: "left_ear",
    8: "right_ear",
    9: "mouth_left",
    10: "mouth_right",
    11: "left_shoulder",
    12: "right_shoulder",
    13: "left_elbow",
    14: "right_elbow",
    15: "left_wrist",
    16: "right_wrist",
    17: "left_pinky",
    18: "right_pinky",
    19: "left_index",
    20: "right_index",
    21: "left_thumb",
    22: "right_thumb",
    23: "left_hip",
    24: "right_hip",
    25: "left_knee",
    26: "right_knee",
    27: "left_ankle",
    28: "right_ankle",
    29: "left_heel",
    30: "right_heel",
    31: "left_foot_index",
    32: "right_foot_index"
}

# Key landmarks for rail detection
HAND_LANDMARKS = ["left_wrist", "right_wrist", "left_index", "right_index", 
                  "left_pinky", "right_pinky", "left_thumb", "right_thumb"]

# Key landmarks for phone detection
PHONE_LANDMARKS = ["left_wrist", "right_wrist", "left_ear", "right_ear"]

# Pose skeleton connections for visualization
POSE_CONNECTIONS = [
    ("left_shoulder", "right_shoulder"),
    ("left_shoulder", "left_elbow"),
    ("left_elbow", "left_wrist"),
    ("right_shoulder", "right_elbow"),
    ("right_elbow", "right_wrist"),
    ("left_shoulder", "left_hip"),
    ("right_shoulder", "right_hip"),
    ("left_hip", "right_hip"),
    ("left_hip", "left_knee"),
    ("left_knee", "left_ankle"),
    ("right_hip", "right_knee"),
    ("right_knee", "right_ankle"),
    ("left_wrist", "left_index"),
    ("left_wrist", "left_pinky"),
    ("right_wrist", "right_index"),
    ("right_wrist", "right_pinky"),
]
