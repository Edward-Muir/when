import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * The gap a dragged card is about to land in. Rather than a see-through copy of the card,
 * the board makes room: the rows either side ease apart on a spring and a recessed slot the
 * size of a card opens between them. Every gap owns one of these, closed at zero height, so
 * moving the drag to the next gap closes one slot and opens the next with the same spring.
 *
 * Display only: no `data-timeline-year` / `data-timeline-index`, so the drag maths measures
 * nothing here and the open slot simply widens the drop band of the gap it sits in.
 */
const SLOT_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };

const BoardSlot: React.FC<{ open: boolean }> = ({ open }) => {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      initial={false}
      animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
      transition={reduceMotion ? { duration: 0 } : SLOT_SPRING}
      className="w-full overflow-hidden"
    >
      <div className="flex items-center w-full py-1">
        {/* Year column (fixed 96px width): the unknown year */}
        <div className="w-24 pl-2 flex items-center justify-end shrink-0">
          <span className="text-text-muted font-bold text-sm font-mono pr-2 opacity-60">?</span>
          <div className="w-3 h-1 bg-accent shrink-0 opacity-50" />
        </div>
        <div className="flex-1 pl-3">
          <div className="board-slot w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
};

export default BoardSlot;
