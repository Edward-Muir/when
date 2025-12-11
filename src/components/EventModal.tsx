import React from 'react';
import { X } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { formatYear, getCategoryDisplayName, getCategoryColorClass } from '../utils/gameLogic';

interface EventModalProps {
  event: HistoricalEvent;
  onClose: () => void;
  showYear?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, showYear = true }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-paper rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-paper border-b border-amber-200 p-4 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold text-sketch">{event.friendly_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs text-white ${getCategoryColorClass(event.category)}`}>
                {getCategoryDisplayName(event.category)}
              </span>
              {showYear && (
                <span className="text-sketch/70 text-sm font-medium">
                  {formatYear(event.year)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-amber-100 transition-colors"
          >
            <X className="w-5 h-5 text-sketch/60" />
          </button>
        </div>

        {/* Image */}
        {event.image_url && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={event.image_url}
              alt={event.friendly_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Description */}
        <div className="p-4">
          <p className="text-sketch/80 leading-relaxed">{event.description}</p>
        </div>

        {/* Close button */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
