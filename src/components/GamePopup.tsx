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

// Sub-component for event header (title + year)
function EventHeader({ event, showYear }: { event: HistoricalEvent; showYear: boolean }) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <h2 className="text-lg font-display font-semibold text-text leading-tight">
        {event.friendly_name}
      </h2>
      {showYear && (
        <span className="text-2xl font-bold font-mono text-accent mt-1 block">
          {formatYear(event.year)}
        </span>
      )}
    </div>
  );
}

// Sub-component for image section (clean, no overlay)
function EventImage({ event, type }: { event: HistoricalEvent; type: GamePopupType }) {
  const isResult = type === 'correct' || type === 'incorrect';
  const isCorrect = type === 'correct';

  // Calculate dynamic height based on image dimensions
  const CONTAINER_WIDTH = 340;
  const MIN_HEIGHT = 128;
  const MAX_HEIGHT = 384;
  const DEFAULT_HEIGHT = 192;

  const getImageHeight = () => {
    if (!event.image_width || !event.image_height) return DEFAULT_HEIGHT;
    const aspectRatio = event.image_width / event.image_height;
    const calculatedHeight = CONTAINER_WIDTH / aspectRatio;
    return Math.min(Math.max(calculatedHeight, MIN_HEIGHT), MAX_HEIGHT);
  };

  const imageHeight = getImageHeight();

  return (
    <div className="relative overflow-hidden" style={{ height: `${imageHeight}px` }}>
      {event.image_url ? (
        <img src={event.image_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-border/30">
          <CategoryIcon category={event.category} className="text-text-muted w-16 h-16" />
        </div>
      )}

      {/* Result badge overlay for correct/incorrect */}
      {isResult && <ResultBadge isCorrect={isCorrect} />}
    </div>
  );
}

// Sub-component for game over header
function GameOverHeader({ gameState }: { gameState: WhenGameState }) {
  const { winners, players } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;

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
    const names = winners.map((w) => w.name);
    const lastWinner = names.pop();
    return `${names.join(', ')} & ${lastWinner} Win!`;
  };

  return (
    <div className="px-4 py-3 border-b border-border">
      <h2 className="text-lg font-display font-semibold text-text">{getWinnerText()}</h2>
    </div>
  );
}

// Sub-component for game over content (stats only, header moved out)
function GameOverContent({ gameState }: { gameState: WhenGameState }) {
  const { winners, players, gameMode } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;
  const isSuddenDeath = gameMode === 'suddenDeath' || gameMode === 'daily';

  const getPlayerStats = (player: Player) => {
    const correct = player.placementHistory.filter((p) => p).length;
    const total = player.placementHistory.length;
    return { correct, total };
  };

  const getEncouragingMessage = (eventsPlaced: number): string | null => {
    if (eventsPlaced >= 12) return 'Legendary!';
    if (eventsPlaced >= 8) return 'History buff!';
    if (eventsPlaced >= 5) return 'Impressive!';
    if (eventsPlaced >= 3) return 'Good start!';
    return null;
  };

  return (
    <div className="px-4 py-4">
      {/* Trophy icon */}
      <div className="flex justify-center mb-4">
        <Trophy className={`w-10 h-10 ${hasWinner ? 'text-accent' : 'text-text-muted'}`} />
      </div>

      {/* Stats section */}
      <div className="space-y-3">
        {isSinglePlayer ? (
          <div className="text-center">
            <p className="text-text font-body">
              {isSuddenDeath ? (
                <>
                  <span className="text-2xl font-bold font-mono">
                    {getPlayerStats(players[0]).correct}
                  </span>
                  <span className="text-text-muted">
                    {' '}
                    {getPlayerStats(players[0]).correct === 1 ? 'event' : 'events'} placed
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl font-bold font-mono">
                    {getPlayerStats(players[0]).correct}
                  </span>
                  <span className="text-text-muted">
                    {' '}
                    / {getPlayerStats(players[0]).total} correct
                  </span>
                </>
              )}
            </p>
            {isSuddenDeath && getEncouragingMessage(getPlayerStats(players[0]).correct) && (
              <p className="text-accent font-medium mt-2">
                {getEncouragingMessage(getPlayerStats(players[0]).correct)}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => {
              const stats = getPlayerStats(player);
              const isWinner = winners.some((w) => w.id === player.id);
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isWinner ? 'bg-accent/20' : 'bg-bg'
                  }`}
                >
                  <span className="font-body text-text">
                    {player.name}
                    {isWinner && <Trophy className="inline-block w-4 h-4 ml-1 text-accent" />}
                  </span>
                  <span className="font-mono text-text">
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
  const isCorrect = type === 'correct';
  const isIncorrect = type === 'incorrect';

  // Determine top border color for feedback
  const getBorderClass = () => {
    if (isCorrect) return 'border-t-4 border-t-success';
    if (isIncorrect) return 'border-t-4 border-t-error';
    return '';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={onDismiss}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm transition-colors ${getBorderClass()}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {isGameOver && gameState ? (
              <>
                <GameOverHeader gameState={gameState} />
                <GameOverContent gameState={gameState} />
              </>
            ) : (
              event && (
                <>
                  {/* Header with title + year */}
                  <EventHeader event={event} showYear={showYear} />

                  {/* Image section (clean, no overlay text) */}
                  <EventImage event={event} type={type} />

                  {/* Description - only for description type */}
                  {isDescription && (
                    <div className="px-4 py-3">
                      <p className="text-text text-sm leading-relaxed font-body">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Next player indicator for multiplayer */}
                  {nextPlayer && (
                    <div className="px-4 py-4 border-t border-border bg-bg">
                      <p className="text-text text-xl text-center font-display">
                        <span className="font-bold">{nextPlayer.name}</span>
                        <span className="text-text-muted"> is up next</span>
                      </p>
                    </div>
                  )}
                </>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamePopup;
