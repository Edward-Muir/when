import React from 'react';
import { HistoricalEvent } from '../../types';
import Card from '../Card';

interface GhostCardProps {
  event: HistoricalEvent;
}

const GhostCard: React.FC<GhostCardProps> = ({ event }) => {
  return (
    <div className="opacity-50 border-2 border-dashed border-amber-400 rounded-lg overflow-hidden">
      <Card event={event} />
    </div>
  );
};

export default GhostCard;
