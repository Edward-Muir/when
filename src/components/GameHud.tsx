import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home } from 'lucide-react';

interface GameHudProps {
  onHome: () => void;
  /** The deck's theme, when it has one. A Custom game has none and shows Home alone. */
  theme?: string;
}

/**
 * All the chrome a game has: Home on the left, the theme pill on the right. Both float over
 * the board inside the 48px fade band that holds "↑ Earlier", so neither costs the timeline
 * any height. There is no top bar and no menu in a game; those are on Home.
 *
 * It sits at z-[34]: above the board's scrims (z-30), below the hint strip (z-[35]) and the
 * hand bar (z-40). The strip itself ignores the pointer, so a drag or a scroll that starts
 * between the two controls still reaches the board.
 *
 * A component of its own because `Game` sits on ESLint's complexity ceiling: the `theme &&`
 * below would be one branch too many there.
 */
const GameHud: React.FC<GameHudProps> = ({ onHome, theme }) => (
  <div className="absolute top-0 inset-x-0 z-[34] pointer-events-none flex items-start justify-between gap-2 px-2 pt-1">
    <button
      onClick={onHome}
      aria-label="Go home"
      className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface border border-border shadow-sm hover:bg-border transition-colors active:scale-95"
    >
      <Home className="w-5 h-5 text-text" />
    </button>
    <AnimatePresence>
      {theme && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          // max-w because curated theme names run to 20 characters ("Crowns & Coronations")
          // and daily pairings to 46 ("Architecture in the Middle East & North Africa"). It
          // wraps to two lines rather than truncating, because a pairing's place comes last and
          // is the part a single line cut off. The `min()` keeps it clear of the centred
          // "↑ Earlier" label down to a 320px screen, where 9.5rem would run under it; the
          // third line is for that narrower pill. The full name is on the Daily hero card.
          className="mt-1.5 max-w-[min(9.5rem,calc(50%-3rem))] line-clamp-3 [overflow-wrap:anywhere] px-2 py-0.5 text-xs leading-[1.2] font-body font-medium bg-accent text-white rounded-xl shadow-sm"
          title={theme}
        >
          {theme}
        </motion.span>
      )}
    </AnimatePresence>
  </div>
);

export default GameHud;
