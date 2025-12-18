import React from 'react';
import { Player } from '../types';
import { Users } from 'lucide-react';

// Custom hand of cards icon with count overlay
const HandCardsIcon: React.FC<{ count: number; className?: string; isCurrent?: boolean }> = ({ count, className = '', isCurrent = false }) => (
  <div className={`relative ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      {/* Back card (rotated left) */}
      <rect x="3" y="4" width="12" height="16" rx="1.5" transform="rotate(-12 9 12)" className="fill-current opacity-40" />
      {/* Middle card */}
      <rect x="6" y="4" width="12" height="16" rx="1.5" className="fill-current opacity-60" />
      {/* Front card (rotated right) */}
      <rect x="9" y="4" width="12" height="16" rx="1.5" transform="rotate(12 15 12)" className="fill-current opacity-80" />
    </svg>
    {/* Count overlay - contrasting color */}
    <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${
      isCurrent
        ? 'text-blue-500 dark:text-blue-400'
        : 'text-light-bg dark:text-dark-bg'
    }`}>
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

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  players,
  currentPlayerIndex,
}) => {
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
              ${isCurrent
                ? 'bg-blue-500 dark:bg-blue-400 text-white shadow-md'
                : isEliminated
                  ? 'bg-error/20 text-error line-through opacity-60'
                  : hasWon
                    ? 'bg-success/20 text-success'
                    : 'bg-light-border dark:bg-dark-border text-light-muted dark:text-dark-muted'
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

export default PlayerInfo;
