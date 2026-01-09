import { Clock } from 'lucide-react';
import type { StoryboardChapter } from '../lib/types';
import { formatTimeCompact } from '../lib/format';

interface StoryboardProps {
  chapters: StoryboardChapter[];
  onChapterSelect: (chapter: StoryboardChapter) => void;
  selectedChapterId?: string;
}

export default function Storyboard({ chapters, onChapterSelect, selectedChapterId }: StoryboardProps) {
  const focusColors: Record<string, string> = {
    non_compliance: 'border-red-500',
    occlusion: 'border-purple-500',
    phone_detection: 'border-orange-500',
    mask_sensitivity: 'border-green-500',
    state_stabilization: 'border-yellow-500',
    compliance: 'border-green-500',
    phone: 'border-orange-500',
  };

  const focusLabels: Record<string, string> = {
    non_compliance: 'Compliance',
    occlusion: 'Occlusion',
    phone_detection: 'Phone',
    mask_sensitivity: 'Rail Mask',
    state_stabilization: 'Debounce',
    compliance: 'Compliance',
    phone: 'Phone',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {chapters.map((chapter) => (
        <button
          key={chapter.id}
          onClick={() => onChapterSelect(chapter)}
          className={`group relative bg-gray-800 rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
            selectedChapterId === chapter.id
              ? focusColors[chapter.focus] || 'border-blue-500'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          {/* Thumbnail */}
          <div className="aspect-video bg-gray-900 relative overflow-hidden">
            {chapter.thumbnail_path ? (
              <img
                src={chapter.thumbnail_path}
                alt={chapter.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Clock size={32} />
              </div>
            )}
            
            {/* Time overlay - using timestamp_sec from StoryboardChapter */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded text-xs font-mono">
              {formatTimeCompact(chapter.timestamp_sec)}
            </div>
            
            {/* Focus tag - using focus from StoryboardChapter */}
            <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
              focusColors[chapter.focus]?.replace('border-', 'bg-').replace('500', '500/30') || 'bg-gray-700'
            } ${
              focusColors[chapter.focus]?.replace('border-', 'text-') || 'text-gray-300'
            }`}>
              {focusLabels[chapter.focus] || chapter.focus}
            </div>
          </div>

          {/* Content - using title from StoryboardChapter */}
          <div className="p-3">
            <h3 className="font-medium text-white text-sm line-clamp-1">
              {chapter.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {chapter.description || `Frame ${chapter.frame_number}`}
            </p>
          </div>

          {/* Selected indicator */}
          {selectedChapterId === chapter.id && (
            <div className="absolute inset-0 ring-2 ring-inset ring-white/20 rounded-xl pointer-events-none" />
          )}
        </button>
      ))}
    </div>
  );
}
