import type { PipelineStep } from '../lib/types';
import JsonViewer from './JsonViewer';

interface StepPanelProps {
  step: PipelineStep;
  data: {
    title: string;
    description: string;
    data: unknown;
  } | null;
}

// Color mapping for pipeline steps (matching PIPELINE_STEPS in types.ts)
const stepColors: Record<string, string> = {
  gray: '#6b7280',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
  green: '#22c55e',
  orange: '#f97316',
  yellow: '#eab308',
  red: '#ef4444',
};

export default function StepPanel({ step, data }: StepPanelProps) {
  const color = stepColors[step.color] || '#6b7280';
  
  if (!data) {
    return (
      <div 
        className="p-6 rounded-lg border-2"
        style={{ 
          borderColor: color + '40',
          backgroundColor: color + '10'
        }}
      >
        <div className="text-center text-gray-400">
          <p>No data available for this step.</p>
          <p className="text-sm mt-1">Select a frame packet to see step details.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 rounded-lg border-2"
      style={{ 
        borderColor: color + '40',
        backgroundColor: color + '10'
      }}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold" style={{ color }}>
          {data.title}
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          {data.description}
        </p>
      </div>

      {/* Step description - using description from PipelineStep */}
      <div className="mb-4 p-3 bg-gray-900/50 rounded-lg text-sm text-gray-400">
        {step.description}
      </div>

      {/* Data visualization */}
      <div className="bg-gray-900/80 rounded-lg overflow-hidden">
        <div className="p-4">
          <JsonViewer data={data.data} maxHeight={300} />
        </div>
      </div>
    </div>
  );
}
