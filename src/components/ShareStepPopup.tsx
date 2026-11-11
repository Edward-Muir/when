import React, { useState } from 'react';
import { Check, Home, RotateCcw, Rows3, Share2 } from 'lucide-react';
import { WhenGameState } from '../types';
import { shareResults } from '../utils/share';
import { getGameOverEyebrow } from '../utils/gameOverCopy';
import { playerPlaceLine } from '../utils/leaderboardUtils';
import type { DailyLeaderboard } from '../hooks/useDailyLeaderboard';
import Modal from './ui/Modal';
import DailyReminderPrompt from './DailyReminderPrompt';
import NextDailyCountdown from './NextDailyCountdown';

/** What the closing card reads from the board: the same instance `Game` hands the popup. */
type ClosingBoard = Pick<DailyLeaderboard, 'entries' | 'rank' | 'totalPlayers' | 'playerEntry'>;

/**
 * The closing card: the last screen of the end-of-game sequence (gameOver → milestones →
 * achievements → here), and the one that holds the exits.
 *
 * It says which game this was, the score in the gallery's own words ("14 events placed",
 * `correctCount`, no starting card), and the place as the player's row numbers it ("3rd of 16
 * today", tie-aware); then Share, then the way out. Restart and Home sit here because this is
 * the last step: anywhere earlier they would let a player leave before the badges and the share.
 * A Daily offers View timeline (close, leaving the finished board) and Home; a Custom or Archive
 * game Restart and Home.
 *
 * **The share is not this card.** `shareResults` is called exactly as before, so the shared text
 * and image keep the timeline length (`correctCount + 1` on a Daily) and the server's rank. See
 * docs/sharing-challenges.
 *
 * Shell is `ui/Modal` on the `reveal` layer, above the game-over popup's `modal` layer. It holds
 * buttons, so it is not tap-anywhere: the backdrop, ESC and Back close it, as View timeline does.
 * No preview of the story card: that is a canvas pass on every game over rather than on a tap.
 */
const ShareStepPopup: React.FC<{
  open: boolean;
  gameState: WhenGameState;
  /** The daily board. Absent or empty on a game without one, which hides the place line. */
  leaderboard?: ClosingBoard;
  onDismiss: () => void;
  onRestart: () => void;
  /** Home, the one way back: `App`'s `handlePlayAgain`. */
  onHome: () => void;
}> = ({ open, gameState, leaderboard, onDismiss, onRestart, onHome }) => {
  const [showToast, setShowToast] = useState(false);

  const isDaily = gameState.gameMode === 'daily';
  const isChallenge = !!gameState.lastConfig?.challengeCode;
  const correctCount = gameState.placementHistory.filter(Boolean).length;
  const rank = leaderboard?.rank ?? null;
  const place = leaderboard
    ? playerPlaceLine(leaderboard.entries, rank, leaderboard.playerEntry, leaderboard.totalPlayers)
    : null;

  const handleShare = async () => {
    const copied = await shareResults(gameState, { leaderboardRank: rank ?? undefined });
    if (copied) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const secondary =
    'flex-1 h-12 flex items-center justify-center gap-2 rounded-xl border border-border bg-bg text-text font-body font-medium text-sm transition-transform active:scale-[0.97]';

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      dismiss="backdrop"
      backdrop="celebration"
      layer="reveal"
      scroll="card"
      // `relative` anchors the "Copied to clipboard!" toast below — Modal's card is static.
      cardClassName="relative px-5 py-6 flex flex-col items-center text-center"
    >
      <p className="font-mono text-[11px] leading-snug tracking-[0.17em] uppercase text-accent">
        {getGameOverEyebrow(gameState)}
      </p>
      <p className="mt-2 flex items-baseline gap-2 font-body" data-testid="closing-score">
        <span className="font-display font-bold text-[40px] leading-none text-text lining-nums">
          {correctCount}
        </span>{' '}
        <span className="text-[17px] text-text-muted">
          {correctCount === 1 ? 'event' : 'events'} placed
        </span>
      </p>
      {place && <p className="mt-1.5 font-body text-sm font-medium text-accent">{place}</p>}

      {isChallenge && (
        <p className="mt-4 text-xs text-text-muted font-body">
          They&apos;ll play with the same cards in the same order.
        </p>
      )}

      <button
        onClick={handleShare}
        className={`w-full h-[52px] px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body bg-accent-secondary text-white ${
          isChallenge ? 'mt-3' : 'mt-5'
        }`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      <div className="mt-2 flex w-full gap-2">
        {isDaily ? (
          <button onClick={onDismiss} className={secondary}>
            <Rows3 className="w-4 h-4" />
            View timeline
          </button>
        ) : (
          <button onClick={onRestart} className={secondary}>
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        )}
        <button onClick={onHome} className={secondary}>
          <Home className="w-4 h-4" />
          Home
        </button>
      </div>

      {isDaily && (
        <div className="w-full">
          <NextDailyCountdown className="mt-4 block whitespace-nowrap text-center" />
          <DailyReminderPrompt />
        </div>
      )}

      {showToast && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-text text-bg px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2 font-body whitespace-nowrap">
          <Check className="w-4 h-4" />
          Copied to clipboard!
        </div>
      )}
    </Modal>
  );
};

export default ShareStepPopup;
