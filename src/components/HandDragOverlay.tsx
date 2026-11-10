import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { HistoricalEvent } from '../types';
import type { DragGrab } from '../hooks/useDragAndDrop';
import Card from './Card';

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

interface HandDragOverlayProps {
  event: HistoricalEvent;
  grab: DragGrab | null;
}

/**
 * What the player carries. The hand shows a square painting; the board takes landscape rows.
 * So on pickup the square closes down around the finger into the landscape card, in about the
 * time the 8px activation distance takes to cross: the player lifts a painting and is holding
 * the row that will land. It is the same card the drop ghost shows, so nothing about the drop
 * is a surprise.
 *
 * The box morphs; the two faces inside it are each drawn at their true size, centred, and
 * cross-faded, so neither is ever stretched. Under reduced motion it is the landscape card
 * from the first frame.
 */
const HandDragOverlay: React.FC<HandDragOverlayProps> = ({ event, grab }) => {
  const reduceMotion = useReducedMotion();
  const { w, h } = landscapeSize();
  const from = grab ?? { x: w / 2, y: h / 2, left: 0, width: w, height: h };
  const to = { ...landscapeBox(from, w, h), width: w, height: h };
  const centred = 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2';

  return (
    <motion.div
      className="dragging-card absolute overflow-hidden"
      initial={
        reduceMotion ? false : { left: 0, top: 0, width: from.width, height: from.height, scale: 1 }
      }
      animate={{ ...to, scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <motion.div
        className={centred}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12 }}
      >
        <Card event={event} size="landscape" />
      </motion.div>
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className={centred}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <Card event={event} size="square" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default HandDragOverlay;
