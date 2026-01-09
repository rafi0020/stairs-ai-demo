/**
 * Stairs-AI Demo - Client-side computation utilities
 * 
 * These functions enable parameter tuning in the static UI without
 * re-running ML inference, using pre-computed intermediate data.
 */

import type { FramePacket } from './types';

// Default tuning parameters
export const DEFAULT_PHONE_THRESHOLD = 0.05;
export const DEFAULT_DEBOUNCE_DURATION = 0.55;

/**
 * Recompute phone detection for a person using a different threshold
 */
export function recomputePhoneForPerson(
  phoneHeuristic: {
    min_distance: number;
    threshold: number;
    is_phone_talking: boolean;
  } | null,
  newThreshold: number
): boolean {
  if (!phoneHeuristic) return false;
  return phoneHeuristic.min_distance < newThreshold;
}

/**
 * Recompute all frame packets with new phone threshold
 */
export function recomputeWithThreshold(
  packets: FramePacket[],
  phoneThreshold: number
): FramePacket[] {
  return packets.map(packet => {
    const newPersons = packet.persons.map(person => {
      const isPhoneTalking = recomputePhoneForPerson(person.phone_heuristic, phoneThreshold);
      return {
        ...person,
        phone_heuristic: person.phone_heuristic ? {
          ...person.phone_heuristic,
          is_phone_talking: isPhoneTalking,
          threshold: phoneThreshold
        } : null
      };
    });

    const phoneCount = newPersons.filter(p => p.phone_heuristic?.is_phone_talking).length;

    return {
      ...packet,
      persons: newPersons,
      metrics: {
        ...packet.metrics,
        phone_count: phoneCount
      }
    };
  });
}

/**
 * State machine state type
 */
type ComplianceState = 'compliant' | 'non_compliant' | 'unknown';
type PhoneState = 'phone' | 'no_phone' | 'unknown';
type StateTuple = [ComplianceState, PhoneState];

/**
 * Simulate debounce state machine over frame packets
 */
export function simulateDebounce(
  packets: FramePacket[],
  phoneThreshold: number,
  debounceDuration: number
): {
  packets: FramePacket[];
  events: SimulatedEvent[];
  stats: SimulationStats;
} {
  if (packets.length === 0) {
    return {
      packets: [],
      events: [],
      stats: {
        totalFrames: 0,
        compliantFrames: 0,
        nonCompliantFrames: 0,
        phoneFrames: 0,
        totalCommits: 0
      }
    };
  }

  const fps = 24; // Assume 24 fps
  const minFrames = Math.ceil(debounceDuration * fps);

  let stableState: StateTuple = ['unknown', 'unknown'];
  let pendingState: StateTuple | null = null;
  let pendingFrameCount = 0;

  const events: SimulatedEvent[] = [];
  const processedPackets: FramePacket[] = [];
  
  let compliantFrames = 0;
  let nonCompliantFrames = 0;
  let phoneFrames = 0;

  for (const packet of packets) {
    // Recompute phone for this frame
    const recomputedPersons = packet.persons.map(person => {
      const isPhone = recomputePhoneForPerson(person.phone_heuristic, phoneThreshold);
      return {
        ...person,
        phone_heuristic: person.phone_heuristic ? {
          ...person.phone_heuristic,
          is_phone_talking: isPhone,
          threshold: phoneThreshold
        } : null
      };
    });

    // Determine raw state for this frame
    const anyHoldingRail = recomputedPersons.some(p => p.rail_hit_test?.any_hit);
    const anyUsingPhone = recomputedPersons.some(p => p.phone_heuristic?.is_phone_talking);
    
    const rawCompliance: ComplianceState = packet.metrics.total_persons === 0 
      ? 'unknown' 
      : (anyHoldingRail ? 'compliant' : 'non_compliant');
    const rawPhone: PhoneState = anyUsingPhone ? 'phone' : 'no_phone';
    const rawState: StateTuple = [rawCompliance, rawPhone];

    // Update stats
    if (rawCompliance === 'compliant') compliantFrames++;
    else if (rawCompliance === 'non_compliant') nonCompliantFrames++;
    if (rawPhone === 'phone') phoneFrames++;

    // State machine logic
    if (stableState[0] === 'unknown' && stableState[1] === 'unknown') {
      // First valid state becomes stable immediately
      if (rawCompliance !== 'unknown') {
        stableState = rawState;
      }
    } else if (rawState[0] !== stableState[0] || rawState[1] !== stableState[1]) {
      // State changed
      if (pendingState && pendingState[0] === rawState[0] && pendingState[1] === rawState[1]) {
        // Same as pending, increment counter
        pendingFrameCount++;
        if (pendingFrameCount >= minFrames) {
          // Commit the state change
          const oldState = stableState;
          stableState = rawState;
          pendingState = null;
          pendingFrameCount = 0;
          commitEvent = true;
          
          events.push({
            frame_number: packet.frame_number,
            timestamp_sec: packet.timestamp_sec,
            old_state: oldState,
            new_state: stableState,
            event_type: determineEventType(oldState, stableState)
          });
        }
      } else {
        // New pending state
        pendingState = rawState;
        pendingFrameCount = 1;
      }
    } else {
      // State matches stable, clear pending
      pendingState = null;
      pendingFrameCount = 0;
    }

    processedPackets.push({
      ...packet,
      persons: recomputedPersons,
      metrics: {
        ...packet.metrics,
        phone_count: recomputedPersons.filter(p => p.phone_heuristic?.is_phone_talking).length
      },
      state_machine: {
        current_state: stableState,
        pending_state: pendingState,
        time_in_pending: pendingFrameCount / fps,
        debounce_threshold: debounceDuration
      }
    });
  }

  return {
    packets: processedPackets,
    events,
    stats: {
      totalFrames: packets.length,
      compliantFrames,
      nonCompliantFrames,
      phoneFrames,
      totalCommits: events.length
    }
  };
}

/**
 * Simulated event from debounce simulation
 */
export interface SimulatedEvent {
  frame_number: number;
  timestamp_sec: number;
  old_state: StateTuple;
  new_state: StateTuple;
  event_type: string;
}

/**
 * Statistics from simulation
 */
export interface SimulationStats {
  totalFrames: number;
  compliantFrames: number;
  nonCompliantFrames: number;
  phoneFrames: number;
  totalCommits: number;
}

/**
 * Determine event type from state transition
 */
function determineEventType(
  oldState: StateTuple,
  newState: StateTuple
): string {
  if (oldState[0] !== newState[0]) {
    return newState[0] === 'compliant' ? 'compliant_start' : 'non_compliant_start';
  }
  if (oldState[1] !== newState[1]) {
    return newState[1] === 'phone' ? 'phone_detected' : 'phone_ended';
  }
  return 'state_change';
}

/**
 * Compare baseline and tuned results
 */
export function compareParameters(
  baselineStats: SimulationStats,
  tunedStats: SimulationStats
): {
  baseline: { stats: SimulationStats };
  tuned: { stats: SimulationStats };
  delta: {
    phoneFramesChange: number;
    eventsChange: number;
  };
} {
  return {
    baseline: { stats: baselineStats },
    tuned: { stats: tunedStats },
    delta: {
      phoneFramesChange: tunedStats.phoneFrames - baselineStats.phoneFrames,
      eventsChange: tunedStats.totalCommits - baselineStats.totalCommits
    }
  };
}
