import { Trophy, Calendar, Zap } from 'lucide-react';
import { GameMode } from '../types';

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
  const displayTurn = Math.min(currentTurn, totalTurns);
  const isSuddenDeath = gameMode === 'suddenDeath';
  const isDaily = gameMode === 'daily';

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
      if (isDaily) return <Calendar className="w-6 h-6 text-amber-600" />;
      if (isSuddenDeath) return <Zap className="w-6 h-6 text-red-500" />;
      return <Trophy className="w-6 h-6 text-amber-600" />;
    };

    return (
      <header className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          {getModeIcon()}
          <h1 className="text-2xl sm:text-3xl text-sketch font-bold">{getTitle()}</h1>
        </div>
        <div className="flex flex-col gap-2">
          {isSuddenDeath ? (
            <>
              <div className="text-3xl font-bold text-red-500">
                Streak: {correctPlacements}
              </div>
              <div className="text-sm text-sketch/70">
                {correctPlacements} event{correctPlacements !== 1 ? 's' : ''} placed correctly {getEmoji()}
              </div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-amber-600">
                {correctPlacements}/{totalTurns}
              </div>
              <div className="text-sm text-sketch/70">
                {percentage}% correct {getEmoji()}
              </div>
            </>
          )}
          <p className="text-xs text-sketch/60 mt-1">{getMessage()}</p>
        </div>
      </header>
    );
  }

  // During gameplay
  return (
    <header className="flex-shrink-0">
      <h1 className="text-2xl sm:text-3xl text-sketch font-bold mb-3">When?</h1>
      <div className="flex flex-col gap-2 text-sketch/80">
        {isSuddenDeath ? (
          // Sudden death: show streak counter
          <span className="text-sm px-3 py-1 bg-red-100 rounded-full inline-block w-fit">
            Streak: {correctPlacements}
          </span>
        ) : (
          // Daily/Freeplay: show turn counter and score
          <>
            <span className="text-sm">
              Turn {displayTurn}/{totalTurns}
            </span>
            <span className="text-sm px-3 py-1 bg-amber-100 rounded-full inline-block w-fit">
              Score: {correctPlacements}/{displayTurn > 0 ? displayTurn - 1 : 0}
            </span>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
