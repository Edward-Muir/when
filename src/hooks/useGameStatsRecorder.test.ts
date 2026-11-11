import { renderHook } from '@testing-library/react';
import { HistoricalEvent, WhenGameState } from '../types';
import { useGameStatsRecorder } from './useGameStatsRecorder';
import { hasSeenNav, markNavSeen } from '../utils/playerStorage';
import { getLocalDateString } from '../utils/puzzleDate';

const event = (name: string, year: number): HistoricalEvent =>
  ({ name, year, category: 'science', difficulty: 'easy' }) as HistoricalEvent;

const CATALOGUE = [event('seed-event', 1500), event('placed-card', 1800)];

function finished(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'gameOver',
    gameMode: 'daily',
    timeline: CATALOGUE,
    seedEventName: 'seed-event',
    deck: [],
    placementHistory: [true, false],
    failedPlacements: [],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: null,
    lastConfig: { dailySeed: getLocalDateString(), mode: 'daily' },
    players: [{ id: 0, name: 'Player 1', hand: [], hasWon: false, placementHistory: [] }],
    currentPlayerIndex: 0,
    turnNumber: 2,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: 1,
    ...overrides,
  } as unknown as WhenGameState;
}

/** A Custom game that places nothing beyond its starting card. */
const emptyCustom = (): WhenGameState =>
  finished({
    gameMode: 'suddenDeath',
    lastConfig: { mode: 'suddenDeath' } as WhenGameState['lastConfig'],
    timeline: [CATALOGUE[0]],
    placementHistory: [false],
  });

const record = (state: WhenGameState) => renderHook(() => useGameStatsRecorder(state, CATALOGUE));

beforeEach(() => localStorage.clear());

describe('the Home tab dots a finished game arms', () => {
  it('lights Archive and Timeline after the first Daily that collects a card', () => {
    record(finished());
    expect(hasSeenNav('archive')).toBe(false);
    expect(hasSeenNav('timeline')).toBe(false);
  });

  it('lights neither for a Custom game that collects nothing', () => {
    record(emptyCustom());
    expect(hasSeenNav('archive')).toBe(true);
    expect(hasSeenNav('timeline')).toBe(true);
  });

  it('lights Timeline, not Archive, for a first Custom game that collects a card', () => {
    record(finished({ gameMode: 'suddenDeath', lastConfig: { mode: 'suddenDeath' } as never }));
    expect(hasSeenNav('archive')).toBe(true);
    expect(hasSeenNav('timeline')).toBe(false);
  });

  it('never lights Archive or Timeline a second time, even after the stats are wiped', () => {
    record(finished());
    markNavSeen('archive');
    markNavSeen('timeline');
    record(finished({ lastConfig: { dailySeed: '2020-01-01', mode: 'daily' } as never }));
    expect(hasSeenNav('archive')).toBe(true);
    expect(hasSeenNav('timeline')).toBe(true);

    // A wipe leaves the stores looking like a first game again; the one-shot flags hold.
    ['when-collection', 'when-daily-cadence', 'when-lifetime-stats'].forEach((k) =>
      localStorage.removeItem(k)
    );
    record(finished());
    expect(hasSeenNav('archive')).toBe(true);
    expect(hasSeenNav('timeline')).toBe(true);
  });

  it('does not light Archive for a player who already had a Daily on record', () => {
    record(finished({ lastConfig: { dailySeed: '2020-01-01', mode: 'daily' } as never }));
    markNavSeen('archive');
    localStorage.removeItem('when-nav-armed');
    record(finished());
    expect(hasSeenNav('archive')).toBe(true);
  });

  it('lights Stats on a badge unlock', () => {
    record(finished());
    // The first Daily unlocks at least one badge (the first-game family).
    expect(hasSeenNav('stats')).toBe(false);
  });
});
