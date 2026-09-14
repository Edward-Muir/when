import React from 'react';
import { motion } from 'framer-motion';
import { Player, GameMode } from '../types';
import { Users, Ruler, Zap } from 'lucide-react';
import { getStreakFeedback } from '../utils/streakFeedback';
import { GameHintKey } from '../utils/playerStorage';

// Widest hand the picture distinguishes. A bigger hand reuses the five-card fan; the
// number overlaid on top still shows the true count.
const MAX_FANNED_CARDS = 5;

// Step per card away from the centre of the fan. The 24x24 viewBox is the constraint: at
// five cards the outer card sits two steps out and two steps of rotation over, so its
// half-extent is 2 * 1.5 + 6 * cos(16deg) + 8 * sin(16deg) + 0.75 (half the stroke) =
// 11.7, inside the 12 available. Widening either step means redoing that sum, or the
// outer card is silently clipped by the viewBox edge.
const FAN_X_STEP = 1.5;
const FAN_ANGLE_STEP = 8;

/**
 * The fanned card rects, one per card in hand, so the picture agrees with the number it
 * sits behind. Renders into a caller-supplied 24x24 <svg>.
 */
const HandCardFan: React.FC<{ count: number }> = ({ count }) => {
  // An empty hand draws nothing — a card here would claim the player still holds one.
  // Both callers switch the number to a colour that reads without a card behind it.
  const cards = Math.min(Math.max(count, 0), MAX_FANNED_CARDS);

  return (
    <>
      {Array.from({ length: cards }, (_, i) => {
        const offset = i - (cards - 1) / 2;
        const x = 6 + FAN_X_STEP * offset;

        return (
          <rect
            key={i}
            data-testid="hand-card"
            x={x}
            y="4"
            width="12"
            height="16"
            rx="1.5"
            transform={`rotate(${FAN_ANGLE_STEP * offset} ${x + 6} 12)`}
            className="fill-current"
            // Back to front, 0.4 -> 0.8. An attribute rather than Tailwind's `opacity-NN`
            // because the value is computed, and Tailwind cannot generate a class from an
            // interpolated string — it would emit no rule at all.
            opacity={cards === 1 ? 0.8 : 0.4 + (0.4 * i) / (cards - 1)}
          />
        );
      })}
    </>
  );
};

// Custom hand of cards icon with count overlay
const HandCardsIcon: React.FC<{ count: number; className?: string; isCurrent?: boolean }> = ({
  count,
  className = '',
  isCurrent = false,
}) => (
  <div className={`relative ${className}`}>
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-5 h-5"
    >
      <HandCardFan count={count} />
    </svg>
    {/* Count overlay - contrasting color. Both overrides are picked to read against a
        card, so with an empty fan the number inherits the row's own colour instead. */}
    <span
      className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
        count === 0 ? '' : isCurrent ? 'text-accent-secondary' : 'text-bg'
      }`}
    >
      {count}
    </span>
  </div>
);

interface PlayerInfoProps {
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ players, currentPlayerIndex }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {players.map((player, index) => {
        const isCurrent = index === currentPlayerIndex;
        const isEliminated = player.isEliminated;
        const hasWon = player.hasWon;

        return (
          <div
            key={player.id}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 font-body
              ${
                isCurrent
                  ? 'bg-accent-secondary text-white shadow-sm'
                  : isEliminated
                    ? 'bg-error/20 text-error line-through opacity-60'
                    : hasWon
                      ? 'bg-success/20 text-success'
                      : 'bg-border text-text-muted'
              }
            `}
          >
            <Users className="w-3 h-3" />
            <span className="font-medium flex-1">{player.name}</span>
            {hasWon ? (
              <span className="text-sm">🏆</span>
            ) : (
              <HandCardsIcon count={player.hand.length} isCurrent={isCurrent} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Enlarged hand icon for compact game info display
const HandCardsIconLarge: React.FC<{ count: number }> = ({ count }) => (
  <div className="relative w-10 h-10">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="w-10 h-10 text-accent"
    >
      <HandCardFan count={count} />
    </svg>
    <span
      className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${
        // No card behind it at zero, so match the counters alongside; the shadow only
        // exists to lift the number off a card.
        count === 0 ? 'text-text-muted' : 'text-white drop-shadow-md'
      }`}
    >
      {count}
    </span>
  </div>
);

// Streak lightning bolt indicator
const StreakBolt: React.FC<{ streak: number }> = ({ streak }) => {
  const config = getStreakFeedback(streak);

  return (
    <div className={`flex items-center gap-1 ${config.boltColorClass}`}>
      <motion.div
        key={streak}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className={`flex items-center gap-0.5 ${config.boltAnimationClass}`}
      >
        <Zap className={`w-3.5 h-3.5 ${config.boltFilled ? 'fill-current' : ''}`} />
        <span className="font-mono text-xs font-bold">{streak}</span>
      </motion.div>
    </div>
  );
};

// Compact game info for the bottom bar
interface GameInfoCompactProps {
  currentPlayer: Player;
  isMultiplayer: boolean;
  timelineLength: number;
  gameMode: GameMode | null;
  onStatsClick?: () => void;
  currentStreak?: number;
  /** The onboarding hint on screen: `stats` glows this counter. */
  nudge?: GameHintKey | null;
}

export const GameInfoCompact: React.FC<GameInfoCompactProps> = ({
  currentPlayer,
  isMultiplayer,
  timelineLength,
  gameMode: _gameMode,
  onStatsClick,
  currentStreak = 0,
  nudge = null,
}) => {
  const showTimelineStats = !isMultiplayer;
  // `bg-border` is not decoration: the button is transparent, and `animate-hint-glow` is
  // transform and filter only, so without a surface to swell there is nothing to see.
  const nudgeClass = nudge === 'stats' ? 'animate-hint-glow bg-border' : '';

  const content = (
    <>
      {/* Player name (if multiplayer) */}
      {isMultiplayer && (
        <span className="text-sm font-medium text-text font-body">{currentPlayer.name}</span>
      )}

      {/* Hand count with enlarged icon */}
      <HandCardsIconLarge count={currentPlayer.hand.length} />
      <span className="text-sm text-text font-body">cards left</span>

      {/* Timeline stats + streak for single-player */}
      {showTimelineStats && (
        <div className="flex items-center gap-2 text-xs text-text-muted font-body">
          <div className="flex items-center gap-1">
            <Ruler className="w-3.5 h-3.5" />
            <span className="font-mono">{timelineLength}</span>
          </div>
          <StreakBolt streak={currentStreak} />
        </div>
      )}
    </>
  );

  // Wrap in tappable button for Sudden Death mode
  if (showTimelineStats) {
    return (
      <button
        onClick={onStatsClick}
        className={`flex flex-col items-center gap-0.5 px-2 py-1 -mx-2 rounded-md hover:bg-border/50 active:bg-border transition-colors cursor-pointer ${nudgeClass}`}
      >
        {content}
      </button>
    );
  }

  return <div className="flex flex-col items-center gap-0.5">{content}</div>;
};

export default PlayerInfo;
