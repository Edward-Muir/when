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
    <div className="flex flex-col gap-2 pointer-events-auto">
      <button
        onClick={handleShare}
        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {state.gameMode !== 'daily' && (
        <button
          onClick={onRestart}
          className="w-full py-3 px-4 bg-accent hover:bg-accent/90 dark:bg-accent-dark dark:hover:bg-accent-dark/90 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </button>
      )}

      <button
        onClick={onNewGame}
        className="w-full py-3 px-4 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:bg-light-border/50 dark:hover:bg-dark-border/50 text-light-text dark:text-dark-text text-sm font-medium rounded-xl shadow transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 font-body"
      >
        <Home className="w-4 h-4" />
        Home
      </button>
    </div>
  );
};

export default GameOverControls;
