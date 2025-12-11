import React from 'react';
import { HistoricalEvent } from '../../types';
import Card from '../Card';

interface TimelineEventProps {
  event: HistoricalEvent;
  onTap: () => void;
  isNew?: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, onTap, isNew = false }) => {
  return (
    <div
      className={`
        flex justify-center py-2
        ${isNew ? 'animate-entrance' : ''}
      `}
    >
      <Card
        event={event}
        showYear={true}
        onClick={onTap}
        size="normal"
      />
    </div>
  );
};

export default TimelineEvent;
