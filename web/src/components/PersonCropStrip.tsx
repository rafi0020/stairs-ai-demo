import type { PersonAnalysis } from '../lib/types';
import { formatConfidence } from '../lib/format';

interface PersonCropStripProps {
  persons: PersonAnalysis[];
}

export default function PersonCropStrip({ persons }: PersonCropStripProps) {
  if (persons.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No persons detected in this frame
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {persons.map((person) => {
        // Using correct property names from types.ts:
        // - rail_hit_test?.any_hit (not rail_hit?.any_hand_in_rail)
        // - phone_heuristic?.is_phone_talking (not phone_result?.is_using_phone)
        // - confidence is directly on PersonAnalysis (not bbox.confidence)
        const isTouchingRail = person.rail_hit_test?.any_hit || false;
        const isUsingPhone = person.phone_heuristic?.is_phone_talking || false;
        
        return (
          <div
            key={person.person_id}
            className={`relative rounded-lg overflow-hidden border-2 ${
              isTouchingRail && !isUsingPhone
                ? 'border-green-500'
                : 'border-red-500'
            }`}
          >
            {/* Person visual placeholder - actual crop would require video access */}
            <div className="w-24 h-32 bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-600">
                  P{person.person_id}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {person.bbox.width}×{person.bbox.height}
                </div>
              </div>
            </div>

            {/* Info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Conf:</span>
                  <span className="font-mono text-white">
                    {formatConfidence(person.confidence)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Rail:</span>
                  <span className={isTouchingRail ? 'text-green-400' : 'text-red-400'}>
                    {isTouchingRail ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className={isUsingPhone ? 'text-orange-400' : 'text-gray-400'}>
                    {isUsingPhone ? '📱' : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status indicators */}
            <div className="absolute top-1 right-1 flex space-x-1">
              {isTouchingRail && (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-xs">
                  🤚
                </div>
              )}
              {isUsingPhone && (
                <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-xs">
                  📱
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
