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
  isFirst = false,
  isLast = false,
}) => {
  return (
    <button
      onClick={() => onPlace(index)}
      disabled={disabled}
      className={`
        w-full py-3 px-4 my-1
        flex items-center justify-center gap-2
        border-2 border-dashed rounded-lg
        transition-all duration-200
        touch-manipulation
        ${disabled
          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'border-amber-400 bg-amber-50 hover:bg-amber-100 hover:border-amber-500 active:bg-amber-200 text-amber-700'
        }
      `}
    >
      <Plus className="w-5 h-5" />
      <span className="text-sm font-medium">
        {isFirst ? 'Place at start' : isLast ? 'Place at end' : 'Place here'}
      </span>
    </button>
  );
};

export default PlacementButton;
