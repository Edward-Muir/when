import React, { useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { DropAnimation, DropAnimationFunction } from '@dnd-kit/core';
import { HistoricalEvent } from '../types';
import type { DragCarry, DragGrab } from '../hooks/useDragAndDrop';
import { getEventColorStyle, getEventTextClass } from '../utils/eventColor';
import { getImageUrl } from '../utils/cloudinaryImage';
import CategoryIcon from './CategoryIcon';
import { titleShadowClass } from './CardFace';

/** Tailwind's `sm` breakpoint, where the landscape card grows from 240x80 to 280x96. */
const SM_QUERY = '(min-width: 640px)';
/** Keep the landscape card this far inside the viewport's sides when it opens. */
const EDGE_MARGIN = 8;

function landscapeSize(): { w: number; h: number } {
  const sm = typeof window !== 'undefined' && window.matchMedia?.(SM_QUERY).matches;
  return sm ? { w: 280, h: 96 } : { w: 240, h: 80 };
}

/**
 * Where the landscape card sits inside dnd-kit's overlay box, which is the hand card's own
 * box. Centred on the finger, so the row the player is carrying and the gap it will land in
 * (judged on the pointer's Y, see useDragAndDrop) are the same place; nudged sideways only as
 * far as it takes to keep it on screen.
 */
function landscapeBox(grab: DragGrab, w: number, h: number): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : w;
  const centre = Math.min(
    Math.max(grab.left + grab.x, w / 2 + EDGE_MARGIN),
    Math.max(vw - w / 2 - EDGE_MARGIN, w / 2 + EDGE_MARGIN)
  );
  return { left: centre - grab.left - w / 2, top: grab.y - h / 2 };
}

/** Share of the landscape card the art covers, and of its width the title block takes (CardFace). */
const ART_SHARE = 0.7;
const TITLE_SHARE = 0.52;
/** How far the board's row is indented inside its `[data-timeline-index]` box: gutter + gap. */
const ROW_CARD_INSET = 108;

/** Marks the morphing card inside dnd-kit's overlay, for the settle to find. */
const DRAG_CARD_ATTR = 'data-drag-card';

interface HandDragOverlayProps {
  event: HistoricalEvent;
  /** Where it was picked up, and `morph`: 0 = the square in the hand, 1 = the landscape row. */
  carry: DragCarry;
}

/**
 * What the player carries: one card that changes shape, never two cards swapping.
 *
 * The hand shows a square painting; the board takes landscape rows. The landscape card's art is
 * 70% of its width, which at phone size is the square's own 168px, so the painting never has to
 * resize. Everything here is a function of one number, `morph`:
 *
 *  - the frame closes from the square to the landscape box, centred on the finger;
 *  - the painting stays the same width and is cropped by the frame around the board's focal
 *    line (`50% 35%`), exactly as a placed row crops it;
 *  - the card's colour slides out to the right, the art's edge fades into it, and the title
 *    crosses from the bottom of the art to the colour;
 *  - the card lifts by 5%.
 *
 * At `morph = 1` this is pixel for pixel the landscape `Card`, which is also what the drop
 * ghost shows. One number rather than mount animations because dnd-kit freezes the overlay's
 * props while a drop animation runs, and the way back to the hand has to play in reverse.
 */
const HandDragOverlay: React.FC<HandDragOverlayProps> = ({ event, carry }) => {
  const { morph } = carry;
  const grab = carry.grabRef.current;
  const [imageError, setImageError] = useState(false);
  const { w, h } = landscapeSize();
  const from = grab ?? { x: w / 2, y: h / 2, left: 0, width: w, height: h };
  const to = landscapeBox(from, w, h);
  const mix = (a: number, b: number) => (t: number) => a + (b - a) * t;

  const x = useTransform(morph, mix(0, to.left));
  const y = useTransform(morph, mix(0, to.top));
  const width = useTransform(morph, mix(from.width, w));
  const height = useTransform(morph, mix(from.height, h));
  const scale = useTransform(morph, mix(1, 1.05));
  const artWidth = useTransform(morph, mix(from.width, w * ART_SHARE));
  // The square's title leaves first and the row's arrives last, so they are never both legible.
  const squareTitle = useTransform(morph, [0, 0.45], [1, 0]);
  const rowTitle = useTransform(morph, [0.5, 1], [0, 1]);
  const rowTitleX = useTransform(morph, [0.5, 1], [14, 0]);

  const hasImage = event.image_url && !imageError;
  const fill = event.color ?? 'var(--color-surface)';

  return (
    <motion.div
      {...{ [DRAG_CARD_ATTR]: '' }}
      className="dragging-card absolute left-0 top-0 overflow-hidden border border-border bg-surface"
      style={{ x, y, width, height, scale, ...getEventColorStyle(event) }}
    >
      <motion.div className="absolute inset-y-0 left-0" style={{ width: artWidth }}>
        {hasImage ? (
          <img
            src={getImageUrl(event.image_url, 'thumbnail')}
            alt=""
            decoding="sync"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-[50%_35%]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CategoryIcon category={event.category} className="text-text-muted w-8 h-8" />
          </div>
        )}
        {/* CardFace fades the art into the colour with a mask. Painting the colour over the
            art with the same gradient is the same picture, and its opacity can be animated. */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: morph,
            backgroundImage: `linear-gradient(90deg, transparent 50%, ${fill})`,
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-2 pt-8 pb-2"
          style={{ opacity: squareTitle }}
        >
          <span className="text-white text-ui-card-title line-clamp-2 block font-body drop-shadow-md">
            {event.friendly_name}
          </span>
        </motion.div>
      </motion.div>
      {/* The row's title: CardFace's block, at its final width from the start so the words
          never re-wrap as the card widens. */}
      <motion.div
        aria-hidden
        className="absolute inset-y-0 right-0 flex items-center justify-end pl-1 pr-4 py-1"
        style={{ width: w * TITLE_SHARE, opacity: rowTitle, x: rowTitleX }}
      >
        <span
          className={`${getEventTextClass(event)} ${titleShadowClass(event, false)} text-sm leading-tight line-clamp-3 font-body text-right`}
        >
          {event.friendly_name}
        </span>
      </motion.div>
    </motion.div>
  );
};

/** How long the card takes to go home to the hand, ms. The reverse morph runs on the same clock. */
export const RETURN_TO_HAND_MS = 180;
export const RETURN_EASING = [0.2, 0.8, 0.2, 1] as const;
/** How long the card takes to seat itself in its row after a drop on the board, ms. */
const SETTLE_MS = 130;

const DROP_EASING = `cubic-bezier(${RETURN_EASING.join(',')})`;

/**
 * A drop back on the hand: the overlay flies home while `morph` runs back to the square, so it
 * lands as the card it started as.
 *
 * Written out rather than left to dnd-kit's default, which measures the overlay's first child
 * and aims that at the hand card. The first child is the morphing card, which is on its own
 * way back inside the overlay, so the two corrections stack and the card overshoots by the
 * finger's offset. This moves the overlay box only, back to where it was picked up from.
 * The hand card stays hidden until the overlay has landed on it.
 */
export const returnToHand: DropAnimationFunction = ({ active, dragOverlay, transform }) => {
  const source = active.node;
  source.style.visibility = 'hidden';
  return dragOverlay.node
    .animate(
      [
        { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` },
        { transform: 'translate3d(0, 0, 0)' },
      ],
      { duration: RETURN_TO_HAND_MS, easing: DROP_EASING, fill: 'forwards' }
    )
    .finished.then(
      () => undefined,
      () => undefined
    )
    .then(() => {
      source.style.visibility = '';
    });
};

/** The board row a card with this title has just been placed in, if it is in the DOM. */
function placedRow(title: string): HTMLElement | null {
  const rows = document.querySelectorAll<HTMLElement>('[data-timeline-index]');
  for (const row of Array.from(rows)) {
    if (row.querySelector('button')?.textContent?.trim() === title) return row;
  }
  return null;
}

/**
 * A drop on the board: the card glides the last stretch from the finger into its slot, comes
 * down from its 5% lift, and gives way to the row underneath it. Without this the carried card
 * vanishes where the finger was and the row appears somewhere near it.
 *
 * It aims at where the row's card will rest, read off the row's own box: the card inside is
 * still mid-entrance and its live position is a moving target. If the row is not there (it
 * always should be: the placement commits with the drop), the card just fades.
 */
export const settleOnBoard: DropAnimationFunction = ({ active, dragOverlay }) => {
  const card = dragOverlay.node.querySelector<HTMLElement>(`[${DRAG_CARD_ATTR}]`);
  if (!card) return undefined;
  const event = active.data.current?.event as HistoricalEvent | undefined;
  const row = event ? placedRow(event.friendly_name) : null;
  const now = new DOMMatrix(getComputedStyle(card).transform);
  let dx = 0;
  let dy = 0;
  if (row) {
    const box = card.getBoundingClientRect();
    const rowBox = row.getBoundingClientRect();
    const { w } = landscapeSize();
    dx = rowBox.left + ROW_CARD_INSET + w / 2 - (box.left + box.width / 2);
    dy = rowBox.top + rowBox.height / 2 - (box.top + box.height / 2);
  }
  const seated = `matrix(1, 0, 0, 1, ${now.e + dx}, ${now.f + dy})`;
  return card
    .animate(
      [
        { transform: now.toString(), opacity: 1 },
        { transform: seated, opacity: 1, offset: 0.7 },
        { transform: seated, opacity: 0 },
      ],
      { duration: SETTLE_MS, easing: DROP_EASING, fill: 'forwards' }
    )
    .finished.then(() => undefined);
};

/**
 * How the carried card is put down. Under reduced motion nothing moves: it disappears on the
 * board and goes straight back in the hand.
 */
export function dropAnimationFor(onBoard: boolean): DropAnimation | null {
  const still =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (still) return null;
  return onBoard ? settleOnBoard : returnToHand;
}

export default HandDragOverlay;
