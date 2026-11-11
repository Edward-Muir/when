import { useEffect, useMemo } from 'react';
import { ACHIEVEMENTS, AchievementDef } from '../data/achievements';
import type { HistoricalEvent } from '../types';
import { buildEventsByName } from '../utils/statsStorage';
import { preloadEventImages } from '../utils/preloadImage';

/**
 * The badges a game unlocked, as defs in unlock order, with the catalogue keyed by name so each
 * can resolve its art (reusing the loaded events). Ids without a badge are skipped.
 *
 * The art is warmed as soon as the list lands at game over, so it is ready when the
 * achievements step opens after the game-over popup. One badge is revealed on the large card
 * (`detail`); two or more share one screen of rings, which use `thumbnail` (AchievementUnlock).
 */
export function useUnlockedBadges(
  unlockedIds: string[],
  allEvents: HistoricalEvent[]
): { unlockedDefs: AchievementDef[]; eventsByName: Map<string, HistoricalEvent> } {
  const eventsByName = useMemo(() => buildEventsByName(allEvents), [allEvents]);
  const unlockedDefs = useMemo(
    () =>
      unlockedIds
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
        .filter((def): def is AchievementDef => def !== undefined),
    [unlockedIds]
  );

  useEffect(() => {
    const variant = unlockedDefs.length > 1 ? 'thumbnail' : 'detail';
    preloadEventImages(
      unlockedDefs.map((def) => eventsByName.get(def.eventName)),
      [variant]
    );
  }, [unlockedDefs, eventsByName]);

  return { unlockedDefs, eventsByName };
}
