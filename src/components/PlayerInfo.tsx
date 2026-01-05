import React from 'react';
import { Player } from '../types';
import { Users } from 'lucide-react';

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
      {/* Back card (rotated left) */}
      <rect
        x="3"
        y="4"
        width="12"
        height="16"
        rx="1.5"
        transform="rotate(-12 9 12)"
        className="fill-current opacity-40"
      />
      {/* Middle card */}
      <rect x="6" y="4" width="12" height="16" rx="1.5" className="fill-current opacity-60" />
      {/* Front card (rotated right) */}
      <rect
        x="9"
        y="4"
        width="12"
        height="16"
        rx="1.5"
        transform="rotate(12 15 12)"
        className="fill-current opacity-80"
      />
    </svg>
    {/* Count overlay - contrasting color */}
    <span
      className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${
        isCurrent ? 'text-accent-secondary' : 'text-bg'
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
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200 font-body
              ${
                isCurrent
                  ? 'bg-accent-secondary text-white shadow-md'
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
              <span className="text-[10px]">🏆</span>
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
      {/* Back card (rotated left) */}
      <rect
        x="3"
        y="4"
        width="12"
        height="16"
        rx="1.5"
        transform="rotate(-12 9 12)"
        className="fill-current opacity-40"
      />
      {/* Middle card */}
      <rect x="6" y="4" width="12" height="16" rx="1.5" className="fill-current opacity-60" />
      {/* Front card (rotated right) */}
      <rect
        x="9"
        y="4"
        width="12"
        height="16"
        rx="1.5"
        transform="rotate(12 15 12)"
        className="fill-current opacity-80"
      />
    </svg>
    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md">
      {count}
    </span>
  </div>
);

// Compact game info for the bottom bar
interface GameInfoCompactProps {
  currentPlayer: Player;
  isMultiplayer: boolean;
}

export const GameInfoCompact: React.FC<GameInfoCompactProps> = ({
  currentPlayer,
  isMultiplayer,
}) => {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Player name (if multiplayer) */}
      {isMultiplayer && (
        <span className="text-xs font-medium text-text font-body">{currentPlayer.name}</span>
      )}

      {/* Hand count with enlarged icon */}
      <HandCardsIconLarge count={currentPlayer.hand.length} />
      <span className="text-[10px] text-text-muted font-body">cards left</span>
    </div>
  );
};

export default PlayerInfo;
