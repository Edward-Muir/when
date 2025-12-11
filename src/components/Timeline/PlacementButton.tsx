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
    <div className="flex justify-center py-1 relative z-20">
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
  );
};

export default PlacementButton;
