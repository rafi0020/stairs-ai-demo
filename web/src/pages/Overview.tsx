import { Users, HandMetal, Phone, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import type { DemoData, StoryboardChapter } from '../lib/types';
import { getStoryboardImageUrl } from '../lib/loadDemoData';

interface OverviewProps {
  demoData: DemoData | null;
  onTimeSelect: (time: number) => void;
}

export default function Overview({ demoData, onTimeSelect }: OverviewProps) {
  const summary = demoData?.summary;
  const storyboard = demoData?.storyboard;
  const hasError = demoData?.error;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
          Stairs-AI Safety Demo
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          A transparent, explainable ML pipeline for staircase safety monitoring.
          See exactly how YOLO detection, pose estimation, and compliance logic work together.
        </p>
      </section>

      {/* Error Banner */}
      {hasError && (
        <section className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-yellow-400" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-400">Demo Data Not Available</h3>
              <p className="text-sm text-gray-400">{hasError}</p>
            </div>
          </div>
        </section>
      )}

      {/* What This Demo Proves */}
      <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <CheckCircle className="text-green-400" />
          <span>What This Demo Proves</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="font-semibold text-green-400 mb-2">✓ Transparent Pipeline</h3>
            <p className="text-sm text-gray-400">
              Every step of the pipeline is visible: from raw frames through YOLO detection,
              pose estimation, rail mask hit-testing, phone heuristics, and state machine debounce.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">✓ Real-World Challenges</h3>
            <p className="text-sm text-gray-400">
              The 8-second demo video showcases occlusion handling, multi-person tracking,
              gesture ambiguity, and parameter sensitivity.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="font-semibold text-purple-400 mb-2">✓ Parameter Tuning</h3>
            <p className="text-sm text-gray-400">
              Adjust phone detection threshold and debounce duration in the Tuning Lab
              to see how parameters affect detection accuracy.
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">✓ Static Deployment</h3>
            <p className="text-sm text-gray-400">
              Runs entirely on GitHub Pages with no backend. All intermediate data
              is pre-computed and exported as static JSON.
            </p>
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      {summary && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Pipeline Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<Users className="text-blue-400" size={24} />}
              label="Person Detections"
              value={summary.persons_detected_count.toString()}
              subtext={`${summary.total_frames} frames`}
            />
            <MetricCard
              icon={<HandMetal className="text-green-400" size={24} />}
              label="Compliant Frames"
              value={`${summary.compliance_summary.compliant_pct.toFixed(1)}%`}
              subtext={`${summary.compliance_summary.compliant_frames} frames`}
            />
            <MetricCard
              icon={<Phone className="text-orange-400" size={24} />}
              label="Phone Detected"
              value={`${summary.phone_summary.phone_pct.toFixed(1)}%`}
              subtext={`${summary.phone_summary.phone_detected_frames} frames`}
            />
            <MetricCard
              icon={<Clock className="text-purple-400" size={24} />}
              label="Events Committed"
              value={summary.events_count.toString()}
              subtext={`${summary.total_duration_sec}s video`}
            />
          </div>
        </section>
      )}

      {/* Storyboard Chapters */}
      {storyboard && storyboard.chapters.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Demo Chapters</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {storyboard.chapters.map((chapter: StoryboardChapter) => (
              <button
                key={chapter.id}
                onClick={() => onTimeSelect(chapter.timestamp_sec)}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors text-left"
              >
                <div className="aspect-video bg-gray-900 relative">
                  <img
                    src={getStoryboardImageUrl(chapter.thumbnail_path)}
                    alt={chapter.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-xs text-gray-300">{chapter.timestamp_sec.toFixed(1)}s</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm">{chapter.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{chapter.focus}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Pipeline Architecture */}
      <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Pipeline Architecture</h2>
        <div className="flex flex-wrap justify-center gap-2 text-sm">
          {['Video Input', 'YOLO Detection', 'Person Crop', 'Pose Estimation', 'Rail Hit-Test', 'Phone Heuristic', 'State Machine', 'Event Output'].map((step, idx) => (
            <div key={step} className="flex items-center">
              <span className="px-3 py-2 bg-gray-700 rounded-lg">{step}</span>
              {idx < 7 && <span className="mx-2 text-gray-500">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Configuration */}
      {summary && (
        <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold mb-4">Configuration</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">YOLO Model</span>
                <span className="font-mono">{summary.parameters.yolo_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">YOLO Confidence</span>
                <span className="font-mono">{summary.parameters.yolo_conf}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Phone Threshold</span>
                <span className="font-mono">{summary.parameters.phone_threshold}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Debounce Duration</span>
                <span className="font-mono">{summary.parameters.min_state_duration_sec}s</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Simple metric card component
function MetricCard({ icon, label, value, subtext }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center space-x-3 mb-2">
        {icon}
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{subtext}</div>
    </div>
  );
}
