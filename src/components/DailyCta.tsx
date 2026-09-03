import React from 'react';
import { HelpCircle, Play, Share2, Trophy } from 'lucide-react';
import NextDailyCountdown from './NextDailyCountdown';

interface DailyCtaProps {
  played: boolean;
  /** Today's score exists and is not on the board (see `canSubmitScore` in ModeSelect). */
  unclaimed: boolean;
  onShare: () => void;
  onPlay: () => void;
  onSubmit: () => void;
  onHowToPlay: () => void;
}

/**
 * The Daily hero card's call to action: Play when unplayed; Share plus the next-daily
 * countdown when already completed today, or, when today's score is not on the board, the
 * way to put it there. Always followed by the "How to play" link: the rules are one tap
 * from the one place every player looks, whatever state the day is in.
 */
const DailyCta: React.FC<DailyCtaProps> = ({
  played,
  unclaimed,
  onShare,
  onPlay,
  onSubmit,
  onHowToPlay,
}) => {
  const buttonClass =
    'w-full py-3.5 px-4 bg-accent hover:bg-accent/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 font-body';

  const howToPlay = (
    <button
      onClick={onHowToPlay}
      className="mt-1 w-full min-h-[44px] flex items-center justify-center gap-1.5 text-sm text-text-muted font-body underline underline-offset-2 hover:text-text transition-colors"
    >
      <HelpCircle className="w-4 h-4" aria-hidden="true" />
      How to play
    </button>
  );

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
        {howToPlay}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <button onClick={onPlay} className={buttonClass}>
        <Play className="w-4 h-4" />
        Play Daily Challenge
      </button>
      {howToPlay}
    </div>
  );
};

export default DailyCta;
