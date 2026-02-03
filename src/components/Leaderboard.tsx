import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Users, X } from 'lucide-react';
import { LeaderboardEntry } from '../hooks/useLeaderboard';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  totalPlayers: number;
  playerRank: number | null;
  isLoading?: boolean;
  error?: string | null;
}

function getMedalEmoji(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

const Leaderboard: React.FC<LeaderboardProps> = ({
  isOpen,
  onClose,
  entries,
  totalPlayers,
  playerRank,
  isLoading,
  error,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
        >
          <motion.div
            className="w-[90vw] max-w-[400px] max-h-[80vh] rounded-lg overflow-hidden border border-border bg-surface shadow-sm flex flex-col"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-display font-semibold text-text">Daily Leaderboard</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-border transition-colors"
                aria-label="Close leaderboard"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Player count + your rank */}
            <div className="px-4 py-2 border-b border-border bg-bg flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-muted font-body">
                {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} today
              </span>
              {playerRank && (
                <span className="ml-auto text-sm text-accent font-medium font-body">
                  You: #{playerRank}
                </span>
              )}
            </div>

            {/* Entries */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-text-muted font-body">Loading...</div>
              ) : error ? (
                <div className="p-8 text-center text-error font-body">{error}</div>
              ) : entries.length === 0 ? (
                <div className="p-8 text-center text-text-muted font-body">
                  No entries yet. Be the first!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {entries.map((entry, index) => {
                    const isPlayer = entry.rank === playerRank;
                    const medal = getMedalEmoji(entry.rank);

                    return (
                      <div
                        key={index}
                        className={`px-4 py-3 flex items-center gap-3 ${isPlayer ? 'bg-accent/10' : ''}`}
                      >
                        {/* Rank */}
                        <div className="w-8 text-center shrink-0">
                          {medal ? (
                            <span className="text-lg">{medal}</span>
                          ) : (
                            <span className="text-sm text-text-muted font-mono">#{entry.rank}</span>
                          )}
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-text truncate font-body">
                            {entry.displayName}
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold font-mono text-accent">
                            {entry.correctCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Leaderboard;
