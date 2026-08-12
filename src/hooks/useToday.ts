import { useEffect, useRef, useState } from 'react';
import { getLocalDateString, msUntilNextLocalMidnight } from '../utils/puzzleDate';

/**
 * The player's current local date (`YYYY-MM-DD`), kept fresh across day rollovers.
 *
 * Three triggers, each cheap and complementary: `appResume` covers Capacitor,
 * `visibilitychange` covers web/Safari tab focus, and a midnight timer covers users who
 * stay foregrounded across the boundary. That last one matters most on iOS, where the
 * WKWebView keeps React state alive for days — the timer re-arms after each firing so a
 * session left open for several nights keeps rolling over.
 *
 * The functional setter dedupes no-op transitions, so consumers only re-render when the
 * date actually changes.
 *
 * @param onTick Called on EVERY trigger, including ones where the date is unchanged — for
 *   side effects that should run on each resume regardless of rollover (e.g. refetching the
 *   leaderboard so other players' submissions land without a reload).
 */
export function useToday(onTick?: (date: string) => void): string {
  const [today, setToday] = useState(getLocalDateString);

  // Held in a ref so an inline callback doesn't re-run the effect (and re-arm the timer)
  // on every render of the consuming component.
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    let timer: number;

    const refresh = () => {
      const next = getLocalDateString();
      setToday((curr) => (curr === next ? curr : next));
      onTickRef.current?.(next);
    };

    const armMidnightTimer = () => {
      timer = window.setTimeout(() => {
        refresh();
        armMidnightTimer();
      }, msUntilNextLocalMidnight() + 1_000);
    };

    const onVisibility = () => {
      if (!document.hidden) refresh();
    };

    // `appResume` is dispatched by App.tsx via @capacitor/app's native `resume` event.
    window.addEventListener('appResume', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    armMidnightTimer();

    return () => {
      window.removeEventListener('appResume', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearTimeout(timer);
    };
  }, []);

  return today;
}
