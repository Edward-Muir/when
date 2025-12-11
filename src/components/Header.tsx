import React from 'react';
import { Trophy } from 'lucide-react';

interface HeaderProps {
  currentTurn: number;
  totalTurns: number;
  correctPlacements: number;
  isGameOver?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentTurn, totalTurns, correctPlacements, isGameOver = false }) => {
  const displayTurn = Math.min(currentTurn, totalTurns);

  if (isGameOver) {
    const percentage = Math.round((correctPlacements / totalTurns) * 100);

    const getMessage = () => {
      if (percentage === 100) return "Perfect score! You're a history master!";
      if (percentage >= 80) return "Excellent! You really know your history!";
      if (percentage >= 60) return "Good job! You have solid historical knowledge.";
      if (percentage >= 40) return "Not bad! Keep learning!";
      return "Keep practicing! History is full of surprises.";
    };

    const getEmoji = () => {
      if (percentage === 100) return "🏆";
      if (percentage >= 80) return "🌟";
      if (percentage >= 60) return "👍";
      if (percentage >= 40) return "📚";
      return "💪";
    };

    return (
      <header className="flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-6 h-6 text-amber-600" />
          <h1 className="text-2xl sm:text-3xl text-sketch font-bold">Game Over!</h1>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-3xl font-bold text-amber-600">
            {correctPlacements}/{totalTurns}
          </div>
          <div className="text-sm text-sketch/70">
            {percentage}% correct {getEmoji()}
          </div>
          <p className="text-xs text-sketch/60 mt-1">{getMessage()}</p>
        </div>
      </header>
    );
  }

  return (
    <header className="flex-shrink-0">
      <h1 className="text-2xl sm:text-3xl text-sketch font-bold mb-3">When?</h1>
      <div className="flex flex-col gap-2 text-sketch/80">
        <span className="text-sm">
          Turn {displayTurn}/{totalTurns}
        </span>
        <span className="text-sm px-3 py-1 bg-amber-100 rounded-full inline-block w-fit">
          Score: {correctPlacements}/{displayTurn > 0 ? displayTurn - 1 : 0}
        </span>
      </div>
    </header>
  );
};

export default Header;
