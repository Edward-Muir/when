import React from 'react';
import { TABS, TabKey } from './homeTabs';
import { useNavDots } from '../hooks/useNavDots';

interface HomeTabBarProps {
  /** The tab the pager is on. Follows the scroll, so it is never set by a tap directly. */
  activeKey: TabKey;
  /** Scroll the pager to this tab. */
  onSelect: (key: TabKey) => void;
}

/**
 * Home's five labelled tabs, along the foot of the screen under the pager. A tap scrolls the
 * same pager the swipe does, and the highlight follows the scroll, so the two never disagree.
 * Sits outside the pager so nothing in it mounts during a swipe.
 *
 * Each tab is a fifth of the width (80px at 402, 64px at 320) and 64px tall; the bar adds the
 * home-indicator inset underneath with `pb-safe`.
 */
const HomeTabBar: React.FC<HomeTabBarProps> = ({ activeKey, onSelect }) => {
  const dots = useNavDots(activeKey);
  const hasDot = (key: TabKey): boolean => {
    switch (key) {
      case 'archive':
        return dots.archive;
      case 'stats':
        return dots.stats;
      case 'timeline':
        return dots.timeline;
      default:
        return false;
    }
  };

  return (
    <nav
      aria-label="Home tabs"
      className="flex-shrink-0 flex bg-surface border-t border-border pb-safe transition-colors"
    >
      {TABS.map(({ key, label, ariaLabel, icon: Icon, activeText }) => {
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            className={`relative flex-1 min-w-0 h-16 flex flex-col items-center justify-center gap-1 font-body transition-colors active:scale-95 ${
              active ? activeText : 'text-text-muted'
            }`}
          >
            {/* The marker on the top edge, in the tab's own colour via `bg-current`. */}
            {active && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full bg-current"
              />
            )}
            <span className="relative">
              <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.25 : 2} />
              {hasDot(key) && (
                <span
                  role="img"
                  aria-label="New"
                  className="absolute -top-0.5 -right-1 h-2 w-2 rounded-full bg-accent ring-2 ring-surface"
                />
              )}
            </span>
            <span
              className={`text-[11px] leading-none whitespace-nowrap ${
                active ? 'font-semibold' : 'font-medium'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default HomeTabBar;
