/**
 * Stairs-AI Demo - TypeScript Type Definitions
 * Simplified types that match the actual JSON data structure
 */

// Bounding box for person detection
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Pose landmark
export interface PoseLandmark {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

// Person pose data
export interface PersonPose {
  landmarks: PoseLandmark[];
}

// Rail hit-test result
export interface RailHitTestResult {
  left_wrist_in_left_rail: boolean;
  right_wrist_in_left_rail: boolean;
  left_wrist_in_right_rail: boolean;
  right_wrist_in_right_rail: boolean;
  any_hit: boolean;
}

// Phone heuristic result
export interface PhoneHeuristicResult {
  left_wrist_to_left_ear_dist: number;
  left_wrist_to_right_ear_dist: number;
  right_wrist_to_left_ear_dist: number;
  right_wrist_to_right_ear_dist: number;
  min_distance: number;
  threshold: number;
  is_phone_talking: boolean;
}

// Person analysis in a frame
export interface PersonAnalysis {
  person_id: number;
  track_id?: number;
  bbox: BoundingBox;
  confidence: number;
  pose: PersonPose | null;
  rail_hit_test: RailHitTestResult | null;
  phone_heuristic: PhoneHeuristicResult | null;
  compliance_status: string;
  crop_path?: string;
}

// Frame-level metrics
export interface FrameMetrics {
  total_persons: number;
  compliant_count: number;
  non_compliant_count: number;
  phone_count: number;
  avg_confidence: number;
}

// State machine status
export interface StateMachineState {
  current_state: [string, string];
  pending_state: [string, string] | null;
  time_in_pending: number;
  debounce_threshold: number;
}

// Complete frame packet
export interface FramePacket {
  frame_number: number;
  timestamp_sec: number;
  metrics: FrameMetrics;
  persons: PersonAnalysis[];
  state_machine: StateMachineState | null;
  annotated_frame_path?: string;
}

// Event details
export interface EventDetails {
  compliance_status?: string;
  is_phone_talking?: boolean;
  rail_left_hit?: boolean;
  rail_right_hit?: boolean;
  phone_distance?: number;
  threshold?: number;
  confidence?: number;
}

// Committed event
export interface Event {
  event_id: string;
  event_type: string;
  timestamp_sec: number;
  frame_number: number;
  person_id: number;
  old_state: [string, string];
  new_state: [string, string];
  debounce_triggered: boolean;
  evidence_frame_path: string | null;
  details: EventDetails;
}

// Storyboard chapter
export interface StoryboardChapter {
  id: string;
  title: string;
  timestamp_sec: number;
  frame_number: number;
  thumbnail_path: string;
  description: string;
  focus: string;
}

// Storyboard data
export interface Storyboard {
  chapters: StoryboardChapter[];
  total_duration_sec: number;
  generated_at: string;
}

// Summary statistics
export interface Summary {
  source_video: string;
  parameters: {
    yolo_model: string;
    yolo_conf: number;
    phone_threshold: number;
    min_state_duration_sec: number;
    fps: number;
    frame_width: number;
    frame_height: number;
  };
  total_frames: number;
  total_duration_sec: number;
  persons_detected_count: number;
  unique_tracks: number;
  compliance_summary: {
    compliant_frames: number;
    non_compliant_frames: number;
    compliant_pct: number;
    non_compliant_pct: number;
  };
  phone_summary: {
    phone_detected_frames: number;
    no_phone_frames: number;
    phone_pct: number;
  };
  events_count: number;
  processing_time_sec: number;
  generated_at: string;
}

// Complete demo data
export interface DemoData {
  summary: Summary | null;
  events: Event[];
  framePackets: FramePacket[];
  storyboard: Storyboard | null;
  loaded: boolean;
  error: string | null;
}

// Pipeline step for whitebox visualization
export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  color: string;
}

// Pipeline steps constant
export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 'raw', name: 'Raw Frame', description: 'Original video frame', color: 'gray' },
  { id: 'yolo', name: 'YOLO Detection', description: 'Person bounding boxes', color: 'blue' },
  { id: 'crop', name: 'Person Crop', description: 'Extracted person regions', color: 'purple' },
  { id: 'pose', name: 'Pose Estimation', description: 'MediaPipe skeleton', color: 'cyan' },
  { id: 'rail', name: 'Rail Hit-Test', description: 'Polygon containment check', color: 'green' },
  { id: 'phone', name: 'Phone Heuristic', description: 'Wrist-to-ear distance', color: 'orange' },
  { id: 'state', name: 'State Machine', description: 'Debounced state tracking', color: 'yellow' },
  { id: 'output', name: 'Final Output', description: 'Committed events', color: 'red' }
];

// Utility functions
export function getComplianceLabel(status: string): string {
  switch (status) {
    case 'compliant': return 'Compliant';
    case 'non_compliant': return 'Non-Compliant';
    default: return 'Unknown';
  }
}

export function getComplianceColor(status: string): string {
  switch (status) {
    case 'compliant': return 'text-green-400';
    case 'non_compliant': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

export function getEventTypeLabel(eventType: string): string {
  switch (eventType) {
    case 'compliant_start': return 'Started Holding Rail';
    case 'non_compliant_start': return 'Released Rail';
    case 'phone_detected': return 'Phone Detected';
    case 'phone_ended': return 'Phone Call Ended';
    default: return eventType;
  }
}

export function getEventTypeColor(eventType: string): string {
  switch (eventType) {
    case 'compliant_start': return 'text-green-400';
    case 'non_compliant_start': return 'text-red-400';
    case 'phone_detected': return 'text-orange-400';
    case 'phone_ended': return 'text-blue-400';
    default: return 'text-gray-400';
  }
}
