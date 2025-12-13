import React, { useEffect } from 'react';
import { HistoricalEvent } from '../types';
import { formatYear, getCategoryDisplayName, getCategoryColorClass } from '../utils/gameLogic';
import CategoryIcon from './CategoryIcon';

interface ExpandedCardProps {
  event: HistoricalEvent | null;
  onClose: () => void;
  showYear?: boolean;
}

const getCategoryBorderColor = (category: string): string => {
  const colors: Record<string, string> = {
    'conflict': 'border-red-400',
    'disasters': 'border-gray-500',
    'exploration': 'border-teal-400',
    'cultural': 'border-purple-400',
    'infrastructure': 'border-amber-400',
    'diplomatic': 'border-blue-400',
  };
  return colors[category] || 'border-gray-400';
};

const getCategoryTitleBg = (category: string): string => {
  const colors: Record<string, string> = {
    'conflict': 'bg-red-100',
    'disasters': 'bg-gray-200',
    'exploration': 'bg-teal-100',
    'cultural': 'bg-purple-100',
    'infrastructure': 'bg-amber-100',
    'diplomatic': 'bg-blue-100',
  };
  return colors[category] || 'bg-gray-100';
};

const ExpandedCard: React.FC<ExpandedCardProps> = ({ event, onClose, showYear = true }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (event) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [event, onClose]);

  if (!event) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25"
      onClick={onClose}
    >
      <div
        className={`w-[280px] sm:w-[320px] rounded-lg overflow-hidden border-2 ${getCategoryBorderColor(event.category)} bg-white shadow-xl`}
      >
        {/* Title bar */}
        <div className={`${getCategoryTitleBg(event.category)} px-3 py-2 border-b ${getCategoryBorderColor(event.category)}`}>
          <span className="text-sketch text-sm font-medium leading-tight block">
            {event.friendly_name}
          </span>
          {showYear && (
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs text-white ${getCategoryColorClass(event.category)}`}>
                {getCategoryDisplayName(event.category)}
              </span>
              <span className="text-sketch/70 text-sm font-medium">
                {formatYear(event.year)}
              </span>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="w-full h-48 sm:h-56">
          {event.image_url ? (
            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <CategoryIcon category={event.category} className="text-gray-400 w-16 h-16" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-3 max-h-32 overflow-y-auto">
          <p className="text-sketch/80 text-sm leading-relaxed">{event.description}</p>
        </div>

        {/* Close hint */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
          <p className="text-center text-sketch/40 text-xs">Tap anywhere to close</p>
        </div>
      </div>
    </div>
  );
};

export default ExpandedCard;
