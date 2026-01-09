/**
 * Stairs-AI Demo - Data loading utilities for static demo files
 */

import type { Summary, Event, FramePacket, Storyboard, DemoData } from './types';

// Base path for demo data (relative to public folder)
const DEMO_BASE_PATH = './demo';

/**
 * Load JSON file from public demo folder
 */
async function loadJson<T>(filename: string): Promise<T> {
  const response = await fetch(`${DEMO_BASE_PATH}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Load summary statistics
 */
export async function loadSummary(): Promise<Summary> {
  return loadJson<Summary>('summary.json');
}

/**
 * Load committed events
 */
export async function loadEvents(): Promise<Event[]> {
  return loadJson<Event[]>('events.json');
}

/**
 * Load frame packets for whitebox analysis
 */
export async function loadFramePackets(): Promise<FramePacket[]> {
  return loadJson<FramePacket[]>('frame_packets.json');
}

/**
 * Load storyboard chapters
 */
export async function loadStoryboard(): Promise<Storyboard> {
  return loadJson<Storyboard>('storyboard.json');
}

/**
 * Load all demo data at once
 */
export async function loadAllDemoData(): Promise<DemoData> {
  try {
    const [summary, events, framePackets, storyboard] = await Promise.all([
      loadSummary().catch(() => null),
      loadEvents().catch(() => []),
      loadFramePackets().catch(() => []),
      loadStoryboard().catch(() => null)
    ]);

    return {
      summary,
      events,
      framePackets,
      storyboard,
      loaded: true,
      error: null
    };
  } catch (error) {
    return {
      summary: null,
      events: [],
      framePackets: [],
      storyboard: null,
      loaded: true,
      error: error instanceof Error ? error.message : 'Unknown error loading demo data'
    };
  }
}

/**
 * Get evidence frame URL
 */
export function getEvidenceFrameUrl(relativePath: string): string {
  // Handle both full paths and just filenames
  if (relativePath.startsWith('evidence_frames/')) {
    return `${DEMO_BASE_PATH}/${relativePath}`;
  }
  return `${DEMO_BASE_PATH}/evidence_frames/${relativePath}`;
}

/**
 * Get storyboard thumbnail URL
 */
export function getStoryboardImageUrl(relativePath: string): string {
  if (relativePath.startsWith('storyboard/')) {
    return `${DEMO_BASE_PATH}/${relativePath}`;
  }
  return `${DEMO_BASE_PATH}/storyboard/${relativePath}`;
}

/**
 * Find frame packet closest to a given time
 */
export function findFramePacketAtTime(
  packets: FramePacket[],
  timeSec: number
): FramePacket | null {
  if (packets.length === 0) return null;

  let closest = packets[0];
  let minDiff = Math.abs(packets[0].timestamp_sec - timeSec);

  for (const packet of packets) {
    const diff = Math.abs(packet.timestamp_sec - timeSec);
    if (diff < minDiff) {
      minDiff = diff;
      closest = packet;
    }
  }

  return closest;
}

/**
 * Create placeholder demo data for when no data is available
 */
export function createPlaceholderData(): DemoData {
  return {
    summary: {
      source_video: 'assets/preview.mp4',
      parameters: {
        yolo_model: 'yolov8n.pt',
        yolo_conf: 0.5,
        phone_threshold: 0.05,
        min_state_duration_sec: 0.55,
        fps: 24,
        frame_width: 1280,
        frame_height: 720
      },
      total_frames: 192,
      total_duration_sec: 8.0,
      persons_detected_count: 0,
      unique_tracks: 0,
      compliance_summary: {
        compliant_frames: 0,
        non_compliant_frames: 0,
        compliant_pct: 0,
        non_compliant_pct: 0
      },
      phone_summary: {
        phone_detected_frames: 0,
        no_phone_frames: 0,
        phone_pct: 0
      },
      events_count: 0,
      processing_time_sec: 0,
      generated_at: new Date().toISOString()
    },
    events: [],
    framePackets: [],
    storyboard: {
      chapters: [
        {
          id: 'ch1',
          title: 'Approach',
          timestamp_sec: 0.0,
          frame_number: 0,
          thumbnail_path: 'storyboard/ch1_approach.svg',
          description: 'Person approaches the staircase.',
          focus: 'Initial detection'
        }
      ],
      total_duration_sec: 8.0,
      generated_at: new Date().toISOString()
    },
    loaded: true,
    error: 'Demo data not yet generated. Run the Python pipeline first.'
  };
}
