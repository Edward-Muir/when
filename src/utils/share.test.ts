import {
  formatShareDate,
  generateChallengeInviteText,
  generateDailyShareText,
  generateShareText,
  shareDailyResult,
  shareResults,
  shareTiles,
} from './share';
import { renderShareFile, ShareCardSpec } from './shareImage';
import { FailedPlacement, HistoricalEvent, WhenGameState } from '../types';

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

  it('names the winner in a multiplayer game', () => {
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

/**
 * The card's art is the timeline as a collage. What has to hold is what the collage must
 * never do: show the cards in date order. The Daily deals everyone the same deck, so a grid in
 * timeline order is the day's answer, posted to friends who have not played. See the header of
 * `shareImage.ts`.
 */
describe('the collage a share shows', () => {
  const mockedRender = renderShareFile as jest.MockedFunction<typeof renderShareFile>;
  const card = (year: number): HistoricalEvent =>
    ({ name: `event-${year}`, friendly_name: `Event ${year}`, year }) as HistoricalEvent;

  // Fifteen cards in date order, as `timeline` is always kept.
  const timeline = Array.from({ length: 15 }, (_, i) => card(1000 + i * 50));
  const missed: FailedPlacement[] = [{ event: card(1025), attemptedPosition: 0, seq: 3 }];
  const names = (events: HistoricalEvent[] = []) => events.map((event) => event.name);
  const sorted = (events: HistoricalEvent[] = []) => [...names(events)].sort();
  const lastSpec = (): ShareCardSpec =>
    mockedRender.mock.calls[mockedRender.mock.calls.length - 1][0];

  beforeEach(() => {
    mockedRender.mockClear();
    // Take the share sheet's place, so nothing falls through to the clipboard.
    Object.assign(navigator, { share: jest.fn().mockResolvedValue(undefined) });
  });

  describe('shareTiles', () => {
    it('keeps every card and loses the order', () => {
      const tiles = shareTiles(timeline, '2026-11-11');
      expect(sorted(tiles)).toEqual(sorted(timeline));
      expect(names(tiles)).not.toEqual(names(timeline));
      // Not merely reversed either.
      expect(names(tiles)).not.toEqual(names(timeline).reverse());
    });

    it('is the same every time for one game, so every share route draws one image', () => {
      expect(names(shareTiles(timeline, '2026-11-11'))).toEqual(
        names(shareTiles(timeline, '2026-11-11'))
      );
    });

    it('changes with the game', () => {
      expect(names(shareTiles(timeline, '2026-11-11'))).not.toEqual(
        names(shareTiles(timeline, '2026-11-12'))
      );
    });

    it('does not reorder the timeline it was given', () => {
      const before = names(timeline);
      shareTiles(timeline, '2026-11-11');
      expect(names(timeline)).toEqual(before);
    });
  });

  it('gives the daily card the timeline, shuffled, without the missed cards', async () => {
    await shareResults(
      makeState({
        gameMode: 'daily',
        timeline,
        seedEventName: timeline[4].name,
        failedPlacements: missed,
        placementHistory: [...Array(14).fill(true), false],
        lastConfig: { mode: 'daily', dailySeed: '2026-11-11' } as WhenGameState['lastConfig'],
      })
    );

    const spec = lastSpec();
    expect(sorted(spec.tiles)).toEqual(sorted(timeline));
    expect(names(spec.tiles)).not.toEqual(names(timeline));
    expect(names(spec.tiles)).not.toContain(missed[0].event.name);
    // One painting per event counted: the daily's number includes the starting card.
    expect(spec.tiles).toHaveLength(Number(spec.score));
    expect(spec.event?.name).toBe(timeline[4].name);
  });

  it('gives a custom card the same treatment', async () => {
    await shareResults(
      makeState({
        timeline,
        seedEventName: timeline[0].name,
        failedPlacements: missed,
        placementHistory: Array(14).fill(true),
      })
    );

    const spec = lastSpec();
    expect(sorted(spec.tiles)).toEqual(sorted(timeline));
    expect(names(spec.tiles)).not.toEqual(names(timeline));
  });

  it("draws the home screen's share of the day from the same shuffle as game over", async () => {
    await shareDailyResult('2026-11-11', 'China', 14, { seedEvent: timeline[4], timeline });
    expect(names(lastSpec().tiles)).toEqual(names(shareTiles(timeline, '2026-11-11')));
  });

  it('falls back to the starting card alone when there is no stored board', async () => {
    await shareDailyResult('2026-11-11', 'China', 14, { seedEvent: timeline[4] });
    expect(lastSpec().tiles).toBeUndefined();
    expect(lastSpec().event?.name).toBe(timeline[4].name);
  });
});
