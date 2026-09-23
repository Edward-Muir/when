import { HistoricalEvent, Category, Player } from '../types';

// Helper to swap array elements without triggering object injection lint rule
function swapElements<T>(arr: T[], i: number, j: number): void {
  const temp = arr.at(i);
  const jVal = arr.at(j);
  if (temp !== undefined && jVal !== undefined) {
    arr.splice(i, 1, jVal);
    arr.splice(j, 1, temp);
  }
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    swapElements(shuffled, i, j);
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
    swapElements(shuffled, i, j);
  }
  return shuffled;
}

// Sort events by year
export function sortByYear(events: HistoricalEvent[]): HistoricalEvent[] {
  return [...events].sort((a, b) => a.year - b.year);
}

/**
 * ============================================================================
 * Placement judging, and why it compares against running bounds
 * ============================================================================
 *
 * Most events are a point in time. Some are a window the record does not pin down — a
 * diffuse process, a floruit, a reign — and those carry an optional `year_end` upper bound
 * (`year` is always the lower bound; see the field's comment in types/index.ts). A card is
 * correct wherever its interval can be read as fitting.
 *
 * The obvious rule — compare the card's interval against its two immediate neighbours — is
 * **unsound**, and was rejected. Counterexample: seed P = 2000-3000; drop Q = 1000-2500 after
 * it (passes, 2500 >= 2000); now drop C = 1100-1200 after Q (passes, 1200 >= 1000). The board
 * reads 2000-3000 | 1000-2500 | 1100-1200 and no left-to-right reading of it is
 * non-decreasing. The game would have said "correct" for putting an 1100-1200 event after a
 * 2000-3000 one.
 *
 * So judge against the **accumulated** bounds instead: everything to the left has already
 * committed to starting no earlier than `leftBoundAt`, and everything to the right to ending
 * no later than `rightBoundAt`. That buys four things adjacency does not:
 *
 *   1. The board stays readable — after any accepted insertion there is still an assignment
 *      of one representative year per card that is non-decreasing left to right.
 *   2. A valid gap always exists, so `findCorrectPosition` can never fall through wrongly.
 *   3. The valid gaps form one contiguous band. Adjacency produces non-contiguous bands
 *      (gaps 0 and 2 valid, gap 1 not), which is indefensible to a player.
 *   4. On a point-only timeline it is byte-identical to the old neighbour rule —
 *      `leftBoundAt(i) === timeline[i-1].year` and `rightBoundAt(i) === timeline[i].year`.
 *      Nothing changes until `year_end` data lands.
 *
 * Both properties in (1) and (2) rest on `start <= end` for every event, which is why
 * `eventEnd` clamps rather than trusts: the JSON is hand-editable and fetched at runtime.
 */

/** Lower bound of an event's window. Always the stored `year`. */
export function eventStart(event: HistoricalEvent): number {
  return event.year;
}

/**
 * Upper bound of an event's window, clamped to `year` unless `year_end` is a strictly larger
 * number. A malformed record degrades to a point card instead of producing an unjudgeable
 * board.
 */
export function eventEnd(event: HistoricalEvent): number {
  const end = event.year_end;
  return typeof end === 'number' && Number.isFinite(end) && end > event.year ? end : event.year;
}

/** True when this event spans a window rather than a single year. */
export function isRangedEvent(event: HistoricalEvent): boolean {
  return eventEnd(event) > event.year;
}

/** The latest start committed to by everything left of gap `i`. */
function leftBoundAt(timeline: HistoricalEvent[], i: number): number {
  let bound = -Infinity;
  for (let k = 0; k < i; k++) {
    const e = timeline.at(k);
    if (e) bound = Math.max(bound, eventStart(e));
  }
  return bound;
}

/** The earliest end committed to by everything at or right of gap `i`. */
function rightBoundAt(timeline: HistoricalEvent[], i: number): number {
  let bound = Infinity;
  for (let k = i; k < timeline.length; k++) {
    const e = timeline.at(k);
    if (e) bound = Math.min(bound, eventEnd(e));
  }
  return bound;
}

// Check if placement is correct at the given index
export function isPlacementCorrect(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  insertionIndex: number
): boolean {
  return (
    eventEnd(event) >= leftBoundAt(timeline, insertionIndex) &&
    eventStart(event) <= rightBoundAt(timeline, insertionIndex)
  );
}

/**
 * The same judgement with every interval collapsed to its `year`, i.e. what the old rule
 * would have said. Used only to decide whether a success was won on a range.
 */
export function isPointPlacementCorrect(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  insertionIndex: number
): boolean {
  let left = -Infinity;
  for (let k = 0; k < insertionIndex; k++) {
    const e = timeline.at(k);
    if (e) left = Math.max(left, e.year);
  }
  let right = Infinity;
  for (let k = insertionIndex; k < timeline.length; k++) {
    const e = timeline.at(k);
    if (e) right = Math.min(right, e.year);
  }
  return event.year >= left && event.year <= right;
}

/**
 * Where a card comes to rest once it has been accepted.
 *
 * A card always settles at its **`year`** — the start of its window — so the board stays
 * sorted by `year` no matter which valid gap the player dropped it in. A windowed card
 * accepted a few slots away therefore slides back after landing, and that is deliberate: the
 * alternative leaves the board reading 1400 then 1350-1450, which looks like a bug, and makes
 * the in-game order disagree with the collection tab, which sorts by `year` independently.
 *
 * **The sorted slot is always a legal placement**, so this can never move a card somewhere the
 * rules would have rejected. Every card left of it has `year <= this year <= this end`, so the
 * left clause holds; every card at or right of it has `end >= year >= this year`, so the right
 * clause holds. That is what makes settling unconditional rather than a special case.
 *
 * The player's own index is preserved when it already sits in the sorted band, which is what
 * keeps equal-year ties on the side they chose instead of snapping them left.
 */
export function settledPosition(
  timeline: HistoricalEvent[],
  event: HistoricalEvent,
  attemptedIndex: number
): number {
  let lo = 0;
  while (lo < timeline.length && (timeline.at(lo)?.year ?? 0) < event.year) lo += 1;
  let hi = lo;
  while (hi < timeline.length && (timeline.at(hi)?.year ?? 0) === event.year) hi += 1;
  return Math.min(Math.max(attemptedIndex, lo), hi);
}

/**
 * The first gap the event can legally occupy — the left edge of its valid band.
 *
 * The trailing `return timeline.length` is unreachable while every event satisfies
 * `start <= end` and the board is readable (both guaranteed above). It is a guard against
 * corrupt data, not a fallback the game is expected to use.
 */
export function findCorrectPosition(timeline: HistoricalEvent[], event: HistoricalEvent): number {
  for (let i = 0; i <= timeline.length; i++) {
    if (isPlacementCorrect(timeline, event, i)) {
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

/**
 * A deep-time window, in one shared unit at whatever precision separates the two ends.
 *
 * Split out of `formatEventYearParts` because that function sits on ESLint's `complexity`
 * ceiling, which is an error rule here rather than a warning.
 *
 * The precision is the design. A fixed zero decimal places for millions renders
 * `first-stone-tools` (3.3 to 2.6 Ma) as a flat "3 million BCE", silently hiding a
 * 700,000-year window so the card reads as a point and the player is never shown why a
 * placement was close enough. Two decimals goes too far the other way and prints spurious
 * precision: `end-permian-mass-extinction` would read "251.94-251.88 million BCE" for what is,
 * at this scale, a point. One decimal separates the genuine windows and leaves the dating
 * error bars collapsed, which is the honest answer for that card and for
 * `lucy-australopithecus-lived` (a 30,000-year uncertainty at 3.2 Ma).
 */
function formatDeepTimeRange(
  start: number,
  end: number,
  magnitude: number
): { start: string; end: string | null } | null {
  const billions = magnitude >= 1000000000;
  const divisor = billions ? 1000000000 : 1000000;
  const unit = billions ? 'billion' : 'million';

  // A shared unit only works while both ends are representable in it. `giant-ground-sloths-roam`
  // runs -2000000 to -9000, and forcing that into millions prints "2-0 million BCE" — the
  // window's own end rounded away to zero. Below a tenth of the unit, hand it back and let the
  // caller fall through to plain comma-separated years, which stay correct at any magnitude.
  if (Math.min(Math.abs(start), Math.abs(end)) < divisor / 10) return null;

  const at = (value: number, digits: number) => (Math.abs(value) / divisor).toFixed(digits);

  // Whole numbers only where they actually say something on both ends. They fail two ways:
  // the ends can collide (`first-stone-tools`, 3.3 and 2.6 Ma both render "3") or one can
  // round away to nothing (`fire-mastery`, 1.79 and 0.4 Ma render "2" and "0"). Either way a
  // decimal place rescues it.
  const startWhole = at(start, 0);
  const endWhole = at(end, 0);
  const wholeWorks = !billions && startWhole !== endWhole && startWhole !== '0' && endWhole !== '0';

  const digits = wholeWorks ? 0 : 1;
  const a = at(start, digits);
  const b = at(end, digits);

  if (a === b) return { start: `${a} ${unit} BCE`, end: null };
  return { start: `${a}-`, end: `${b} ${unit} BCE` };
}

/**
 * A ranged event's label, split so the timeline can stack it over two lines in its fixed
 * 96px column while the popup renders it inline. `end` is null for a point event.
 *
 * `formatYear` is deliberately left alone — it is duplicated in scripts/themes/catalogue.js
 * and used by node scripts — so this composes on top of it rather than replacing it.
 *
 * Three cases the naive "formatYear each end" approach gets wrong:
 *   - Both BCE: the era suffix belongs once, on the end. -1200..-800 is "1200-800 BCE", not
 *     "1200 BCE - 800 BCE".
 *   - Straddling zero: -50..20 needs the app's only "CE", because "50 BCE - 20" is unreadable.
 *   - Deep time: formatYear rounds millions with toFixed(0), so formatting each end
 *     separately renders -3_300_000..-2_600_000 as "3-3 million BCE". Pick the unit once from
 *     the wider bound, format both mantissas against it, and collapse to a single string when
 *     they land on the same value.
 */
export function formatEventYearParts(event: Pick<HistoricalEvent, 'year' | 'year_end'>): {
  start: string;
  end: string | null;
} {
  const start = event.year;
  const rawEnd = event.year_end;
  const end =
    typeof rawEnd === 'number' && Number.isFinite(rawEnd) && rawEnd > start ? rawEnd : null;

  if (end === null) return { start: formatYear(start), end: null };

  const magnitude = Math.max(Math.abs(start), Math.abs(end));
  if (start < 0 && end < 0 && magnitude >= 1000000) {
    const deep = formatDeepTimeRange(start, end, magnitude);
    if (deep) return deep;
  }

  // Both BCE: larger magnitude first (which `year` already is), era suffix once. Strictly
  // negative, so a window ending at year 0 falls through to the straddle case below rather
  // than rendering "100-0" with the era lost.
  if (start < 0 && end < 0) {
    return { start: `${Math.abs(start).toLocaleString()}-`, end: formatYear(end) };
  }

  // Straddling zero: both eras have to be named.
  if (start < 0) {
    return { start: `${formatYear(start)} -`, end: `${end} CE` };
  }

  return { start: `${start}-`, end: `${end}` };
}

/** The same label on one line, for surfaces with room (the popup, the reports page). */
export function formatEventYear(event: Pick<HistoricalEvent, 'year' | 'year_end'>): string {
  const { start, end } = formatEventYearParts(event);
  if (end === null) return start;
  // `start` already carries its own trailing separator ("1200-" or "50 BCE -").
  return start.endsWith('-') && !start.endsWith(' -') ? `${start}${end}` : `${start} ${end}`;
}

export function getCategoryDisplayName(category: Category): string {
  // Categories are single lowercase words (e.g. "empires", "architecture") — capitalize
  // the first letter for display.
  return category.charAt(0).toUpperCase() + category.slice(1);
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

/**
 * The smallest deck a game can be dealt from: every hand, the face-up starting card, and two
 * replacement draws per player so the opening turns cannot run the deck dry.
 */
export function minDeckSize(playerCount: number, handSize: number): number {
  return playerCount * handSize + 1 + playerCount * 2;
}

// Add a card to a player's hand
export function addToHand(hand: HistoricalEvent[], event: HistoricalEvent): HistoricalEvent[] {
  return [...hand, event];
}

// Get next active (non-eliminated) player index
export function getNextActivePlayerIndex(currentIndex: number, players: Player[]): number {
  const playerCount = players.length;
  let nextIndex = (currentIndex + 1) % playerCount;
  let checked = 0;

  // Find next non-eliminated player
  let nextPlayer = players.at(nextIndex);
  while (nextPlayer?.isEliminated && checked < playerCount) {
    nextIndex = (nextIndex + 1) % playerCount;
    nextPlayer = players.at(nextIndex);
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
      const card = deck.at(deckIndex);
      if (card !== undefined) {
        hand.push(card);
        deckIndex++;
      }
    }

    players.push({
      id: i,
      name: playerNames.at(i) || `Player ${i + 1}`,
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

// Result of end-of-round processing
export interface EndOfRoundResult {
  gameOver: boolean;
  updatedPlayers: Player[];
  winners: Player[];
  grantReprieve?: boolean;
}

// Process end of round. Both game modes run sudden-death mechanics, so this is the only
// game-over check: inspect hand sizes at round end, granting a reprieve if a multiplayer
// field all emptied their hands on the same round.
export function processEndOfRound(
  players: Player[],
  activePlayersAtRoundStart: number
): EndOfRoundResult {
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
