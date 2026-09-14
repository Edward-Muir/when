import React from 'react';
import { render, screen } from '@testing-library/react';
import { GameInfoCompact } from './PlayerInfo';
import { HistoricalEvent, Player } from '../types';

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

const renderWithHand = (size: number) =>
  render(
    <GameInfoCompact
      currentPlayer={playerWithHand(size)}
      isMultiplayer={false}
      // Distinct from any hand size under test, and from each other: the hand count, the
      // timeline length and the streak all render as bare text in this widget.
      timelineLength={99}
      currentStreak={42}
      gameMode="daily"
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
