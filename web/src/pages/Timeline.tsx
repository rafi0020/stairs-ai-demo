import { useMemo } from 'react';
import { Clock, AlertCircle, Phone } from 'lucide-react';
import type { DemoData, Event, StoryboardChapter } from '../lib/types';
import { getEventTypeLabel, getEventTypeColor } from '../lib/types';
import { formatTime } from '../lib/format';
import { getStoryboardImageUrl } from '../lib/loadDemoData';

interface TimelineProps {
  demoData: DemoData | null;
  selectedTime: number;
  onTimeSelect: (time: number) => void;
}

export default function Timeline({ demoData, selectedTime, onTimeSelect }: TimelineProps) {
  const events = demoData?.events ?? [];
  const packets = demoData?.framePackets ?? [];
  const chapters = demoData?.storyboard?.chapters ?? [];
  const duration = demoData?.summary?.total_duration_sec ?? 8.0;

  // Find current chapter
  const currentChapter = useMemo(() => {
    return chapters.find((ch: StoryboardChapter) =>
      selectedTime >= ch.timestamp_sec && 
      selectedTime < (ch.timestamp_sec + 2) // Approximate chapter duration
    ) || chapters[0];
  }, [chapters, selectedTime]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Clock className="text-purple-400" />
          <span>Timeline View</span>
        </h1>
        <div className="text-gray-400 font-mono">
          {formatTime(selectedTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Current Chapter */}
      {currentChapter && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-400">Current Chapter</div>
              <div className="text-xl font-semibold mt-1">{currentChapter.title}</div>
              <div className="text-gray-400 text-sm mt-2">{currentChapter.description}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono text-white">{formatTime(selectedTime)}</div>
              <div className="text-sm text-gray-400">{currentChapter.focus}</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Visualization */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Full Timeline</h2>
        
        {/* Timeline bar */}
        <div className="relative h-16 bg-gray-700 rounded-lg overflow-hidden">
          {/* Compliance segments from packets */}
          {packets.map((packet, idx) => {
            const startPct = (packet.timestamp_sec / duration) * 100;
            const isCompliant = packet.metrics.compliant_count > 0;
            const isPhone = packet.metrics.phone_count > 0;
            const width = 100 / packets.length;
            
            return (
              <div
                key={idx}
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
                title={`Frame ${packet.frame_number}: ${isCompliant ? 'Compliant' : 'Non-compliant'}`}
              />
            );
          })}

          {/* Phone overlay */}
          {packets.map((packet, idx) => {
            const startPct = (packet.timestamp_sec / duration) * 100;
            const isPhone = packet.metrics.phone_count > 0;
            const width = 100 / packets.length;
            
            if (!isPhone) return null;
            return (
              <div
                key={`phone-${idx}`}
                className="absolute bottom-0 h-1/2 bg-orange-500"
                style={{
                  left: `${startPct}%`,
                  width: `${Math.max(width, 0.5)}%`
                }}
              />
            );
          })}

          {/* Event markers */}
          {events.map((event: Event, idx: number) => (
            <button
              key={idx}
              onClick={() => onTimeSelect(event.timestamp_sec)}
              className="absolute top-0 bottom-0 w-1 bg-yellow-400 hover:bg-yellow-300 z-10"
              style={{ left: `${(event.timestamp_sec / duration) * 100}%` }}
              title={`${getEventTypeLabel(event.event_type)} at ${event.timestamp_sec.toFixed(2)}s`}
            />
          ))}

          {/* Current time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20"
            style={{ left: `${(selectedTime / duration) * 100}%` }}
          />
        </div>

        {/* Timeline scrubber */}
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={selectedTime}
          onChange={(e) => onTimeSelect(parseFloat(e.target.value))}
          className="w-full mt-2"
          aria-label="Timeline scrubber"
        />

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-gray-400">Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-gray-400">Non-Compliant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-gray-400">No Persons</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-gray-400">Phone Detected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400"></div>
            <span className="text-gray-400">Event</span>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Committed Events ({events.length})</h2>
        
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p>No events committed in this demo run.</p>
            <p className="text-sm mt-1">Events are only committed when state changes remain stable for ≥0.55s.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event: Event, idx: number) => (
              <button
                key={idx}
                onClick={() => onTimeSelect(event.timestamp_sec)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  Math.abs(event.timestamp_sec - selectedTime) < 0.1
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {event.event_type.includes('phone') ? (
                      <Phone className="text-orange-400" size={20} />
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${
                        event.event_type === 'compliant_start' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    )}
                    <div>
                      <div className={`font-medium ${getEventTypeColor(event.event_type)}`}>
                        {getEventTypeLabel(event.event_type)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Person #{event.person_id} • Frame {event.frame_number}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{event.timestamp_sec.toFixed(2)}s</div>
                    <div className="text-xs text-gray-400">
                      {event.debounce_triggered ? 'Debounced' : 'Immediate'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chapter Navigation */}
      {chapters.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Chapters</h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {chapters.map((chapter: StoryboardChapter) => (
              <button
                key={chapter.id}
                onClick={() => onTimeSelect(chapter.timestamp_sec)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  currentChapter?.id === chapter.id
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium text-sm">{chapter.title}</div>
                <div className="text-xs text-gray-400 mt-1">{chapter.timestamp_sec.toFixed(1)}s</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
