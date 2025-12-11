import React from 'react';
import { Plus } from 'lucide-react';

interface PlacementButtonProps {
  index: number;
  onPlace: (index: number) => void;
  disabled?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const PlacementButton: React.FC<PlacementButtonProps> = ({
  index,
  onPlace,
  disabled = false,
}) => {
  return (
    <div className="flex items-center py-1 relative z-20">
      {/* Empty space for date column alignment - matches TimelineEvent */}
      <div className="w-14 sm:w-16 shrink-0" />
      {/* Button aligned with cards */}
      <div className="w-36 sm:w-40 ml-4 flex justify-center">
        <button
          onClick={() => onPlace(index)}
          disabled={disabled}
          className={`
            w-12 h-12
            flex items-center justify-center
            rounded-full
            border-2
            transition-all duration-150
            touch-manipulation
            shadow-md
            ${disabled
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-amber-400 bg-amber-100 hover:bg-amber-200 hover:border-amber-500 active:scale-95 active:bg-amber-300 text-amber-700'
            }
          `}
          aria-label="Place card here"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PlacementButton;
