import { Trophy, Calendar, Zap, Sun, Moon } from 'lucide-react';
import { GameMode } from '../types';
import { useTheme } from '../hooks/useTheme';

interface HeaderProps {
  currentTurn: number;
  totalTurns: number;
  correctPlacements: number;
  isGameOver?: boolean;
  gameMode?: GameMode | null;
}

const Header: React.FC<HeaderProps> = ({
  currentTurn,
  totalTurns,
  correctPlacements,
  isGameOver = false,
  gameMode = 'freeplay',
}) => {
  const { isDark, toggleTheme } = useTheme();
  const displayTurn = Math.min(currentTurn, totalTurns);
  const isSuddenDeath = gameMode === 'suddenDeath';
  const isDaily = gameMode === 'daily';

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-light-border dark:hover:bg-dark-border transition-colors"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-accent-dark" />
      ) : (
        <Moon className="w-5 h-5 text-accent" />
      )}
    </button>
  );

  if (isGameOver) {
    // For sudden death, show streak; for others, show percentage
    const percentage = isSuddenDeath
      ? 0
      : Math.round((correctPlacements / totalTurns) * 100);

    const getMessage = () => {
      if (isSuddenDeath) {
        if (correctPlacements >= 20) return "Legendary! You're a timeline master!";
        if (correctPlacements >= 15) return "Incredible streak! Amazing knowledge!";
        if (correctPlacements >= 10) return "Great run! You really know your history!";
        if (correctPlacements >= 5) return "Good effort! Keep practicing!";
        return "Don't give up! Every mistake is a learning opportunity.";
      }
      if (percentage === 100) return "Perfect score! You're a history master!";
      if (percentage >= 80) return "Excellent! You really know your history!";
      if (percentage >= 60) return "Good job! You have solid historical knowledge.";
      if (percentage >= 40) return "Not bad! Keep learning!";
      return "Keep practicing! History is full of surprises.";
    };

    const getEmoji = () => {
      if (isSuddenDeath) {
        if (correctPlacements >= 20) return "🏆";
        if (correctPlacements >= 15) return "🌟";
        if (correctPlacements >= 10) return "🔥";
        if (correctPlacements >= 5) return "👍";
        return "💪";
      }
      if (percentage === 100) return "🏆";
      if (percentage >= 80) return "🌟";
      if (percentage >= 60) return "👍";
      if (percentage >= 40) return "📚";
      return "💪";
    };

    const getTitle = () => {
      if (isDaily) return "Daily Complete!";
      if (isSuddenDeath) return "Game Over!";
      return "Game Over!";
    };

    const getModeIcon = () => {
      if (isDaily) return <Calendar className="w-6 h-6 text-accent dark:text-accent-dark" />;
      if (isSuddenDeath) return <Zap className="w-6 h-6 text-error" />;
      return <Trophy className="w-6 h-6 text-accent dark:text-accent-dark" />;
    };

    return (
      <header className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <h1 className="text-2xl sm:text-3xl text-light-text dark:text-dark-text font-bold font-display">{getTitle()}</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-col gap-2">
          {isSuddenDeath ? (
            <>
              <div className="text-3xl font-bold text-error font-display">
                Streak: {correctPlacements}
              </div>
              <div className="text-sm text-light-muted dark:text-dark-muted font-body">
                {correctPlacements} event{correctPlacements !== 1 ? 's' : ''} placed correctly {getEmoji()}
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-accent dark:text-accent-dark font-display">
                {correctPlacements}/{totalTurns}
              </div>
              <div className="text-sm text-light-muted dark:text-dark-muted font-body">
                {percentage}% correct {getEmoji()}
              </div>
            </>
          )}
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1 font-body">{getMessage()}</p>
        </div>
      </header>
    );
  }

  // During gameplay
  return (
    <header className="flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl sm:text-3xl text-light-text dark:text-dark-text font-bold font-display">When?</h1>
        <ThemeToggle />
      </div>
      <div className="flex flex-col gap-2 text-light-muted dark:text-dark-muted font-body">
        {isSuddenDeath ? (
          // Sudden death: show streak counter
          <span className="text-sm px-3 py-1 bg-error/20 dark:bg-error/30 text-error rounded-full inline-block w-fit">
            Streak: {correctPlacements}
          </span>
        ) : (
          // Daily/Freeplay: show turn counter and score
          <>
            <span className="text-sm">
              Turn {displayTurn}/{totalTurns}
            </span>
            <span className="text-sm px-3 py-1 bg-accent/20 dark:bg-accent-dark/30 text-accent dark:text-accent-dark rounded-full inline-block w-fit">
              Score: {correctPlacements}/{displayTurn > 0 ? displayTurn - 1 : 0}
            </span>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
