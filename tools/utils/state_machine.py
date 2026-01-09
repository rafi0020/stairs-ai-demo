"""
Stairs-AI Demo - Debounce state machine for event stabilization
"""
from typing import Optional, Tuple, List
from dataclasses import dataclass

from .types import FrameMetrics, StateMachineDebug, Event

# Default minimum state duration for debounce (seconds)
MIN_STATE_DURATION = 0.55


@dataclass
class StateEntry:
    """Internal state tracking entry"""
    state: Tuple[int, int]  # (compliance, phone_talking)
    start_time: float
    start_frame: int
    metrics: FrameMetrics


class DebounceStateMachine:
    """
    State machine with debounce for stable event emission.
    
    Only commits a state change when the new state has remained stable
    for at least MIN_STATE_DURATION seconds. This prevents spurious
    events from brief detection fluctuations.
    """
    
    def __init__(self, min_duration: float = MIN_STATE_DURATION):
        """
        Initialize state machine.
        
        Args:
            min_duration: Minimum seconds a state must persist before committing
        """
        self.min_duration = min_duration
        
        # Last committed (stable) state
        self.last_committed_state: Optional[Tuple[int, int]] = None
        self.last_committed_time: float = 0.0
        self.last_committed_frame: int = 0
        self.last_committed_metrics: Optional[FrameMetrics] = None
        
        # Current candidate state
        self.current_state: Optional[Tuple[int, int]] = None
        self.current_state_start: float = 0.0
        self.current_state_frame: int = 0
        self.current_metrics: Optional[FrameMetrics] = None
        
        # Event history
        self.events: List[Event] = []
    
    def get_state_tuple(self, metrics: FrameMetrics) -> Tuple[int, int]:
        """Extract state tuple from frame metrics"""
        return (metrics.compliance, metrics.phone_talking)
    
    def update(self, 
               metrics: FrameMetrics, 
               time_sec: float, 
               frame_index: int) -> StateMachineDebug:
        """
        Process a new frame and potentially commit state change.
        
        Args:
            metrics: Frame-level aggregated metrics
            time_sec: Current time in seconds
            frame_index: Current frame index
            
        Returns:
            StateMachineDebug with full state machine info
        """
        new_state = self.get_state_tuple(metrics)
        
        # Initialize on first frame
        if self.current_state is None:
            self.current_state = new_state
            self.current_state_start = time_sec
            self.current_state_frame = frame_index
            self.current_metrics = metrics
            
            return StateMachineDebug(
                current_raw_state=new_state,
                last_stable_state=self.last_committed_state,
                time_in_current_state=0.0,
                min_state_duration=self.min_duration,
                would_commit=False,
                state_changed=False
            )
        
        # Check if state changed
        state_changed = (new_state != self.current_state)
        
        if state_changed:
            # Reset to new candidate state
            self.current_state = new_state
            self.current_state_start = time_sec
            self.current_state_frame = frame_index
            self.current_metrics = metrics
            
            return StateMachineDebug(
                current_raw_state=new_state,
                last_stable_state=self.last_committed_state,
                time_in_current_state=0.0,
                min_state_duration=self.min_duration,
                would_commit=False,
                state_changed=True
            )
        
        # State is same as current candidate - check duration
        time_in_state = time_sec - self.current_state_start
        would_commit = (
            time_in_state >= self.min_duration and 
            new_state != self.last_committed_state
        )
        
        # Update current metrics
        self.current_metrics = metrics
        
        return StateMachineDebug(
            current_raw_state=new_state,
            last_stable_state=self.last_committed_state,
            time_in_current_state=time_in_state,
            min_state_duration=self.min_duration,
            would_commit=would_commit,
            state_changed=False
        )
    
    def commit_if_ready(self, 
                        metrics: FrameMetrics,
                        time_sec: float,
                        frame_index: int,
                        evidence_filename: str) -> Optional[Event]:
        """
        Commit current state if debounce threshold met.
        
        Args:
            metrics: Current frame metrics
            time_sec: Current time
            frame_index: Current frame index
            evidence_filename: Filename for evidence frame
            
        Returns:
            Event if committed, None otherwise
        """
        state = self.get_state_tuple(metrics)
        time_in_state = time_sec - self.current_state_start
        
        # Check commit conditions
        should_commit = (
            time_in_state >= self.min_duration and
            state != self.last_committed_state
        )
        
        if not should_commit:
            return None
        
        # Create event
        event = Event(
            timestamp=time_sec,
            frame_index=frame_index,
            total_people=metrics.total_people,
            people_holding_rail=metrics.people_holding_rail,
            people_using_phone=metrics.people_using_phone,
            compliance=metrics.compliance,
            phone_talking=metrics.phone_talking,
            evidence_filename=evidence_filename,
            previous_state=self.last_committed_state
        )
        
        # Update committed state
        self.last_committed_state = state
        self.last_committed_time = time_sec
        self.last_committed_frame = frame_index
        self.last_committed_metrics = metrics
        
        self.events.append(event)
        
        return event
    
    def get_events(self) -> List[Event]:
        """Get all committed events"""
        return self.events
    
    def reset(self):
        """Reset state machine to initial state"""
        self.last_committed_state = None
        self.last_committed_time = 0.0
        self.last_committed_frame = 0
        self.last_committed_metrics = None
        self.current_state = None
        self.current_state_start = 0.0
        self.current_state_frame = 0
        self.current_metrics = None
        self.events = []


def simulate_debounce(
    frame_packets: List[dict],
    min_duration: float = MIN_STATE_DURATION
) -> Tuple[List[dict], List[dict]]:
    """
    Simulate debounce over pre-computed frame packets.
    
    This enables static UI to show different debounce behaviors
    without re-running the full pipeline.
    
    Args:
        frame_packets: List of frame packet dicts with metrics
        min_duration: Debounce duration to simulate
        
    Returns:
        Tuple of (updated_packets, simulated_events)
    """
    sm = DebounceStateMachine(min_duration=min_duration)
    updated_packets = []
    
    for packet in frame_packets:
        metrics = FrameMetrics(
            total_people=packet["metrics"]["total_people"],
            people_holding_rail=packet["metrics"]["people_holding_rail"],
            people_using_phone=packet["metrics"]["people_using_phone"],
            compliance=packet["metrics"]["compliance"],
            phone_talking=packet["metrics"]["phone_talking"]
        )
        
        debug = sm.update(metrics, packet["time_sec"], packet["frame_index"])
        
        # Check if would commit
        would_commit = debug.would_commit
        
        updated_packet = dict(packet)
        updated_packet["state_machine"] = debug.to_dict()
        updated_packet["simulated_commit"] = would_commit
        
        if would_commit:
            # Simulate commit
            sm.last_committed_state = debug.current_raw_state
            sm.last_committed_time = packet["time_sec"]
        
        updated_packets.append(updated_packet)
    
    simulated_events = [e.to_dict() for e in sm.events]
    
    return updated_packets, simulated_events
