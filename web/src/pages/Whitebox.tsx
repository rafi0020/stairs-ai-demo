import { useState, useMemo } from 'react';
import { Eye, Layers } from 'lucide-react';
import type { DemoData, FramePacket, PersonAnalysis } from '../lib/types';
import { PIPELINE_STEPS, getComplianceColor } from '../lib/types';
import { formatTime } from '../lib/format';

interface WhiteboxProps {
  demoData: DemoData | null;
  selectedTime: number;
  packet: FramePacket | null;
  onTimeSelect: (time: number) => void;
}

export default function Whitebox({ demoData, selectedTime, packet, onTimeSelect }: WhiteboxProps) {
  const [activeStep, setActiveStep] = useState('raw');
  
  const duration = demoData?.summary?.total_duration_sec ?? 8.0;
  const events = demoData?.events ?? [];

  // Get step data for current packet
  const stepData = useMemo(() => {
    if (!packet) return null;

    const steps: Record<string, { title: string; description: string; data: unknown }> = {
      raw: {
        title: 'Raw Frame',
        description: `Frame ${packet.frame_number} at ${packet.timestamp_sec.toFixed(2)}s`,
        data: { frame_number: packet.frame_number, timestamp_sec: packet.timestamp_sec }
      },
      yolo: {
        title: 'YOLO Detection',
        description: `Detected ${packet.metrics.total_persons} person(s)`,
        data: packet.persons.map((p: PersonAnalysis) => ({
          person_id: p.person_id,
          bbox: p.bbox,
          confidence: p.confidence
        }))
      },
      crop: {
        title: 'Person Crops',
        description: `${packet.persons.length} person regions extracted`,
        data: packet.persons.map((p: PersonAnalysis) => ({
          person_id: p.person_id,
          crop_path: p.crop_path,
          size: `${p.bbox.width}x${p.bbox.height}`
        }))
      },
      pose: {
        title: 'Pose Estimation',
        description: 'MediaPipe 33-landmark skeleton',
        data: packet.persons.map((p: PersonAnalysis) => ({
          person_id: p.person_id,
          landmarks_count: p.pose?.landmarks.length ?? 0,
          has_pose: p.pose !== null
        }))
      },
      rail: {
        title: 'Rail Hit-Test',
        description: 'Polygon containment check for wrist landmarks',
        data: packet.persons.map((p: PersonAnalysis) => ({
          person_id: p.person_id,
          any_hit: p.rail_hit_test?.any_hit ?? false,
          left_wrist_in_left_rail: p.rail_hit_test?.left_wrist_in_left_rail ?? false,
          right_wrist_in_left_rail: p.rail_hit_test?.right_wrist_in_left_rail ?? false
        }))
      },
      phone: {
        title: 'Phone Heuristic',
        description: 'Wrist-to-ear distance measurement',
        data: packet.persons.map((p: PersonAnalysis) => ({
          person_id: p.person_id,
          is_phone_talking: p.phone_heuristic?.is_phone_talking ?? false,
          min_distance: p.phone_heuristic?.min_distance?.toFixed(4) ?? 'N/A',
          threshold: p.phone_heuristic?.threshold ?? 0.05
        }))
      },
      state: {
        title: 'State Machine',
        description: 'Debounced state tracking',
        data: {
          current_state: packet.state_machine?.current_state ?? ['unknown', 'unknown'],
          pending_state: packet.state_machine?.pending_state,
          time_in_pending: packet.state_machine?.time_in_pending ?? 0,
          debounce_threshold: packet.state_machine?.debounce_threshold ?? 0.55
        }
      },
      output: {
        title: 'Final Output',
        description: 'Aggregated frame metrics',
        data: {
          metrics: packet.metrics,
          compliance_status: packet.metrics.compliant_count > 0 ? 'compliant' : 'non_compliant'
        }
      }
    };

    return steps[activeStep];
  }, [packet, activeStep]);

  const currentStep = PIPELINE_STEPS.find(s => s.id === activeStep);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Layers className="text-blue-400" />
          <span>Pipeline View</span>
        </h1>
        <div className="text-gray-400">
          <span className="font-mono">{formatTime(selectedTime)}</span>
          <span className="mx-2">/</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Timeline Scrubber */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="relative h-8">
          <div className="absolute inset-0 bg-gray-700 rounded-full" />
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500/30 rounded-full"
            style={{ width: `${(selectedTime / duration) * 100}%` }}
          />
          {/* Event markers */}
          {events.map((event, idx) => (
            <div
              key={idx}
              className="absolute top-0 w-1 h-full bg-yellow-400"
              style={{ left: `${(event.timestamp_sec / duration) * 100}%` }}
              title={`${event.event_type} at ${event.timestamp_sec.toFixed(2)}s`}
            />
          ))}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={selectedTime}
            onChange={(e) => onTimeSelect(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Timeline scrubber"
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none"
            style={{ left: `calc(${(selectedTime / duration) * 100}% - 8px)` }}
          />
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Pipeline Steps</h2>
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STEPS.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeStep === step.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span className="mr-2">{idx + 1}.</span>
              {step.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step Detail */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Step Info */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="text-blue-400" size={24} />
            <div>
              <h2 className="text-xl font-semibold">{currentStep?.name}</h2>
              <p className="text-gray-400 text-sm">{currentStep?.description}</p>
            </div>
          </div>

          {stepData && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-300">{stepData.title}</h3>
              <p className="text-sm text-gray-400">{stepData.description}</p>
            </div>
          )}
        </div>

        {/* Step Data */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="font-medium mb-4">Step Data</h3>
          {stepData ? (
            <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-300 max-h-64">
              {JSON.stringify(stepData.data, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No frame data available. Select a time on the timeline.</p>
          )}
        </div>
      </div>

      {/* Persons Strip */}
      {packet && packet.persons.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-medium mb-4">Detected Persons ({packet.persons.length})</h3>
          <div className="flex flex-wrap gap-4">
            {packet.persons.map((person: PersonAnalysis) => (
              <div
                key={person.person_id}
                className={`p-4 rounded-lg border-2 ${
                  person.compliance_status === 'compliant'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                }`}
              >
                <div className="text-sm font-medium">Person #{person.person_id}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Confidence: {(person.confidence * 100).toFixed(1)}%
                </div>
                <div className={`text-xs mt-1 ${getComplianceColor(person.compliance_status)}`}>
                  {person.compliance_status}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Rail: {person.rail_hit_test?.any_hit ? '✓ Holding' : '✗ Not holding'}
                </div>
                <div className="text-xs text-gray-400">
                  Phone: {person.phone_heuristic?.is_phone_talking ? '📱 Yes' : 'No'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State Machine Visualization */}
      {packet?.state_machine && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="font-medium mb-4">State Machine</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 mb-1">Current State</div>
              <div className="font-mono text-lg">
                [{packet.state_machine.current_state.join(', ')}]
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 mb-1">Pending State</div>
              <div className="font-mono text-lg">
                {packet.state_machine.pending_state 
                  ? `[${packet.state_machine.pending_state.join(', ')}]`
                  : 'None'}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-gray-400 mb-1">Time in Pending</div>
              <div className="font-mono text-lg">
                {packet.state_machine.time_in_pending.toFixed(2)}s / {packet.state_machine.debounce_threshold}s
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
