import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import PlayerInfo, { DeckPile, GameInfoCompact, deckCountLabel } from './PlayerInfo';
import { HistoricalEvent, Player } from '../types';
import { getImageUrl } from '../utils/cloudinaryImage';

// jsdom has no matchMedia; framer's useReducedMotion reads it.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
});

const card = (i: number): HistoricalEvent => ({
  name: `event-${i}`,
  friendly_name: `Event ${i}`,
  year: 1900 + i,
  category: 'science',
  description: 'A thing that happened',
  difficulty: 'medium',
  image_url: `https://res.cloudinary.com/dscb8inz1/image/upload/v1/events/event-${i}.png`,
});

const deckOf = (size: number): HistoricalEvent[] => Array.from({ length: size }, (_, i) => card(i));

const playerWithHand = (size: number): Player => ({
  id: 0,
  name: 'Player 1',
  hand: Array.from({ length: size }, (_, i) => card(i)),
  hasWon: false,
  placementHistory: [],
});

const renderPanel = (props: Partial<React.ComponentProps<typeof GameInfoCompact>> = {}) =>
  render(
    <GameInfoCompact
      currentPlayer={playerWithHand(5)}
      isMultiplayer={false}
      // Distinct from each other and from the pile's count, which is above its cap and so
      // reads "30+": all three render as bare text in this panel.
      timelineLength={99}
      currentStreak={42}
      deck={deckOf(77)}
      {...props}
    />
  );

describe('the hand bar counters', () => {
  it('show the timeline length and the streak on one line', () => {
    renderPanel();
    const row = screen.getByRole('button');
    expect(within(row).getByTestId('timeline-counter')).toHaveTextContent('99');
    expect(within(row).getByTestId('streak-counter')).toHaveTextContent('42');
    expect(row).toHaveClass('flex', 'items-center');
    expect(row).not.toHaveClass('flex-col');
  });

  // It was hidden at zero once; a counter that comes and goes moves the row about.
  it('show the streak from the start, at zero', () => {
    renderPanel({ currentStreak: 0 });
    expect(screen.getByTestId('streak-counter')).toHaveTextContent('0');
    expect(screen.getByTestId('timeline-counter')).toBeInTheDocument();
  });

  it('show the streak as it grows', () => {
    renderPanel({ currentStreak: 1 });
    expect(screen.getByTestId('streak-counter')).toHaveTextContent('1');
  });

  it('no longer show the hand: no fan icon, no count and no "cards left"', () => {
    renderPanel();
    expect(screen.queryAllByTestId('hand-card')).toHaveLength(0);
    expect(screen.queryByText('cards left')).toBeNull();
    expect(screen.queryByText('5')).toBeNull();
  });

  it('open the stats, and say what they hold to a screen reader', () => {
    const onStatsClick = jest.fn();
    renderPanel({ onStatsClick });
    fireEvent.click(
      screen.getByRole('button', { name: 'Game stats: 99 in the timeline, streak 42' })
    );
    expect(onStatsClick).toHaveBeenCalledTimes(1);
  });

  it('glow for the stats hint', () => {
    renderPanel({ nudge: 'stats' });
    expect(screen.getByRole('button')).toHaveClass('animate-hint-glow', 'bg-border');
  });

  it('give way to the player’s name in multiplayer', () => {
    renderPanel({ isMultiplayer: true });
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByTestId('deck-pile')).toBeInTheDocument();
  });
});

// The fan is still drawn by the players list (the default export), one small icon a player.
describe('the hand fan icon', () => {
  const renderList = (size: number) =>
    render(
      <PlayerInfo
        players={[playerWithHand(size)]}
        currentPlayerIndex={0}
        turnNumber={1}
        roundNumber={1}
      />
    );
  const fannedCards = () => screen.getAllByTestId('hand-card');

  it.each([1, 2, 3, 4, 5])('draws one card per card in hand (%i)', (size) => {
    renderList(size);
    expect(fannedCards()).toHaveLength(size);
    expect(screen.getByText(String(size))).toBeInTheDocument();
  });

  it('caps the fan at five cards but still shows the true count', () => {
    renderList(7);
    expect(fannedCards()).toHaveLength(5);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('draws no cards when the hand empties', () => {
    renderList(0);
    // queryAllByTestId, not the getAllByTestId helper: that one throws on zero matches.
    expect(screen.queryAllByTestId('hand-card')).toHaveLength(0);
  });

  it('keeps the whole fan inside the 24x24 viewBox', () => {
    renderList(5);
    const halfStroke = 0.75;

    fannedCards().forEach((rect) => {
      const x = Number(rect.getAttribute('x'));
      const angle =
        (Math.abs(Number(/rotate\((-?[\d.]+)/.exec(rect.getAttribute('transform')!)![1])) *
          Math.PI) /
        180;
      // Half-extents of a 12x16 rect rotated about its own centre.
      const halfWidth = 6 * Math.cos(angle) + 8 * Math.sin(angle) + halfStroke;
      const halfHeight = 8 * Math.cos(angle) + 6 * Math.sin(angle) + halfStroke;

      expect(x + 6 - halfWidth).toBeGreaterThanOrEqual(0);
      expect(x + 6 + halfWidth).toBeLessThanOrEqual(24);
      expect(12 - halfHeight).toBeGreaterThanOrEqual(0);
      expect(12 + halfHeight).toBeLessThanOrEqual(24);
    });
  });
});

describe('the deck pile', () => {
  const pile = () => screen.getByTestId('deck-pile');
  const art = () => screen.queryAllByTestId('deck-card');

  it('sits under the counters', () => {
    renderPanel();
    expect(pile()).toHaveTextContent('30+');
    const counter = screen.getByTestId('timeline-counter');
    expect(counter.compareDocumentPosition(pile()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Not part of the button that opens the stats.
    expect(screen.getByRole('button')).not.toContainElement(pile());
  });

  it('is captioned "deck", under the pile and outside it', () => {
    renderPanel();
    const caption = screen.getByText('deck');
    expect(pile()).not.toContainElement(caption);
    expect(pile().compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The pile already names itself to a screen reader.
    expect(caption).toHaveAttribute('aria-hidden', 'true');
  });

  it.each([
    [1, '1', '1 card in the deck'],
    [24, '24', '24 cards in the deck'],
    [30, '30', '30 cards in the deck'],
    [31, '30+', 'More than 30 cards in the deck'],
    [3000, '30+', 'More than 30 cards in the deck'],
  ])('shows %i cards as "%s"', (count, text, label) => {
    render(<DeckPile deck={deckOf(count)} />);
    expect(pile()).toHaveTextContent(text);
    expect(screen.getByRole('img', { name: label })).toBe(pile());
  });

  it('shows the paintings of the next three cards, the next one on top', () => {
    render(<DeckPile deck={deckOf(24)} />);
    const images = within(pile()).getAllByRole('presentation');
    expect(images.map((img) => img.getAttribute('src'))).toEqual(
      [0, 1, 2].map((i) => getImageUrl(card(i).image_url, 'thumbnail'))
    );
    const layers = art().map((tile) => Number(tile.style.zIndex));
    expect(layers).toEqual([...layers].sort((a, b) => b - a));
    // Each card under the top one steps down and to the left.
    const px = (value: string) => parseFloat(value);
    const tops = art().map((tile) => px(tile.style.top));
    const lefts = art().map((tile) => px(tile.style.left));
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    expect(lefts).toEqual([...lefts].sort((a, b) => b - a));
    expect(new Set(tops).size).toBe(3);
  });

  it('shows only as many cards as the deck still has', () => {
    render(<DeckPile deck={deckOf(2)} />);
    expect(art()).toHaveLength(2);
  });

  it('leaves a blank card where a painting is missing or fails to load', () => {
    render(<DeckPile deck={[{ ...card(0), image_url: undefined }, card(1)]} />);
    expect(art()).toHaveLength(2);
    const [image] = within(pile()).getAllByRole('presentation');
    fireEvent.error(image);
    expect(within(pile()).queryAllByRole('presentation')).toHaveLength(0);
    expect(art()).toHaveLength(2);
  });

  it('keeps the count on a corner badge, off the art', () => {
    render(<DeckPile deck={deckOf(24)} />);
    const badge = screen.getByText('24');
    expect(badge).toHaveClass('absolute', '-right-2', '-top-1.5');
    // The app's accent, like the pass count: never a colour from outside the theme.
    expect(badge).toHaveClass('bg-accent', 'text-white');
    art().forEach((tile) => expect(tile).not.toContainElement(badge));
  });

  it('shows an empty outline and a muted zero when the deck runs dry', () => {
    render(<DeckPile deck={[]} />);
    expect(pile()).toHaveTextContent('0');
    expect(screen.getByRole('img', { name: 'The deck is empty' })).toBe(pile());
    expect(screen.getByText('0')).toHaveClass('text-text-muted');
    expect(screen.getByTestId('deck-outline')).toBeInTheDocument();
    expect(art()).toHaveLength(0);
  });

  it('never shows a negative count', () => {
    expect(deckCountLabel(-3)).toBe('0');
  });
});
