import { useMemo } from 'react';
import type { Event, FramePacket, StoryboardChapter } from '../lib/types';
import { formatTimeCompact } from '../lib/format';

interface EventTimelineProps {
  events: Event[];
  packets: FramePacket[];
  duration: number;
  selectedTime: number;
  chapters: StoryboardChapter[];
  onTimeSelect: (time: number) => void;
  compact?: boolean;
}

// Get compliance color based on metrics
function getComplianceBarColor(compliantCount: number, nonCompliantCount: number): string {
  if (compliantCount > 0 && nonCompliantCount === 0) return '#22c55e'; // green
  if (nonCompliantCount > 0) return '#ef4444'; // red
  return '#6b7280'; // gray (no persons)
}

export default function EventTimeline({
  events,
  packets,
  duration,
  selectedTime,
  chapters,
  onTimeSelect,
  compact = false
}: EventTimelineProps) {
  // Sample packets for visualization (every Nth packet to avoid too many elements)
  const sampleRate = Math.max(1, Math.floor(packets.length / 200));
  const sampledPackets = useMemo(() => {
    return packets.filter((_, i) => i % sampleRate === 0);
  }, [packets, sampleRate]);

  const timeToPercent = (time: number) => {
    return duration > 0 ? (time / duration) * 100 : 0;
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    onTimeSelect(percent * duration);
  };

  const height = compact ? 'h-12' : 'h-24';

  return (
    <div className="space-y-2">
      {/* Chapter headers - using timestamp_sec and title from StoryboardChapter */}
      {!compact && (
        <div className="relative h-6 mb-2">
          {chapters.map((chapter, idx) => {
            const left = timeToPercent(chapter.timestamp_sec);
            const nextChapter = chapters[idx + 1];
            const width = nextChapter 
              ? timeToPercent(nextChapter.timestamp_sec) - left
              : 100 - left;
            return (
              <div
                key={chapter.id}
                className="absolute top-0 h-full flex items-center justify-center text-xs text-gray-400 border-l border-gray-600 px-1 overflow-hidden"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <span className="truncate">{chapter.title}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Main timeline */}
      <div
        className={`relative ${height} bg-gray-900 rounded-lg overflow-hidden cursor-crosshair`}
        onClick={handleClick}
      >
        {/* Compliance bars - using timestamp_sec and metrics from FramePacket */}
        <div className="absolute inset-0 flex">
          {sampledPackets.map((packet, idx) => {
            const left = timeToPercent(packet.timestamp_sec);
            const nextPacket = sampledPackets[idx + 1];
            const width = nextPacket 
              ? timeToPercent(nextPacket.timestamp_sec) - left
              : 100 - left;
            
            return (
              <div
                key={idx}
                className="absolute top-0 h-1/2 transition-colors"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.5)}%`,
                  backgroundColor: getComplianceBarColor(
                    packet.metrics.compliant_count,
                    packet.metrics.non_compliant_count
                  )
                }}
              />
            );
          })}
        </div>

        {/* Phone detection bars - using phone_count from FrameMetrics */}
        <div className="absolute inset-0 flex">
          {sampledPackets.map((packet, idx) => {
            if (packet.metrics.phone_count === 0) return null;
            
            const left = timeToPercent(packet.timestamp_sec);
            const nextPacket = sampledPackets[idx + 1];
            const width = nextPacket 
              ? timeToPercent(nextPacket.timestamp_sec) - left
              : 100 - left;
            
            return (
              <div
                key={idx}
                className="absolute bottom-0 h-1/2 bg-orange-500/60"
                style={{
                  left: `${left}%`,
                  width: `${Math.max(width, 0.5)}%`
                }}
              />
            );
          })}
        </div>

        {/* People count indicator - using total_persons from FrameMetrics */}
        {!compact && (
          <div className="absolute inset-0 flex items-center pointer-events-none">
            {sampledPackets.map((packet, idx) => {
              const left = timeToPercent(packet.timestamp_sec);
              const peopleHeight = Math.min(100, packet.metrics.total_persons * 25);
              
              return (
                <div
                  key={idx}
                  className="absolute bottom-1/4 w-px bg-white/20"
                  style={{
                    left: `${left}%`,
                    height: `${peopleHeight}%`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Event markers - using timestamp_sec from Event */}
        {events.map((event, idx) => {
          const left = timeToPercent(event.timestamp_sec);
          return (
            <div
              key={idx}
              className="absolute top-0 bottom-0 flex items-center z-10"
              style={{ left: `${left}%` }}
            >
              <div className="w-0 h-full border-l-2 border-dashed border-yellow-400/50" />
              <div 
                className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-yellow-300 bg-yellow-400 shadow-lg ${
                  compact ? 'w-2 h-2' : 'w-4 h-4'
                }`}
              />
            </div>
          );
        })}

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
          style={{ left: `${timeToPercent(selectedTime)}%` }}
        >
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      </div>

      {/* Time labels */}
      <div className="relative h-4 text-xs text-gray-500">
        {[0, 2, 4, 6, 8].filter(t => t <= duration).map((time) => (
          <button
            key={time}
            onClick={() => onTimeSelect(time)}
            className="absolute transform -translate-x-1/2 hover:text-white transition-colors"
            style={{ left: `${timeToPercent(time)}%` }}
          >
            {formatTimeCompact(time)}
          </button>
        ))}
      </div>
    </div>
  );
}
