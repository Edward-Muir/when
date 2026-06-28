import { HistoricalEvent } from '../types';

/** Number of events shown in the game-start intro animation. */
export const INTRO_EVENT_COUNT = 20;

/**
 * Pick a random subset of events for the intro animation, sorted by year so they
 * read as a timeline. Selected once per game (in App) so the set warmed during
 * modeSelect is exactly the set the transition later renders.
 */
export function pickIntroEvents(
  allEvents: HistoricalEvent[],
  count: number = INTRO_EVENT_COUNT
): HistoricalEvent[] {
  if (allEvents.length === 0) return [];
  const shuffled = [...allEvents].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allEvents.length)).sort((a, b) => a.year - b.year);
}
