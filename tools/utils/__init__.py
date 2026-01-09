"""
Stairs-AI Demo - Utility modules
"""

from .types import *
from .masks import RailMaskManager
from .pose import PoseEstimator
from .phone import detect_phone_usage, PHONE_DETECTION_THRESHOLD
from .state_machine import DebounceStateMachine, MIN_STATE_DURATION
from .overlay import draw_full_overlay, create_person_crop_strip
from .events import EventLogger, generate_evidence_filename
from .io import save_jsonl, save_json, load_jsonl, load_json, create_summary
