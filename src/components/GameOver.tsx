import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

interface GameOverProps {
  score: number;
  total: number;
  onPlayAgain: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, total, onPlayAgain }) => {
  const percentage = Math.round((score / total) * 100);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream">
      <div className="bg-paper rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Trophy icon */}
        <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Trophy className="w-10 h-10 text-amber-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-sketch mb-2">Game Over!</h1>

        {/* Score */}
        <div className="my-6">
          <div className="text-6xl font-bold text-amber-600 mb-2">
            {score}/{total}
          </div>
          <div className="text-xl text-sketch/60">
            {percentage}% correct {getEmoji()}
          </div>
        </div>

        {/* Message */}
        <p className="text-sketch/70 mb-8">{getMessage()}</p>

        {/* Play again button */}
        <button
          onClick={onPlayAgain}
          className="
            w-full py-4 px-6
            bg-gradient-to-r from-amber-500 to-amber-600
            hover:from-amber-600 hover:to-amber-700
            text-white text-lg font-medium
            rounded-xl shadow-lg
            transition-all duration-200
            flex items-center justify-center gap-2
            active:scale-95
          "
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOver;
