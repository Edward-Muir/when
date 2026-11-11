import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, MotionValue, useMotionValue, useReducedMotion } from 'framer-motion';

/**
 * The entrance of the game-over gallery: the cards on the board travel into the grid.
 *
 * It is an entrance and nothing else. The grid inside the popup is complete without it, which
 * is what reduced-motion players get, what the tests render, and what is left if the board
 * cannot be measured.
 *
 * How it works, and why not `layoutId`:
 *
 * - **Measured, not projected.** On open this reads where each card's art sits on the board
 *   (`data-board-card`, set by `TimelineEvent` and `TombstoneRow`) and where its tile sits in
 *   the grid, and `GalleryFlight` moves a clone between the two. A shared `layoutId` would tie
 *   the board's rows to a popup that mounts and unmounts, and docs/gameplay-feel/index.md
 *   records two traps with exactly that on this board.
 * - **The clones fly outside the popup**, in a body portal, because the Modal card clips its
 *   content. The real tiles stay hidden until the clones land and swap in on the same frame.
 * - **The Modal card is mid scale-in when this measures**, so tile rects are un-scaled about
 *   the card's centre, which the scale does not move.
 * - **The card can move during the flight.** On the Daily the leaderboard block swaps its
 *   skeleton for the form, the card grows, and the centred card shifts up. `shiftY` carries
 *   that into every clone's target so they land on the tiles wherever those end up.
 * - **Only the rows on screen travel from their rows.** About eight are; the rest fade in from
 *   the edge of the board nearest to where they sit.
 */

export interface FlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FlightPath {
  /** Where the clone starts: the card's art on the board, or a spot at the board's edge. */
  from: FlightRect;
  /** The tile it lands on, as measured when the flight began. */
  to: FlightRect;
  /** False for a card that was off screen: it fades in at the edge and has no art to open. */
  fromBoard: boolean;
}

export type TravelPhase = 'pending' | 'flying' | 'landed';

export interface GalleryTravel {
  phase: TravelPhase;
  /** One path per tile, in tile order. Empty unless a flight was planned. */
  paths: FlightPath[];
  /** 0 to 1 across the whole flight. Every clone's style is derived from it. */
  progress: MotionValue<number>;
  /** How far the grid has moved since `paths` was measured. */
  shiftY: MotionValue<number>;
  /** True once the popup's own surface should be showing behind the tiles. */
  surface: boolean;
  /** True when the tiles arrived by flight, so the score may count up to greet them. */
  flew: boolean;
}

/** The beat before anything moves, while the scrim comes up over the board. */
export const FLIGHT_HOLD_S = 0.3;
/** First clone leaving to last clone landing. */
export const FLIGHT_TRAVEL_S = 1.1;
/** How far into the flight the popup's surface appears under the arriving tiles. */
const SURFACE_AT = 0.65;

const BOARD_CARD = '[data-board-card]';
const TILE = '[data-gallery-tile]';

function rectOf(element: Element): FlightRect {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
}

/** Undo the Modal card's entrance scale, which is about the card's centre. */
function restingRects(card: HTMLElement, elements: Element[]): FlightRect[] {
  const box = card.getBoundingClientRect();
  const scale = card.offsetWidth > 0 ? box.width / card.offsetWidth : 1;
  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;
  return elements.map((element) => {
    const r = element.getBoundingClientRect();
    return {
      left: cx + (r.left - cx) / scale,
      top: cy + (r.top - cy) / scale,
      width: r.width / scale,
      height: r.height / scale,
    };
  });
}

/** The art of every card on the board, by event name. */
function boardArt(scroller: Element): Map<string, HTMLImageElement> {
  const art = new Map<string, HTMLImageElement>();
  scroller.querySelectorAll<HTMLElement>(BOARD_CARD).forEach((card) => {
    const name = card.dataset.boardCard;
    const img = card.querySelector('img');
    // A card whose image failed shows an icon, and has no painting to carry over.
    if (name && img && img.naturalWidth > 0) art.set(name, img);
  });
  return art;
}

function pathFor(img: HTMLImageElement | undefined, to: FlightRect, board: FlightRect): FlightPath {
  const boardBottom = board.top + board.height;
  if (img) {
    const from = rectOf(img);
    const middle = from.top + from.height / 2;
    if (middle > board.top && middle < boardBottom) return { from, to, fromBoard: true };
    // Off screen: arrive from whichever edge of the board the card is beyond.
    const above = middle <= board.top;
    const top = above ? board.top - to.height * 0.4 : boardBottom - to.height * 0.6;
    return { from: { ...to, top }, to, fromBoard: false };
  }
  return { from: { ...to, top: boardBottom - to.height * 0.6 }, to, fromBoard: false };
}

/** Null when there is nothing to fly from: no board on the page, or no art on it. */
function planFlight(grid: HTMLElement, names: readonly string[]): FlightPath[] | null {
  const scroller = document.querySelector('[data-board-scroller]');
  const card = grid.closest<HTMLElement>('[role="dialog"]');
  if (!scroller || !card) return null;
  const tiles = Array.from(grid.querySelectorAll(TILE));
  if (tiles.length === 0 || tiles.length !== names.length) return null;
  const art = boardArt(scroller);
  if (art.size === 0) return null;
  const board = rectOf(scroller);
  const targets = restingRects(card, tiles);
  // eslint-disable-next-line security/detect-object-injection -- index from map()
  return names.map((name, i) => pathFor(art.get(name), targets[i], board));
}

export function useGalleryTravel(
  gridRef: RefObject<HTMLElement | null>,
  /** Event names in tile order. Read once, when the gallery mounts. */
  names: readonly string[]
): GalleryTravel {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const shiftY = useMotionValue(0);
  const [phase, setPhase] = useState<TravelPhase>('pending');
  const [paths, setPaths] = useState<FlightPath[]>([]);
  // Starts false: the popup opens without its surface and is given it, so it never has one to
  // fade out. Going the other way left a ghost of the card under the first frames of flight.
  const [surface, setSurface] = useState(false);
  const [flew, setFlew] = useState(false);
  const namesRef = useRef(names);

  // Plan the flight before the first paint, so the clones are over the board's cards on the
  // same frame the board begins to fade. Once per mount: the gallery mounts when the popup
  // opens and the game it shows is over.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    const plan = grid && !reduceMotion ? planFlight(grid, namesRef.current) : null;
    if (!plan) {
      setSurface(true);
      setPhase('landed');
      return;
    }
    setPaths(plan);
    setFlew(true);
    setPhase('flying');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount, see above
  }, []);

  useEffect(() => {
    if (phase !== 'flying') return;
    const grid = gridRef.current;
    const card = grid?.closest<HTMLElement>('[role="dialog"]');
    const firstTile = grid?.querySelector(TILE);
    const startTop = paths[0]?.to.top;

    const stopSurface = progress.on('change', (p) => {
      if (p >= SURFACE_AT) setSurface(true);
    });
    const controls = animate(progress, 1, {
      duration: FLIGHT_TRAVEL_S,
      delay: FLIGHT_HOLD_S,
      ease: 'linear',
      onComplete: () => {
        setSurface(true);
        setPhase('landed');
      },
    });

    // Follow the grid if the card resizes under the flight (see the header comment).
    let observer: ResizeObserver | undefined;
    if (card && firstTile && startTop !== undefined && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        shiftY.set(restingRects(card, [firstTile])[0].top - startTop);
      });
      observer.observe(card);
    }

    return () => {
      controls.stop();
      stopSurface();
      observer?.disconnect();
    };
  }, [phase, paths, gridRef, progress, shiftY]);

  return { phase, paths, progress, shiftY, surface, flew };
}
