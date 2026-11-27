import { act, fireEvent, render, screen } from '@testing-library/react';
import { useReducedMotion } from 'framer-motion';
import ActiveCardDisplay, { deckOrigin } from './ActiveCardDisplay';
import { HistoricalEvent, Player } from '../types';
import { STARTING_PASSES } from '../utils/gameLogic';

// framer-motion reads the reduced-motion preference once per page and caches it, so a
// matchMedia stub cannot switch it between tests. The hook itself is stubbed instead.
jest.mock('framer-motion', () => ({
  ...jest.requireActual('framer-motion'),
  useReducedMotion: jest.fn(),
}));
const setReducedMotion = (reduce: boolean) =>
  (useReducedMotion as jest.Mock).mockReturnValue(reduce);

const card = (name: string, year: number): HistoricalEvent => ({
  name,
  friendly_name: name,
  year,
  category: 'empires',
  description: '',
  difficulty: 'easy',
});

const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((name, i) => card(name, 1000 + i));

const player = (hand: HistoricalEvent[], extra: Partial<Player> = {}): Player => ({
  id: 0,
  name: 'Player 1',
  hand,
  hasWon: false,
  placementHistory: [],
  ...extra,
});

type Props = React.ComponentProps<typeof ActiveCardDisplay>;

function setup(overrides: Partial<Props> = {}) {
  const onPass = jest.fn();
  const onCycleHand = jest.fn();
  const props: Props = {
    activeCard: a,
    currentPlayer: player([a, b, c]),
    isAnimating: false,
    onCycleHand,
    onPass,
    deckLength: 10,
    onCardTap: jest.fn(),
    ...overrides,
  };
  const view = render(<ActiveCardDisplay {...props} />);
  const rerender = (next: Partial<Props>) =>
    view.rerender(<ActiveCardDisplay {...props} {...next} />);
  return { onPass, onCycleHand, rerender };
}

const passButton = () => screen.getByRole('button', { name: 'Pass this card' });
const swapButton = () => screen.getByRole('button', { name: 'Cycle to next card' });
const count = () => screen.getByTestId('pass-count');

beforeEach(() => {
  setReducedMotion(false);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the pass button', () => {
  it('shows the passes left, and says so to a screen reader', () => {
    setup();
    expect(count()).toHaveTextContent(String(STARTING_PASSES));
    expect(passButton()).toHaveAccessibleDescription(
      `${STARTING_PASSES} passes left, 3 more in a row for another`
    );
  });

  it('counts down as passes are spent and up as streaks earn them', () => {
    const { rerender } = setup({ currentPlayer: player([a, b, c], { passesUsed: 2 }) });
    expect(count()).toHaveTextContent('1');
    expect(passButton()).toHaveAccessibleDescription('1 pass left, 3 more in a row for another');

    rerender({
      currentPlayer: player([a, b, c], { passesUsed: 2, placementHistory: [true, true, true] }),
    });
    expect(count()).toHaveTextContent('2');
  });

  it('passes on a tap', () => {
    const { onPass } = setup();
    fireEvent.click(passButton());
    expect(onPass).toHaveBeenCalledTimes(1);
  });

  it('spends one pass on a double tap, and takes another after a moment', () => {
    const { onPass } = setup();
    fireEvent.click(passButton());
    fireEvent.click(passButton());
    expect(onPass).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(500));
    fireEvent.click(passButton());
    expect(onPass).toHaveBeenCalledTimes(2);
  });

  it('is disabled with no pass left, the count still showing', () => {
    const { onPass } = setup({
      currentPlayer: player([a, b, c], { passesUsed: STARTING_PASSES }),
    });
    expect(passButton()).toBeDisabled();
    expect(count()).toHaveTextContent('0');
    expect(count()).toHaveClass('text-text-muted');
    fireEvent.click(passButton());
    expect(onPass).not.toHaveBeenCalled();
  });

  it('is disabled when the deck has nothing to draw', () => {
    setup({ deckLength: 0 });
    expect(passButton()).toBeDisabled();
  });

  it('is disabled while a placement animates, like swap', () => {
    setup({ isAnimating: true });
    expect(passButton()).toBeDisabled();
    expect(swapButton()).toBeDisabled();
  });

  it('works with one card in hand, where swap cannot', () => {
    setup({ currentPlayer: player([a]) });
    expect(passButton()).toBeEnabled();
    expect(swapButton()).toBeDisabled();
  });

  it('glows gold for its hint, and only for its own', () => {
    const { rerender } = setup({ nudge: 'pass' });
    expect(passButton()).toHaveClass('animate-hint-glow', 'bg-accent');
    expect(swapButton()).not.toHaveClass('animate-hint-glow');

    rerender({ nudge: 'swap' });
    expect(passButton()).not.toHaveClass('animate-hint-glow');
    expect(swapButton()).toHaveClass('animate-hint-glow', 'bg-accent');
  });

  it('sits above swap', () => {
    setup();
    const position = passButton().compareDocumentPosition(swapButton());
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('the pass ring', () => {
  const ring = () => screen.getByTestId('pass-ring');
  const lit = () =>
    screen.getAllByTestId('pass-ring-segment').filter((s) => s.getAttribute('data-lit') === 'true');
  const withHistory = (placementHistory: boolean[], extra: Partial<Player> = {}) =>
    player([a, b, c], { placementHistory, ...extra });

  it('has three segments, none lit before a correct placement', () => {
    setup();
    expect(screen.getAllByTestId('pass-ring-segment')).toHaveLength(3);
    expect(lit()).toHaveLength(0);
  });

  it('lights one segment for each correct placement in a row', () => {
    const { rerender } = setup({ currentPlayer: withHistory([true]) });
    expect(lit()).toHaveLength(1);
    expect(passButton()).toHaveAccessibleDescription(
      `${STARTING_PASSES} passes left, 2 more in a row for another`
    );

    rerender({ currentPlayer: withHistory([true, true]) });
    expect(lit()).toHaveLength(2);
  });

  it('empties on a miss', () => {
    const { rerender } = setup({ currentPlayer: withHistory([true, true]) });
    rerender({ currentPlayer: withHistory([true, true, false]) });
    expect(lit()).toHaveLength(0);
  });

  it('shows full for a beat when the third in a row earns a pass, then clears', () => {
    const { rerender } = setup({ currentPlayer: withHistory([true, true]) });
    rerender({ currentPlayer: withHistory([true, true, true]) });
    expect(lit()).toHaveLength(3);
    expect(count()).toHaveTextContent(String(STARTING_PASSES + 1));

    act(() => jest.advanceTimersByTime(500));
    expect(lit()).toHaveLength(0);
  });

  it('clears at once under reduced motion', () => {
    setReducedMotion(true);
    const { rerender } = setup({ currentPlayer: withHistory([true, true]) });
    rerender({ currentPlayer: withHistory([true, true, true]) });
    expect(lit()).toHaveLength(0);
  });

  it('is not full on a game that opens with a pass already earned', () => {
    // A resumed daily: the run was made before this screen mounted.
    setup({ currentPlayer: withHistory([true, true, true, true]) });
    expect(lit()).toHaveLength(1);
  });

  it('still shows with no pass left, outside the dimmed button', () => {
    setup({ currentPlayer: withHistory([true], { passesUsed: STARTING_PASSES }) });
    expect(passButton()).toBeDisabled();
    expect(passButton()).not.toContainElement(ring());
    expect(lit()).toHaveLength(1);
  });

  it('steps aside while the hint has the button filled gold', () => {
    setup({ nudge: 'pass' });
    expect(screen.queryByTestId('pass-ring')).toBeNull();
  });
});

describe('the passed card', () => {
  it('is shown leaving, as a copy that nothing can touch', () => {
    const { rerender } = setup();
    expect(screen.queryByTestId('passed-card')).toBeNull();

    fireEvent.click(passButton());
    rerender({ activeCard: d, currentPlayer: player([d, b, c], { passesUsed: 1 }) });

    const thrown = screen.getByTestId('passed-card');
    expect(thrown).toHaveTextContent('a');
    expect(thrown).toHaveClass('pointer-events-none');
    expect(thrown).toHaveAttribute('aria-hidden', 'true');
  });

  it('is not shown at all under reduced motion', () => {
    setReducedMotion(true);
    const { onPass } = setup();
    fireEvent.click(passButton());
    expect(onPass).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('passed-card')).toBeNull();
  });
});

describe('where a drawn card is dealt from', () => {
  // The bar at 402px wide: the pile's 40px top card in the left panel, the 184px hand card
  // in the middle.
  const pile = { left: 38, top: 930, width: 40, height: 40 };
  const hand = { left: 109, top: 808, width: 184, height: 184 };

  it('is the pile, centre to centre, at the pile’s size', () => {
    expect(deckOrigin(pile, hand)).toEqual({ x: 58 - 201, y: 950 - 900, scale: 40 / 184 });
  });

  it('is nowhere when the pile or the hand cannot be measured', () => {
    expect(deckOrigin(null, hand)).toBeNull();
    expect(deckOrigin(pile, null)).toBeNull();
    expect(deckOrigin({ ...pile, width: 0 }, hand)).toBeNull();
    expect(deckOrigin(pile, { ...hand, width: 0 })).toBeNull();
  });
});
