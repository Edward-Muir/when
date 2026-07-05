import React, { useEffect, useState } from 'react';

const DAY_MS = 86_400_000;

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Time until the next daily puzzle (UTC midnight, matching the daily seed rollover)
function msUntilNextDaily(): number {
  return DAY_MS - (Date.now() % DAY_MS);
}

interface NextDailyCountdownProps {
  className?: string;
}

const NextDailyCountdown: React.FC<NextDailyCountdownProps> = ({ className = '' }) => {
  const [remaining, setRemaining] = useState(msUntilNextDaily);

  useEffect(() => {
    const interval = setInterval(() => setRemaining(msUntilNextDaily()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={`text-text-muted text-sm font-mono ${className}`}>
      Next daily in {formatCountdown(remaining)}
    </span>
  );
};

export default NextDailyCountdown;
