import { useState, useMemo } from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import type { DemoData, FramePacket } from '../lib/types';
import { 
  simulateDebounce, 
  compareParameters, 
  DEFAULT_PHONE_THRESHOLD, 
  DEFAULT_DEBOUNCE_DURATION,
  type SimulationStats 
} from '../lib/computeDerived';
import { formatPercent } from '../lib/format';

interface TuningLabProps {
  demoData: DemoData | null;
}

export default function TuningLab({ demoData }: TuningLabProps) {
  const [phoneThreshold, setPhoneThreshold] = useState(DEFAULT_PHONE_THRESHOLD);
  const [debounceDuration, setDebounceDuration] = useState(DEFAULT_DEBOUNCE_DURATION);

  const packets = demoData?.framePackets ?? [];
  const duration = demoData?.summary?.total_duration_sec ?? 8.0;

  // Run baseline simulation with default params
  const baselineResult = useMemo(() => {
    return simulateDebounce(packets, DEFAULT_PHONE_THRESHOLD, DEFAULT_DEBOUNCE_DURATION);
  }, [packets]);

  // Run tuned simulation with current params
  const tunedResult = useMemo(() => {
    return simulateDebounce(packets, phoneThreshold, debounceDuration);
  }, [packets, phoneThreshold, debounceDuration]);

  // Compare results
  const comparison = useMemo(() => {
    if (packets.length === 0) return null;
    return compareParameters(baselineResult.stats, tunedResult.stats);
  }, [baselineResult.stats, tunedResult.stats, packets.length]);

  const baselineStats = baselineResult.stats;
  const tunedStats = tunedResult.stats;

  const resetToDefaults = () => {
    setPhoneThreshold(DEFAULT_PHONE_THRESHOLD);
    setDebounceDuration(DEFAULT_DEBOUNCE_DURATION);
  };

  const hasChanges = phoneThreshold !== DEFAULT_PHONE_THRESHOLD || debounceDuration !== DEFAULT_DEBOUNCE_DURATION;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Sliders className="text-yellow-400" />
          <span>Tuning Lab</span>
        </h1>
        
        {hasChanges && (
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-700 rounded-lg flex items-center space-x-2 hover:bg-gray-600"
          >
            <RefreshCw size={16} />
            <span>Reset to Defaults</span>
          </button>
        )}
      </div>

      {/* Parameter Sliders */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Phone Threshold */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-orange-400">Phone Detection Threshold</h3>
              <p className="text-sm text-gray-400">
                Maximum wrist-to-ear distance for phone detection
              </p>
            </div>
            <div className="text-2xl font-mono text-white">
              {phoneThreshold.toFixed(3)}
            </div>
          </div>
          
          <input
            type="range"
            min={0.01}
            max={0.15}
            step={0.005}
            value={phoneThreshold}
            onChange={(e) => setPhoneThreshold(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Phone detection threshold"
            title="Adjust phone detection threshold"
          />
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0.01 (strict)</span>
            <span className="text-orange-400">Default: 0.05</span>
            <span>0.15 (loose)</span>
          </div>
          
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-sm">
            <p className="text-gray-400">
              <strong className="text-white">Lower</strong> = Fewer false positives, might miss real phone use
            </p>
            <p className="text-gray-400 mt-1">
              <strong className="text-white">Higher</strong> = Catches more gestures, including non-phone movements
            </p>
          </div>
        </div>

        {/* Debounce Duration */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-yellow-400">Debounce Duration</h3>
              <p className="text-sm text-gray-400">
                Minimum time a state must persist before committing
              </p>
            </div>
            <div className="text-2xl font-mono text-white">
              {debounceDuration.toFixed(2)}s
            </div>
          </div>
          
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.05}
            value={debounceDuration}
            onChange={(e) => setDebounceDuration(parseFloat(e.target.value))}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label="Debounce duration"
            title="Adjust state debounce duration"
          />
          
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0.10s (responsive)</span>
            <span className="text-yellow-400">Default: 0.55s</span>
            <span>2.00s (stable)</span>
          </div>
          
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-sm">
            <p className="text-gray-400">
              <strong className="text-white">Shorter</strong> = More events, might include noise
            </p>
            <p className="text-gray-400 mt-1">
              <strong className="text-white">Longer</strong> = Fewer events, more stable but may miss quick changes
            </p>
          </div>
        </div>
      </div>

      {/* Impact Summary */}
      {comparison && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Impact Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ImpactCard
              label="Phone Frames"
              baseline={baselineStats.phoneFrames}
              tuned={tunedStats.phoneFrames}
              unit=" frames"
              positiveIsGood={false}
            />
            <ImpactCard
              label="Events Committed"
              baseline={baselineStats.totalCommits}
              tuned={tunedStats.totalCommits}
              unit=""
            />
            <ImpactCard
              label="Compliant Frames"
              baseline={baselineStats.compliantFrames}
              tuned={tunedStats.compliantFrames}
              unit=" frames"
              positiveIsGood={true}
            />
            <ImpactCard
              label="Non-Compliant"
              baseline={baselineStats.nonCompliantFrames}
              tuned={tunedStats.nonCompliantFrames}
              unit=" frames"
              positiveIsGood={false}
            />
          </div>
        </div>
      )}

      {/* Timeline Comparison */}
      {packets.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Timeline Comparison</h2>
          
          {/* Baseline Timeline */}
          <div className="mb-4">
            <div className="text-sm text-gray-400 mb-2">Baseline (Default Parameters)</div>
            <TimelineBar packets={baselineResult.packets} duration={duration} />
          </div>
          
          {/* Tuned Timeline */}
          <div>
            <div className="text-sm text-gray-400 mb-2">Tuned (Your Parameters)</div>
            <TimelineBar packets={tunedResult.packets} duration={duration} />
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-400">Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-400">Non-Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-gray-400">Phone</span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Stats Table */}
      {comparison && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Detailed Statistics</h2>
          
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 text-gray-400">Metric</th>
                <th className="text-right py-2 text-gray-400">Baseline</th>
                <th className="text-right py-2 text-gray-400">Tuned</th>
                <th className="text-right py-2 text-gray-400">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700/50">
                <td className="py-2">Total Frames</td>
                <td className="text-right font-mono">{baselineStats.totalFrames}</td>
                <td className="text-right font-mono">{tunedStats.totalFrames}</td>
                <td className="text-right font-mono text-gray-500">-</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2">Compliant Frames</td>
                <td className="text-right font-mono text-green-400">{baselineStats.compliantFrames}</td>
                <td className="text-right font-mono text-green-400">{tunedStats.compliantFrames}</td>
                <td className="text-right font-mono text-gray-500">-</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2">Non-Compliant Frames</td>
                <td className="text-right font-mono text-red-400">{baselineStats.nonCompliantFrames}</td>
                <td className="text-right font-mono text-red-400">{tunedStats.nonCompliantFrames}</td>
                <td className="text-right font-mono text-gray-500">-</td>
              </tr>
              <tr className="border-b border-gray-700/50">
                <td className="py-2">Phone Detected Frames</td>
                <td className="text-right font-mono text-orange-400">{baselineStats.phoneFrames}</td>
                <td className="text-right font-mono text-orange-400">{tunedStats.phoneFrames}</td>
                <td className={`text-right font-mono ${
                  comparison.delta.phoneFramesChange !== 0 
                    ? comparison.delta.phoneFramesChange > 0 ? 'text-orange-400' : 'text-green-400'
                    : 'text-gray-500'
                }`}>
                  {comparison.delta.phoneFramesChange !== 0 
                    ? (comparison.delta.phoneFramesChange > 0 ? '+' : '') + comparison.delta.phoneFramesChange
                    : '-'
                  }
                </td>
              </tr>
              <tr>
                <td className="py-2">Events Committed</td>
                <td className="text-right font-mono">{baselineStats.totalCommits}</td>
                <td className="text-right font-mono">{tunedStats.totalCommits}</td>
                <td className={`text-right font-mono ${
                  comparison.delta.eventsChange !== 0 
                    ? comparison.delta.eventsChange > 0 ? 'text-blue-400' : 'text-yellow-400'
                    : 'text-gray-500'
                }`}>
                  {comparison.delta.eventsChange !== 0 
                    ? (comparison.delta.eventsChange > 0 ? '+' : '') + comparison.delta.eventsChange
                    : '-'
                  }
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* No Data Warning */}
      {packets.length === 0 && (
        <div className="bg-yellow-900/20 rounded-xl p-6 border border-yellow-600/30 text-center">
          <Sliders className="mx-auto mb-4 text-yellow-400" size={48} />
          <h2 className="text-xl font-semibold mb-2">No Frame Data Available</h2>
          <p className="text-gray-400">
            Run the Python pipeline to generate frame packets, then return here to tune parameters.
          </p>
        </div>
      )}
    </div>
  );
}

// Impact card component
function ImpactCard({ 
  label, 
  baseline, 
  tuned, 
  unit,
  positiveIsGood = true 
}: { 
  label: string; 
  baseline: number; 
  tuned: number; 
  unit: string;
  positiveIsGood?: boolean;
}) {
  const change = tuned - baseline;
  const isPositive = change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  
  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">{tuned}{unit}</div>
      {change !== 0 && (
        <div className={`text-sm mt-1 ${isGood ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change}{unit} vs baseline
        </div>
      )}
      {change === 0 && (
        <div className="text-sm mt-1 text-gray-500">No change</div>
      )}
    </div>
  );
}

// Timeline bar component
function TimelineBar({ packets, duration }: { packets: FramePacket[]; duration: number }) {
  return (
    <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
      {packets.map((packet, idx) => {
        const startPct = (packet.timestamp_sec / duration) * 100;
        const isCompliant = packet.metrics.compliant_count > 0;
        const isPhone = packet.metrics.phone_count > 0;
        const width = 100 / Math.max(packets.length, 1);
        
        return (
          <div key={idx}>
            {/* Compliance bar (top half) */}
            <div
              className={`absolute top-0 h-1/2 ${
                packet.metrics.total_persons === 0 
                  ? 'bg-gray-500' 
                  : isCompliant 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
              }`}
              style={{
                left: `${startPct}%`,
                width: `${Math.max(width, 0.5)}%`
              }}
            />
            {/* Phone bar (bottom half) */}
            {isPhone && (
              <div
                className="absolute bottom-0 h-1/2 bg-orange-500"
                style={{
                  left: `${startPct}%`,
                  width: `${Math.max(width, 0.5)}%`
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
