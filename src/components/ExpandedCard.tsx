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
        className="w-[280px] sm:w-[320px] rounded-lg overflow-hidden border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card shadow-xl dark:shadow-card-rest-dark transition-colors"
      >
        {/* Image first */}
        <div className="w-full h-48 sm:h-56">
          {event.image_url ? (
            <img src={event.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-light-border/30 dark:bg-dark-border/30">
              <CategoryIcon category={event.category} className="text-light-muted dark:text-dark-muted w-16 h-16" />
            </div>
          )}
        </div>

        {/* Title bar */}
        <div className="bg-light-card dark:bg-dark-card px-3 py-2 border-t border-light-border dark:border-dark-border">
          <span className="text-light-text dark:text-dark-text text-sm font-medium leading-tight block font-body">
            {event.friendly_name}
          </span>
          {showYear && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-accent dark:text-accent-dark text-sm font-bold font-mono">
                {formatYear(event.year)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="p-3 max-h-32 overflow-y-auto border-t border-light-border dark:border-dark-border">
          <p className="text-light-muted dark:text-dark-muted text-sm leading-relaxed font-body">{event.description}</p>
        </div>

        {/* Close hint */}
        <div className="px-3 py-2 border-t border-light-border dark:border-dark-border bg-light-border/30 dark:bg-dark-border/30">
          <p className="text-center text-light-muted/60 dark:text-dark-muted/60 text-xs font-body">Tap anywhere to close</p>
        </div>
      </div>
    </div>
  );
};

export default ExpandedCard;
