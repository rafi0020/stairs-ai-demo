import type { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  green: 'bg-green-500/10 border-green-500/30 text-green-400',
  red: 'bg-red-500/10 border-red-500/30 text-red-400',
  orange: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  gray: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
};

const iconColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  yellow: 'text-yellow-400',
  gray: 'text-gray-400',
};

export default function MetricsCard({ icon: Icon, label, value, subtext, color }: MetricsCardProps) {
  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]} transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between mb-2">
        <Icon className={iconColorClasses[color]} size={24} />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {subtext && (
        <div className="text-xs text-gray-500 mt-1">{subtext}</div>
      )}
    </div>
  );
}
