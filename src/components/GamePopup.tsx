import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatYear } from '../utils/gameLogic';
import { generateEmojiGrid } from '../utils/share';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { DailyResult } from '../utils/playerStorage';
import CategoryIcon from './CategoryIcon';
import LeaderboardSubmit from './LeaderboardSubmit';

interface GamePopupProps {
  type: GamePopupType;
  event: HistoricalEvent | null;
  onDismiss: () => void;
  nextPlayer?: Player;
  showYear?: boolean;
  gameState?: WhenGameState;
}

// Sub-component for result banner (full-width colored banner at top)
function ResultBanner({ isCorrect }: { isCorrect: boolean }) {
  return (
    <div className={`px-4 py-2 flex items-center gap-2 ${isCorrect ? 'bg-success' : 'bg-error'}`}>
      <div className="w-5 h-5 flex items-center justify-center">
        {isCorrect ? (
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        )}
      </div>
      <span className="font-semibold text-lg text-white leading-none">
        {isCorrect ? 'Correct!' : 'Wrong!'}
      </span>
    </div>
  );
}

// Sub-component for event header (title + year)
function EventHeader({
  event,
  showYear,
  isIncorrect,
}: {
  event: HistoricalEvent;
  showYear: boolean;
  isIncorrect?: boolean;
}) {
  return (
    <div className="px-4 py-3 border-b border-border">
      <h2 className="text-lg font-display font-semibold text-text leading-tight">
        {event.friendly_name}
      </h2>
      {showYear && (
        <span
          className={`text-2xl font-bold font-mono mt-1 block ${isIncorrect ? 'text-error' : 'text-accent'}`}
        >
          {formatYear(event.year)}
        </span>
      )}
    </div>
  );
}

// Image dimension constants
const IMAGE_CONTAINER_WIDTH = 340;
const IMAGE_MIN_HEIGHT = 128;
const IMAGE_MAX_HEIGHT = 384;
const IMAGE_DEFAULT_HEIGHT = 192;

// Sub-component for image section (clean, no overlay)
function EventImage({ event }: { event: HistoricalEvent }) {
  const getImageHeight = () => {
    if (!event.image_width || !event.image_height) return IMAGE_DEFAULT_HEIGHT;
    const aspectRatio = event.image_width / event.image_height;
    const calculatedHeight = IMAGE_CONTAINER_WIDTH / aspectRatio;
    return Math.min(Math.max(calculatedHeight, IMAGE_MIN_HEIGHT), IMAGE_MAX_HEIGHT);
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
  const { winners, players, gameMode, placementHistory, lastConfig } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;
  const isSuddenDeath = gameMode === 'suddenDeath' || gameMode === 'daily';
  const isDaily = gameMode === 'daily';

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

  // Build daily result for leaderboard submission
  const dailyResult: DailyResult | null =
    isDaily && lastConfig?.dailySeed
      ? {
          date: lastConfig.dailySeed,
          theme: getThemeDisplayName(getDailyTheme(lastConfig.dailySeed)),
          won: hasWinner,
          correctCount: placementHistory.filter((p) => p).length,
          totalAttempts: placementHistory.length,
          emojiGrid: generateEmojiGrid(placementHistory),
        }
      : null;

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

      {/* Leaderboard submit section for daily mode */}
      {dailyResult && <LeaderboardSubmit dailyResult={dailyResult} />}
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
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm transition-colors"
            onClick={isGameOver ? (e) => e.stopPropagation() : undefined}
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
                  {/* Result banner for correct/incorrect */}
                  {(isCorrect || isIncorrect) && <ResultBanner isCorrect={isCorrect} />}

                  {/* Header with title + year */}
                  <EventHeader event={event} showYear={showYear} isIncorrect={isIncorrect} />

                  {/* Image section */}
                  <EventImage event={event} />

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
