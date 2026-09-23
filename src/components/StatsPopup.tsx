import React from 'react';
import { Ruler, Zap, Layers } from 'lucide-react';
import Modal from './ui/Modal';

interface StatsPopupProps {
  isOpen: boolean;
  cardsInHand: number;
  timelineLength: number;
  currentStreak: number;
  onDismiss: () => void;
}

const StatsPopup: React.FC<StatsPopupProps> = ({
  isOpen,
  cardsInHand,
  timelineLength,
  currentStreak,
  onDismiss,
}) => {
  return (
    <Modal open={isOpen} onDismiss={onDismiss} header="Timeline Stats">
      {/* Stats content */}
      <div className="px-4 py-4 space-y-4">
        {/* Cards in hand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
            <Layers className="w-5 h-5 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold font-mono text-text">{cardsInHand}</div>
            <div className="text-sm text-text-muted font-body">Cards remaining in hand</div>
          </div>
        </div>

        {/* Current timeline length */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
            <Ruler className="w-5 h-5 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold font-mono text-text">{timelineLength}</div>
            <div className="text-sm text-text-muted font-body">Events in your timeline</div>
          </div>
        </div>

        {/* Best streak */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg flex items-center justify-center">
            <Zap className="w-5 h-5 text-text-muted" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold font-mono text-text">{currentStreak}</div>
            <div className="text-sm text-text-muted font-body">Current streak</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StatsPopup;
