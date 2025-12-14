import React from 'react';
import { Player } from '../types';
import { Users } from 'lucide-react';

interface PlayerInfoProps {
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  roundNumber: number;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({
  players,
  currentPlayerIndex,
  turnNumber,
  roundNumber,
}) => {
  return (
    <div className="flex items-center gap-2 mb-3">
      {/* Player cards - horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto flex-1">
        {players.map((player, index) => {
          const isCurrent = index === currentPlayerIndex;
          const isEliminated = player.isEliminated;
          const hasWon = player.hasWon;

          return (
            <div
              key={player.id}
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium
                transition-all duration-200 whitespace-nowrap font-body
                ${isCurrent
                  ? 'bg-blue-500 dark:bg-blue-400 text-white scale-105 shadow-md'
                  : isEliminated
                    ? 'bg-error/20 text-error line-through opacity-60'
                    : hasWon
                      ? 'bg-success/20 text-success'
                      : 'bg-light-border dark:bg-dark-border text-light-muted dark:text-dark-muted'
                }
              `}
            >
              <Users className="w-3 h-3" />
              <span className="font-medium">{player.name}</span>
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${isCurrent
                  ? 'bg-white/30'
                  : hasWon
                    ? 'bg-success/30'
                    : isEliminated
                      ? 'bg-error/30'
                      : 'bg-black/10 dark:bg-white/10'
                }
              `}>
                {hasWon ? '🏆' : player.hand.length}
              </span>
            </div>
          );
        })}
      </div>

      {/* Round/Turn info - only show if more than 1 player */}
      {players.length > 1 && (
        <div className="flex items-center gap-1.5 text-xs text-light-muted dark:text-dark-muted font-body shrink-0">
          <span>R{roundNumber}</span>
          <span className="opacity-50">·</span>
          <span>T{turnNumber}</span>
        </div>
      )}
    </div>
  );
};

export default PlayerInfo;
