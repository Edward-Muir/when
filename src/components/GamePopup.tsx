import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';
import { HistoricalEvent, Player, GamePopupType, WhenGameState } from '../types';
import { formatYear } from '../utils/gameLogic';
import { generateEmojiGrid } from '../utils/share';
import { getDailyTheme, getThemeDisplayName } from '../utils/dailyTheme';
import { DailyResult, hasSubmittedToLeaderboard } from '../utils/playerStorage';
import CategoryIcon from './CategoryIcon';
import LeaderboardSubmit from './LeaderboardSubmit';
import { getEventColorStyle, getEventTextClass } from '../utils/eventColor';
import { getImageUrl } from '../utils/cloudinaryImage';
import ReportIssueButton from './ReportIssueButton';

interface GamePopupProps {
  type: GamePopupType;
  event: HistoricalEvent | null;
  onDismiss: () => void;
  nextPlayer?: Player;
  showYear?: boolean;
  gameState?: WhenGameState;
  // Tombstoned (failed) event: greyscale image, muted text, surface background —
  // matches the tombstone card treatment on the timeline
  tombstone?: boolean;
  /** The daily rank, once the leaderboard resolves it. Consumed by the sequence's share
   *  step, which is no longer inside this popup. */
  onRankResolved?: (rank: number) => void;
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
  tombstone,
}: {
  event: HistoricalEvent;
  showYear: boolean;
  isIncorrect?: boolean;
  tombstone?: boolean;
}) {
  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  return (
    <div className="px-4 py-3">
      <h2 className={`text-lg font-display font-semibold leading-tight ${textClass}`}>
        {event.friendly_name}
      </h2>
      {showYear && (
        <span
          className={`text-2xl font-bold font-mono mt-1 block ${isIncorrect ? 'text-error' : `${textClass} opacity-100`}`}
        >
          {formatYear(event.year)}
        </span>
      )}
    </div>
  );
}

// Image box, in CSS px. Fixed rather than derived from `image_width`/`image_height`:
// those fields are stale Wikipedia thumbnail dimensions (330x440 on every playable event)
// while the real Cloudinary sources are square, so the old aspect-ratio maths always
// clamped to this maximum anyway — keeping it a constant is pixel-identical to what
// shipped before. The square `detail` image is cropped to fit by `object-cover`.
const IMAGE_CONTAINER_HEIGHT = 384;

// Sub-component for image section (clean, no overlay)
function EventImage({ event, tombstone }: { event: HistoricalEvent; tombstone?: boolean }) {
  // The card the user just tapped already has its thumbnail cached, so painting it as the
  // backdrop makes the popup feel instant while the larger detail image decodes over it.
  // Replaces a per-card eager detail preload that fetched full-size art for every card
  // rendered, opened or not. Same placeholder trick as AchievementCard.
  const placeholderSrc = getImageUrl(event.image_url, 'thumbnail');

  return (
    <div className="relative overflow-hidden" style={{ height: `${IMAGE_CONTAINER_HEIGHT}px` }}>
      {event.image_url ? (
        <img
          src={getImageUrl(event.image_url, 'detail')}
          alt=""
          decoding="async"
          className={`w-full h-full object-cover ${tombstone ? 'grayscale opacity-70' : ''}`}
          style={
            placeholderSrc
              ? {
                  backgroundImage: `url(${placeholderSrc})`,
                  backgroundSize: 'cover',
                  // Must match the <img>'s object-position, which defaults to 50% 50%.
                  // background-position defaults to 0% 0% instead, so without this the
                  // placeholder sits left/top-anchored and the picture visibly jumps
                  // when the detail image loads over it.
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
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
function GameOverContent({
  gameState,
  onLeaderboardSubmit,
  onRankResolved,
}: {
  gameState: WhenGameState;
  onLeaderboardSubmit?: () => void;
  onRankResolved?: (rank: number) => void;
}) {
  const { winners, players, gameMode, placementHistory, lastConfig, bestStreak } = gameState;
  const hasWinner = winners.length > 0;
  const isSinglePlayer = players.length === 1;
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
              <span className="text-2xl font-bold font-mono">
                {getPlayerStats(players[0]).correct}
              </span>
              <span className="text-text-muted">
                {' '}
                {getPlayerStats(players[0]).correct === 1 ? 'event' : 'events'} placed
              </span>
            </p>
            {bestStreak >= 2 && (
              <p className="text-text-muted text-sm mt-1 font-body">Best streak: {bestStreak}x</p>
            )}
            {getEncouragingMessage(getPlayerStats(players[0]).correct) && (
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
      {dailyResult && (
        <LeaderboardSubmit
          dailyResult={dailyResult}
          onSubmitted={onLeaderboardSubmit}
          // Lifted all the way to `Game`, because the share that uses it is no longer a
          // sibling in this popup — it is the last step of the sequence.
          onRankResolved={onRankResolved}
        />
      )}

      {/* No share here, and no "come back tomorrow" either. This popup is the *first* screen
          of the end-of-game sequence (see `useEndOfGameSequence`); both belong on the last
          one, `ShareStepPopup`, which is where the player has seen their milestones and
          badges and is actually finished. */}
    </div>
  );
}

// Hook to gate backdrop dismissal for daily leaderboard submission
function useBackdropDismiss(isDaily: boolean) {
  const [submitted, setSubmitted] = useState(hasSubmittedToLeaderboard);
  const canBackdropDismiss = !isDaily || submitted;
  return { canBackdropDismiss, onLeaderboardSubmit: () => setSubmitted(true) };
}

// Sub-component for event popup content (description, correct, incorrect)
function EventPopupContent({
  type,
  event,
  showYear,
  nextPlayer,
  tombstone,
}: {
  type: GamePopupType;
  event: HistoricalEvent;
  showYear: boolean;
  nextPlayer?: Player;
  tombstone?: boolean;
}) {
  const isCorrect = type === 'correct';
  const isIncorrect = type === 'incorrect';
  const isDescription = type === 'description';

  return (
    <>
      {(isCorrect || isIncorrect) && <ResultBanner isCorrect={isCorrect} />}
      <EventHeader
        event={event}
        showYear={showYear}
        isIncorrect={isIncorrect}
        tombstone={tombstone}
      />
      <EventImage event={event} tombstone={tombstone} />
      {(isDescription || isIncorrect) && (
        <div className="px-4 py-3">
          <p
            className={`${tombstone ? 'text-text-muted' : getEventTextClass(event)} text-sm leading-relaxed font-body`}
          >
            {event.description}
          </p>
        </div>
      )}
      {isDescription && <ReportIssueButton event={event} tombstone={tombstone} />}
      {nextPlayer && (
        <div className="px-4 py-4 border-t border-border">
          <p className={`${getEventTextClass(event)} text-xl text-center font-display`}>
            <span className="font-bold">{nextPlayer.name}</span>
            <span className="opacity-70"> is up next</span>
          </p>
        </div>
      )}
    </>
  );
}

const GamePopup: React.FC<GamePopupProps> = ({
  type,
  event,
  onDismiss,
  nextPlayer,
  showYear = true,
  gameState,
  tombstone = false,
  onRankResolved,
}) => {
  const isGameOver = type === 'gameOver';
  const isVisible = isGameOver ? !!gameState : !!event;
  const { canBackdropDismiss, onLeaderboardSubmit } = useBackdropDismiss(
    isGameOver && gameState?.gameMode === 'daily'
  );

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
          onClick={canBackdropDismiss ? onDismiss : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-border bg-surface shadow-sm transition-colors"
            style={!isGameOver && event && !tombstone ? getEventColorStyle(event) : undefined}
            onClick={isGameOver ? (e) => e.stopPropagation() : undefined}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {isGameOver && gameState ? (
              <>
                <GameOverHeader gameState={gameState} />
                <GameOverContent
                  gameState={gameState}
                  onLeaderboardSubmit={onLeaderboardSubmit}
                  onRankResolved={onRankResolved}
                />
              </>
            ) : (
              event && (
                <EventPopupContent
                  type={type}
                  event={event}
                  showYear={showYear}
                  nextPlayer={nextPlayer}
                  tombstone={tombstone}
                />
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamePopup;
