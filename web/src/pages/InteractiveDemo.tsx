/**
 * InteractiveDemo.tsx
 * 
 * Single-page interactive safety demo with:
 * - Real video playback if sample video exists, otherwise animated SVG viewport
 * - Real-time overlay showing detections, poses, and analysis
 * - Card-based pipeline visualization with hover interactions
 * - Live metrics updating as video plays
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Eye, EyeOff,
  User, Hand, Phone, Shield, ShieldOff, AlertTriangle,
  Activity, Clock, Video, Monitor, Cpu,
  Scan, Move, Target, GitBranch, FileOutput, X
} from 'lucide-react';
import type { DemoData, FramePacket, PersonAnalysis } from '../lib/types';
import EventTimeline from '../components/EventTimeline';
import PersonCropStrip from '../components/PersonCropStrip';
import FrameViewer from '../components/FrameViewer';

interface InteractiveDemoProps {
  demoData: DemoData | null;
}

// Pipeline stages with detailed info for cards
const PIPELINE_STAGES = [
  { 
    id: 'input', 
    label: 'Video Input', 
    icon: Video,
    color: 'from-gray-500 to-gray-600',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-500',
    description: 'Camera feed captures staircase area',
    detail: '24 FPS, 1080p resolution',
    output: 'Raw video frames'
  },
  { 
    id: 'yolo', 
    label: 'YOLO Detection', 
    icon: Scan,
    color: 'from-blue-500 to-blue-600',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-500',
    description: 'YOLOv8 detects persons in frame',
    detail: 'Model: yolov8n.pt, Conf: 0.5',
    output: 'Bounding boxes + confidence'
  },
  { 
    id: 'crop', 
    label: 'Person Crop', 
    icon: Move,
    color: 'from-purple-500 to-purple-600',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-500',
    description: 'Extract individual person regions',
    detail: '10% padding around bbox',
    output: 'Cropped person images'
  },
  { 
    id: 'pose', 
    label: 'Pose Estimation', 
    icon: User,
    color: 'from-cyan-500 to-cyan-600',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-500',
    description: 'MediaPipe extracts body keypoints',
    detail: '33 landmarks per person',
    output: 'Skeleton keypoints'
  },
  { 
    id: 'rail', 
    label: 'Rail Hit-Test', 
    icon: Target,
    color: 'from-green-500 to-green-600',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-500',
    description: 'Test wrist position against rail mask',
    detail: 'Point-in-polygon test',
    output: 'touching: true/false'
  },
  { 
    id: 'phone', 
    label: 'Phone Detection', 
    icon: Phone,
    color: 'from-yellow-500 to-yellow-600',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-500',
    description: 'Wrist-ear distance heuristic',
    detail: 'Threshold: 0.05 normalized',
    output: 'phone_visible: true/false'
  },
  { 
    id: 'state', 
    label: 'State Machine', 
    icon: GitBranch,
    color: 'from-orange-500 to-orange-600',
    borderColor: 'border-orange-500',
    bgColor: 'bg-orange-500',
    description: 'Debounce noisy detections',
    detail: 'Debounce: 0.55 seconds',
    output: 'Stable compliance state'
  },
  { 
    id: 'output', 
    label: 'Event Output', 
    icon: FileOutput,
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-500',
    bgColor: 'bg-red-500',
    description: 'Commit compliance events',
    detail: 'JSON export ready',
    output: 'Events + analytics'
  },
];

export default function InteractiveDemo({ demoData }: InteractiveDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showOverlays, setShowOverlays] = useState({
    boundingBox: true,
    pose: true,
    railMask: true,
  });
  const [activeStage, setActiveStage] = useState(0);
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const [videoAvailable, setVideoAvailable] = useState(false);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  const totalDuration = demoData?.summary?.total_duration_sec || 8;
  const fps = 24;
  
  // Check if video file exists
  useEffect(() => {
    const video = document.createElement('video');
    video.src = '/stairs-ai-demo/demo/sample_video.mp4';
    
    video.onloadedmetadata = () => {
      setVideoAvailable(true);
    };
    
    video.onerror = () => {
      setVideoAvailable(false);
    };
    
    // Also try alternative paths
    setTimeout(() => {
      if (!videoAvailable) {
        const altVideo = document.createElement('video');
        altVideo.src = './demo/sample_video.mp4';
        altVideo.onloadedmetadata = () => setVideoAvailable(true);
      }
    }, 500);
  }, []);
  
  // Get current frame packet based on time
  const getCurrentPacket = useCallback((): FramePacket | null => {
    if (!demoData?.framePackets?.length) return null;
    
    const packets = demoData.framePackets;
    let closest = packets[0];
    let minDiff = Math.abs(packets[0].timestamp_sec - currentTime);
    
    for (const packet of packets) {
      const diff = Math.abs(packet.timestamp_sec - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = packet;
      }
    }
    return closest;
  }, [demoData, currentTime]);
  
  const currentPacket = getCurrentPacket();
  
  // Sync video with current time
  useEffect(() => {
    if (videoRef.current && videoAvailable) {
      if (Math.abs(videoRef.current.currentTime - currentTime) > 0.1) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, videoAvailable]);
  
  // Animation loop for playback (used for both video and SVG mode)
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoRef.current && videoAvailable) {
        videoRef.current.pause();
      }
      return;
    }
    
    if (videoRef.current && videoAvailable) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play();
    }
    
    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      setCurrentTime(prev => {
        const next = prev + delta * playbackSpeed;
        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
      
      // Cycle through pipeline stages based on time
      const stageIndex = Math.floor((currentTime / totalDuration) * PIPELINE_STAGES.length) % PIPELINE_STAGES.length;
      setActiveStage(stageIndex);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalDuration, videoAvailable, currentTime]);
  
  const handlePlayPause = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
    lastTimeRef.current = 0;
    setIsPlaying(!isPlaying);
  };
  
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setActiveStage(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  const formatTime = (sec: number) => {
    const s = Math.floor(sec);
    const ms = Math.floor((sec % 1) * 100);
    return `${s}.${ms.toString().padStart(2, '0')}s`;
  };
  
  // Get current phase based on time (for simulation mode)
  const currentPhase = Math.floor(currentTime / 2.5) % 4;
  const simIsTouchingRail = currentPhase === 1 || currentPhase === 2;
  const simHasPhone = currentPhase === 2 || currentPhase === 3;
  const simIsCompliant = simIsTouchingRail && !simHasPhone;
  
  // Create simulated persons when no real data is available
  const simulatedPersons: PersonAnalysis[] = currentTime > 0 ? [{
    person_id: 1,
    bbox: { x: 100, y: 80, width: 160, height: 200 },
    confidence: 0.87,
    pose: { landmarks: [] },
    rail_hit_test: {
      left_wrist_in_left_rail: simIsTouchingRail,
      right_wrist_in_left_rail: false,
      left_wrist_in_right_rail: false,
      right_wrist_in_right_rail: false,
      any_hit: simIsTouchingRail
    },
    phone_heuristic: {
      left_wrist_to_left_ear_dist: 0.5,
      left_wrist_to_right_ear_dist: 0.5,
      right_wrist_to_left_ear_dist: simHasPhone ? 0.03 : 0.5,
      right_wrist_to_right_ear_dist: simHasPhone ? 0.03 : 0.5,
      min_distance: simHasPhone ? 0.03 : 0.5,
      threshold: 0.05,
      is_phone_talking: simHasPhone
    },
    compliance_status: simIsCompliant ? 'compliant' : 'non_compliant'
  }] : [];
  
  // Get persons from current packet, fallback to simulated data
  const realPersons = currentPacket?.persons || [];
  const persons = realPersons.length > 0 ? realPersons : simulatedPersons;
  const metrics = currentPacket?.metrics || (currentTime > 0 ? {
    total_persons: 1,
    compliant_count: simIsCompliant ? 1 : 0,
    non_compliant_count: simIsCompliant ? 0 : 1,
    phone_count: simHasPhone ? 1 : 0
  } : { total_persons: 0, compliant_count: 0, non_compliant_count: 0, phone_count: 0 });
  
  // Get displayed stage (hovered or active)
  const displayedStage = hoveredStage !== null ? hoveredStage : activeStage;
  
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Main Demo Container */}
      <div className="max-w-[1800px] mx-auto p-4">
        
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Stairs-AI Safety Demo
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              ML Pipeline Visualization
              {videoAvailable ? (
                <span className="flex items-center gap-1 text-green-400 text-xs bg-green-900/30 px-2 py-0.5 rounded">
                  <Video className="w-3 h-3" /> Video Mode
                </span>
              ) : (
                <span className="flex items-center gap-1 text-blue-400 text-xs bg-blue-900/30 px-2 py-0.5 rounded">
                  <Monitor className="w-3 h-3" /> Simulation Mode
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Speed:</span>
              {[0.5, 1, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    playbackSpeed === speed 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/30' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Pipeline Flow Cards - Interactive Card Grid */}
        <div className="mb-4">
          <div className="grid grid-cols-8 gap-2">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = idx <= activeStage && isPlaying;
              const isCurrent = idx === activeStage && isPlaying;
              const isHovered = hoveredStage === idx;
              
              return (
                <div
                  key={stage.id}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    isHovered ? 'z-20 scale-105' : 'z-10'
                  }`}
                  onMouseEnter={() => setHoveredStage(idx)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  {/* Card */}
                  <div className={`
                    rounded-xl p-3 border-2 transition-all duration-300
                    ${isCurrent 
                      ? `bg-gradient-to-br ${stage.color} border-white shadow-lg shadow-current/30` 
                      : isActive
                        ? `bg-gradient-to-br ${stage.color} ${stage.borderColor} opacity-80`
                        : isHovered
                          ? `bg-gray-800 ${stage.borderColor} border-opacity-100`
                          : 'bg-gray-800/50 border-gray-700'
                    }
                  `}>
                    {/* Stage Number */}
                    <div className={`
                      absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${isCurrent || isActive 
                        ? 'bg-white text-gray-900' 
                        : 'bg-gray-700 text-gray-300'
                      }
                    `}>
                      {idx + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2
                      ${isCurrent 
                        ? 'bg-white/20' 
                        : isActive 
                          ? 'bg-white/10' 
                          : `bg-gradient-to-br ${stage.color}`
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-white animate-pulse' : 'text-white'}`} />
                    </div>
                    
                    {/* Label */}
                    <div className={`text-center text-xs font-medium truncate ${
                      isCurrent || isActive || isHovered ? 'text-white' : 'text-gray-400'
                    }`}>
                      {stage.label}
                    </div>
                    
                    {/* Processing indicator */}
                    {isCurrent && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Connector Arrow */}
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className={`absolute top-1/2 -right-2 w-2 h-0.5 ${
                      isActive ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  )}
                  
                  {/* Hover Tooltip */}
                  {isHovered && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 z-30">
                      <div className={`bg-gray-900 rounded-lg border ${stage.borderColor} p-3 shadow-xl`}>
                        <div className={`text-sm font-semibold mb-1 bg-gradient-to-r ${stage.color} bg-clip-text text-transparent`}>
                          {stage.label}
                        </div>
                        <p className="text-gray-300 text-xs mb-2">{stage.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Config:</span>
                          <span className="text-gray-400 font-mono">{stage.detail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="text-gray-500">Output:</span>
                          <span className="text-green-400">{stage.output}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* Left: Video Viewport with Overlays */}
          <div className="col-span-8">
            <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
              {/* Video Frame with Overlays */}
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                
                {/* Real Video Layer (if available) */}
                {videoAvailable && (
                  <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    src="/stairs-ai-demo/demo/sample_video.mp4"
                    muted
                    playsInline
                    onError={() => setVideoAvailable(false)}
                  />
                )}
                
                {/* SVG Overlay Layer - Evidence Frame Style */}
                <div className="absolute inset-0">
                  <svg viewBox="0 0 640 360" className="w-full h-full">
                    {/* Background - matches evidence_frames style */}
                    {!videoAvailable && (
                      <>
                        <defs>
                          <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="640" height="360" fill="#0f172a"/>
                        <rect width="640" height="360" fill="url(#gridPattern)"/>
                      </>
                    )}
                    
                    {/* Left Rail Zone - exactly like evidence frames */}
                    {showOverlays.railMask && (
                      <g>
                        <rect 
                          x="30" y="80" width="60" height="240" 
                          fill="#22c55e" 
                          opacity={persons.some(p => p.rail_hit_test?.left_wrist_in_left_rail || p.rail_hit_test?.right_wrist_in_left_rail) ? 0.4 : 0.2} 
                          stroke="#22c55e" 
                          strokeWidth="2"
                        />
                        <text x="60" y="335" textAnchor="middle" fill="#22c55e" fontFamily="sans-serif" fontSize="10">LEFT RAIL</text>
                      </g>
                    )}
                    
                    {/* Right Rail Zone */}
                    {showOverlays.railMask && (
                      <g>
                        <rect 
                          x="550" y="80" width="60" height="240" 
                          fill="#22c55e" 
                          opacity={persons.some(p => p.rail_hit_test?.left_wrist_in_right_rail || p.rail_hit_test?.right_wrist_in_right_rail) ? 0.4 : 0.2} 
                          stroke="#22c55e" 
                          strokeWidth="2"
                        />
                        <text x="580" y="335" textAnchor="middle" fill="#22c55e" fontFamily="sans-serif" fontSize="10">RIGHT RAIL</text>
                      </g>
                    )}
                    
                    {/* Animated Person Detection - Evidence Frame Style */}
                    {persons.map((person: PersonAnalysis, idx: number) => {
                      // Animate person position based on time - simulating walking
                      const progress = (currentTime / totalDuration);
                      const walkOffset = Math.sin(currentTime * 3) * 10;
                      
                      // 4 Phases with correct compliance logic:
                      // Phase 0: Not touching rail, no phone → NON-COMPLIANT (red)
                      // Phase 1: Touching rail, no phone → COMPLIANT (green) ✓ Only compliant case
                      // Phase 2: Touching rail, using phone → NON-COMPLIANT (orange/red)
                      // Phase 3: Not touching rail, using phone → NON-COMPLIANT (orange/red)
                      const phase = Math.floor(currentTime / 2.5) % 4; // Change every 2.5 seconds, loop through 4 phases
                      
                      const isTouchingRail = phase === 1 || phase === 2; // Touching in phases 1 and 2
                      const hasPhone = phase === 2 || phase === 3; // Phone in phases 2 and 3
                      
                      // COMPLIANT only when: touching rail AND NOT using phone
                      const isCompliant = isTouchingRail && !hasPhone;
                      
                      // Person position - moves across screen
                      const xCenter = 180 + progress * 280 + idx * 100;
                      const yCenter = 160 + walkOffset + idx * 20;
                      
                      // Skeleton color: red for non-compliant, green for compliant, orange accent for phone
                      const skeletonColor = isCompliant ? '#22c55e' : '#ef4444';
                      const bboxColor = isCompliant ? '#22c55e' : hasPhone ? '#f59e0b' : '#3b82f6';
                      
                      // Left wrist position - extends to rail if touching
                      const leftWristX = isTouchingRail ? 70 : xCenter - 50;
                      const leftWristY = yCenter + 40;
                      
                      // Right wrist position - raised if phone detected
                      const rightWristX = hasPhone ? xCenter + 20 : xCenter + 50;
                      const rightWristY = hasPhone ? yCenter - 10 : yCenter + 50;
                      
                      return (
                        <g key={person.person_id}>
                          {/* Person Bounding Box - dashed style like evidence frames */}
                          {showOverlays.boundingBox && (
                            <rect 
                              x={xCenter - 80} 
                              y={yCenter - 50} 
                              width="160" 
                              height="200" 
                              fill="none" 
                              stroke={bboxColor} 
                              strokeWidth="2" 
                              strokeDasharray="5,5"
                            />
                          )}
                          
                          {/* Skeleton - Evidence Frame Style */}
                          {showOverlays.pose && (
                            <g>
                              {/* Head */}
                              <circle cx={xCenter} cy={yCenter - 30} r="20" fill="none" stroke={skeletonColor} strokeWidth="2"/>
                              
                              {/* Body/Spine */}
                              <line x1={xCenter} y1={yCenter - 10} x2={xCenter} y2={yCenter + 60} stroke={skeletonColor} strokeWidth="2"/>
                              
                              {/* Left Arm - extends to rail if compliant */}
                              <line 
                                x1={xCenter} y1={yCenter + 10} 
                                x2={leftWristX} y2={leftWristY} 
                                stroke={isTouchingRail ? '#22c55e' : skeletonColor} 
                                strokeWidth="2"
                              />
                              
                              {/* Right Arm - raised if phone */}
                              <line 
                                x1={xCenter} y1={yCenter + 10} 
                                x2={rightWristX} y2={rightWristY} 
                                stroke={hasPhone ? '#f59e0b' : skeletonColor} 
                                strokeWidth="2"
                              />
                              
                              {/* Legs */}
                              <line x1={xCenter} y1={yCenter + 60} x2={xCenter - 30} y2={yCenter + 120} stroke={skeletonColor} strokeWidth="2"/>
                              <line x1={xCenter} y1={yCenter + 60} x2={xCenter + 30} y2={yCenter + 120} stroke={skeletonColor} strokeWidth="2"/>
                              
                              {/* Left Wrist Landmark */}
                              <circle 
                                cx={leftWristX} cy={leftWristY} 
                                r={isTouchingRail ? 8 : 5} 
                                fill={isTouchingRail ? '#22c55e' : '#f59e0b'}
                              />
                              
                              {/* Right Wrist Landmark */}
                              <circle 
                                cx={rightWristX} cy={rightWristY} 
                                r={hasPhone ? 8 : 5} 
                                fill={hasPhone ? '#f59e0b' : '#f59e0b'}
                              />
                              
                              {/* Hit indicator when touching rail */}
                              {isTouchingRail && (
                                <g>
                                  <line x1={leftWristX} y1={leftWristY} x2="60" y2={leftWristY} stroke="#22c55e" strokeWidth="3"/>
                                  <text x="60" y={leftWristY - 15} textAnchor="middle" fill="#22c55e" fontFamily="sans-serif" fontSize="10" fontWeight="bold">
                                    HIT!
                                  </text>
                                </g>
                              )}
                              
                              {/* Phone detection visualization */}
                              {hasPhone && (
                                <g>
                                  {/* Ear marker */}
                                  <circle cx={xCenter + 15} cy={yCenter - 35} r="5" fill="#f59e0b"/>
                                  
                                  {/* Distance line to ear */}
                                  <line 
                                    x1={rightWristX} y1={rightWristY} 
                                    x2={xCenter + 15} y2={yCenter - 35} 
                                    stroke="#f59e0b" 
                                    strokeWidth="2" 
                                    strokeDasharray="3,3"
                                  />
                                  
                                  {/* Distance label */}
                                  <text x={rightWristX + 25} y={rightWristY - 10} fill="#f59e0b" fontFamily="sans-serif" fontSize="9">
                                    0.032 &lt; 0.05
                                  </text>
                                  
                                  {/* Phone icon */}
                                  <rect x={rightWristX - 6} y={rightWristY - 5} width="12" height="20" rx="2" fill="#f59e0b"/>
                                </g>
                              )}
                            </g>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Title - Evidence Frame Style */}
                    <text x="320" y="30" textAnchor="middle" fill="#f8fafc" fontFamily="sans-serif" fontSize="16" fontWeight="bold">
                      {(() => {
                        const phase = Math.floor(currentTime / 2.5) % 4;
                        if (phase === 0) return 'Phase 1: No Rail Contact, No Phone';
                        if (phase === 1) return 'Phase 2: Rail Contact, No Phone ✓';
                        if (phase === 2) return 'Phase 3: Rail Contact + Phone Usage';
                        return 'Phase 4: No Rail Contact + Phone Usage';
                      })()}
                    </text>
                    <text x="320" y="50" textAnchor="middle" fill="#94a3b8" fontFamily="sans-serif" fontSize="12">
                      Frame {currentPacket?.frame_number || Math.floor(currentTime * fps)} | {formatTime(currentTime)} | Person #{persons[0]?.person_id || 1}
                    </text>
                    
                    {/* Status Badges - Evidence Frame Style */}
                    <g transform="translate(0, 0)">
                      {(() => {
                        const phase = Math.floor(currentTime / 2.5) % 4;
                        const isTouchingRail = phase === 1 || phase === 2;
                        const hasPhone = phase === 2 || phase === 3;
                        // COMPLIANT only when: touching rail AND NOT using phone
                        const isCompliant = isTouchingRail && !hasPhone;
                        
                        return (
                          <>
                            {/* Rail status badge */}
                            <rect 
                              x="140" 
                              y="330" 
                              width={isTouchingRail ? 110 : 130} 
                              height="24" 
                              rx="4" 
                              fill={isTouchingRail ? '#22c55e' : '#6b7280'}
                            />
                            <text 
                              x={isTouchingRail ? 195 : 205} 
                              y="347" 
                              textAnchor="middle" 
                              fill="white" 
                              fontFamily="sans-serif" 
                              fontSize="11" 
                              fontWeight="bold"
                            >
                              {isTouchingRail ? '✓ RAIL CONTACT' : '✗ NO RAIL'}
                            </text>
                            
                            {/* Phone status badge */}
                            <rect 
                              x={isTouchingRail ? 260 : 280} 
                              y="330" 
                              width={hasPhone ? 110 : 100} 
                              height="24" 
                              rx="4" 
                              fill={hasPhone ? '#f59e0b' : '#6b7280'}
                            />
                            <text 
                              x={hasPhone ? (isTouchingRail ? 315 : 335) : (isTouchingRail ? 310 : 330)} 
                              y="347" 
                              textAnchor="middle" 
                              fill="white" 
                              fontFamily="sans-serif" 
                              fontSize="11" 
                              fontWeight="bold"
                            >
                              {hasPhone ? '📱 PHONE' : 'NO PHONE'}
                            </text>
                            
                            {/* Main compliance badge */}
                            <rect 
                              x={hasPhone ? 380 : (isTouchingRail ? 370 : 390)} 
                              y="330" 
                              width={isCompliant ? 110 : 130} 
                              height="24" 
                              rx="4" 
                              fill={isCompliant ? '#22c55e' : '#ef4444'}
                            />
                            <text 
                              x={isCompliant ? (hasPhone ? 435 : 425) : (hasPhone ? 445 : 455)} 
                              y="347" 
                              textAnchor="middle" 
                              fill="white" 
                              fontFamily="sans-serif" 
                              fontSize="11" 
                              fontWeight="bold"
                            >
                              {isCompliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
                            </text>
                          </>
                        );
                      })()}
                    </g>
                    
                    {/* Frame Info Overlay - Top Left */}
                    <g>
                      <rect x="10" y="60" width="140" height="50" fill="rgba(0,0,0,0.7)" rx="4" />
                      <text x="20" y="80" fill="#9ca3af" fontSize="9">PIPELINE STATUS</text>
                      <text x="20" y="98" fill="#22c55e" fontSize="12" fontWeight="bold">
                        {isPlaying ? PIPELINE_STAGES[activeStage]?.label || 'Processing...' : 'Ready'}
                      </text>
                    </g>
                    
                    {/* Detection Stats - Top Right */}
                    <g transform="translate(490, 60)">
                      <rect width="140" height="70" fill="rgba(0,0,0,0.7)" rx="4" />
                      <text x="10" y="18" fill="#9ca3af" fontSize="9">DETECTIONS</text>
                      <text x="10" y="35" fill="#fff" fontSize="12" fontWeight="bold">
                        {metrics?.total_persons || persons.length} Person(s)
                      </text>
                      <text x="10" y="50" fill={metrics?.compliant_count ? '#22c55e' : '#ef4444'} fontSize="10">
                        Rail: {metrics?.compliant_count || 0} touching
                      </text>
                      <text x="10" y="65" fill="#eab308" fontSize="10">
                        Phone: {metrics?.phone_count || 0} detected
                      </text>
                    </g>
                  </svg>
                </div>
                
                {/* Play/Pause Overlay */}
                {!isPlaying && currentTime === 0 && (
                  <div 
                    className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer backdrop-blur-sm"
                    onClick={handlePlayPause}
                  >
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 hover:from-green-400 hover:to-emerald-500 transition-all shadow-2xl shadow-green-600/30">
                        <Play className="w-12 h-12 text-white ml-1" />
                      </div>
                      <p className="text-white text-xl font-semibold">Click to Start Demo</p>
                      <p className="text-gray-400 text-sm mt-2">
                        {videoAvailable 
                          ? '8-second video with real-time analysis' 
                          : '8-second simulated pipeline visualization'
                        }
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3">
                        {videoAvailable ? (
                          <span className="flex items-center gap-1 text-green-400 text-xs bg-green-900/30 px-3 py-1 rounded-full">
                            <Video className="w-3 h-3" /> Real Video Available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-blue-400 text-xs bg-blue-900/30 px-3 py-1 rounded-full">
                            <Monitor className="w-3 h-3" /> Animated Simulation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Video Controls */}
              <div className="p-4 bg-gray-800/50">
                {/* Progress Bar */}
                <div 
                  className="h-3 bg-gray-700 rounded-full cursor-pointer mb-4 relative group"
                  onClick={handleSeek}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg cursor-grab active:cursor-grabbing transition-transform group-hover:scale-110"
                    style={{ left: `calc(${(currentTime / totalDuration) * 100}% - 10px)` }}
                  />
                  
                  {/* Event markers */}
                  {demoData?.events?.map((event, idx) => (
                    <div
                      key={idx}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-yellow-300 hover:scale-150 transition-transform"
                      style={{ left: `${(event.timestamp_sec / totalDuration) * 100}%` }}
                      title={event.event_type}
                    />
                  ))}
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 flex items-center justify-center transition-all shadow-lg shadow-green-600/30"
                    >
                      {isPlaying ? (
                        <Pause className="w-7 h-7 text-white" />
                      ) : (
                        <Play className="w-7 h-7 text-white ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="Reset demo to start"
                      onClick={handleReset}
                      className="w-11 h-11 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                    >
                      <RotateCcw className="w-5 h-5 text-white" />
                    </button>
                    
                    <div className="text-white font-mono text-xl ml-4 bg-gray-800 px-4 py-2 rounded-lg">
                      {formatTime(currentTime)} <span className="text-gray-500">/</span> {formatTime(totalDuration)}
                    </div>
                  </div>
                  
                  {/* Overlay Toggles */}
                  <div className="flex items-center gap-2">
                    {Object.entries(showOverlays).map(([key, value]) => (
                      <button
                        key={key}
                        type="button"
                        title={`Toggle ${key.replace(/([A-Z])/g, ' $1').trim()} overlay`}
                        onClick={() => setShowOverlays(prev => ({ ...prev, [key]: !value }))}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          value 
                            ? 'bg-gray-600 text-white shadow-inner' 
                            : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                        }`}
                      >
                        {value ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Detection & Metrics Panel */}
          <div className="col-span-4 space-y-4">
            
            {/* Current Stage Detail */}
            <div className={`bg-gray-900 rounded-xl p-4 border-2 ${PIPELINE_STAGES[displayedStage]?.borderColor || 'border-gray-800'} transition-colors`}>
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const Icon = PIPELINE_STAGES[displayedStage]?.icon || Cpu;
                  return (
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${PIPELINE_STAGES[displayedStage]?.color || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-white font-semibold">
                    {PIPELINE_STAGES[displayedStage]?.label || 'Pipeline Stage'}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {hoveredStage !== null ? 'Hover preview' : (isPlaying ? 'Currently processing' : 'Ready')}
                  </p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-3">
                {PIPELINE_STAGES[displayedStage]?.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">Config:</span>
                  <div className="text-gray-300 font-mono mt-1">
                    {PIPELINE_STAGES[displayedStage]?.detail}
                  </div>
                </div>
                <div className="bg-gray-800 rounded p-2">
                  <span className="text-gray-500">Output:</span>
                  <div className="text-green-400 font-mono mt-1">
                    {PIPELINE_STAGES[displayedStage]?.output}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Current Detection Details */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                Detection Details
              </h3>
              
              {persons.length > 0 ? (
                <div className="space-y-3">
                  {persons.map((person: PersonAnalysis) => (
                    <div 
                      key={person.person_id}
                      className={`p-3 rounded-lg border ${
                        person.compliance_status === 'compliant'
                          ? 'bg-green-900/20 border-green-700'
                          : 'bg-red-900/20 border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Person {person.person_id}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          person.compliance_status === 'compliant'
                            ? 'bg-green-600 text-white'
                            : 'bg-red-600 text-white'
                        }`}>
                          {person.compliance_status?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Hand className="w-3 h-3" />
                          Rail: {person.rail_hit_test?.any_hit ? '✓ Touching' : '✗ Not touching'}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Phone className="w-3 h-3" />
                          Phone: {person.phone_heuristic?.is_phone_talking ? '⚠ Detected' : '✓ None'}
                        </div>
                        <div className="text-gray-500">
                          Confidence: {((person.confidence || 0.85) * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">
                          Pose: {person.pose?.landmarks?.length || 17} keypoints
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Waiting for detections...</p>
                  <p className="text-xs mt-1">Press play to start analysis</p>
                </div>
              )}
            </div>
            
            {/* Live Metrics */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-500" />
                Live Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <MetricBox
                  label="Total Persons"
                  value={metrics?.total_persons || 0}
                  icon={<User className="w-4 h-4" />}
                  color="blue"
                />
                <MetricBox
                  label="Compliant"
                  value={metrics?.compliant_count || 0}
                  icon={<Shield className="w-4 h-4" />}
                  color="green"
                />
                <MetricBox
                  label="Non-Compliant"
                  value={metrics?.non_compliant_count || 0}
                  icon={<ShieldOff className="w-4 h-4" />}
                  color="red"
                />
                <MetricBox
                  label="Phone Detected"
                  value={metrics?.phone_count || 0}
                  icon={<Phone className="w-4 h-4" />}
                  color="yellow"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Full-Width Bottom Section - Timeline & Storyboard */}
        <div className="mt-4 grid grid-cols-12 gap-4">
          {/* Timeline Visualization - Interactive Event Timeline */}
          <div className="col-span-8 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Timeline & Events
            </h3>
            
            <EventTimeline 
              events={demoData?.events || []}
              packets={demoData?.framePackets || []}
              duration={totalDuration}
              selectedTime={currentTime}
              chapters={demoData?.storyboard?.chapters || []}
              onTimeSelect={setCurrentTime}
              compact={false}
            />
            
            {/* Events list with clickable rows */}
            {demoData?.events && demoData.events.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-500 mb-2">Click to view evidence:</div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {demoData.events.map((event, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEventIndex(idx)}
                      className={`flex items-center gap-2 p-2 rounded text-xs transition-all ${
                        selectedEventIndex === idx
                          ? 'bg-blue-900/50 border border-blue-700'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      <Clock className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-400 font-mono">{formatTime(event.timestamp_sec)}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                        event.event_type === 'compliant_start' ? 'bg-green-800 text-green-300' :
                        event.event_type.includes('phone') ? 'bg-yellow-800 text-yellow-300' :
                        'bg-red-800 text-red-300'
                      }`}>
                        {event.event_type}
                      </span>
                      {event.evidence_frame_path && (
                        <Eye className="w-3 h-3 text-blue-400 ml-auto flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Person Analysis - Person Crop Strip */}
          <div className="col-span-4 bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Move className="w-5 h-5 text-purple-500" />
              Person Analysis
            </h3>
            {persons.length > 0 ? (
              <PersonCropStrip persons={persons} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No persons detected</p>
                <p className="text-xs mt-1">Press play to start analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* FrameViewer Modal - Evidence Frame Viewer */}
      {selectedEventIndex !== null && demoData?.events?.[selectedEventIndex] && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/50 border border-blue-700 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Evidence Frame
                  </h2>
                  <p className="text-xs text-gray-400">
                    Event: {demoData.events[selectedEventIndex].event_type} | 
                    Person {demoData.events[selectedEventIndex].person_id} | 
                    {formatTime(demoData.events[selectedEventIndex].timestamp_sec)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventIndex(null)}
                className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              {demoData.events[selectedEventIndex].evidence_frame_path ? (
                <FrameViewer 
                  src={`/stairs-ai-demo/demo/${demoData.events[selectedEventIndex].evidence_frame_path}`}
                  alt={`Event frame - ${demoData.events[selectedEventIndex].event_type}`}
                />
              ) : (
                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No evidence frame available for this event</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricBox({ label, value, icon, color }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colors = {
    blue: 'bg-blue-900/30 border-blue-700 text-blue-400',
    green: 'bg-green-900/30 border-green-700 text-green-400',
    red: 'bg-red-900/30 border-red-700 text-red-400',
    yellow: 'bg-yellow-900/30 border-yellow-700 text-yellow-400',
  };
  
  return (
    <div className={`p-3 rounded-lg border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
