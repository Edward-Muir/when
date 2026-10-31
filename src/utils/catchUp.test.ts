import { HistoricalEvent, Difficulty } from '../types';
import {
  CATCH_UP_REACH,
  boardRoom,
  catchUpDrawIndex,
  catchUpEase,
  drawCatchUp,
  lookahead,
  struggleBefore,
} from './catchUp';
import { buildDifficultyIndex } from './difficultyScore';
import { seededRandom } from './gameLogic';

function ev(
  name: string,
  year: number,
  yearEnd?: number,
  difficulty: Difficulty = 'medium'
): HistoricalEvent {
  return {
    name,
    friendly_name: name,
    year,
    ...(yearEnd === undefined ? {} : { year_end: yearEnd }),
    category: 'empires',
    description: 'Test event',
    difficulty,
  };
}

// One event every ten years from 1000 to 2000, so `u` is (year - 1000) / 1000.
const CATALOGUE = Array.from({ length: 101 }, (_, i) => ev(`cat${i}`, 1000 + i * 10));
const INDEX = buildDifficultyIndex(CATALOGUE);

const names = (events: HistoricalEvent[]) => events.map((e) => e.name);

describe('struggle', () => {
  it('doubles the lookahead per level, from the top card alone', () => {
    expect([0, 1, 2, 3].map(lookahead)).toEqual([1, 8, 16, 32]);
    expect(CATCH_UP_REACH).toBe(32);
  });

  it('rises with each miss, caps at 3, and the next hit draws at it before it falls', () => {
    expect(struggleBefore([])).toBe(0);
    expect(struggleBefore([false])).toBe(1);
    expect(struggleBefore([false, false])).toBe(2);
    expect(struggleBefore([false, false, false, false])).toBe(3);
    expect(struggleBefore([false, true])).toBe(0);
    expect(struggleBefore([false, false, true])).toBe(1);
    expect(struggleBefore([true, true, false])).toBe(1);
  });
});

describe('boardRoom', () => {
  const board = [ev('l', 1200), ev('r', 1800)];

  it('is the clearance to the nearer neighbour', () => {
    expect(boardRoom(ev('mid', 1500), board, INDEX)).toBeCloseTo(0.3);
    expect(boardRoom(ev('wedged', 1250), board, INDEX)).toBeCloseTo(0.05);
  });

  it('measures only the one side a board edge leaves', () => {
    expect(boardRoom(ev('late', 1900), board, INDEX)).toBeCloseTo(0.1);
    expect(boardRoom(ev('early', 1100), board, INDEX)).toBeCloseTo(0.1);
  });

  it('credits a card’s window with the gaps it opens', () => {
    const wider = [ev('a', 1200), ev('b', 1300), ev('c', 1500)];
    // A point at 1290 is wedged against 1300; reaching to 1350 makes the 1300 card no threat.
    expect(boardRoom(ev('point', 1290), wider, INDEX)).toBeCloseTo(0.01);
    expect(boardRoom(ev('ranged', 1290, 1350), wider, INDEX)).toBeCloseTo(0.09);
  });

  it('measures against a ranged neighbour’s far end', () => {
    const point = [ev('a', 1200), ev('b', 1500)];
    const ranged = [ev('a', 1200, 1450), ev('b', 1500)];
    // Before a is a miss only once the card is past a's window: 1460 clears a point a by
    // 0.26 but a window ending at 1450 by 0.01, so b's 0.04 decides the first case only.
    expect(boardRoom(ev('x', 1460), point, INDEX)).toBeCloseTo(0.04);
    expect(boardRoom(ev('x', 1460), ranged, INDEX)).toBeCloseTo(0.01);
  });
});

describe('catchUpDrawIndex', () => {
  const board = [ev('l', 1200), ev('r', 1800)];
  const tight = (i: number) => ev(`tight${i}`, 1805);
  const roomy = ev('roomy', 1500);

  it('takes the top card at struggle 0', () => {
    expect(catchUpDrawIndex([tight(0), roomy], board, 0, INDEX)).toBe(0);
  });

  it('takes the card with the most room inside the lookahead', () => {
    const deck = [tight(0), tight(1), roomy, tight(2)];
    expect(catchUpDrawIndex(deck, board, 1, INDEX)).toBe(2);
  });

  it('cannot see past the lookahead', () => {
    const deck = [...Array.from({ length: 8 }, (_, i) => tight(i)), roomy];
    expect(catchUpDrawIndex(deck, board, 1, INDEX)).toBe(0);
    expect(catchUpDrawIndex(deck, board, 2, INDEX)).toBe(8);
  });

  it('breaks a tie on room by recognition, then by deck order', () => {
    const hard = ev('hard', 1500, undefined, 'hard');
    const easy = ev('easy', 1500, undefined, 'easy');
    const easyToo = ev('easyToo', 1500, undefined, 'easy');
    expect(catchUpDrawIndex([hard, easy, easyToo], board, 1, INDEX)).toBe(1);
  });

  it('never deals a harder card for a deeper struggle', () => {
    const random = seededRandom(7);
    for (let trial = 0; trial < 200; trial++) {
      const year = () => 1000 + Math.floor(random() * 1000);
      const timeline = Array.from({ length: 1 + Math.floor(random() * 12) }, (_, i) =>
        ev(`b${i}`, year())
      ).sort((a, b) => a.year - b.year);
      const deck = Array.from({ length: 40 }, (_, i) => ev(`d${i}`, year()));
      const ease = (s: number) =>
        catchUpEase(deck[catchUpDrawIndex(deck, timeline, s, INDEX)], timeline, INDEX);
      for (let s = 0; s < 3; s++) expect(ease(s + 1)).toBeGreaterThanOrEqual(ease(s));
    }
  });
});

describe('drawCatchUp', () => {
  it('draws the top card for a player who has not missed', () => {
    const deck = [ev('a', 1810), ev('b', 1500), ev('c', 1820)];
    const { card, newDeck } = drawCatchUp(deck, [ev('l', 1200), ev('r', 1800)], [true], INDEX);
    expect(card?.name).toBe('a');
    expect(names(newDeck)).toEqual(['b', 'c']);
  });

  it('after a miss, lifts the eased card out and leaves the rest in order', () => {
    const deck = [ev('a', 1810), ev('b', 1500), ev('c', 1820)];
    const { card, newDeck } = drawCatchUp(deck, [ev('l', 1200), ev('r', 1800)], [false], INDEX);
    expect(card?.name).toBe('b');
    expect(names(newDeck)).toEqual(['a', 'c']);
  });

  it('returns nothing from an empty deck', () => {
    expect(drawCatchUp([], [ev('l', 1200)], [false], INDEX)).toEqual({
      card: undefined,
      newDeck: [],
    });
  });

  // Daily resume rebuilds the deck as "composed minus everything seen", so this must hold
  // for any run of hits and misses.
  it('always leaves the composed deck minus the cards dealt, in order', () => {
    const random = seededRandom(11);
    for (let trial = 0; trial < 100; trial++) {
      const composed = Array.from({ length: 60 }, (_, i) =>
        ev(`c${i}`, 1000 + Math.floor(random() * 1000))
      );
      const seen = new Set<string>([composed[0].name]);
      let timeline = [composed[0]];
      let deck = composed.slice(1);
      const history: boolean[] = [];
      for (let turn = 0; turn < 30 && deck.length > 0; turn++) {
        const hit = random() < 0.6;
        if (hit) {
          const placed = ev(`p${trial}-${turn}`, 1000 + Math.floor(random() * 1000));
          timeline = [...timeline, placed].sort((a, b) => a.year - b.year);
          const { card, newDeck } = drawCatchUp(deck, timeline, history, INDEX);
          if (card) seen.add(card.name);
          deck = newDeck;
        }
        history.push(hit);
        expect(names(deck)).toEqual(names(composed.filter((e) => !seen.has(e.name))));
      }
    }
  });
});
