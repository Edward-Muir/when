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
    // The badge takes the new count when the ring's gold reaches it, about half a second on.
    act(() => jest.advanceTimersByTime(600));
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

  it('takes its size, like swap, from the one variable the stylesheet sets', () => {
    setup();
    // 48px, or 44px on a narrow screen (index.css). A fixed size here would undo both.
    [passButton(), swapButton()].forEach((button) =>
      expect(button).toHaveClass('w-[var(--hand-button)]', 'h-[var(--hand-button)]')
    );
  });

  it('is named "Pass", and swap "Cycle", each under its own button', () => {
    setup();
    const passName = screen.getByText('Pass');
    const cycleName = screen.getByText('Cycle');
    const after = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    // Pass button, its name, the Cycle button, its name: in that order down the column.
    expect(after(passButton(), passName)).toBe(true);
    expect(after(passName, swapButton())).toBe(true);
    expect(after(swapButton(), cycleName)).toBe(true);
    // The buttons carry their own labels for a screen reader.
    [passName, cycleName].forEach((name) => expect(name).toHaveAttribute('aria-hidden', 'true'));
    expect(passButton()).not.toContainElement(passName);
  });

  it('sits above swap', () => {
    setup();
    const position = passButton().compareDocumentPosition(swapButton());
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('the hand count', () => {
  const handCount = () => screen.getByTestId('hand-count');

  it('shows the cards in hand, in the gold of the deck and pass counts', () => {
    setup();
    expect(handCount()).toHaveTextContent('3');
    expect(handCount()).toHaveClass('bg-accent', 'text-white');
    expect(screen.getByText('3 cards in hand')).toHaveClass('sr-only');
  });

  it('shows the true count for a hand wider than the fan', () => {
    const hand = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name, i) => card(name, 1000 + i));
    setup({ currentPlayer: player(hand) });
    expect(handCount()).toHaveTextContent('7');
  });

  it('follows the hand down, and is muted when it is empty', () => {
    const { rerender } = setup();
    rerender({ currentPlayer: player([a]) });
    expect(handCount()).toHaveTextContent('1');
    expect(screen.getByText('1 card in hand')).toBeInTheDocument();
    rerender({ currentPlayer: player([]) });
    expect(handCount()).toHaveTextContent('0');
    expect(handCount()).toHaveClass('bg-border', 'text-text-muted');
  });
});

describe('the top card while a placement animates', () => {
  // The drag handle is the element carrying dnd-kit's attributes; its parent is what hides.
  const handle = () => screen.getByRole('button', { name: /^a$/ });

  it('is shown, when the hand given is already the one the turn settles into', () => {
    setup({ isAnimating: true });
    // eslint-disable-next-line testing-library/no-node-access -- the wrapper is what hides
    expect(handle().parentElement).not.toHaveClass('invisible');
  });

  it('is hidden when it is the card just played', () => {
    setup({ isAnimating: true, topHidden: true });
    // eslint-disable-next-line testing-library/no-node-access -- the wrapper is what hides
    expect(handle().parentElement).toHaveClass('invisible');
  });

  it('ignores a tap until the turn commits, then answers one', () => {
    const onCardTap = jest.fn();
    const { rerender } = setup({ isAnimating: true, onCardTap });
    fireEvent.click(handle());
    expect(onCardTap).not.toHaveBeenCalled();

    rerender({ isAnimating: false, onCardTap });
    fireEvent.click(handle());
    expect(onCardTap).toHaveBeenCalledTimes(1);
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

  describe('when the third in a row earns a pass', () => {
    const earn = () => {
      const view = setup({ currentPlayer: withHistory([true, true]) });
      view.rerender({ currentPlayer: withHistory([true, true, true]) });
      return view;
    };
    const gathering = () => screen.queryAllByTestId('pass-ring-gather');
    const earned = () => screen.queryByTestId('pass-earned');

    it('first shows the ring complete, the count not yet raised', () => {
      earn();
      expect(lit()).toHaveLength(3);
      expect(count()).toHaveTextContent(String(STARTING_PASSES));
      expect(gathering()).toHaveLength(0);
    });

    it('then draws the gold off both sides of the ring towards the badge', () => {
      earn();
      act(() => jest.advanceTimersByTime(200));
      expect(lit()).toHaveLength(0);
      expect(gathering()).toHaveLength(2);
      expect(count()).toHaveTextContent(String(STARTING_PASSES));
      expect(earned()).toBeNull();
    });

    it('then raises the count as the gold lands, with a +1', () => {
      earn();
      act(() => jest.advanceTimersByTime(520));
      expect(gathering()).toHaveLength(0);
      expect(count()).toHaveTextContent(String(STARTING_PASSES + 1));
      expect(earned()).toHaveTextContent('+1');
    });

    it('and leaves an empty ring and the new count behind', () => {
      earn();
      act(() => jest.advanceTimersByTime(1500));
      expect(lit()).toHaveLength(0);
      expect(earned()).toBeNull();
      expect(count()).toHaveTextContent(String(STARTING_PASSES + 1));
    });

    it('lets the pass be spent at once, whatever the badge is still showing', () => {
      const { onPass } = earn();
      expect(passButton()).toBeEnabled();
      fireEvent.click(passButton());
      expect(onPass).toHaveBeenCalledTimes(1);
    });

    it('tells a screen reader the true count from the first frame', () => {
      earn();
      expect(passButton()).toHaveAccessibleDescription(
        `${STARTING_PASSES + 1} passes left, 3 more in a row for another`
      );
    });

    it('simply changes the count under reduced motion', () => {
      setReducedMotion(true);
      earn();
      expect(lit()).toHaveLength(0);
      expect(count()).toHaveTextContent(String(STARTING_PASSES + 1));
      expect(gathering()).toHaveLength(0);
      expect(earned()).toBeNull();
    });
  });

  it('is not full on a game that opens with a pass already earned', () => {
    // A resumed daily: the run was made before this screen mounted.
    setup({ currentPlayer: withHistory([true, true, true, true]) });
    expect(lit()).toHaveLength(1);
    expect(count()).toHaveTextContent(String(STARTING_PASSES + 1));
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
