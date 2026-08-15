import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { WhenGameState } from '../types';
import { shareResults } from '../utils/share';
import Modal from './ui/Modal';
import DailyReminderPrompt from './DailyReminderPrompt';
import NextDailyCountdown from './NextDailyCountdown';

/**
 * The last screen of the end-of-game sequence: gameOver → milestones → achievements → here.
 *
 * The share used to live inside the game-over popup, i.e. the *first* screen, so it went out
 * before the player knew what they had unlocked, and the genuinely final beat was a button in
 * the bottom bar nobody looks at. This is the finale instead, and it always renders — see
 * `useEndOfGameSequence`.
 *
 * The daily's return hooks (reminder opt-in, next-daily countdown) moved here with it. They
 * are the "come back tomorrow" beat, so they belong on the last screen rather than three
 * screens earlier.
 *
 * No preview of the story card: rendering it would mean a `renderShareCard` canvas pass on
 * every single game over rather than only when someone actually taps Share, and this surface
 * has real Cloudinary cost discipline behind it (docs/cloudinary-cost-controls.md).
 *
 * Shell is `ui/Modal` on the `reveal` layer, the same as `MilestonePopup` / `AchievementUnlock`,
 * so it sits above the game-over popup's `modal` layer — and like them it advances on a tap
 * anywhere. The Share button and the reminder prompt stop their own clicks so that using them
 * does not also dismiss the popup.
 */
const ShareStepPopup: React.FC<{
  open: boolean;
  gameState: WhenGameState;
  /** Null until the board resolves a placing, which for a custom game is never. */
  leaderboardRank?: number | null;
  onDismiss: () => void;
}> = ({ open, gameState, leaderboardRank, onDismiss }) => {
  const [showToast, setShowToast] = useState(false);

  const isDaily = gameState.gameMode === 'daily';
  const isChallenge = !!gameState.lastConfig?.challengeCode;
  const correctCount = gameState.placementHistory.filter(Boolean).length;
  // The daily counts the pre-placed seed card, matching the share text and the story card.
  const timelineLength = isDaily ? correctCount + 1 : correctCount;

  // In tap-advance the card no longer swallows clicks, so anything interactive has to stop its
  // own — otherwise sharing or answering the reminder would also close the popup.
  const keepOpen = (e: React.MouseEvent) => e.stopPropagation();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const copied = await shareResults(gameState, { leaderboardRank: leaderboardRank ?? undefined });
    if (copied) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      // Tap anywhere to finish, like the milestone and achievement steps before it. The share
      // is an offer, not a required step, so it must not be the only way off this screen.
      dismiss="tap-advance"
      backdrop="celebration"
      layer="reveal"
      // `relative` anchors the "Copied to clipboard!" toast below — Modal's card is static.
      cardClassName="relative px-5 py-6 flex flex-col items-center text-center"
    >
      <p className="font-body text-text">
        <span className="font-mono text-3xl font-bold">{timelineLength}</span>
        <span className="text-text-muted"> {timelineLength === 1 ? 'event' : 'events'}</span>
      </p>
      {leaderboardRank && (
        <p className="mt-1 font-body text-sm text-accent">#{leaderboardRank} globally</p>
      )}

      {isChallenge && (
        <p className="mt-4 text-xs text-text-muted font-body">
          They&apos;ll play with the same cards in the same order.
        </p>
      )}

      <button
        onClick={handleShare}
        className={`w-full py-2.5 px-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body bg-accent-secondary hover:bg-accent-secondary/90 text-white ${
          isChallenge ? 'mt-3' : 'mt-5'
        }`}
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isDaily && (
        <div className="w-full">
          {/* Has its own Remind me / Not now buttons, so it opts out of tap-to-continue. */}
          <div onClick={keepOpen}>
            <DailyReminderPrompt />
          </div>
          <p className="text-center text-text-muted text-sm mt-4 font-body">
            Come back tomorrow · <NextDailyCountdown />
          </p>
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
