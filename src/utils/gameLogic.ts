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
function seededRandom(seed: number): () => number {
  return function() {
    // eslint-disable-next-line no-mixed-operators
    let t = seed += 0x6D2B79F5;
    // eslint-disable-next-line no-mixed-operators
    t = Math.imul((t ^ (t >>> 15)), t | 1);
    // eslint-disable-next-line no-mixed-operators
    t ^= t + Math.imul((t ^ (t >>> 7)), t | 61);
    // eslint-disable-next-line no-mixed-operators
    return (((t ^ (t >>> 14))) >>> 0) / 4294967296;
  };
}

// Convert string to numeric seed
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
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
export function findCorrectPosition(
  timeline: HistoricalEvent[],
  event: HistoricalEvent
): number {
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
  'conflict': { bg: 'bg-red-600', border: 'border-red-400' },
  'disasters': { bg: 'bg-gray-700', border: 'border-gray-500' },
  'exploration': { bg: 'bg-teal-600', border: 'border-teal-400' },
  'cultural': { bg: 'bg-purple-600', border: 'border-purple-400' },
  'infrastructure': { bg: 'bg-amber-600', border: 'border-amber-400' },
  'diplomatic': { bg: 'bg-blue-600', border: 'border-blue-400' },
};

export function getCategoryColorClass(category: Category): string {
  return categoryColors[category]?.bg || 'bg-gray-500';
}

export function getCategoryDisplayName(category: Category): string {
  const names: Record<Category, string> = {
    'conflict': 'Conflict',
    'disasters': 'Disasters',
    'exploration': 'Exploration',
    'cultural': 'Cultural',
    'infrastructure': 'Infrastructure',
    'diplomatic': 'Diplomatic',
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
export function removeFromHand(
  hand: HistoricalEvent[],
  eventName: string
): HistoricalEvent[] {
  return hand.filter(e => e.name !== eventName);
}

// Add a card to a player's hand
export function addToHand(
  hand: HistoricalEvent[],
  event: HistoricalEvent
): HistoricalEvent[] {
  return [...hand, event];
}

// Get next player index (wraps around)
export function getNextPlayerIndex(
  currentIndex: number,
  playerCount: number
): number {
  return (currentIndex + 1) % playerCount;
}

// Get next active (non-eliminated) player index
export function getNextActivePlayerIndex(
  currentIndex: number,
  players: Player[]
): number {
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
    });
  }

  return {
    players,
    remainingDeck: deck.slice(deckIndex),
  };
}

// Check if game should end
export function shouldGameEnd(
  players: Player[],
  roundNumber: number,
  currentPlayerIndex: number,
  gameMode: GameMode
): boolean {
  // Count active (non-eliminated) players
  const activePlayers = players.filter(p => !p.isEliminated);

  // Sudden death: game ends when only one non-eliminated player remains
  if (gameMode === 'suddenDeath' && activePlayers.length <= 1) {
    return true;
  }

  // Regular multiplayer: must complete at least 1 full round
  if (roundNumber < 2) {
    return false;
  }

  // Check if we have any winners
  const hasWinners = players.some(p => p.hasWon);

  // Game ends when we return to player 0 after someone has won
  return hasWinners && currentPlayerIndex === 0;
}

// Count remaining active players (for sudden death)
export function countActivePlayers(players: Player[]): number {
  return players.filter(p => !p.isEliminated).length;
}

// Get the last remaining player (for sudden death winner)
export function getLastRemainingPlayer(players: Player[]): Player | null {
  const active = players.filter(p => !p.isEliminated);
  return active.length === 1 ? active[0] : null;
}
