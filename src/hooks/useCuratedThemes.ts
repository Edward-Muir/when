import { useMemo, useSyncExternalStore } from 'react';
import { HistoricalEvent } from '../types';
import { getCuratedThemesRevision, subscribeCuratedThemes } from '../utils/curatedThemes';
import { getDailyPreviewEvent } from '../utils/dailyConfig';
import { DailyTheme, getDailyTheme } from '../utils/dailyTheme';

/**
 * React's view of the theme calendar.
 *
 * The calendar is fetched once at boot but read synchronously everywhere, so filling it in
 * signals React nothing on its own. Anything that derived a value from it before the fetch
 * landed would keep that value forever — which is exactly what happened to mode select's
 * "Today's Challenge" name: `App` mounts `ModeSelect` during the `loading` phase with a
 * constant key, so its first render runs against an empty calendar, and a `[today]`
 * dependency does not change again until midnight. A curated day showed the seeded fallback
 * category all day, unless the player had already played (which reads the stored result
 * instead and hid the bug).
 *
 * Subscribing to the revision fixes the boot ordering and the forced refetch on resume with
 * one mechanism.
 */
export function useCuratedThemesRevision(): number {
  return useSyncExternalStore(
    subscribeCuratedThemes,
    getCuratedThemesRevision,
    getCuratedThemesRevision
  );
}

/** Today's theme, recomputed when the day rolls over or the calendar changes. */
export function useDailyTheme(date: string): DailyTheme {
  const revision = useCuratedThemesRevision();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is deliberately unread: it is the change signal for the module-level calendar `getDailyTheme` reads
  return useMemo(() => getDailyTheme(date), [date, revision]);
}

/** The hero card for today's deck, under the same two triggers. */
export function useDailyPreviewEvent(
  allEvents: HistoricalEvent[],
  date: string
): HistoricalEvent | null {
  const revision = useCuratedThemesRevision();
  // Without the revision this would lean on `allEvents` changing identity in the same tick,
  // which holds only on the cold-boot path: `loadAllEvents` returns the cached array by
  // reference, so a warm catalogue with a cold calendar would never re-run it.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `revision` is the calendar's change signal, as in `useDailyTheme`
  return useMemo(() => getDailyPreviewEvent(allEvents, date), [allEvents, date, revision]);
}
