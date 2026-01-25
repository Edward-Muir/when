import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface EventNavigationProps {
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
}

export function EventNavigation({
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  onJump,
}: EventNavigationProps) {
  const [jumpValue, setJumpValue] = useState('');

  const handleJump = () => {
    const index = parseInt(jumpValue, 10) - 1; // Convert to 0-based
    if (!isNaN(index) && index >= 0 && index < totalCount) {
      onJump(index);
      setJumpValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJump();
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          title="Previous event (Arrow Left)"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-[100px] text-center text-sm text-text-secondary">
          {currentIndex + 1} of {totalCount}
        </span>

        <button
          onClick={onNext}
          disabled={currentIndex === totalCount - 1}
          className="flex h-8 w-8 items-center justify-center rounded border border-border text-text-secondary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          title="Next event (Arrow Right)"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-text-secondary">Jump to:</label>
        <input
          type="number"
          min={1}
          max={totalCount}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="#"
          className="w-16 rounded border border-border bg-white px-2 py-1 text-center text-sm text-text focus:border-accent focus:outline-none"
        />
        <button
          onClick={handleJump}
          disabled={!jumpValue}
          className="rounded bg-bg-secondary px-2 py-1 text-sm text-text-secondary transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
        >
          Go
        </button>
      </div>
    </div>
  );
}
