import { useEffect, useMemo, useRef, useState } from 'react';
import { HistoricalEvent, WhenGameState } from '../types';
import {
  buildEventsByName,
  recordGameResult,
  detectMilestones,
  getLifetimeStats,
  getDailyCadence,
  GameMilestone,
} from '../utils/statsStorage';
import { markNavUnseen } from '../utils/playerStorage';
import { getCuratedThemeIdForConfig } from '../utils/themeReplay';
import { getThemeBest, recordThemeResult } from '../utils/themeBests';
import { getThemeOutcome } from '../utils/themeOutcome';
import { appendGameRecord, buildGameRecord } from '../utils/gameHistory';

interface GameStatsRecording {
  /** Achievement ids unlocked by the most recently recorded game. */
  newlyUnlockedAchievements: string[];
  /** Personal-best milestones set by the most recently recorded game. */
  gameMilestones: GameMilestone[];
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
    if (state.phase !== 'gameOver') {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || eventsByName.size === 0) return;
    recordedRef.current = true;
    // Snapshot records BEFORE recording so we can tell which the game just beat.
    const themeId = getCuratedThemeIdForConfig(state.lastConfig);
    const prev = {
      lifetime: getLifetimeStats(),
      cadence: getDailyCadence(),
      themeBest: themeId ? (getThemeBest(themeId)?.correctCount ?? 0) : undefined,
    };
    const unlocked = recordGameResult(state, eventsByName);
    const { survived, perfect } = getThemeOutcome(state);
    // A curated theme's record — the daily on its day and every Archive replay alike.
    if (themeId) {
      recordThemeResult(themeId, {
        correctCount: state.placementHistory.filter(Boolean).length,
        cleared: survived,
        perfect,
      });
    }
    // The per-game history behind the stats page's calendar and, later, its trend views.
    const record = buildGameRecord(state, { themeId, cleared: survived, perfect });
    if (record) appendGameRecord(record);
    // Re-arm the Achievements nav dot so the player is nudged to go see what they earned.
    if (unlocked.length > 0) markNavUnseen('achievements');
    setNewlyUnlockedAchievements(unlocked);
    setGameMilestones(detectMilestones(state, prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `state` read once per game, ref-guarded
  }, [state.phase, eventsByName]);

  return { newlyUnlockedAchievements, gameMilestones };
}
