import { RotateCcw, Home, Share2 } from 'lucide-react';
import { WhenGameState } from '../types';
import { getTodayResult } from '../utils/playerStorage';
import { shareResults } from '../utils/share';

interface GameOverControlsProps {
  state: WhenGameState;
  onRestart: () => void;
  onNewGame: () => void;
  onShowToast: () => void;
  /**
   * False while the game-over popup or any end-of-game step is up. Those screens own the share
   * and, on the last one, Restart and Home; the bar's buttons are the fallback for once they are
   * gone. Shown through the scrim they did nothing, and a second Share beside the popup's was
   * one too many.
   */
  visible?: boolean;
}

const GameOverControls: React.FC<GameOverControlsProps> = ({
  state,
  onRestart,
  onNewGame,
  onShowToast,
  visible = true,
}) => {
  const handleShare = async () => {
    // The rank, if the player has already submitted. This bar is the fallback route once the
    // game-over popup has been dismissed, so it has no popup state to read from — but the
    // stored daily result is the same value `LeaderboardSubmit` wrote, which keeps the two
    // share routes producing the same message.
    const leaderboardRank =
      state.gameMode === 'daily' ? getTodayResult()?.leaderboardRank : undefined;
    const showClipboardToast = await shareResults(state, { leaderboardRank });
    if (showClipboardToast) {
      onShowToast();
    }
  };

  // The bar keeps its height, so the board does not move when the buttons come back.
  if (!visible) return <div className="flex-1" />;

  return (
    <div className="flex-1 flex items-center justify-center gap-4 px-4 pointer-events-auto">
      <button
        onClick={handleShare}
        className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-accent-secondary hover:bg-accent-secondary/90 text-white rounded-2xl shadow-sm transition-all duration-200 active:scale-95"
      >
        <Share2 className="w-6 h-6" />
        {/* Always "Share". It said "Challenge" for daily and challenge-code games, which is
            a different verb from every other share surface and implies a challenge-code
            game that the daily is not. */}
        <span className="text-sm font-medium font-body">Share</span>
      </button>

      {/* Restart button (not shown for daily mode) */}
      {state.gameMode !== 'daily' && (
        <button
          onClick={onRestart}
          className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-accent hover:bg-accent/90 text-white rounded-2xl shadow-sm transition-all duration-200 active:scale-95"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="text-sm font-medium font-body">Restart</span>
        </button>
      )}

      {/* Home button */}
      <button
        onClick={onNewGame}
        className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-surface border border-border hover:bg-border/50 text-text rounded-2xl shadow-sm transition-all duration-200 active:scale-95"
      >
        <Home className="w-6 h-6" />
        <span className="text-sm font-medium font-body">Home</span>
      </button>
    </div>
  );
};

export default GameOverControls;
