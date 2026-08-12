import React, { useEffect, useState } from 'react';
import { msUntilNextLocalMidnight } from '../utils/puzzleDate';

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface NextDailyCountdownProps {
  className?: string;
}

// Counts to the player's local midnight, matching the daily seed rollover. On the two DST
// days a year this legitimately shows up to 25 hours (or as few as 23).
const NextDailyCountdown: React.FC<NextDailyCountdownProps> = ({ className = '' }) => {
  const [remaining, setRemaining] = useState(() => msUntilNextLocalMidnight());

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntilNextLocalMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`text-text-muted text-sm font-mono ${className}`}>
      Next daily in {formatCountdown(remaining)}
    </span>
  );
};

export default NextDailyCountdown;
