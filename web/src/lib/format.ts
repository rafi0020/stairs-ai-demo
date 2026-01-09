/**
 * Stairs-AI Demo - Formatting utilities
 */

/**
 * Format time in seconds to MM:SS.mmm
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(2).padStart(5, '0')}`;
}

/**
 * Format time in seconds to compact format (e.g., "2.5s")
 */
export function formatTimeCompact(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Format distance (normalized coordinates)
 */
export function formatDistance(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(4);
}

/**
 * Format boolean as Yes/No
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Yes' : 'No';
}

/**
 * Format confidence value
 */
export function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get status badge classes
 */
export function getStatusClasses(status: 'compliant' | 'non-compliant' | 'neutral' | 'phone'): string {
  switch (status) {
    case 'compliant':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'non-compliant':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'phone':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'neutral':
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get compliance status as status type
 */
export function complianceToStatus(compliance: number): 'compliant' | 'non-compliant' | 'neutral' {
  switch (compliance) {
    case 0: return 'compliant';
    case 1: return 'non-compliant';
    default: return 'neutral';
  }
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
