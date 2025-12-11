import React from 'react';

interface HeaderProps {
  currentTurn: number;
  totalTurns: number;
  correctPlacements: number;
}

const Header: React.FC<HeaderProps> = ({ currentTurn, totalTurns, correctPlacements }) => {
  const displayTurn = Math.min(currentTurn, totalTurns);

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
