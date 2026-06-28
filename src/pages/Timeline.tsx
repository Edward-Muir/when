import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoricalEvent } from '../types';
import { loadAllEvents, getCachedEvents } from '../utils/eventLoader';
import ViewTimeline from '../components/ViewTimeline';

/**
 * My Timeline page (route: /timeline). The production counterpart to /stats and
 * /achievements: a first-class route rendering the player's personal collection
 * (the events they've correctly placed). Events seed synchronously from the module
 * cache to avoid a load flash, then refresh from loadAllEvents().
 */
const Timeline: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<HistoricalEvent[]>(() => getCachedEvents() ?? []);

  useEffect(() => {
    loadAllEvents().then(setEvents);
  }, []);

  return <ViewTimeline allEvents={events} onHomeClick={() => navigate('/')} />;
};

export default Timeline;
