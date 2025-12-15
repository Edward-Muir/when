import React, { useEffect } from 'react';
import { HistoricalEvent } from '../types';
import { formatYear } from '../utils/gameLogic';
import CategoryIcon from './CategoryIcon';

interface ExpandedCardProps {
  event: HistoricalEvent | null;
  onClose: () => void;
  showYear?: boolean;
}

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-[85vw] max-w-[340px] sm:max-w-[400px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl dark:shadow-card-rest-dark transition-colors"
      >
        {/* Image with title overlay */}
        <div className="h-56 sm:h-64 relative overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
              <CategoryIcon category={event.category} className="text-light-muted dark:text-dark-muted w-20 h-20" />
            </div>
          )}

          {/* Title overlay with gradient backdrop */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pt-12 pb-3">
            <span className="text-white text-lg font-medium leading-tight block font-body drop-shadow-md">
              {event.friendly_name}
            </span>
          </div>
        </div>

        {/* Year section - prominent, always readable */}
        {showYear && (
          <div className="bg-accent dark:bg-accent-dark px-4 py-3 text-center">
            <span className="text-white text-2xl font-bold font-mono">
              {formatYear(event.year)}
            </span>
          </div>
        )}

        {/* Description - compact */}
        <div className="px-4 py-3">
          <p className="text-light-text dark:text-dark-text text-sm leading-relaxed font-body">{event.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ExpandedCard;
