import { useRef, useCallback } from 'react';
import type { Event } from '../lib/types';
import { formatTime } from '../lib/format';

interface VideoScrubberProps {
  currentTime: number;
  duration: number;
  events: Event[];
  onSeek: (time: number) => void;
}

export default function VideoScrubber({ currentTime, duration, events, onSeek }: VideoScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percent * duration;
    
    onSeek(newTime);
  }, [duration, onSeek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Time display */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span className="font-mono">{formatTime(currentTime)}</span>
        <span className="font-mono">{formatTime(duration)}</span>
      </div>

      {/* Scrubber track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className="relative h-8 bg-gray-700 rounded-lg cursor-pointer group"
      >
        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg transition-all duration-100"
          style={{ width: `${progress}%` }}
        />

        {/* Event markers - using timestamp_sec from Event type */}
        {events.map((event, idx) => {
          const eventPercent = (event.timestamp_sec / duration) * 100;
          return (
            <div
              key={idx}
              className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${eventPercent}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-yellow-300 shadow-lg hover:scale-125 transition-transform" />
            </div>
          );
        })}

        {/* Thumb */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg group-hover:scale-110 transition-transform z-20"
          style={{ left: `${progress}%` }}
        />

        {/* Hover tooltip */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg font-mono">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Time markers */}
      <div className="relative h-4 text-xs text-gray-500">
        {[0, 0.25, 0.5, 0.75, 1].map((percent) => (
          <div
            key={percent}
            className="absolute transform -translate-x-1/2"
            style={{ left: `${percent * 100}%` }}
          >
            {formatTime(percent * duration)}
          </div>
        ))}
      </div>
    </div>
  );
}
