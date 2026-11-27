import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { DeckPile, GameInfoCompact, deckCountLabel } from './PlayerInfo';
import { HistoricalEvent, PlacementResult, Player } from '../types';
import { getImageUrl } from '../utils/cloudinaryImage';

type InFlight = { placementInFlight: PlacementResult | null };

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

const placement = (success: boolean): PlacementResult => ({
  success,
  event: card(0),
  correctPosition: 0,
  attemptedPosition: 1,
});

const renderWithHand = (size: number, animation: Partial<InFlight> = {}) =>
  render(
    <GameInfoCompact
      currentPlayer={playerWithHand(size)}
      isMultiplayer={false}
      // Distinct from any hand size under test, and from each other: the hand count, the
      // timeline length and the streak all render as bare text in this widget.
      timelineLength={99}
      currentStreak={42}
      // Above the cap, so the pile reads "30+" and never collides with a number under test.
      deck={deckOf(77)}
      {...animation}
    />
  );

const fannedCards = () => screen.getAllByTestId('hand-card');

describe('GameInfoCompact hand counter', () => {
  it.each([1, 2, 3, 4, 5])('draws one card per card in hand (%i)', (size) => {
    renderWithHand(size);
    expect(fannedCards()).toHaveLength(size);
    expect(screen.getByText(String(size))).toBeInTheDocument();
  });

  it('caps the fan at five cards but still shows the true count', () => {
    renderWithHand(7);
    expect(fannedCards()).toHaveLength(5);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('draws no cards when the hand empties', () => {
    renderWithHand(0);
    // queryAllByTestId, not the getAllByTestId helper: that one throws on zero matches.
    expect(screen.queryAllByTestId('hand-card')).toHaveLength(0);
  });

  it('mutes the number when there is no card behind it', () => {
    renderWithHand(0);
    const zero = screen.getByText('0');
    expect(zero).toHaveClass('text-text-muted');
    expect(zero).not.toHaveClass('text-white');
  });

  it('keeps the number light while it sits on a card', () => {
    renderWithHand(3);
    const three = screen.getByText('3');
    expect(three).toHaveClass('text-white');
    expect(three).not.toHaveClass('text-text-muted');
  });

  it('keeps the whole fan inside the 24x24 viewBox', () => {
    renderWithHand(5);
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

describe('GameInfoCompact leads a miss', () => {
  it('drops a card as soon as the miss animation starts', () => {
    renderWithHand(5, { placementInFlight: placement(false) });
    expect(fannedCards()).toHaveLength(4);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('does not lead a correct placement', () => {
    renderWithHand(5, { placementInFlight: placement(true) });
    expect(fannedCards()).toHaveLength(5);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('stops leading once the animation settles and the hand has really shrunk', () => {
    renderWithHand(4, { placementInFlight: null });
    expect(fannedCards()).toHaveLength(4);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows the empty-hand state while the last card is still travelling', () => {
    renderWithHand(1, { placementInFlight: placement(false) });
    expect(screen.queryAllByTestId('hand-card')).toHaveLength(0);
    expect(screen.getByText('0')).toHaveClass('text-text-muted');
  });
});

describe('the deck pile', () => {
  const pile = () => screen.getByTestId('deck-pile');
  const art = () => screen.queryAllByTestId('deck-card');

  it('sits under the hand counter', () => {
    renderWithHand(5);
    expect(pile()).toHaveTextContent('30+');
    const counter = screen.getByText('cards left');
    expect(counter.compareDocumentPosition(pile()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Not part of the button that opens the stats.
    expect(screen.getByRole('button')).not.toContainElement(pile());
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
