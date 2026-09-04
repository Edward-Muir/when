import { act, renderHook } from '@testing-library/react';
import {
  useOnboardingHints,
  pickHint,
  UseOnboardingHintsArgs,
  DRAG_NUDGE_MS,
  OUTCOME_HINT_MS,
  ACTION_HINT_MS,
} from './useOnboardingHints';
import { hasSeenHint, markHintSeen, resetHintsSeen } from '../utils/playerStorage';
import { HistoricalEvent, PlacementResult } from '../types';

const event: HistoricalEvent = {
  name: 'moon',
  friendly_name: 'Moon Landing',
  year: 1969,
  category: 'empires',
  description: '',
  difficulty: 'easy',
};

const result = (success: boolean): PlacementResult => ({
  success,
  event,
  correctPosition: 0,
  attemptedPosition: 0,
});

const base: UseOnboardingHintsArgs = {
  phase: 'playing',
  isAnimating: false,
  isDragging: false,
  lastPlacementResult: null,
  handLength: 5,
  deckLength: 20,
  timelineLength: 1,
  activeCardName: 'a',
  isMultiplayer: false,
  statsOpen: false,
  cardOpen: false,
};

const setup = (overrides: Partial<UseOnboardingHintsArgs> = {}) =>
  renderHook((props: UseOnboardingHintsArgs) => useOnboardingHints(props), {
    initialProps: { ...base, ...overrides },
  });

/**
 * Play one placement through: the result lands with the animation on, then it settles. A
 * different `PlacementResult` object every call, which is how the hook detects a new one.
 */
const place = (
  rerender: ReturnType<typeof setup>['rerender'],
  success: boolean,
  extra: Partial<UseOnboardingHintsArgs> = {}
) => {
  const r = result(success);
  rerender({ ...base, ...extra, lastPlacementResult: r, isAnimating: true });
  rerender({ ...base, ...extra, lastPlacementResult: r, isAnimating: false });
};

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('pickHint', () => {
  it('orders drag > wrong > correct > tapCard > stats > swap', () => {
    expect(pickHint(['swap', 'correct'])).toBe('correct');
    expect(pickHint(['correct', 'wrong', 'swap'])).toBe('wrong');
    expect(pickHint(['swap', 'drag'])).toBe('drag');
    expect(pickHint(['swap', 'stats', 'tapCard'])).toBe('tapCard');
    expect(pickHint(['swap', 'stats'])).toBe('stats');
    expect(pickHint([])).toBeNull();
  });
});

describe('the drag nudge', () => {
  it('appears after the idle time, with no rules modal first', () => {
    const view = setup();
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS - 1));
    expect(view.result.current.active).toBeNull();
    act(() => jest.advanceTimersByTime(1));
    expect(view.result.current.active).toBe('drag');
  });

  it('a drag clears the nudge and settles it for good, even if it never showed', () => {
    const view = setup();
    act(() => jest.advanceTimersByTime(1000));
    view.rerender({ ...base, isDragging: true });
    expect(view.result.current.active).toBeNull();
    expect(hasSeenHint('drag')).toBe(true);

    view.rerender({ ...base, isDragging: false });
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS * 2));
    expect(view.result.current.active).toBeNull();
  });

  it('tapping the nudge marks it, so it does not come straight back', () => {
    const view = setup();
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS));
    expect(view.result.current.active).toBe('drag');
    act(() => view.result.current.dismiss());
    expect(view.result.current.active).toBeNull();
    expect(hasSeenHint('drag')).toBe(true);
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS * 2));
    expect(view.result.current.active).toBeNull();
  });

  it('stays quiet before play starts and in multiplayer', () => {
    const { result: loadingResult } = setup({ phase: 'modeSelect' });
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS * 2));
    expect(loadingResult.current.active).toBeNull();

    const { result: multiResult } = setup({ isMultiplayer: true });
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS * 2));
    expect(multiResult.current.active).toBeNull();
  });
});

describe('the placement outcome hints', () => {
  beforeEach(() => {
    markHintSeen('drag');
  });

  it('shows the wrong-spot hint once the miss animation settles, once only', () => {
    const view = setup();
    place(view.rerender, false);
    expect(view.result.current.active).toBe('wrong');
    expect(hasSeenHint('wrong')).toBe(true);

    act(() => jest.advanceTimersByTime(OUTCOME_HINT_MS));
    expect(view.result.current.active).toBeNull();

    // The next miss moves down the ladder rather than repeating itself.
    place(view.rerender, false);
    expect(view.result.current.active).toBe('tapCard');
  });

  it('shows the correct hint only when a replacement was drawn', () => {
    const { result: noDeckResult, rerender: noDeckRerender } = setup({ deckLength: 0 });
    place(noDeckRerender, true, { deckLength: 0 });
    expect(noDeckResult.current.active).toBeNull();
    expect(hasSeenHint('correct')).toBe(false);

    const view = setup();
    place(view.rerender, true);
    expect(view.result.current.active).toBe('correct');
  });

  it('holds the hint back while the animation runs', () => {
    const view = setup();
    view.rerender({ ...base, lastPlacementResult: result(false), isAnimating: true });
    expect(view.result.current.active).toBeNull();
  });

  it('discards an outcome that ends the game, so it returns next game', () => {
    const view = setup();
    const r = result(false);
    view.rerender({ ...base, lastPlacementResult: r, isAnimating: true });
    view.rerender({ ...base, lastPlacementResult: r, isAnimating: false, phase: 'gameOver' });
    expect(view.result.current.active).toBeNull();
    expect(hasSeenHint('wrong')).toBe(false);
  });

  it('a new drag clears a showing outcome hint', () => {
    const view = setup();
    place(view.rerender, false);
    expect(view.result.current.active).toBe('wrong');
    view.rerender({ ...base, lastPlacementResult: result(false), isDragging: true });
    expect(view.result.current.active).toBeNull();
  });
});

describe('the ladder', () => {
  beforeEach(() => {
    markHintSeen('drag');
  });

  it('walks one rung per placement: wrong, correct, tapCard, stats, swap', () => {
    const view = setup({ timelineLength: 5 });
    const rung = (success: boolean) => {
      place(view.rerender, success, { timelineLength: 5 });
      return view.result.current.active;
    };

    expect(rung(false)).toBe('wrong');
    expect(rung(true)).toBe('correct');
    expect(rung(true)).toBe('tapCard');
    expect(rung(true)).toBe('stats');
    expect(rung(true)).toBe('swap');

    // Every rung spent. Let the last strip expire on its own, then the sixth placement has
    // nothing to say — and neither does the next game.
    act(() => jest.advanceTimersByTime(ACTION_HINT_MS));
    expect(view.result.current.active).toBeNull();
    expect(rung(true)).toBeNull();
    const { result: nextGame } = setup({ timelineLength: 5 });
    act(() => jest.advanceTimersByTime(ACTION_HINT_MS * 2));
    expect(nextGame.current.active).toBeNull();
  });

  it('skips the wrong rung for a player who never misses', () => {
    const view = setup({ timelineLength: 5 });
    const rung = () => {
      place(view.rerender, true, { timelineLength: 5 });
      return view.result.current.active;
    };

    expect(rung()).toBe('correct');
    expect(rung()).toBe('tapCard');
    expect(rung()).toBe('stats');
    // Never wrong, so this rung rode `timelineLength >= 4` instead.
    expect(rung()).toBe('swap');
  });

  it('spends exactly one rung per settle, however many are eligible', () => {
    markHintSeen('wrong');
    const view = setup({ timelineLength: 5 });
    place(view.rerender, true, { timelineLength: 5 });
    expect(view.result.current.active).toBe('correct');
    // Showing `correct` opens `tapCard`, which opens `stats`, which opens `swap`. A
    // re-entrant settle would burn all four in one render pass.
    expect(hasSeenHint('tapCard')).toBe(false);
    expect(hasSeenHint('stats')).toBe(false);
    expect(hasSeenHint('swap')).toBe(false);
  });

  it('replaces a strip that is still up rather than being suppressed by it', () => {
    const view = setup({ timelineLength: 5 });
    place(view.rerender, false, { timelineLength: 5 });
    expect(view.result.current.active).toBe('wrong');
    // No timer advance: the previous strip has not expired.
    place(view.rerender, true, { timelineLength: 5 });
    expect(view.result.current.active).toBe('correct');
  });
});

describe('the swap hint', () => {
  beforeEach(() => {
    ['drag', 'wrong', 'correct', 'tapCard', 'stats'].forEach((key) => markHintSeen(key as 'drag'));
  });

  it('appears at the settle with no timer, even though the draw changed the top card', () => {
    const view = setup();
    // The real sequence: `useWhenGame` swaps in the newly drawn card in the same commit that
    // ends the animation, so the top card has already changed by the time the hint shows.
    const r = result(true);
    view.rerender({ ...base, lastPlacementResult: r, isAnimating: true });
    view.rerender({ ...base, lastPlacementResult: r, isAnimating: false, activeCardName: 'b' });
    expect(view.result.current.active).toBe('swap');
    expect(hasSeenHint('swap')).toBe(true);
  });

  it('hides when the card is actually swapped, and does not return', () => {
    const view = setup();
    place(view.rerender, true);
    expect(view.result.current.active).toBe('swap');

    view.rerender({ ...base, lastPlacementResult: result(true), activeCardName: 'b' });
    expect(view.result.current.active).toBeNull();

    act(() => jest.advanceTimersByTime(ACTION_HINT_MS * 2));
    expect(view.result.current.active).toBeNull();
  });

  it('never shows with a single card in hand', () => {
    const view = setup({ handLength: 1 });
    place(view.rerender, true, { handLength: 1 });
    expect(view.result.current.active).toBeNull();
    expect(hasSeenHint('swap')).toBe(false);
  });

  it('waits for a miss or four placements', () => {
    localStorage.clear();
    ['drag', 'correct', 'tapCard', 'stats'].forEach((key) => markHintSeen(key as 'drag'));
    const { result: earlyResult, rerender: earlyRerender } = setup({ timelineLength: 2 });
    place(earlyRerender, true, { timelineLength: 2 });
    expect(earlyResult.current.active).toBeNull();

    const { result: laterResult, rerender: laterRerender } = setup({ timelineLength: 5 });
    place(laterRerender, true, { timelineLength: 5 });
    expect(laterResult.current.active).toBe('swap');
  });
});

describe('hiding when the hint has been answered', () => {
  beforeEach(() => {
    ['drag', 'wrong', 'correct'].forEach((key) => markHintSeen(key as 'drag'));
  });

  it('hides the tap-a-card hint when a description popup opens', () => {
    const view = setup();
    place(view.rerender, true);
    expect(view.result.current.active).toBe('tapCard');
    view.rerender({ ...base, lastPlacementResult: result(true), cardOpen: true });
    expect(view.result.current.active).toBeNull();
  });

  it('hides the stats hint when the stats popup opens', () => {
    markHintSeen('tapCard');
    const view = setup();
    place(view.rerender, true);
    expect(view.result.current.active).toBe('stats');
    view.rerender({ ...base, lastPlacementResult: result(true), statsOpen: true });
    expect(view.result.current.active).toBeNull();
  });

  it('does not spend a hint on a settle where its target is already open', () => {
    const view = setup({ cardOpen: true });
    place(view.rerender, true, { cardOpen: true });
    expect(view.result.current.active).toBeNull();
    expect(hasSeenHint('tapCard')).toBe(false);
  });
});

describe('resetting the hints', () => {
  it('re-arms the ladder without a remount, so the menu works mid-game', () => {
    ['drag', 'wrong', 'correct', 'tapCard', 'stats', 'swap'].forEach((key) =>
      markHintSeen(key as 'drag')
    );
    const view = setup();
    place(view.rerender, false);
    expect(view.result.current.active).toBeNull();

    act(() => resetHintsSeen());
    place(view.rerender, false);
    expect(view.result.current.active).toBe('wrong');
  });

  it('clears whatever strip is showing', () => {
    const view = setup();
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS));
    expect(view.result.current.active).toBe('drag');
    act(() => resetHintsSeen());
    expect(view.result.current.active).toBeNull();
  });
});

describe('leaving play', () => {
  it('clears whatever is showing when the game ends', () => {
    const view = setup();
    act(() => jest.advanceTimersByTime(DRAG_NUDGE_MS));
    expect(view.result.current.active).toBe('drag');
    view.rerender({ ...base, phase: 'gameOver' });
    expect(view.result.current.active).toBeNull();
  });
});
