import { useMemo } from 'react';
import { DailyTheme, getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { buildDailyDeck } from '../utils/dailyConfig';
import { HistoricalEvent } from '../types';

export interface DailyPreview {
  theme: DailyTheme;
  themeName: string;
  /** Today's whole deck; the Daily card shows its first card, the Resume check reads it all. */
  deck: HistoricalEvent[];
}

/**
 * Today's theme and deck for the Daily tab.
 *
 * Both read the curated calendar's module cache (`utils/curatedThemes.ts`), which nothing
 * re-renders on, so the memos key on what changes when it does:
 * - `allEvents`: the boot load resolves the events and the calendar together, and the home
 *   screen is already mounted while it runs (the `loading` phase renders it too). Keying only
 *   on `today` named a seeded theme on a curated day.
 * - `calendarVersion`: bumped after each calendar refetch.
 * - `today`: rollover.
 */
export function useDailyPreview(
  today: string,
  allEvents: HistoricalEvent[],
  calendarVersion: number
): DailyPreview {
  const theme = useMemo(
    () => getDailyTheme(today),
    // The extra deps stand in for the module cache (see above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [today, allEvents, calendarVersion]
  );
  const deck = useMemo(
    () => buildDailyDeck(allEvents, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, today, calendarVersion]
  );
  return { theme, themeName: getThemeDisplayName(theme), deck };
}
