import { HistoricalEvent, Category, Player, GameMode } from '../types';

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Seeded random number generator (mulberry32)
export function seededRandom(seed: number): () => number {
  return function () {
    // eslint-disable-next-line no-mixed-operators
    let t = (seed += 0x6d2b79f5);
    // eslint-disable-next-line no-mixed-operators
    t = Math.imul(t ^ (t >>> 15), t | 1);
    // eslint-disable-next-line no-mixed-operators
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    // eslint-disable-next-line no-mixed-operators
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert string to numeric seed
export function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Seeded Fisher-Yates shuffle for reproducible results
export function shuffleArraySeeded<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  const random = seededRandom(stringToSeed(seed));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sort events by year
export function sortByYear(events: HistoricalEvent[]): HistoricalEvent[] {
  return [...events].sort((a, b) => a.year - b.year);
}

// Check if placement is correct at the given index
export function isPlacementCorrect(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  insertionIndex: number
): boolean {
  const leftEvent = insertionIndex > 0 ? timeline[insertionIndex - 1] : null;
  const rightEvent = insertionIndex < timeline.length ? timeline[insertionIndex] : null;

  // Must be >= left neighbor's year
  if (leftEvent && event.year < leftEvent.year) {
    return false;
  }

  // Must be <= right neighbor's year
  if (rightEvent && event.year > rightEvent.year) {
    return false;
  }

  return true;
}

// Find the correct position for an event in the timeline
export function findCorrectPosition(timeline: HistoricalEvent[], event: HistoricalEvent): number {
  for (let i = 0; i <= timeline.length; i++) {
    const leftYear = i > 0 ? timeline[i - 1].year : -Infinity;
    const rightYear = i < timeline.length ? timeline[i].year : Infinity;

    if (event.year >= leftYear && event.year <= rightYear) {
      return i;
    }
  }
  return timeline.length;
}

// Insert event into timeline at the specified position
export function insertIntoTimeline(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  index: number
): HistoricalEvent[] {
  const newTimeline = [...timeline];
  newTimeline.splice(index, 0, event);
  return newTimeline;
}

// Format year for display
export function formatYear(year: number): string {
  if (year < 0) {
    const absYear = Math.abs(year);
    if (absYear >= 1000000000) {
      return `${(absYear / 1000000000).toFixed(1)} billion BCE`;
    }
    if (absYear >= 1000000) {
      return `${(absYear / 1000000).toFixed(0)} million BCE`;
    }
    if (absYear >= 1000) {
      return `${absYear.toLocaleString()} BCE`;
    }
    return `${absYear} BCE`;
  }
  return `${year}`;
}

// Category color mapping
const categoryColors: Record<Category, { bg: string; border: string }> = {
  conflict: { bg: 'bg-red-600', border: 'border-red-400' },
  disasters: { bg: 'bg-gray-700', border: 'border-gray-500' },
  exploration: { bg: 'bg-teal-600', border: 'border-teal-400' },
  cultural: { bg: 'bg-purple-600', border: 'border-purple-400' },
  infrastructure: { bg: 'bg-amber-600', border: 'border-amber-400' },
  diplomatic: { bg: 'bg-blue-600', border: 'border-blue-400' },
};

export function getCategoryColorClass(category: Category): string {
  return categoryColors[category]?.bg || 'bg-gray-500';
}

export function getCategoryDisplayName(category: Category): string {
  const names: Record<Category, string> = {
    conflict: 'Conflict',
    disasters: 'Disasters',
    exploration: 'Exploration',
    cultural: 'Cultural',
    infrastructure: 'Infrastructure',
    diplomatic: 'Diplomatic',
  };
  return names[category] || category;
}

// ==========================================
// Multiplayer utility functions
// ==========================================

// Draw a card from the deck
export function drawCard(deck: HistoricalEvent[]): {
  card: HistoricalEvent | null;
  newDeck: HistoricalEvent[];
} {
  if (deck.length === 0) {
    return { card: null, newDeck: [] };
  }
  const [card, ...newDeck] = deck;
  return { card, newDeck };
}

// Remove a card from a player's hand by event name
export function removeFromHand(hand: HistoricalEvent[], eventName: string): HistoricalEvent[] {
  return hand.filter((e) => e.name !== eventName);
}

// Add a card to a player's hand
export function addToHand(hand: HistoricalEvent[], event: HistoricalEvent): HistoricalEvent[] {
  return [...hand, event];
}

// Get next player index (wraps around)
export function getNextPlayerIndex(currentIndex: number, playerCount: number): number {
  return (currentIndex + 1) % playerCount;
}

// Get next active (non-eliminated) player index
export function getNextActivePlayerIndex(currentIndex: number, players: Player[]): number {
  const playerCount = players.length;
  let nextIndex = (currentIndex + 1) % playerCount;
  let checked = 0;

  // Find next non-eliminated player
  while (players[nextIndex].isEliminated && checked < playerCount) {
    nextIndex = (nextIndex + 1) % playerCount;
    checked++;
  }

  return nextIndex;
}

// Initialize players for game start
export function initializePlayers(
  playerCount: number,
  playerNames: string[],
  cardsPerHand: number,
  deck: HistoricalEvent[]
): { players: Player[]; remainingDeck: HistoricalEvent[] } {
  const players: Player[] = [];
  let deckIndex = 0;

  for (let i = 0; i < playerCount; i++) {
    const hand: HistoricalEvent[] = [];

    // Deal cards to this player
    for (let j = 0; j < cardsPerHand; j++) {
      if (deckIndex < deck.length) {
        hand.push(deck[deckIndex]);
        deckIndex++;
      }
    }

    players.push({
      id: i,
      name: playerNames[i] || `Player ${i + 1}`,
      hand,
      hasWon: false,
      isEliminated: false,
      placementHistory: [],
    });
  }

  return {
    players,
    remainingDeck: deck.slice(deckIndex),
  };
}

// Check if game should end (used for non-sudden-death modes)
export function shouldGameEnd(
  players: Player[],
  roundNumber: number,
  currentPlayerIndex: number,
  gameMode: GameMode
): boolean {
  const activePlayers = players.filter((p) => !p.isEliminated);

  // Sudden death mode - handled by processEndOfRound
  if (gameMode === 'suddenDeath') {
    // Single player: end immediately when eliminated (no rounds concept)
    if (players.length === 1) {
      return activePlayers.length === 0;
    }
    // Multiplayer: only check at round boundary (when we return to player 0)
    if (currentPlayerIndex !== 0) {
      return false;
    }
    // At round boundary: end if 1 or 0 players remain
    return activePlayers.length <= 1;
  }

  // Regular multiplayer: must complete at least 1 full round
  if (roundNumber < 2) {
    return false;
  }

  // Check if we have any winners
  const hasWinners = players.some((p) => p.hasWon);

  // Game ends when we return to player 0 after someone has won
  return hasWinners && currentPlayerIndex === 0;
}

// Result of end-of-round processing
export interface EndOfRoundResult {
  gameOver: boolean;
  updatedPlayers: Player[];
  winners: Player[];
  grantReprieve?: boolean;
}

// Process end of round for sudden death mode
// Simplified logic: check hand sizes at round end, grant reprieve if all failed together
export function processEndOfRound(
  players: Player[],
  gameMode: GameMode,
  activePlayersAtRoundStart: number
): EndOfRoundResult {
  // Only process for sudden death
  if (gameMode !== 'suddenDeath') {
    return { gameOver: false, updatedPlayers: players, winners: [] };
  }

  const updatedPlayers = players.map((p) => ({ ...p }));
  const activePlayers = updatedPlayers.filter((p) => !p.isEliminated);
  const playersWithEmptyHands = activePlayers.filter((p) => p.hand.length === 0);

  // Check if ALL active players have empty hands AND there were >1 active at round start
  const allEliminated =
    playersWithEmptyHands.length === activePlayers.length && activePlayers.length > 0;
  const reprieveEligible = activePlayersAtRoundStart > 1;

  if (allEliminated && reprieveEligible) {
    // REPRIEVE: All players failed together and we started with >1 - give each 1 card
    return { gameOver: false, updatedPlayers, winners: [], grantReprieve: true };
  }

  // Eliminate players with empty hands
  playersWithEmptyHands.forEach((p) => {
    p.isEliminated = true;
  });

  const remaining = updatedPlayers.filter((p) => !p.isEliminated);

  // No players remaining - game over with no winners
  if (remaining.length === 0) {
    return { gameOver: true, updatedPlayers, winners: [] };
  }

  // Last player standing wins - BUT only if someone was eliminated this round
  // (i.e., we started with more than 1 player)
  if (remaining.length === 1 && activePlayersAtRoundStart > 1) {
    remaining[0].hasWon = true;
    return { gameOver: true, updatedPlayers, winners: remaining };
  }

  // Game continues (either multiple players, or single player still has cards)
  return { gameOver: false, updatedPlayers, winners: [] };
}
