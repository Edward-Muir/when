import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { HistoricalEvent } from '../../types';

/**
 * The hand as a row of card backs, one per card: the game's lives. A miss shrinks the row
 * and the lost back visibly leaves, which a count alone never showed. Keyed by event name so
 * a swap reorders without churn and a draw slides a new back in.
 */
const HandBacks: React.FC<{ hand: HistoricalEvent[] }> = ({ hand }) => {
  const reduceMotion = useReducedMotion();
  return (
    <div className="flex items-center gap-1" aria-label={`${hand.length} cards in hand`}>
      <AnimatePresence initial={false}>
        {hand.map((card, i) => (
          <motion.div
            key={card.name}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { scale: 0.4, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 26 }}
            className={`hand-back w-3.5 h-5 rounded-sm border ${
              i === 0 ? 'border-accent' : 'border-border'
            }`}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HandBacks;
