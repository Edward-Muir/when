import { HistoricalEvent } from '../types';

/**
 * How many years a timeline covers, from its earliest card to its latest.
 *
 * Reads `year` only, the start of each card's evidence window, the same anchor the board sorts
 * by. There is no year zero, so a span that crosses from BCE to CE is one shorter than the
 * subtraction says: 1 BCE to 1 CE is one year, not two.
 */
export function getTimelineSpan(events: readonly HistoricalEvent[]): number {
  if (events.length < 2) return 0;
  let earliest = Infinity;
  let latest = -Infinity;
  for (const event of events) {
    earliest = Math.min(earliest, event.year);
    latest = Math.max(latest, event.year);
  }
  const span = latest - earliest;
  return earliest < 0 && latest > 0 ? span - 1 : span;
}

function trimmed(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/**
 * The span as the game-over screen says it: "3,208 years", "120 million years". Null when
 * there is nothing to say, which is a timeline whose cards share one year.
 *
 * One decimal below ten million or ten billion, so "3.3 million years" keeps what separates it
 * from 3; past that the decimal is noise.
 */
export function formatTimelineSpan(span: number): string | null {
  if (!Number.isFinite(span) || span <= 0) return null;
  if (span >= 1_000_000_000) {
    const billions = span / 1_000_000_000;
    return `${billions >= 10 ? Math.round(billions) : trimmed(billions)} billion years`;
  }
  if (span >= 1_000_000) {
    const millions = span / 1_000_000;
    return `${millions >= 10 ? Math.round(millions) : trimmed(millions)} million years`;
  }
  if (span === 1) return '1 year';
  return `${span.toLocaleString('en-US')} years`;
}
