import { useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEvent, WhenGameState } from '../types';
import {
  buildEventsByName,
  recordGameResult,
  detectMilestones,
  getLifetimeStats,
  getDailyCadence,
  getCollectionState,
  GameMilestone,
} from '../utils/statsStorage';
import { armNavOnce, markNavUnseen } from '../utils/playerStorage';
import { getCuratedThemeIdForConfig } from '../utils/themeReplay';
import { getThemeBest, recordThemeResult } from '../utils/themeBests';
import { getThemeOutcome } from '../utils/themeOutcome';
import { appendGameRecord, buildGameRecord } from '../utils/gameHistory';
import { asRecordedDaily } from '../utils/dailyReplay';

interface GameStatsRecording {
  /** Achievement ids unlocked by the most recently recorded game. */
  newlyUnlockedAchievements: string[];
  /** Personal-best milestones set by the most recently recorded game. */
  gameMilestones: GameMilestone[];
}

/**
 * Light the two once-per-install "new" dots on Home's tabs, from the stores as they stood
 * before this game was recorded: Archive after the first Daily ever finished, Timeline after
 * the first game that put anything in the collection. "Ever" rather than "next", so an install
 * that predates the dots is never told about tabs it has been using.
 */
function armFirstGameDots(
  game: WhenGameState,
  before: { dailiesPlayed: number; collected: number }
): void {
  if (game.lastConfig?.dailySeed && before.dailiesPlayed === 0) armNavOnce('archive');
  if (before.collected === 0 && getCollectionState().placedEventIds.length > 0) {
    armNavOnce('timeline');
  }
}

/**
 * Record every finished game into the stats primitives, unlocking achievements and detecting
 * personal-best milestones. Unlike the daily save (idempotent by overwrite), this increments
 * counters, so a ref guards once-per-game. Both outputs are always set (empty when nothing new)
 * so a later game can't re-surface a prior game's unlocks/milestones.
 */
export function useGameStatsRecorder(
  state: WhenGameState,
  allEvents: HistoricalEvent[]
): GameStatsRecording {
  const eventsByName = useMemo(() => buildEventsByName(allEvents), [allEvents]);
  const recordedRef = useRef(false);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<string[]>([]);
  const [gameMilestones, setGameMilestones] = useState<GameMilestone[]>([]);

  useEffect(() => {
    // A board restored for review re-enters `gameOver` with a game that was already recorded.
    // Counting it again would double every lifetime stat and re-fire its achievements.
    if (state.phase !== 'gameOver' || state.isReview) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || eventsByName.size === 0) return;
    recordedRef.current = true;
    // Snapshot records BEFORE recording so we can tell which the game just beat.
    const cadence = getDailyCadence();
    // A missed past day from the Archive calendar records as that day's daily; everything
    // below reads `game`, never `state`, so the cadence, history and milestones agree.
    const game = asRecordedDaily(state, cadence.playedDates);
    const themeId = getCuratedThemeIdForConfig(game.lastConfig);
    const prev = {
      lifetime: getLifetimeStats(),
      cadence,
      themeBest: themeId ? (getThemeBest(themeId)?.correctCount ?? 0) : undefined,
    };
    const collectedBefore = getCollectionState().placedEventIds.length;
    const unlocked = recordGameResult(game, eventsByName);
    armFirstGameDots(game, {
      dailiesPlayed: cadence.playedDates.length,
      collected: collectedBefore,
    });
    const { survived, perfect } = getThemeOutcome(game);
    // A curated theme's record — the daily on its day and every Archive replay alike.
    if (themeId) {
      recordThemeResult(themeId, {
        correctCount: game.placementHistory.filter(Boolean).length,
        cleared: survived,
        perfect,
      });
    }
    // The per-game history behind the stats page's calendar and, later, its trend views.
    const record = buildGameRecord(game, { themeId, cleared: survived, perfect });
    if (record) appendGameRecord(record);
    // Re-arm the Settings tab's dot (the badges live on that tab) so the player is nudged to go
    // see what they earned.
    if (unlocked.length > 0) markNavUnseen('stats');
    setNewlyUnlockedAchievements(unlocked);
    setGameMilestones(detectMilestones(game, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `state` read once per game, ref-guarded
  }, [state.phase, state.isReview, eventsByName]);

  return { newlyUnlockedAchievements, gameMilestones };
}
