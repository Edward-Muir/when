import { act, renderHook } from '@testing-library/react';
import {
  useOnboardingHints,
  pickHint,
  UseOnboardingHintsArgs,
  DRAG_NUDGE_MS,
  OUTCOME_HINT_MS,
  SWAP_HINT_MS,
  SWAP_COOLDOWN_MS,
} from './useOnboardingHints';
import { hasSeenHint, markHintSeen } from '../utils/playerStorage';
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
};

const setup = (overrides: Partial<UseOnboardingHintsArgs> = {}) =>
  renderHook((props: UseOnboardingHintsArgs) => useOnboardingHints(props), {
    initialProps: { ...base, ...overrides },
  });

/** Play one placement through: the result lands with the animation on, then it settles. */
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
  it('orders drag > wrong > correct > swap', () => {
    expect(pickHint(['swap', 'correct'])).toBe('correct');
    expect(pickHint(['correct', 'wrong', 'swap'])).toBe('wrong');
    expect(pickHint(['swap', 'drag'])).toBe('drag');
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

    place(view.rerender, false);
    expect(view.result.current.active).toBeNull();
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

describe('the swap hint', () => {
  beforeEach(() => {
    markHintSeen('drag');
  });

  it('waits until the drag, correct and wrong hints have all been seen', () => {
    markHintSeen('correct');
    const view = setup();
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS * 2));
    expect(view.result.current.active).toBeNull();

    markHintSeen('wrong');
    const { result: laterResult } = setup();
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS));
    expect(laterResult.current.active).toBe('swap');
    expect(hasSeenHint('swap')).toBe(true);
  });

  it('comes after four placements for a player who has never been wrong', () => {
    markHintSeen('correct');
    const view = setup({ timelineLength: 5 });
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS));
    expect(view.result.current.active).toBe('swap');
  });

  it('never shows with a single card in hand', () => {
    markHintSeen('correct');
    markHintSeen('wrong');
    const view = setup({ handLength: 1 });
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS * 2));
    expect(view.result.current.active).toBeNull();
  });

  it('waits for the previous strip to clear, then hides on its own or when the card is swapped', () => {
    markHintSeen('correct');
    const view = setup();
    place(view.rerender, false);
    expect(view.result.current.active).toBe('wrong');
    act(() => jest.advanceTimersByTime(OUTCOME_HINT_MS));
    expect(view.result.current.active).toBeNull();
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS));
    expect(view.result.current.active).toBe('swap');

    view.rerender({ ...base, lastPlacementResult: result(false), activeCardName: 'b' });
    expect(view.result.current.active).toBeNull();

    // Once seen it does not return, however long the hand stays swappable.
    act(() => jest.advanceTimersByTime(SWAP_HINT_MS * 2));
    expect(view.result.current.active).toBeNull();
  });

  it('shows once in the game where it fires, and not again after', () => {
    markHintSeen('correct');
    markHintSeen('wrong');
    const view = setup();
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS));
    expect(view.result.current.active).toBe('swap');
    act(() => jest.advanceTimersByTime(SWAP_HINT_MS));
    expect(view.result.current.active).toBeNull();

    const { result: nextResult } = setup();
    act(() => jest.advanceTimersByTime(SWAP_COOLDOWN_MS * 2));
    expect(nextResult.current.active).toBeNull();
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
