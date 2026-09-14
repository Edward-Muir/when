import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameInfoCompact } from './PlayerInfo';
import { HistoricalEvent, PlacementResult, Player } from '../types';

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
});

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
