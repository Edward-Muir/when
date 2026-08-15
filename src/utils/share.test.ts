import {
  formatShareDate,
  generateChallengeInviteText,
  generateDailyShareText,
  generateShareText,
} from './share';
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
  it('is identity, question and link, with no stats, when the card travels with it', () => {
    const { withCard } = generateDailyShareText({ date: '2026-08-15', correctCount: 10 });
    expect(withCard).toBe('When? #49 · Can you make a longer timeline?\n\nplay-when.com/daily');
  });

  it('keeps the stat line on the form that ships without the card', () => {
    const { textOnly } = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 10,
      leaderboardRank: 47,
    });
    expect(textOnly).toBe(
      'When? #49 · Can you make a longer timeline?\nTimeline of 11 · #47 globally\n\nplay-when.com/daily'
    );
  });

  it('never repeats in the caption what the card already shows', () => {
    // The card carries the score, the rank and the puzzle identity. The caption repeating
    // all three is the redundancy this format was rewritten to remove.
    const { withCard } = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 10,
      leaderboardRank: 47,
    });
    expect(withCard).not.toContain('Timeline of');
    expect(withCard).not.toContain('globally');
  });

  it('identifies the puzzle by number, never by date', () => {
    const { withCard, textOnly } = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 10,
    });
    for (const text of [withCard, textOnly]) {
      expect(text).toContain('#49');
      expect(text).not.toContain('Aug 15');
      expect(text).not.toContain('Aug');
    }
  });

  it('falls back to a numberless headline for a pre-epoch or junk date', () => {
    expect(generateDailyShareText({ date: 'tomorrow', correctCount: 3 }).withCard).toBe(
      'When? · Can you make a longer timeline?\n\nplay-when.com/daily'
    );
    expect(generateDailyShareText({ date: '2020-01-01', correctCount: 3 }).withCard).not.toContain(
      '#'
    );
  });

  it('keeps the question mark the rest of the app brands with', () => {
    const { withCard } = generateDailyShareText({ date: '2026-08-15', correctCount: 4 });
    expect(withCard.startsWith('When?')).toBe(true);
  });

  it('counts the seed card in the timeline length', () => {
    expect(generateDailyShareText({ date: '2026-08-15', correctCount: 0 }).textOnly).toContain(
      'Timeline of 1'
    );
  });

  it('spends its one emoji on the top spot and nowhere else', () => {
    const top = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 20,
      leaderboardRank: 1,
    }).textOnly;
    expect(top).toContain('#1 globally 👑');
    expect([...top].filter((c) => EMOJI.test(c))).toHaveLength(1);

    const runnerUp = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 20,
      leaderboardRank: 2,
    }).textOnly;
    expect(runnerUp).not.toMatch(EMOJI);
  });

  it('carries no red/green grid', () => {
    const { withCard, textOnly } = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 10,
    });
    expect(withCard).not.toMatch(/🟩|🟥/);
    expect(textOnly).not.toMatch(/🟩|🟥/);
  });

  it('ends with exactly one URL, so link previews are unambiguous', () => {
    const { withCard, textOnly } = generateDailyShareText({
      date: '2026-08-15',
      correctCount: 10,
      leaderboardRank: 3,
    });
    for (const text of [withCard, textOnly]) {
      expect(text.match(/play-when\.com/g)).toHaveLength(1);
      expect(text.split('\n').pop()).toBe('play-when.com/daily');
    }
  });
});

describe('generateShareText', () => {
  it('routes daily games through the daily format', () => {
    const { withCard, textOnly } = generateShareText(
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
    expect(withCard).toBe('When? #49 · Can you make a longer timeline?\n\nplay-when.com/daily');
    expect(textOnly).toContain('Timeline of 4');
  });

  it('names no mode for a custom game, and drops the seed bonus', () => {
    const { withCard, textOnly } = generateShareText(
      makeState({ placementHistory: [true, true, true, false], bestStreak: 3 })
    );
    expect(withCard).toBe('When? · Can you make a longer timeline?\n\nplay-when.com');
    expect(textOnly).toBe(
      'When? · Can you make a longer timeline?\nTimeline of 3\n\nplay-when.com'
    );
  });

  it('never labels a game "Marathon" or "Sudden Death"', () => {
    const custom = generateShareText(makeState({ placementHistory: [true, true] }));
    const daily = generateShareText(makeState({ gameMode: 'daily', placementHistory: [true] }));
    for (const { withCard, textOnly } of [custom, daily]) {
      expect(withCard).not.toMatch(/marathon|sudden death/i);
      expect(textOnly).not.toMatch(/marathon|sudden death/i);
    }
  });

  it('never mentions a best run', () => {
    const { textOnly } = generateShareText(
      makeState({ placementHistory: [true, true, true], bestStreak: 7 })
    );
    expect(textOnly).not.toMatch(/best run/i);
    expect(textOnly).not.toContain('7');
  });

  it('swaps in the challenge link when the game came from a code, and says what it does', () => {
    const { withCard, textOnly } = generateShareText(
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
    for (const text of [withCard, textOnly]) {
      expect(text.split('\n').pop()).toBe('play-when.com/challenge/able-baker-cane-dog-echo-fox');
      expect(text.match(/play-when\.com/g)).toHaveLength(1);
      expect(text).toContain('Same cards, same order.');
    }
  });

  it('names the winner in a multiplayer marathon', () => {
    const { withCard, textOnly } = generateShareText(
      makeState({
        players: [
          { id: 0, name: 'Ada', hand: [], hasWon: true, placementHistory: [] },
          { id: 1, name: 'Alan', hand: [], hasWon: false, placementHistory: [] },
        ],
        winners: [{ id: 0, name: 'Ada', hand: [], hasWon: true, placementHistory: [] }],
        roundNumber: 12,
      })
    );
    expect(withCard).toBe('When? · 2 players · Make the longest timeline.\n\nplay-when.com');
    expect(textOnly).toBe(
      'When? · 2 players · Make the longest timeline.\nAda wins · 12 rounds\n\nplay-when.com'
    );
  });

  it('never emits the emoji grid', () => {
    const { withCard, textOnly } = generateShareText(
      makeState({ placementHistory: [true, false, true, true, false], bestStreak: 2 })
    );
    for (const text of [withCard, textOnly]) {
      expect(text).not.toMatch(/🟩|🟥/);
      expect(text).not.toMatch(EMOJI);
    }
  });
});

describe('generateChallengeInviteText', () => {
  it('describes rather than challenges, because nothing has been played yet', () => {
    expect(generateChallengeInviteText('play-when.com/challenge/able-baker-cane')).toBe(
      'When? · Make the longest timeline.\nSame cards, same order.\n\nplay-when.com/challenge/able-baker-cane'
    );
  });
});

describe('the line every share carries', () => {
  const CTA = 'Can you make a longer timeline?';
  const DESCRIPTOR = 'Make the longest timeline.';

  const multiplayer = () =>
    generateShareText(
      makeState({
        players: [
          { id: 0, name: 'Ada', hand: [], hasWon: true, placementHistory: [] },
          { id: 1, name: 'Alan', hand: [], hasWon: false, placementHistory: [] },
        ],
        winners: [],
        roundNumber: 3,
      })
    );

  it('asks the question wherever a result exists', () => {
    const withResult = [
      generateDailyShareText({ date: '2026-08-15', correctCount: 10, leaderboardRank: 47 }),
      generateShareText(makeState({ placementHistory: [true, true] })),
    ];
    for (const { withCard, textOnly } of withResult) {
      expect(withCard).toContain(CTA);
      expect(textOnly).toContain(CTA);
    }
  });

  it('describes instead wherever there is no result to beat', () => {
    // Nothing has been played on the challenge invite; multiplayer has a result, but it
    // belongs to whoever won, so "a longer timeline" than whose is ambiguous.
    expect(generateChallengeInviteText('play-when.com/challenge/x')).toContain(DESCRIPTOR);
    expect(generateChallengeInviteText('play-when.com/challenge/x')).not.toContain(CTA);
    expect(multiplayer().withCard).toContain(DESCRIPTOR);
    expect(multiplayer().withCard).not.toContain(CTA);
  });

  it('never uses an em dash', () => {
    // A standing instruction, enforced rather than trusted to stay applied. The separator
    // is the middle dot the app and the card already use.
    const strings = [
      generateDailyShareText({ date: '2026-08-15', correctCount: 10, leaderboardRank: 47 }),
      generateDailyShareText({ date: 'tomorrow', correctCount: 1 }),
      generateShareText(makeState({ placementHistory: [true, true] })),
      multiplayer(),
      generateShareText(
        makeState({
          placementHistory: [true],
          lastConfig: {
            mode: 'suddenDeath',
            totalTurns: 5,
            selectedDifficulties: [],
            selectedCategories: [],
            selectedEras: [],
            challengeCode: 'able-baker-cane',
          },
        })
      ),
    ].flatMap(({ withCard, textOnly }) => [withCard, textOnly]);
    strings.push(generateChallengeInviteText('play-when.com/challenge/x'));

    for (const text of strings) {
      expect(text).not.toContain('—');
    }
  });
});
