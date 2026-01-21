import { renderHook, act } from '@testing-library/react';
import { useWhenGame } from './useWhenGame';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import { ALL_ERAS } from '../utils/eras';

import * as gameLogic from '../utils/gameLogic';

// Mock only loadAllEvents (the network call), keep filter functions real
jest.mock('../utils/eventLoader', () => {
  const actual = jest.requireActual('../utils/eventLoader');
  return {
    ...actual,
    loadAllEvents: jest.fn(),
  };
});

// Mock playerStorage to prevent auto-starting daily mode in tests
jest.mock('../utils/playerStorage', () => ({
  saveDailyResult: jest.fn(),
  saveTimelineHighScore: jest.fn(),
  getTimelineHighScore: jest.fn().mockReturnValue(0),
  getTodayResult: jest.fn().mockReturnValue(null),
  hasPlayedToday: jest.fn().mockReturnValue(true), // Pretend daily was already played
  hasPlayedMode: jest.fn().mockReturnValue(true),
  markModePlayed: jest.fn(),
}));

const mockedLoadAllEvents = loadAllEvents as jest.MockedFunction<typeof loadAllEvents>;

// Helper to create test events with specific years
function createTestEvent(name: string, year: number): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    category: 'cultural', // Must match selectedCategories in startGame
    description: 'Test event',
    difficulty: 'medium', // Must match selectedDifficulties in startGame
  };
}

// Generate events with sequential years (10-year gaps)
function createTestEventDeck(count: number, startYear = 1800): HistoricalEvent[] {
  return Array.from({ length: count }, (_, i) =>
    createTestEvent(`event-${startYear + i * 10}`, startYear + i * 10)
  );
}

describe('useWhenGame - Sudden Death Mode', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Default: 20 events, years 1800-1990 (10-year gaps)
    mockedLoadAllEvents.mockResolvedValue(createTestEventDeck(20));
    // Mock shuffleArray to return events in order (no shuffle) for predictable tests
    jest.spyOn(gameLogic, 'shuffleArray').mockImplementation(<T>(arr: T[]) => [...arr]);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // Helper to initialize hook and wait for events to load
  async function setupGame() {
    const { result } = renderHook(() => useWhenGame());

    // Wait for loadAllEvents to resolve
    await act(async () => {
      await Promise.resolve();
    });

    return result;
  }

  // Helper to start a sudden death game
  function startSuddenDeathGame(
    result: ReturnType<typeof renderHook<ReturnType<typeof useWhenGame>, unknown>>['result'],
    options: {
      playerCount?: number;
      playerNames?: string[];
      suddenDeathHandSize?: number;
    } = {}
  ) {
    const { playerCount = 1, playerNames = [], suddenDeathHandSize = 3 } = options;

    act(() => {
      result.current.startGame({
        mode: 'suddenDeath',
        totalTurns: 10,
        selectedDifficulties: ['easy', 'medium', 'hard'],
        selectedCategories: ['cultural'],
        selectedEras: [...ALL_ERAS],
        playerCount,
        playerNames,
        suddenDeathHandSize,
      });
    });

    // Complete the transition to playing phase
    act(() => {
      result.current.completeTransition();
    });
  }

  // Helper to place a card and run timers
  function placeCardAndWait(
    result: ReturnType<typeof renderHook<ReturnType<typeof useWhenGame>, unknown>>['result'],
    insertionIndex: number
  ) {
    act(() => {
      result.current.placeCard(insertionIndex);
    });
    act(() => {
      jest.runAllTimers();
    });
    // Dismiss popup to advance turn (needed for multiplayer)
    act(() => {
      result.current.dismissPopup();
    });
  }

  describe('Core Behavioral Tests', () => {
    it('correct placement draws a new card (hand size stays the same)', async () => {
      const result = await setupGame();
      startSuddenDeathGame(result, { suddenDeathHandSize: 3 });

      const initialHandSize = result.current.state.players[0].hand.length;
      expect(initialHandSize).toBe(3);

      // Timeline starts with 1 event (year 1800)
      // Player's first card will be from deck (year 1810)
      // Place at index 1 (after timeline event) - should be correct
      placeCardAndWait(result, 1);

      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(3); // Still 3 cards
    });

    it('incorrect placement does not draw a card (hand shrinks by 1)', async () => {
      const result = await setupGame();
      startSuddenDeathGame(result, { suddenDeathHandSize: 3 });

      expect(result.current.state.players[0].hand.length).toBe(3);

      // Place at index 0 (before timeline event year 1800)
      // Player's card is year 1810, so this is wrong
      placeCardAndWait(result, 0);

      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(2); // Shrunk to 2
    });
  });

  describe('Single Player Scenarios', () => {
    it('single player survives round - game continues with smaller hand', async () => {
      const result = await setupGame();
      startSuddenDeathGame(result, { suddenDeathHandSize: 3 });

      // Wrong placement - hand shrinks to 2
      placeCardAndWait(result, 0);

      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(2);
      expect(result.current.state.players[0].isEliminated).toBeFalsy();
    });

    it('single player loses when hand empties - game over with no winners', async () => {
      const result = await setupGame();
      startSuddenDeathGame(result, { suddenDeathHandSize: 1 });

      expect(result.current.state.players[0].hand.length).toBe(1);

      // Wrong placement - hand empties
      placeCardAndWait(result, 0);

      expect(result.current.state.phase).toBe('gameOver');
      expect(result.current.state.players[0].hand.length).toBe(0);
      expect(result.current.state.players[0].isEliminated).toBe(true);
      expect(result.current.state.winners).toHaveLength(0);
    });

    it('single player loses after 3 incorrect placements with hand size 3', async () => {
      const result = await setupGame();
      startSuddenDeathGame(result, { suddenDeathHandSize: 3 });

      expect(result.current.state.players[0].hand.length).toBe(3);
      expect(result.current.state.phase).toBe('playing');

      // First wrong placement - hand shrinks to 2
      placeCardAndWait(result, 0);
      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(2);

      // Second wrong placement - hand shrinks to 1
      placeCardAndWait(result, 0);
      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(1);

      // Third wrong placement - hand empties, game over
      placeCardAndWait(result, 0);
      expect(result.current.state.phase).toBe('gameOver');
      expect(result.current.state.players[0].hand.length).toBe(0);
      expect(result.current.state.players[0].isEliminated).toBe(true);
      expect(result.current.state.winners).toHaveLength(0);
    });
  });

  describe('Two Player Scenarios', () => {
    it('one player eliminated - other wins', async () => {
      // Create specific deck for controlled test
      // Timeline: 1800
      // P1 hand: 1810 (can place correctly at index 1)
      // P2 hand: 1820 (will place incorrectly)
      const testEvents = [
        createTestEvent('timeline-start', 1800),
        createTestEvent('p1-card', 1810),
        createTestEvent('p2-card', 1820),
        // Extra cards for deck
        ...createTestEventDeck(10, 1900),
      ];
      mockedLoadAllEvents.mockResolvedValue(testEvents);

      const result = await setupGame();
      startSuddenDeathGame(result, {
        playerCount: 2,
        playerNames: ['Player 1', 'Player 2'],
        suddenDeathHandSize: 1,
      });

      // P1's turn - correct placement
      expect(result.current.state.currentPlayerIndex).toBe(0);
      placeCardAndWait(result, 1); // After 1800, correct for 1810

      // P2's turn - wrong placement (hand will empty)
      expect(result.current.state.currentPlayerIndex).toBe(1);
      placeCardAndWait(result, 0); // Before 1800, wrong for 1820

      // P2 eliminated, P1 wins
      expect(result.current.state.phase).toBe('gameOver');
      expect(result.current.state.players[1].isEliminated).toBe(true);
      expect(result.current.state.winners).toHaveLength(1);
      expect(result.current.state.winners[0].name).toBe('Player 1');
    });

    it('reprieve granted when both players fail together', async () => {
      const testEvents = [
        createTestEvent('timeline-start', 1800),
        createTestEvent('p1-card', 1810),
        createTestEvent('p2-card', 1820),
        // Deck cards for reprieve
        createTestEvent('reprieve-1', 1830),
        createTestEvent('reprieve-2', 1840),
        ...createTestEventDeck(10, 1900),
      ];
      mockedLoadAllEvents.mockResolvedValue(testEvents);

      const result = await setupGame();
      startSuddenDeathGame(result, {
        playerCount: 2,
        playerNames: ['Player 1', 'Player 2'],
        suddenDeathHandSize: 1,
      });

      // P1's turn - wrong placement
      expect(result.current.state.currentPlayerIndex).toBe(0);
      placeCardAndWait(result, 0); // Wrong

      // P2's turn - wrong placement
      expect(result.current.state.currentPlayerIndex).toBe(1);
      placeCardAndWait(result, 0); // Wrong

      // Both should get reprieve (1 card each)
      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].isEliminated).toBeFalsy();
      expect(result.current.state.players[1].isEliminated).toBeFalsy();
      expect(result.current.state.players[0].hand.length).toBe(1);
      expect(result.current.state.players[1].hand.length).toBe(1);
    });
  });

  describe('Three Player Scenarios', () => {
    it('two players eliminated - remaining player wins', async () => {
      const testEvents = [
        createTestEvent('timeline-start', 1800),
        createTestEvent('p1-card', 1810),
        createTestEvent('p2-card', 1820),
        createTestEvent('p3-card', 1830),
        // Extra deck cards
        ...createTestEventDeck(10, 1900),
      ];
      mockedLoadAllEvents.mockResolvedValue(testEvents);

      const result = await setupGame();
      startSuddenDeathGame(result, {
        playerCount: 3,
        playerNames: ['Player 1', 'Player 2', 'Player 3'],
        suddenDeathHandSize: 1,
      });

      // P1's turn - wrong placement (will be eliminated)
      expect(result.current.state.currentPlayerIndex).toBe(0);
      placeCardAndWait(result, 0);

      // P2's turn - correct placement (survives)
      expect(result.current.state.currentPlayerIndex).toBe(1);
      placeCardAndWait(result, 1);

      // P3's turn - wrong placement (will be eliminated)
      expect(result.current.state.currentPlayerIndex).toBe(2);
      placeCardAndWait(result, 0);

      // P1 and P3 eliminated, P2 wins
      expect(result.current.state.phase).toBe('gameOver');
      expect(result.current.state.players[0].isEliminated).toBe(true);
      expect(result.current.state.players[1].isEliminated).toBeFalsy();
      expect(result.current.state.players[2].isEliminated).toBe(true);
      expect(result.current.state.winners).toHaveLength(1);
      expect(result.current.state.winners[0].name).toBe('Player 2');
    });
  });

  describe('Edge Cases', () => {
    it('multiple players survive with cards - game continues', async () => {
      const testEvents = [
        createTestEvent('timeline-start', 1800),
        createTestEvent('p1-card', 1810),
        createTestEvent('p2-card', 1820),
        // Extra deck cards
        ...createTestEventDeck(10, 1900),
      ];
      mockedLoadAllEvents.mockResolvedValue(testEvents);

      const result = await setupGame();
      startSuddenDeathGame(result, {
        playerCount: 2,
        playerNames: ['Player 1', 'Player 2'],
        suddenDeathHandSize: 2,
      });

      // P1's turn - correct placement
      placeCardAndWait(result, 1);

      // P2's turn - correct placement
      placeCardAndWait(result, 2);

      // Both still have cards, game continues
      expect(result.current.state.phase).toBe('playing');
      expect(result.current.state.players[0].hand.length).toBe(2);
      expect(result.current.state.players[1].hand.length).toBe(2);
    });
  });
});
