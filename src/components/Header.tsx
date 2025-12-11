import React from 'react';

interface HeaderProps {
  currentTurn: number;
  totalTurns: number;
  correctPlacements: number;
}

const Header: React.FC<HeaderProps> = ({ currentTurn, totalTurns, correctPlacements }) => {
  const displayTurn = Math.min(currentTurn, totalTurns);

  return (
    <header className="flex-shrink-0 bg-amber-900/10 border-b border-amber-900/20 px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-xl sm:text-2xl text-sketch font-bold">When?</h1>
        <div className="flex items-center gap-4 text-sketch/80">
          <span className="text-sm sm:text-base">
            Turn {displayTurn}/{totalTurns}
          </span>
          <span className="text-sm sm:text-base px-3 py-1 bg-amber-100 rounded-full">
            Score: {correctPlacements}/{displayTurn > 0 ? displayTurn - 1 : 0}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
