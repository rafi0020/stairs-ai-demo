/**
 * Documentation.tsx
 * 
 * Complete project documentation page with:
 * - System architecture
 * - Algorithm explanations
 * - Implementation details
 * - API reference
 */

import { useState } from 'react';
import { 
  BookOpen, Eye, Database,
  ChevronDown, ChevronRight, Zap, Shield,
  Camera, Phone, Brain, Layers
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'System Overview', icon: BookOpen },
  { id: 'architecture', label: 'Architecture', icon: Layers },
  { id: 'detection', label: 'Detection Pipeline', icon: Eye },
  { id: 'algorithms', label: 'Algorithms', icon: Brain },
  { id: 'api', label: 'API Reference', icon: Database },
];

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedAlgo, setExpandedAlgo] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            Stairs-AI Documentation
          </h1>
          <p className="text-gray-400 mt-2">
            Complete technical documentation for the Unilever Smart Staircase Safety System
          </p>
        </div>
        
        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeSection === id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-8">
          
          {/* System Overview */}
          {activeSection === 'overview' && (
            <div className="prose prose-invert max-w-none">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-blue-500" />
                System Overview
              </h2>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">What is Stairs-AI?</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Stairs-AI is a computer vision system designed to monitor staircase safety 
                    in industrial and commercial environments. It uses deep learning to detect 
                    persons, analyze their posture, and determine compliance with safety protocols.
                  </p>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Key Objectives</h3>
                  <ul className="text-gray-300 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-green-500 mt-0.5" />
                      Detect handrail usage compliance
                    </li>
                    <li className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-yellow-500 mt-0.5" />
                      Identify phone usage during stair traversal
                    </li>
                    <li className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                      Provide real-time safety monitoring
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-purple-500 mt-0.5" />
                      Generate actionable safety insights
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-800">
                <h3 className="text-lg font-semibold text-white mb-4">Transparent ML Approach</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Unlike black-box ML systems, Stairs-AI implements a <strong>transparent approach</strong> 
                  where every step of the detection pipeline is transparent and explainable:
                </p>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Input Frame</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Detection</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <Brain className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Analysis</div>
                  </div>
                  <div className="text-center p-3 bg-gray-800/50 rounded">
                    <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-xs text-gray-400">Decision</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Technology Stack</h3>
                <div className="grid grid-cols-3 gap-4">
                  <TechCard 
                    title="YOLOv8" 
                    description="State-of-the-art object detection for person localization"
                    badge="Detection"
                  />
                  <TechCard 
                    title="MediaPipe" 
                    description="Google's pose estimation for body keypoint extraction"
                    badge="Pose"
                  />
                  <TechCard 
                    title="OpenCV" 
                    description="Computer vision operations and image processing"
                    badge="Processing"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Architecture - Interactive Diagrams */}
          {activeSection === 'architecture' && (
            <ArchitectureSection />
          )}
          
          {/* Detection Pipeline */}
          {activeSection === 'detection' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Eye className="w-6 h-6 text-green-500" />
                Detection Pipeline
              </h2>
              
              <div className="space-y-6">
                <PipelineStep
                  number={1}
                  title="Person Detection (YOLO)"
                  description="YOLOv8 nano model processes each video frame to detect persons with bounding boxes."
                  details={[
                    'Model: yolov8n.pt (6.3M parameters)',
                    'Input: 640x640 RGB frame',
                    'Output: List of bounding boxes with confidence scores',
                    'Threshold: 0.5 confidence minimum',
                  ]}
                  color="blue"
                />
                
                <PipelineStep
                  number={2}
                  title="Person Cropping"
                  description="Each detected person is cropped from the frame for individual analysis."
                  details={[
                    'Padding: 10% margin around bounding box',
                    'Normalization: Resize to standard dimensions',
                    'Output: Individual person crops for pose estimation',
                  ]}
                  color="purple"
                />
                
                <PipelineStep
                  number={3}
                  title="Pose Estimation (MediaPipe)"
                  description="MediaPipe Pose extracts 33 body keypoints from each person crop."
                  details={[
                    'Model: MediaPipe BlazePose GHUM 3D',
                    'Keypoints: 33 landmarks including hands and face',
                    'Key landmarks: wrist_left (15), wrist_right (16)',
                    'Visibility threshold: 0.5 for reliable keypoints',
                  ]}
                  color="cyan"
                />
                
                <PipelineStep
                  number={4}
                  title="Rail Hit-Test"
                  description="Tests if hand keypoints fall within the predefined rail mask polygon."
                  details={[
                    'Rail mask: Pre-defined polygon in image coordinates',
                    'Test: Point-in-polygon for left/right wrist',
                    'Result: touching=true if either wrist in rail zone',
                    'Confidence: Based on keypoint visibility score',
                  ]}
                  color="green"
                />
                
                <PipelineStep
                  number={5}
                  title="Phone Detection Heuristic"
                  description="Multi-factor heuristic to detect phone usage based on hand and head positions."
                  details={[
                    'Factor 1: Wrist-to-ear distance < threshold',
                    'Factor 2: Hand elevation above shoulder',
                    'Factor 3: Arm angle suggesting holding object',
                    'Threshold: 0.05 normalized distance',
                  ]}
                  color="yellow"
                />
                
                <PipelineStep
                  number={6}
                  title="State Machine & Debounce"
                  description="Finite state machine with temporal debouncing to prevent flickering detections."
                  details={[
                    'States: unknown → non_compliant ↔ compliant',
                    'Debounce duration: 0.55 seconds',
                    'Event commit: Only after stable state duration',
                    'Prevents: Flickering from momentary occlusions',
                  ]}
                  color="orange"
                />
              </div>
            </div>
          )}
          
          {/* Algorithms */}
          {activeSection === 'algorithms' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Brain className="w-6 h-6 text-cyan-500" />
                Algorithm Details
              </h2>
              
              <div className="space-y-4">
                <AlgorithmSection
                  title="Rail Hit-Test Algorithm"
                  expanded={expandedAlgo === 'rail'}
                  onToggle={() => setExpandedAlgo(expandedAlgo === 'rail' ? null : 'rail')}
                  content={
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        The rail hit-test determines if a person's hand is touching the handrail
                        by checking if wrist keypoints fall within a predefined polygon mask.
                      </p>
                      
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-300">
                        <pre>{`def rail_hit_test(keypoints, rail_polygon):
    """
    Test if wrist keypoints are within rail mask.
    
    Args:
        keypoints: Dict of {name: (x, y, visibility)}
        rail_polygon: List of (x, y) polygon vertices
    
    Returns:
        {touching: bool, confidence: float, hand: str}
    """
    left_wrist = keypoints.get('left_wrist')
    right_wrist = keypoints.get('right_wrist')
    
    left_in = point_in_polygon(left_wrist[:2], rail_polygon)
    right_in = point_in_polygon(right_wrist[:2], rail_polygon)
    
    if left_in or right_in:
        return {
            'touching': True,
            'confidence': max(left_wrist[2], right_wrist[2]),
            'hand': 'left' if left_in else 'right'
        }
    
    return {'touching': False, 'confidence': 0.0}`}</pre>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-800 p-4 rounded">
                          <h4 className="text-white font-medium text-sm mb-2">Inputs</h4>
                          <ul className="text-gray-400 text-xs space-y-1">
                            <li>• Wrist keypoint coordinates (x, y)</li>
                            <li>• Keypoint visibility/confidence</li>
                            <li>• Rail polygon vertices</li>
                          </ul>
                        </div>
                        <div className="bg-gray-800 p-4 rounded">
                          <h4 className="text-white font-medium text-sm mb-2">Outputs</h4>
                          <ul className="text-gray-400 text-xs space-y-1">
                            <li>• touching: boolean flag</li>
                            <li>• confidence: 0.0-1.0 score</li>
                            <li>• hand: 'left' | 'right' | null</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  }
                />
                
                <AlgorithmSection
                  title="Phone Detection Heuristic"
                  expanded={expandedAlgo === 'phone'}
                  onToggle={() => setExpandedAlgo(expandedAlgo === 'phone' ? null : 'phone')}
                  content={
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        Phone detection uses geometric heuristics based on the relative positions
                        of hand and head keypoints to infer phone usage.
                      </p>
                      
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-300">
                        <pre>{`def phone_heuristic(keypoints, threshold=0.05):
    """
    Detect phone usage from pose keypoints.
    
    Heuristics:
    1. Wrist near ear (hand raised to head)
    2. Forearm angle suggesting holding object
    3. Wrist above shoulder height
    """
    left_wrist = keypoints['left_wrist']
    right_wrist = keypoints['right_wrist']
    left_ear = keypoints['left_ear']
    right_ear = keypoints['right_ear']
    
    # Calculate wrist-to-ear distances
    left_dist = distance(left_wrist, left_ear)
    right_dist = distance(right_wrist, right_ear)
    
    # Normalize by torso length for scale invariance
    torso_len = distance(
        keypoints['left_shoulder'],
        keypoints['left_hip']
    )
    
    left_normalized = left_dist / torso_len
    right_normalized = right_dist / torso_len
    
    phone_visible = (
        left_normalized < threshold or 
        right_normalized < threshold
    )
    
    return {
        'phone_visible': phone_visible,
        'confidence': 1.0 - min(left_normalized, right_normalized),
        'hand': 'left' if left_normalized < right_normalized else 'right'
    }`}</pre>
                      </div>
                    </div>
                  }
                />
                
                <AlgorithmSection
                  title="State Machine & Debounce"
                  expanded={expandedAlgo === 'state'}
                  onToggle={() => setExpandedAlgo(expandedAlgo === 'state' ? null : 'state')}
                  content={
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        A finite state machine with temporal debouncing prevents flickering
                        detections caused by momentary occlusions or pose estimation errors.
                      </p>
                      
                      <div className="bg-gray-800 p-4 rounded">
                        <h4 className="text-white font-medium text-sm mb-3">State Diagram</h4>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <div className="w-24 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-gray-300 text-sm">Unknown</span>
                            </div>
                          </div>
                          <ChevronRight className="text-gray-600" />
                          <div className="text-center">
                            <div className="w-24 h-12 bg-red-900 rounded-lg flex items-center justify-center border border-red-700">
                              <span className="text-red-300 text-sm">Non-Compliant</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <ChevronRight className="text-gray-600 rotate-90" />
                            <span className="text-gray-500 text-xs my-1">debounce</span>
                            <ChevronRight className="text-gray-600 -rotate-90" />
                          </div>
                          <div className="text-center">
                            <div className="w-24 h-12 bg-green-900 rounded-lg flex items-center justify-center border border-green-700">
                              <span className="text-green-300 text-sm">Compliant</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-300">
                        <pre>{`class ComplianceStateMachine:
    def __init__(self, debounce_duration=0.55):
        self.state = 'unknown'
        self.pending_state = None
        self.pending_since = None
        self.debounce_duration = debounce_duration
    
    def update(self, is_compliant: bool, timestamp: float):
        new_state = 'compliant' if is_compliant else 'non_compliant'
        
        if new_state != self.state:
            if self.pending_state == new_state:
                # Check if debounce period has passed
                if timestamp - self.pending_since >= self.debounce_duration:
                    old_state = self.state
                    self.state = new_state
                    self.pending_state = None
                    return {'event': f'{old_state}_to_{new_state}'}
            else:
                # Start new pending transition
                self.pending_state = new_state
                self.pending_since = timestamp
        else:
            # Reset pending if back to current state
            self.pending_state = None
        
        return None`}</pre>
                      </div>
                    </div>
                  }
                />
                
                <AlgorithmSection
                  title="Point-in-Polygon Test"
                  expanded={expandedAlgo === 'pip'}
                  onToggle={() => setExpandedAlgo(expandedAlgo === 'pip' ? null : 'pip')}
                  content={
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm">
                        Ray casting algorithm to determine if a point lies inside a polygon.
                        Used for rail mask hit-testing.
                      </p>
                      
                      <div className="bg-gray-900 p-4 rounded font-mono text-sm text-gray-300">
                        <pre>{`def point_in_polygon(point, polygon):
    """
    Ray casting algorithm for point-in-polygon test.
    
    Cast a horizontal ray from the point to infinity.
    Count intersections with polygon edges.
    Odd count = inside, even count = outside.
    """
    x, y = point
    n = len(polygon)
    inside = False
    
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        
        if ((yi > y) != (yj > y)) and \\
           (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        
        j = i
    
    return inside`}</pre>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          )}
          
          {/* API Reference */}
          {activeSection === 'api' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Database className="w-6 h-6 text-red-500" />
                API Reference
              </h2>
              
              <div className="space-y-6">
                <ApiEndpoint
                  method="GET"
                  path="/demo/summary.json"
                  description="Video processing summary and configuration"
                  response={`{
  "source_video": "sample_stair_8s.mp4",
  "duration_sec": 8.0,
  "total_frames": 192,
  "persons_detected_count": 2,
  "parameters": {
    "yolo_model": "yolov8n.pt",
    "yolo_confidence": 0.5,
    "phone_threshold": 0.05,
    "debounce_duration": 0.55
  },
  "compliance_summary": {
    "compliant_frames": 96,
    "non_compliant_frames": 96
  }
}`}
                />
                
                <ApiEndpoint
                  method="GET"
                  path="/demo/events.json"
                  description="List of committed compliance events"
                  response={`[
  {
    "event_id": "evt_001",
    "event_type": "became_compliant",
    "person_id": 1,
    "timestamp_sec": 2.5,
    "frame_number": 60,
    "evidence_frame_path": "evidence/evt_001.jpg"
  }
]`}
                />
                
                <ApiEndpoint
                  method="GET"
                  path="/demo/frame_packets.json"
                  description="Per-frame detection and analysis data"
                  response={`[
  {
    "frame_number": 60,
    "timestamp_sec": 2.5,
    "metrics": {
      "total_persons": 2,
      "compliant_count": 1,
      "non_compliant_count": 1,
      "phone_count": 0
    },
    "persons": [
      {
        "person_id": 1,
        "bbox": [100, 50, 200, 300],
        "compliance_status": "compliant",
        "rail_hit_test": {
          "touching": true,
          "confidence": 0.92,
          "hand": "left"
        },
        "phone_heuristic": {
          "phone_visible": false,
          "confidence": 0.1
        }
      }
    ]
  }
]`}
                />
                
                <ApiEndpoint
                  method="GET"
                  path="/demo/storyboard.json"
                  description="Demo chapter markers for narrative"
                  response={`[
  {
    "id": "ch1",
    "title": "Approach",
    "timestamp_sec": 0.0,
    "focus": "Initial detection",
    "image_path": "storyboard/ch1_approach.jpg"
  }
]`}
                />
              </div>
              
              <div className="mt-8 bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">TypeScript Types</h3>
                <div className="font-mono text-xs text-gray-300 bg-gray-900 p-4 rounded overflow-x-auto">
                  <pre>{`// Core types for the demo application

interface FramePacket {
  frame_number: number;
  timestamp_sec: number;
  metrics: FrameMetrics;
  persons: PersonAnalysis[];
}

interface PersonAnalysis {
  person_id: number;
  bbox: [number, number, number, number];
  compliance_status: 'compliant' | 'non_compliant' | 'unknown';
  rail_hit_test: RailHitResult;
  phone_heuristic: PhoneResult;
  keypoint_count: number;
}

interface RailHitResult {
  touching: boolean;
  confidence: number;
  hand: 'left' | 'right' | null;
}

interface PhoneResult {
  phone_visible: boolean;
  confidence: number;
  hand: 'left' | 'right' | null;
}

interface Event {
  event_id: string;
  event_type: string;
  person_id: number;
  timestamp_sec: number;
  frame_number: number;
  evidence_frame_path: string;
}`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components

function TechCard({ title, description, badge }: { 
  title: string; 
  description: string; 
  badge: string; 
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white font-semibold">{title}</h4>
        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">{badge}</span>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function PipelineStep({ number, title, description, details, color }: {
  number: number;
  title: string;
  description: string;
  details: string[];
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-900/20',
    purple: 'border-purple-500 bg-purple-900/20',
    cyan: 'border-cyan-500 bg-cyan-900/20',
    green: 'border-green-500 bg-green-900/20',
    yellow: 'border-yellow-500 bg-yellow-900/20',
    orange: 'border-orange-500 bg-orange-900/20',
  };
  
  return (
    <div className={`p-6 rounded-lg border-l-4 ${colors[color]}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold">{number}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-300 text-sm mb-3">{description}</p>
          <ul className="space-y-1">
            {details.map((detail, idx) => (
              <li key={idx} className="text-gray-400 text-xs flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AlgorithmSection({ title, expanded, onToggle, content }: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  content: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700 transition-colors"
      >
        <span className="text-white font-medium">{title}</span>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-700">
          {content}
        </div>
      )}
    </div>
  );
}

function ApiEndpoint({ method, path, description, response }: {
  method: string;
  path: string;
  description: string;
  response: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <span className="px-2 py-1 bg-green-700 text-green-200 text-xs font-bold rounded">
          {method}
        </span>
        <span className="font-mono text-blue-400 text-sm">{path}</span>
      </div>
      <div className="p-4">
        <p className="text-gray-400 text-sm mb-3">{description}</p>
        <div className="bg-gray-900 p-3 rounded font-mono text-xs text-gray-300 overflow-x-auto">
          <pre>{response}</pre>
        </div>
      </div>
    </div>
  );
}

// Interactive Architecture Section with SVG diagrams
function ArchitectureSection() {
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const PIPELINE_STAGES = [
    { id: 0, label: 'Video Input', color: '#6b7280', x: 50, desc: 'Camera feed or video file input', tech: 'OpenCV VideoCapture' },
    { id: 1, label: 'YOLO Detection', color: '#3b82f6', x: 130, desc: 'Detect persons with bounding boxes', tech: 'YOLOv8n (6.3M params)' },
    { id: 2, label: 'Person Crop', color: '#a855f7', x: 210, desc: 'Extract individual person ROIs', tech: 'NumPy array slicing' },
    { id: 3, label: 'Pose Estimation', color: '#06b6d4', x: 290, desc: 'Extract 33 body keypoints', tech: 'MediaPipe BlazePose' },
    { id: 4, label: 'Rail Hit-Test', color: '#22c55e', x: 370, desc: 'Check wrist-rail intersection', tech: 'Point-in-polygon algorithm' },
    { id: 5, label: 'Phone Detection', color: '#eab308', x: 450, desc: 'Detect phone usage heuristics', tech: 'Wrist-ear distance ratio' },
    { id: 6, label: 'State Machine', color: '#f97316', x: 530, desc: 'Debounce and commit events', tech: 'FSM with 0.55s debounce' },
    { id: 7, label: 'Output', color: '#ef4444', x: 610, desc: 'Events, metrics, evidence', tech: 'JSON export' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Layers className="w-6 h-6 text-purple-500" />
        Interactive System Architecture
      </h2>
      
      {/* Main Interactive Pipeline Diagram */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <h3 className="text-base font-semibold text-white mb-2">ML Processing Pipeline</h3>
        <p className="text-gray-400 text-xs mb-4">Click or hover on any stage to see details</p>
        
        <div className="relative">
          <svg viewBox="0 0 700 160" className="w-full h-auto">
            {/* Background */}
            <defs>
              <linearGradient id="pipelineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect x="0" y="0" width="700" height="160" fill="url(#pipelineGrad)" rx="8"/>
            
            {/* Connection lines */}
            {PIPELINE_STAGES.slice(0, -1).map((stage, idx) => (
              <line 
                key={`line-${idx}`}
                x1={stage.x + 22} 
                y1="55" 
                x2={PIPELINE_STAGES[idx + 1].x - 8} 
                y2="55"
                stroke={activeStage === idx || activeStage === idx + 1 ? '#60a5fa' : '#475569'}
                strokeWidth="2"
                strokeDasharray={activeStage === idx ? "6,3" : "0"}
                className="transition-all duration-300"
              />
            ))}
            
            {/* Pipeline nodes */}
            {PIPELINE_STAGES.map((stage) => (
              <g 
                key={stage.id}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredNode(stage.label)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setActiveStage(activeStage === stage.id ? null : stage.id)}
              >
                {/* Node glow effect when active */}
                {(activeStage === stage.id || hoveredNode === stage.label) && (
                  <circle 
                    cx={stage.x} 
                    cy="55" 
                    r="28" 
                    fill={stage.color} 
                    opacity="0.3"
                    filter="url(#glow)"
                  />
                )}
                
                {/* Main node circle */}
                <circle 
                  cx={stage.x} 
                  cy="55" 
                  r="20" 
                  fill={activeStage === stage.id ? stage.color : '#1e293b'}
                  stroke={stage.color}
                  strokeWidth={activeStage === stage.id || hoveredNode === stage.label ? "3" : "2"}
                  className="transition-all duration-200"
                />
                
                {/* Node number */}
                <text 
                  x={stage.x} 
                  y="59" 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="12" 
                  fontWeight="bold"
                >
                  {stage.id + 1}
                </text>
                
                {/* Label */}
                <text 
                  x={stage.x} 
                  y="90" 
                  textAnchor="middle" 
                  fill={activeStage === stage.id ? '#fff' : '#9ca3af'}
                  fontSize="9"
                  fontWeight={activeStage === stage.id ? "bold" : "normal"}
                >
                  {stage.label}
                </text>
                
                {/* Tech label when active */}
                {activeStage === stage.id && (
                  <text x={stage.x} y="105" textAnchor="middle" fill="#60a5fa" fontSize="7">
                    {stage.tech}
                  </text>
                )}
              </g>
            ))}
            
            {/* Data flow indicators */}
            <g className="animate-pulse">
              <circle cx="85" cy="55" r="3" fill="#60a5fa" opacity="0.8"/>
              <circle cx="165" cy="55" r="3" fill="#60a5fa" opacity="0.6"/>
              <circle cx="245" cy="55" r="3" fill="#60a5fa" opacity="0.4"/>
            </g>
            
            {/* Legend */}
            <text x="20" y="145" fill="#6b7280" fontSize="9">
              → Click nodes for details | Data flows left to right
            </text>
          </svg>
        </div>
        
        {/* Stage Details Panel */}
        {activeStage !== null && (
          <div className="mt-4 p-3 bg-gray-900 rounded-lg border-l-4" style={{ borderColor: PIPELINE_STAGES[activeStage].color }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: PIPELINE_STAGES[activeStage].color }}
              >
                <span className="text-white font-bold text-sm">{activeStage + 1}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm">{PIPELINE_STAGES[activeStage].label}</h4>
                <p className="text-gray-400 text-xs">{PIPELINE_STAGES[activeStage].tech} — {PIPELINE_STAGES[activeStage].desc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Compliance Logic Diagram */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <h3 className="text-base font-semibold text-white mb-2">Compliance Decision Logic</h3>
        <p className="text-gray-400 text-xs mb-4">Interactive decision tree showing how compliance is determined</p>
        
        <svg viewBox="0 0 500 220" className="w-full h-auto">
          <defs>
            <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="500" height="220" fill="url(#bgGrad2)" rx="8"/>
          
          {/* Start node */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('start')}>
            <circle cx="250" cy="30" r="18" fill="#3b82f6" stroke={hoveredNode === 'start' ? '#fff' : '#1e40af'} strokeWidth="2"/>
            <text x="250" y="34" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">START</text>
          </g>
          
          {/* Connection from start */}
          <line x1="250" y1="48" x2="250" y2="68" stroke="#475569" strokeWidth="2"/>
          
          {/* Rail Check Decision */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('rail')}>
            <polygon 
              points="250,70 310,100 250,130 190,100" 
              fill={hoveredNode === 'rail' ? '#22c55e' : '#1e293b'} 
              stroke="#22c55e" 
              strokeWidth="2"
            />
            <text x="250" y="97" textAnchor="middle" fill="white" fontSize="8">Touching</text>
            <text x="250" y="107" textAnchor="middle" fill="white" fontSize="8">Railing?</text>
          </g>
          
          {/* No rail - goes to non-compliant */}
          <line x1="190" y1="100" x2="100" y2="100" stroke="#ef4444" strokeWidth="2"/>
          <text x="140" y="92" fill="#ef4444" fontSize="8">NO</text>
          
          {/* Yes rail - goes to phone check */}
          <line x1="310" y1="100" x2="390" y2="100" stroke="#22c55e" strokeWidth="2"/>
          <line x1="390" y1="100" x2="390" y2="140" stroke="#22c55e" strokeWidth="2"/>
          <text x="350" y="92" fill="#22c55e" fontSize="8">YES</text>
          
          {/* Non-compliant result (no rail) */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('nc1')}>
            <rect x="35" y="82" width="70" height="36" rx="5" fill={hoveredNode === 'nc1' ? '#ef4444' : '#7f1d1d'} stroke="#ef4444" strokeWidth="2"/>
            <text x="70" y="103" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">NON-COMPLIANT</text>
          </g>
          
          {/* Phone Check Decision */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('phone')}>
            <polygon 
              points="390,145 445,175 390,205 335,175" 
              fill={hoveredNode === 'phone' ? '#f59e0b' : '#1e293b'} 
              stroke="#f59e0b" 
              strokeWidth="2"
            />
            <text x="390" y="172" textAnchor="middle" fill="white" fontSize="8">Using</text>
            <text x="390" y="182" textAnchor="middle" fill="white" fontSize="8">Phone?</text>
          </g>
          
          {/* Yes phone - non-compliant */}
          <line x1="445" y1="175" x2="480" y2="175" stroke="#ef4444" strokeWidth="2"/>
          <line x1="480" y1="175" x2="480" y2="120" stroke="#ef4444" strokeWidth="2"/>
          <line x1="480" y1="120" x2="455" y2="120" stroke="#ef4444" strokeWidth="2"/>
          <text x="458" y="168" fill="#ef4444" fontSize="8">YES</text>
          
          {/* Non-compliant result (phone) */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('nc2')}>
            <rect x="385" y="102" width="70" height="36" rx="5" fill={hoveredNode === 'nc2' ? '#ef4444' : '#7f1d1d'} stroke="#ef4444" strokeWidth="2"/>
            <text x="420" y="123" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">NON-COMPLIANT</text>
          </g>
          
          {/* No phone - compliant */}
          <line x1="335" y1="175" x2="265" y2="175" stroke="#22c55e" strokeWidth="2"/>
          <text x="295" y="168" fill="#22c55e" fontSize="8">NO</text>
          
          {/* Compliant result */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('comp')}>
            <rect x="175" y="157" width="85" height="36" rx="5" fill={hoveredNode === 'comp' ? '#22c55e' : '#14532d'} stroke="#22c55e" strokeWidth="3"/>
            <text x="217" y="179" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">✓ COMPLIANT</text>
          </g>
          
          {/* Legend */}
          <g transform="translate(15, 180)">
            <rect width="130" height="32" fill="rgba(0,0,0,0.3)" rx="4"/>
            <circle cx="12" cy="10" r="5" fill="#22c55e"/>
            <text x="22" y="13" fill="#9ca3af" fontSize="7">Rail + No phone</text>
            <circle cx="12" cy="24" r="5" fill="#ef4444"/>
            <text x="22" y="27" fill="#9ca3af" fontSize="7">No rail OR phone</text>
          </g>
        </svg>
      </div>
      
      {/* State Machine Diagram */}
      <div className="bg-gray-800 rounded-xl p-4">
        <h3 className="text-base font-semibold text-white mb-2">State Machine & Debounce</h3>
        <p className="text-gray-400 text-xs mb-4">How compliance states transition with temporal debouncing</p>
        
        <svg viewBox="0 0 500 140" className="w-full h-auto">
          <rect width="500" height="140" fill="#0f172a" rx="8"/>
          
          {/* Unknown State */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('unknown')}>
            <circle cx="70" cy="60" r="30" fill={hoveredNode === 'unknown' ? '#4b5563' : '#1f2937'} stroke="#6b7280" strokeWidth="2"/>
            <text x="70" y="64" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Unknown</text>
          </g>
          
          {/* Arrow to Non-Compliant */}
          <g>
            <line x1="100" y1="45" x2="145" y2="32" stroke="#ef4444" strokeWidth="2"/>
            <text x="130" y="30" fill="#ef4444" fontSize="9">detect</text>
          </g>
          
          {/* Non-Compliant State */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('noncomp')}>
            <circle cx="200" cy="35" r="28" fill={hoveredNode === 'noncomp' ? '#dc2626' : '#7f1d1d'} stroke="#ef4444" strokeWidth="2"/>
            <text x="200" y="32" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Non-</text>
            <text x="200" y="42" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">Compliant</text>
          </g>
          
          {/* Compliant State */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('compliant')}>
            <circle cx="200" cy="105" r="28" fill={hoveredNode === 'compliant' ? '#16a34a' : '#14532d'} stroke="#22c55e" strokeWidth="2"/>
            <text x="200" y="109" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">Compliant</text>
          </g>
          
          {/* Bidirectional arrows with debounce */}
          <g>
            <line x1="220" y1="55" x2="220" y2="80" stroke="#f59e0b" strokeWidth="2"/>
            <line x1="180" y1="80" x2="180" y2="55" stroke="#f59e0b" strokeWidth="2"/>
            <rect x="240" y="55" width="55" height="24" fill="#1e293b" rx="4" stroke="#f59e0b"/>
            <text x="268" y="68" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="bold">DEBOUNCE</text>
            <text x="268" y="76" textAnchor="middle" fill="#f59e0b" fontSize="6">0.55 sec</text>
          </g>
          
          {/* Event Output */}
          <g className="cursor-pointer" onMouseEnter={() => setHoveredNode('event')}>
            <rect x="340" y="50" width="100" height="34" fill={hoveredNode === 'event' ? '#1d4ed8' : '#1e3a8a'} rx="5" stroke="#3b82f6" strokeWidth="2"/>
            <text x="390" y="66" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">📤 Event Commit</text>
            <text x="390" y="78" textAnchor="middle" fill="#93c5fd" fontSize="6">became_compliant</text>
          </g>
          
          <line x1="295" y1="67" x2="340" y2="67" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2"/>
          
          {/* Info text */}
          <text x="70" y="125" fill="#6b7280" fontSize="7">
            States only transition after 0.55s of stable readings (debounce)
          </text>
        </svg>
      </div>
    </div>
  );
}
