import React from 'react';
import { Play, Share2, Trophy } from 'lucide-react';
import NextDailyCountdown from './NextDailyCountdown';

interface DailyCtaProps {
  played: boolean;
  /** Today's score exists and is not on the board (see `canSubmitScore` in ModeSelect). */
  unclaimed: boolean;
  onShare: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  /** The "tap the button above" strip is up: make the Play button the obvious thing. */
  nudge?: boolean;
}

/**
 * The Daily hero card's call to action: Play when unplayed; Share plus the next-daily
 * countdown when already completed today, or, when today's score is not on the board, the
 * way to put it there. No "How to play" link here: it cost the hero image 48px for every
 * player forever. The Daily tab's once-only strip (`ModeSelect`) and the menu carry it.
 */
const DailyCta: React.FC<DailyCtaProps> = ({
  played,
  unclaimed,
  onShare,
  onPlay,
  onSubmit,
  nudge = false,
}) => {
  const buttonClass =
    'w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body';

  if (played) {
    return (
      <div className="w-full flex flex-col items-center gap-2">
        {/* An unclaimed score takes the share slot for as long as it is unclaimed. Sharing a
            score is the lesser thing to offer someone whose score did not make the board, and
            this is the only route back to submitting once the game-over popup is gone. */}
        {unclaimed ? (
          <button onClick={onSubmit} className={buttonClass}>
            <Trophy className="w-4 h-4" />
            Submit Your Score
          </button>
        ) : (
          <button onClick={onShare} className={buttonClass}>
            <Share2 className="w-4 h-4" />
            Challenge a Friend
          </button>
        )}
        <NextDailyCountdown />
      </div>
    );
  }

  return (
    <button onClick={onPlay} className={`${buttonClass} ${nudge ? 'animate-hint-glow' : ''}`}>
      <Play className="w-4 h-4" />
      Play Daily Challenge
    </button>
  );
};

export default DailyCta;
