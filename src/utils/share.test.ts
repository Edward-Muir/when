import { formatShareDate, generateDailyShareText, generateShareText } from './share';
import { WhenGameState } from '../types';

// The canvas renderer is irrelevant to the text format and unavailable under jsdom.
jest.mock('./shareImage', () => ({
  renderShareFile: jest.fn().mockResolvedValue(null),
}));

function makeState(overrides: Partial<WhenGameState> = {}): WhenGameState {
  return {
    phase: 'gameOver',
    gameMode: 'suddenDeath',
    timeline: [],
    deck: [],
    placementHistory: [],
    failedPlacements: [],
    lastPlacementResult: null,
    isAnimating: false,
    animationPhase: 'idle',
    lastConfig: null,
    players: [
      {
        id: 0,
        name: 'Player 1',
        hand: [],
        hasWon: false,
        placementHistory: [],
      },
    ],
    currentPlayerIndex: 0,
    turnNumber: 1,
    roundNumber: 1,
    winners: [],
    activePlayersAtRoundStart: 1,
    currentStreak: 0,
    bestStreak: 0,
    ...overrides,
  } as WhenGameState;
}

const EMOJI = /\p{Extended_Pictographic}/u;

describe('formatShareDate', () => {
  it('formats an ISO puzzle date without re-parsing it as a Date', () => {
    expect(formatShareDate('2026-08-15')).toBe('Aug 15');
    expect(formatShareDate('2026-01-01')).toBe('Jan 1');
    expect(formatShareDate('2026-12-31')).toBe('Dec 31');
  });

  it('passes anything unrecognised straight through', () => {
    expect(formatShareDate('tomorrow')).toBe('tomorrow');
    expect(formatShareDate('2026-13-01')).toBe('2026-13-01');
  });
});

describe('generateDailyShareText', () => {
  it('is three parts: identity, stats, link', () => {
    const text = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 10,
    });
    expect(text).toBe('When · Aug 15 · Everything\nTimeline of 11\n\nplay-when.com/daily');
  });

  it('counts the seed card in the timeline length', () => {
    expect(
      generateDailyShareText({ date: '2026-08-15', theme: 'Science', correctCount: 0 })
    ).toContain('Timeline of 1');
  });

  it('appends best run and rank when they exist', () => {
    const text = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 10,
      bestStreak: 4,
      leaderboardRank: 47,
    });
    expect(text).toContain('Timeline of 11 — best run 4 — #47 globally');
  });

  it('hides a best run of one, which is not a run', () => {
    const text = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 3,
      bestStreak: 1,
    });
    expect(text).not.toContain('best run');
  });

  it('spends its one emoji on the top spot and nowhere else', () => {
    const top = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 20,
      bestStreak: 9,
      leaderboardRank: 1,
    });
    expect(top).toContain('#1 globally 👑');
    expect([...top].filter((c) => EMOJI.test(c))).toHaveLength(1);

    const runnerUp = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 20,
      bestStreak: 9,
      leaderboardRank: 2,
    });
    expect(runnerUp).not.toMatch(EMOJI);
  });

  it('carries no red/green grid', () => {
    const text = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 10,
      bestStreak: 4,
    });
    expect(text).not.toMatch(/🟩|🟥/);
  });

  it('ends with exactly one URL, so link previews are unambiguous', () => {
    const text = generateDailyShareText({
      date: '2026-08-15',
      theme: 'Everything',
      correctCount: 10,
      leaderboardRank: 3,
    });
    expect(text.match(/play-when\.com/g)).toHaveLength(1);
    expect(text.split('\n').pop()).toBe('play-when.com/daily');
  });
});

describe('generateShareText', () => {
  it('routes daily games through the daily format', () => {
    const text = generateShareText(
      makeState({
        gameMode: 'daily',
        placementHistory: [true, true, false, true],
        bestStreak: 2,
        lastConfig: {
          mode: 'daily',
          totalTurns: 5,
          selectedDifficulties: [],
          selectedCategories: [],
          selectedEras: [],
          dailySeed: '2026-08-15',
        },
      })
    );
    expect(text).toContain('When · Aug 15 · ');
    expect(text).toContain('Timeline of 4 — best run 2');
    expect(text.split('\n').pop()).toBe('play-when.com/daily');
  });

  it('reports marathon placements without the seed bonus', () => {
    const text = generateShareText(
      makeState({ placementHistory: [true, true, true, false], bestStreak: 3 })
    );
    expect(text).toBe('When · Marathon\nTimeline of 3 — best run 3\n\nplay-when.com');
  });

  it('swaps in the challenge link when the game came from a code', () => {
    const text = generateShareText(
      makeState({
        placementHistory: [true, true],
        lastConfig: {
          mode: 'suddenDeath',
          totalTurns: 5,
          selectedDifficulties: [],
          selectedCategories: [],
          selectedEras: [],
          challengeCode: 'able-baker-cane-dog-echo-fox',
        },
      })
    );
    expect(text.split('\n').pop()).toBe('play-when.com/challenge/able-baker-cane-dog-echo-fox');
    expect(text.match(/play-when\.com/g)).toHaveLength(1);
  });

  it('names the winner in a multiplayer marathon', () => {
    const text = generateShareText(
      makeState({
        players: [
          { id: 0, name: 'Ada', hand: [], hasWon: true, placementHistory: [] },
          { id: 1, name: 'Alan', hand: [], hasWon: false, placementHistory: [] },
        ],
        winners: [{ id: 0, name: 'Ada', hand: [], hasWon: true, placementHistory: [] }],
        roundNumber: 12,
      })
    );
    expect(text).toBe('When · Marathon · 2 players\nAda wins — 12 rounds\n\nplay-when.com');
  });

  it('never emits the emoji grid', () => {
    const text = generateShareText(
      makeState({ placementHistory: [true, false, true, true, false], bestStreak: 2 })
    );
    expect(text).not.toMatch(/🟩|🟥/);
    expect(text).not.toMatch(EMOJI);
  });
});
