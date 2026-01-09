import { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Code, Eye } from 'lucide-react';
import type { DemoData, FramePacket, PersonAnalysis } from '../lib/types';
import { getComplianceColor } from '../lib/types';
import { formatTime } from '../lib/format';
import { getEvidenceFrameUrl } from '../lib/loadDemoData';

interface InspectorProps {
  demoData: DemoData | null;
  packet: FramePacket | null;
  onTimeSelect: (time: number) => void;
}

export default function Inspector({ demoData, packet, onTimeSelect }: InspectorProps) {
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('visual');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    metrics: true,
    persons: true,
    state: true
  });

  const packets = demoData?.framePackets ?? [];
  
  const currentIndex = useMemo(() => {
    if (!packet) return -1;
    return packets.findIndex((p: FramePacket) => p.frame_number === packet.frame_number);
  }, [packets, packet]);

  const goToPacket = (index: number) => {
    if (index >= 0 && index < packets.length) {
      onTimeSelect(packets[index].timestamp_sec);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Search className="text-cyan-400" />
          <span>Frame Inspector</span>
        </h1>
        
        {/* View Toggle */}
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1.5 rounded text-sm flex items-center space-x-1 ${
              viewMode === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye size={16} />
            <span>Visual</span>
          </button>
          <button
            onClick={() => setViewMode('json')}
            className={`px-3 py-1.5 rounded text-sm flex items-center space-x-1 ${
              viewMode === 'json' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code size={16} />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Frame Navigation */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <button
            onClick={() => goToPacket(currentIndex - 1)}
            disabled={currentIndex <= 0}
            className="px-4 py-2 bg-gray-700 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <ChevronLeft size={18} />
            <span>Prev</span>
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-mono">
              {packet ? `Frame ${packet.frame_number}` : 'No Frame'}
            </div>
            <div className="text-gray-400 text-sm">
              {packet ? formatTime(packet.timestamp_sec) : '--:--'}
              {packets.length > 0 && ` • ${currentIndex + 1} of ${packets.length}`}
            </div>
          </div>
          
          <button
            onClick={() => goToPacket(currentIndex + 1)}
            disabled={currentIndex >= packets.length - 1}
            className="px-4 py-2 bg-gray-700 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Frame slider */}
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={Math.max(0, packets.length - 1)}
            value={currentIndex >= 0 ? currentIndex : 0}
            onChange={(e) => goToPacket(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Frame navigation"
            title="Navigate between frames"
          />
        </div>
      </div>

      {!packet ? (
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
          <Search className="mx-auto mb-4 text-gray-500" size={48} />
          <h2 className="text-xl font-semibold mb-2">No Frame Selected</h2>
          <p className="text-gray-400">Use the navigation above or timeline to select a frame.</p>
        </div>
      ) : viewMode === 'json' ? (
        /* JSON View */
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Raw Frame Packet</h2>
          <pre className="bg-gray-900 rounded-lg p-4 overflow-auto text-sm text-gray-300 max-h-[600px]">
            {JSON.stringify(packet, null, 2)}
          </pre>
        </div>
      ) : (
        /* Visual View */
        <div className="space-y-6">
          {/* Metrics Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('metrics')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/50"
            >
              <h2 className="text-lg font-semibold">Frame Metrics</h2>
              <span className="text-gray-400">{expandedSections.metrics ? '−' : '+'}</span>
            </button>
            {expandedSections.metrics && (
              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <MetricBox label="Total Persons" value={packet.metrics.total_persons} />
                  <MetricBox label="Compliant" value={packet.metrics.compliant_count} color="green" />
                  <MetricBox label="Non-Compliant" value={packet.metrics.non_compliant_count} color="red" />
                  <MetricBox label="Phone" value={packet.metrics.phone_count} color="orange" />
                  <MetricBox label="Avg Confidence" value={`${(packet.metrics.avg_confidence * 100).toFixed(1)}%`} />
                </div>
              </div>
            )}
          </div>

          {/* Persons Section */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <button
              onClick={() => toggleSection('persons')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/50"
            >
              <h2 className="text-lg font-semibold">Detected Persons ({packet.persons.length})</h2>
              <span className="text-gray-400">{expandedSections.persons ? '−' : '+'}</span>
            </button>
            {expandedSections.persons && (
              <div className="px-6 pb-4">
                {packet.persons.length === 0 ? (
                  <p className="text-gray-400">No persons detected in this frame.</p>
                ) : (
                  <div className="space-y-4">
                    {packet.persons.map((person: PersonAnalysis) => (
                      <div
                        key={person.person_id}
                        className={`p-4 rounded-lg border-2 ${
                          person.compliance_status === 'compliant'
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-red-500/50 bg-red-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold">Person #{person.person_id}</div>
                          <div className={`px-2 py-1 rounded text-sm ${getComplianceColor(person.compliance_status)}`}>
                            {person.compliance_status}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400 mb-1">Bounding Box</div>
                            <div className="font-mono">
                              {person.bbox.x}, {person.bbox.y} ({person.bbox.width}×{person.bbox.height})
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Confidence</div>
                            <div className="font-mono">{(person.confidence * 100).toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Pose Landmarks</div>
                            <div className="font-mono">{person.pose?.landmarks.length ?? 0}</div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-700">
                          <div>
                            <div className="text-gray-400 mb-1">Rail Hit Test</div>
                            {person.rail_hit_test ? (
                              <div className="space-y-1">
                                <div>Any Hit: {person.rail_hit_test.any_hit ? '✓ Yes' : '✗ No'}</div>
                                <div className="text-xs text-gray-500">
                                  L-Wrist in L-Rail: {person.rail_hit_test.left_wrist_in_left_rail ? '✓' : '✗'} |
                                  R-Wrist in L-Rail: {person.rail_hit_test.right_wrist_in_left_rail ? '✓' : '✗'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-400 mb-1">Phone Heuristic</div>
                            {person.phone_heuristic ? (
                              <div className="space-y-1">
                                <div>
                                  {person.phone_heuristic.is_phone_talking ? '📱 Phone Detected' : 'No Phone'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Min Distance: {person.phone_heuristic.min_distance.toFixed(4)} (threshold: {person.phone_heuristic.threshold})
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500">N/A</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* State Machine Section */}
          {packet.state_machine && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleSection('state')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/50"
              >
                <h2 className="text-lg font-semibold">State Machine</h2>
                <span className="text-gray-400">{expandedSections.state ? '−' : '+'}</span>
              </button>
              {expandedSections.state && (
                <div className="px-6 pb-4">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Current State</div>
                      <div className="font-mono">[{packet.state_machine.current_state.join(', ')}]</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Pending State</div>
                      <div className="font-mono">
                        {packet.state_machine.pending_state 
                          ? `[${packet.state_machine.pending_state.join(', ')}]`
                          : 'None'}
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Time in Pending</div>
                      <div className="font-mono">{packet.state_machine.time_in_pending.toFixed(3)}s</div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">Debounce Threshold</div>
                      <div className="font-mono">{packet.state_machine.debounce_threshold}s</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple metric box
function MetricBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = {
    green: 'text-green-400',
    red: 'text-red-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400'
  }[color ?? ''] ?? 'text-white';

  return (
    <div className="bg-gray-900 rounded-lg p-3 text-center">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
