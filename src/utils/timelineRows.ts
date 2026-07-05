import { FailedPlacement, HistoricalEvent } from '../types';
import { findCorrectPosition } from './gameLogic';

export type TimelineRow =
  | { kind: 'event'; event: HistoricalEvent; realIndex: number }
  | { kind: 'tombstone'; failed: FailedPlacement; gap: number };

/**
 * Interleave display-only tombstones (failed placements) into the real timeline.
 * Tombstone positions are derived from the current timeline on every call so they
 * stay correct as the timeline grows; real events keep their original indices.
 */
export function buildTimelineRows(
  events: HistoricalEvent[],
  failedPlacements: FailedPlacement[]
): TimelineRow[] {
  if (failedPlacements.length === 0) {
    return events.map((event, realIndex) => ({ kind: 'event', event, realIndex }));
  }

  // Group tombstones by the gap they belong in (gap i renders before real event i)
  const byGap = new Map<number, FailedPlacement[]>();
  for (const failed of failedPlacements) {
    const gap = findCorrectPosition(events, failed.event);
    const existing = byGap.get(gap);
    if (existing) {
      existing.push(failed);
    } else {
      byGap.set(gap, [failed]);
    }
  }
  byGap.forEach((group) => group.sort((a, b) => a.event.year - b.event.year || a.seq - b.seq));

  const rows: TimelineRow[] = [];
  for (let i = 0; i <= events.length; i++) {
    byGap.get(i)?.forEach((failed) => rows.push({ kind: 'tombstone', failed, gap: i }));
    const event = events.at(i);
    if (event !== undefined) {
      rows.push({ kind: 'event', event, realIndex: i });
    }
  }
  return rows;
}
