import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatYear } from '../utils/gameLogic';
import CategoryIcon from './CategoryIcon';

interface GamePopupProps {
  type: GamePopupType;
  event: HistoricalEvent | null;
  onDismiss: () => void;
  nextPlayer?: Player;
  showYear?: boolean;
  gameState?: WhenGameState;
}

// Sub-component for result badge (overlays on image for correct/incorrect)
function ResultBadge({ isCorrect }: { isCorrect: boolean }) {
  return (
    <div
      className={`absolute top-3 left-3 flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm ${
        isCorrect ? 'bg-success/90' : 'bg-error/90'
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {isCorrect ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        )}
      </div>
      <span className="font-semibold text-base text-white leading-none">
        {isCorrect ? 'Correct!' : 'Wrong!'}
      </span>
    </div>
  );
}

// Sub-component for image section with title overlay (used for all popup types)
function EventImage({ event, type }: { event: HistoricalEvent; type: GamePopupType }) {
  const isResult = type === 'correct' || type === 'incorrect';
  const isCorrect = type === 'correct';

  return (
    <div className="h-56 sm:h-64 relative overflow-hidden">
      {event.image_url ? (
        <img src={event.image_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
          <CategoryIcon
            category={event.category}
            className="text-light-muted dark:text-dark-muted w-20 h-20"
          />
        </div>
      )}

      {/* Result badge overlay for correct/incorrect */}
      {isResult && <ResultBadge isCorrect={isCorrect} />}

      {/* Title overlay at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pt-12 pb-3">
        <span className="text-white text-lg font-medium leading-tight block font-body drop-shadow-md">
          {event.friendly_name}
        </span>
      </div>
    </div>
  );
}

// Sub-component for year bar
function YearBar({ year, type }: { year: number; type: GamePopupType }) {
  const bgClass =
    type === 'description'
      ? 'bg-accent dark:bg-accent-dark'
      : type === 'correct'
        ? 'bg-success'
        : 'bg-error';

  return (
    <div className={`px-4 py-3 text-center ${bgClass}`}>
      <span className="text-white text-2xl font-bold font-mono">{formatYear(year)}</span>
    </div>
  );
}

// Sub-component for game over content
function GameOverContent({ gameState }: { gameState: WhenGameState }) {
  const { winners, players, gameMode } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;
  const isSuddenDeath = gameMode === 'suddenDeath' || gameMode === 'daily';

  // Generate winner text
  const getWinnerText = () => {
    if (isSinglePlayer) {
      return hasWinner ? 'You Won!' : 'Game Over';
    }
    if (!hasWinner) {
      return 'Game Over';
    }
    if (winners.length === 1) {
      return `${winners[0].name} Wins!`;
    }
    // Multiple winners
    const names = winners.map((w) => w.name);
    const lastWinner = names.pop();
    return `${names.join(', ')} & ${lastWinner} Win!`;
  };

  // Calculate stats for a player
  const getPlayerStats = (player: Player) => {
    const correct = player.placementHistory.filter((p) => p).length;
    const total = player.placementHistory.length;
    return { correct, total };
  };

  // Get encouraging message based on events placed
  const getEncouragingMessage = (eventsPlaced: number): string | null => {
    if (eventsPlaced >= 12) return 'Legendary!';
    if (eventsPlaced >= 8) return 'History buff!';
    if (eventsPlaced >= 5) return 'Impressive!';
    if (eventsPlaced >= 3) return 'Good start!';
    return null;
  };

  return (
    <div className="p-6">
      {/* Header with trophy */}
      <div className="flex flex-col items-center gap-3 mb-6">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center ${
            hasWinner ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-light-border dark:bg-dark-border'
          }`}
        >
          <Trophy
            className={`w-8 h-8 ${hasWinner ? 'text-amber-500' : 'text-light-muted dark:text-dark-muted'}`}
          />
        </div>
        <h2 className="text-2xl font-display font-bold text-light-text dark:text-dark-text">
          {getWinnerText()}
        </h2>
      </div>

      {/* Stats section */}
      <div className="space-y-3">
        {isSinglePlayer ? (
          // Single player stats
          <div className="text-center">
            <p className="text-light-text dark:text-dark-text font-body">
              {isSuddenDeath ? (
                <>
                  <span className="text-2xl font-bold font-mono">
                    {getPlayerStats(players[0]).correct}
                  </span>
                  <span className="text-light-muted dark:text-dark-muted">
                    {' '}
                    {getPlayerStats(players[0]).correct === 1 ? 'event' : 'events'} placed
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold font-mono">
                    {getPlayerStats(players[0]).correct}
                  </span>
                  <span className="text-light-muted dark:text-dark-muted">
                    {' '}
                    / {getPlayerStats(players[0]).total} correct
                  </span>
                </>
              )}
            </p>
            {isSuddenDeath && getEncouragingMessage(getPlayerStats(players[0]).correct) && (
              <p className="text-accent dark:text-accent-dark font-medium mt-2">
                {getEncouragingMessage(getPlayerStats(players[0]).correct)}
              </p>
            )}
          </div>
        ) : (
          // Multiplayer stats - per player
          <div className="space-y-2">
            {players.map((player) => {
              const stats = getPlayerStats(player);
              const isWinner = winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isWinner ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-light-bg dark:bg-dark-bg'
                  }`}
                >
                  <span className="font-body text-light-text dark:text-dark-text">
                    {player.name}
                    {isWinner && <Trophy className="inline-block w-4 h-4 ml-1 text-amber-500" />}
                  </span>
                  <span className="font-mono text-light-text dark:text-dark-text">
                    {stats.correct}/{stats.total}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const GamePopup: React.FC<GamePopupProps> = ({
  type,
  event,
  onDismiss,
  nextPlayer,
  showYear = true,
  gameState,
}) => {
  const isGameOver = type === 'gameOver';
  const isVisible = isGameOver ? !!gameState : !!event;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  const isDescription = type === 'description';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/50"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl dark:shadow-card-rest-dark transition-colors"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {isGameOver && gameState ? (
              // Game over content
              <GameOverContent gameState={gameState} />
            ) : (
              // Event-based content (description, correct, incorrect)
              event && (
                <>
                  {/* Image section with optional result badge overlay */}
                  <EventImage event={event} type={type} />

                  {/* Year section */}
                  {showYear && <YearBar year={event.year} type={type} />}

                  {/* Description - only for description type */}
                  {isDescription && (
                    <div className="px-4 py-3">
                      <p className="text-light-text dark:text-dark-text text-sm leading-relaxed font-body">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Next player indicator for multiplayer */}
                  {nextPlayer && (
                    <div className="px-4 py-4 border-t border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
                      <p className="text-light-text dark:text-dark-text text-xl text-center font-display">
                        <span className="font-bold">{nextPlayer.name}</span>
                        <span className="text-light-muted dark:text-dark-muted"> is up next</span>
                      </p>
                    </div>
                  )}
                </>
              )
            )}

            {/* Tap to continue hint */}
            <div className="px-4 py-2 border-t border-light-border/50 dark:border-dark-border/50">
              <p className="text-light-muted/60 dark:text-dark-muted/60 text-xs text-center font-body">
                Tap anywhere to continue
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamePopup;
