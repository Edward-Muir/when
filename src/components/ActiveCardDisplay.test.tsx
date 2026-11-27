import { act, fireEvent, render, screen } from '@testing-library/react';
import { useReducedMotion } from 'framer-motion';
import ActiveCardDisplay from './ActiveCardDisplay';
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
    expect(passButton()).toHaveAccessibleDescription(`${STARTING_PASSES} passes left`);
  });

  it('counts down as passes are spent and up as streaks earn them', () => {
    const { rerender } = setup({ currentPlayer: player([a, b, c], { passesUsed: 2 }) });
    expect(count()).toHaveTextContent('1');
    expect(passButton()).toHaveAccessibleDescription('1 pass left');

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
