import React from 'react';
import { Eye, Play, Share2, Trophy } from 'lucide-react';
import NextDailyCountdown from './NextDailyCountdown';

interface DailyCtaProps {
  played: boolean;
  /** Today's score exists and is not on the board (see `canSubmitScore` in ModeSelect). */
  unclaimed: boolean;
  onShare: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  /** Today's finished board can be restored, so the review button has somewhere to go. */
  canReview?: boolean;
  onReview?: () => void;
  /** The strip pointing here is up: halo the eye, since the copy no longer names it. */
  reviewNudge?: boolean;
  /** The "tap the button above" strip is up: make the Play button the obvious thing. */
  nudge?: boolean;
}

/**
 * The Daily hero card's call to action: Play when unplayed; Share plus the next-daily
 * countdown when already completed today, or, when today's score is not on the board, the
 * way to put it there. No "How to play" link here: it cost the hero image 48px for every
 * player forever. The Daily tab's once-only strip (`ModeSelect`) and the menu carry it.
 *
 * Once the daily is done an eye sits beside whichever of those is showing, reopening the board
 * the player built so the cards can be read. It is an icon on the end of the row rather than a
 * button of its own so the hero image keeps its height and the share stays the primary action.
 */
const DailyCta: React.FC<DailyCtaProps> = ({
  played,
  unclaimed,
  onShare,
  onPlay,
  onSubmit,
  canReview = false,
  onReview,
  reviewNudge = false,
  nudge = false,
}) => {
  const buttonClass =
    'py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body';

  if (played) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full flex items-stretch gap-2">
          {/* An unclaimed score takes the share slot for as long as it is unclaimed. Sharing a
              score is the lesser thing to offer someone whose score did not make the board, and
              this is the only route back to submitting once the game-over popup is gone. */}
          {unclaimed ? (
            <button onClick={onSubmit} className={`${buttonClass} flex-1 min-w-0`}>
              <Trophy className="w-4 h-4" />
              Submit Your Score
            </button>
          ) : (
            <button onClick={onShare} className={`${buttonClass} flex-1 min-w-0`}>
              <Share2 className="w-4 h-4" />
              Challenge a Friend
            </button>
          )}
          {canReview && (
            <button
              onClick={onReview}
              aria-label="Review today's timeline"
              className={`shrink-0 w-[52px] flex items-center justify-center rounded-xl bg-surface border border-border text-text hover:bg-border transition-colors active:scale-95 ${
                reviewNudge ? 'animate-hint-halo' : ''
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
        </div>
        <NextDailyCountdown />
      </div>
    );
  }

  return (
    <button
      onClick={onPlay}
      className={`${buttonClass} w-full ${nudge ? 'animate-hint-glow' : ''}`}
    >
      <Play className="w-4 h-4" />
      Play Daily Challenge
    </button>
  );
};

export default DailyCta;
