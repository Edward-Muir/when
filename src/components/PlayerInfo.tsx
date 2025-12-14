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
            <span className={`
              px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center
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
  );
};

export default PlayerInfo;
