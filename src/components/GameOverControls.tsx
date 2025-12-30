import { RotateCcw, Home, Share2 } from 'lucide-react';
import { WhenGameState } from '../types';
import { shareResults } from '../utils/share';

interface GameOverControlsProps {
  state: WhenGameState;
  onRestart: () => void;
  onNewGame: () => void;
  onShowToast: () => void;
}

const GameOverControls: React.FC<GameOverControlsProps> = ({
  state,
  onRestart,
  onNewGame,
  onShowToast,
}) => {
  const handleShare = async () => {
    const showClipboardToast = await shareResults(state);
    if (showClipboardToast) {
      onShowToast();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center gap-4 px-4 pointer-events-auto">
      {/* Share button */}
      <button
        onClick={handleShare}
        className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
      >
        <Share2 className="w-6 h-6" />
        <span className="text-xs font-medium font-body">Share</span>
      </button>

      {/* Restart button (not shown for daily mode) */}
      {state.gameMode !== 'daily' && (
        <button
          onClick={onRestart}
          className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white rounded-2xl shadow-lg transition-all duration-200 active:scale-95"
        >
          <RotateCcw className="w-6 h-6" />
          <span className="text-xs font-medium font-body">Restart</span>
        </button>
      )}

      {/* Home button */}
      <button
        onClick={onNewGame}
        className="flex flex-col items-center justify-center gap-1 w-20 h-20 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-border/50 dark:hover:bg-dark-border/50 text-light-text dark:text-dark-text rounded-2xl shadow transition-all duration-200 active:scale-95"
      >
        <Home className="w-6 h-6" />
        <span className="text-xs font-medium font-body">Home</span>
      </button>
    </div>
  );
};

export default GameOverControls;
