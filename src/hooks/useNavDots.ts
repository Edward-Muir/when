import { useEffect, useState } from 'react';
import { hasSeenNav, markNavSeen, NavKey } from '../utils/playerStorage';

type NavDots = Record<NavKey, boolean>;

const readDots = (): NavDots => ({
  archive: !hasSeenNav('archive'),
  stats: !hasSeenNav('stats'),
  timeline: !hasSeenNav('timeline'),
});

const isNavKey = (key: string): key is NavKey =>
  key === 'archive' || key === 'stats' || key === 'timeline';

/**
 * How long a tab must stay active before it counts as visited. A tap from Daily to Timeline
 * scrolls the pager across Archive and Stats, and the active tab follows the scroll through
 * each; without the wait, their dots would clear on a tab the player never stopped on.
 */
export const NAV_DOT_SETTLE_MS = 400;

/**
 * Which of Home's tabs carry a "new" dot, clearing the one the player settles on.
 *
 * Read once at mount. That is enough because the events that arm a dot (a badge unlock, a
 * first Daily, a first collected event) all happen in a game, and Home mounts afresh when the
 * game ends. Daily and Custom never carry one.
 */
export function useNavDots(activeKey: string): NavDots {
  const [dots, setDots] = useState(readDots);

  useEffect(() => {
    if (!isNavKey(activeKey) || hasSeenNav(activeKey)) return;
    const timer = window.setTimeout(() => {
      markNavSeen(activeKey);
      setDots((prev) => {
        switch (activeKey) {
          case 'archive':
            return { ...prev, archive: false };
          case 'stats':
            return { ...prev, stats: false };
          case 'timeline':
            return { ...prev, timeline: false };
        }
      });
    }, NAV_DOT_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [activeKey]);

  return dots;
}
