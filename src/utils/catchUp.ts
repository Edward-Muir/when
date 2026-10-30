import { HistoricalEvent } from '../types';
import { eventEnd, eventStart } from './gameLogic';
import { DifficultyIndex, RECOGNITION_RANK } from './difficultyScore';

/**
 * Catch-up draws: after a miss, the next replacement is the easiest card in a lookahead window
 * rather than the top of the deck.
 *
 * The deck is still composed up front (`deckBuilder.ts`) and a clean game deals it exactly as
 * before. What changes is that a player who is struggling gets a foothold back, the way
 * Candy Crush grants extra moves to a player stuck on a level: King's stated finding is that
 * easier content keeps players longer ("retention always wins"). It is silent by design; the
 * player is never told a card was eased.
 *
 * Struggle is a level from 0 to MAX_STRUGGLE, folded from the player's own placement history:
 * a miss raises it, and every correct placement draws at the current level and then lowers it.
 * The lookahead doubles per level (1, 8, 16, 32), so repeated misses dig deeper for a card that
 * fits. Each wider window contains the narrower one, and a miss draws nothing, so two misses
 * can never deal a harder card than one would.
 *
 * "Easiest" is measured on the player's actual board, not the card's label: a card that drops
 * into a wide gap is easy whatever its rating says. `boardRoom` is how far the card sits from
 * the nearest placement that would be a miss, in the CDF-rank `u` space the deck builder uses
 * (a distance there reads as "how many catalogue events lie between"). The recognition label
 * only breaks near-ties.
 *
 * Misses still draw nothing. The leaderboard's red-square cap (`lib/leaderboard/handSize.ts`)
 * and `themeOutcome.ts` both rely on that. The pick is a pure function of the deck, the board
 * and the history, with no RNG. It removes one card and keeps the rest in order, so the
 * remaining deck is always the composed deck minus every card seen. Daily resume rebuilds it
 * from exactly that (`dailyProgress.ts`).
 */

export const MAX_STRUGGLE = 3;

/** How much a card's recognition label can shave off its board room. Board room dominates. */
export const RECOGNITION_WEIGHT = 0.25;

/** Cards a draw may choose between at struggle level `struggle`. */
export function lookahead(struggle: number): number {
  return struggle <= 0 ? 1 : 4 * 2 ** Math.min(struggle, MAX_STRUGGLE);
}

/** The furthest a single draw can reach into the deck. */
export const CATCH_UP_REACH = lookahead(MAX_STRUGGLE);

/** The struggle level the next correct placement will draw at, given everything so far. */
export function struggleBefore(history: readonly boolean[]): number {
  let struggle = 0;
  for (const correct of history) {
    struggle = correct ? Math.max(0, struggle - 1) : Math.min(MAX_STRUGGLE, struggle + 1);
  }
  return struggle;
}

/**
 * The board's running bounds at every gap, the same ones `isPlacementCorrect` judges against:
 * `maxStart[i]` is the latest start left of gap `i`, `minEnd[i]` the earliest end at or right
 * of it. Both are non-decreasing in `i`. Worked out once per draw, not once per candidate.
 */
interface BoardBounds {
  maxStart: number[];
  minEnd: number[];
}

function boardBounds(timeline: HistoricalEvent[]): BoardBounds {
  const maxStart = [-Infinity];
  for (const event of timeline) {
    maxStart.push(Math.max(maxStart.at(-1) ?? -Infinity, eventStart(event)));
  }
  const minEnd = [Infinity];
  for (let i = timeline.length - 1; i >= 0; i--) {
    const event = timeline.at(i);
    minEnd.unshift(Math.min(minEnd[0], event ? eventEnd(event) : Infinity));
  }
  return { maxStart, minEnd };
}

function roomWithin(card: HistoricalEvent, bounds: BoardBounds, index: DifficultyIndex): number {
  const { maxStart, minEnd } = bounds;
  const gaps = maxStart.length;
  const start = eventStart(card);
  const end = eventEnd(card);

  // The valid gaps form one contiguous run: from the first whose right bound admits the
  // card's start to the last whose left bound admits its end.
  let first = 0;
  while (first < gaps - 1 && (minEnd.at(first) ?? Infinity) < start) first++;
  let last = gaps - 1;
  while (last > 0 && (maxStart.at(last) ?? -Infinity) > end) last--;

  // One gap further out on either side is the nearest miss. Measure how far the card's window
  // is from the bound that makes it one; a board edge has no miss beyond it.
  const margins: number[] = [];
  if (first > 0) {
    margins.push(index.uOfYear(start) - index.uOfYear(minEnd.at(first - 1) ?? start));
  }
  if (last < gaps - 1) {
    margins.push(index.uOfYear(maxStart.at(last + 1) ?? end) - index.uOfYear(end));
  }
  return margins.length === 0 ? 1 : Math.max(0, Math.min(...margins));
}

/** How far `card` sits from its nearest miss on `timeline`, in `u` space (0..1). */
export function boardRoom(
  card: HistoricalEvent,
  timeline: HistoricalEvent[],
  index: DifficultyIndex
): number {
  return roomWithin(card, boardBounds(timeline), index);
}

function easeWithin(card: HistoricalEvent, bounds: BoardBounds, index: DifficultyIndex): number {
  const recognition = RECOGNITION_RANK[card.difficulty] ?? 0.5;
  return roomWithin(card, bounds, index) * (1 - RECOGNITION_WEIGHT * recognition);
}

/** How easy `card` would be to place on `timeline`: board room, nudged by recognition. */
export function catchUpEase(
  card: HistoricalEvent,
  timeline: HistoricalEvent[],
  index: DifficultyIndex
): number {
  return easeWithin(card, boardBounds(timeline), index);
}

/** Which deck index a draw at `struggle` takes. 0 at struggle 0; ties go to the earlier card. */
export function catchUpDrawIndex(
  deck: HistoricalEvent[],
  timeline: HistoricalEvent[],
  struggle: number,
  index: DifficultyIndex
): number {
  const window = Math.min(lookahead(struggle), deck.length);
  if (window <= 1) return 0;

  const bounds = boardBounds(timeline);
  let best = 0;
  let bestEase = -Infinity;
  for (let i = 0; i < window; i++) {
    const card = deck.at(i);
    if (!card) break;
    const ease = easeWithin(card, bounds, index);
    if (ease > bestEase) {
      best = i;
      bestEase = ease;
    }
  }
  return best;
}

/**
 * Draw a replacement for a correct placement. `timeline` is the board with that placement
 * already on it, and `history` the player's placements before it.
 */
export function drawCatchUp(
  deck: HistoricalEvent[],
  timeline: HistoricalEvent[],
  history: readonly boolean[],
  index: DifficultyIndex
): { card: HistoricalEvent | undefined; newDeck: HistoricalEvent[] } {
  const pick = catchUpDrawIndex(deck, timeline, struggleBefore(history), index);
  const card = deck.at(pick);
  if (!card) return { card: undefined, newDeck: deck };
  return { card, newDeck: [...deck.slice(0, pick), ...deck.slice(pick + 1)] };
}
