import { Archive, Home, Hourglass, LucideIcon, Settings, SlidersHorizontal } from 'lucide-react';

/**
 * Every Home tab, by key. The `stats` key is the Settings tab: the page holds the player's
 * profile, the settings and the stats, and it keeps the key it had as the Stats tab so the
 * stored nav dot (`when-nav-seen`) and the `statsTab` hint carry over. Achievements is not a
 * tab: the badges live on that page (`stats/AchievementsSection.tsx`).
 */
export type NavDest = 'home' | 'archive' | 'custom' | 'stats' | 'timeline';

export type TabKey = NavDest;

/**
 * The path that opens the home screen on each tab (`src/pages/Home.tsx`), so a refresh or a
 * shared link comes back to the tab it was on.
 */
const NAV_PATHS: Record<NavDest, string> = {
  home: '/',
  archive: '/archive',
  custom: '/custom',
  stats: '/settings',
  timeline: '/timeline',
};

/** The Settings tab's path from when it was the Stats tab; old links and bookmarks use it. */
const LEGACY_STATS_PATH = '/stats';

// eslint-disable-next-line security/detect-object-injection -- key is the NavDest union
export const pathForNav = (key: NavDest): string => NAV_PATHS[key];

/** The tab a path names, or null for any other path. */
export function navForPath(pathname: string): NavDest | null {
  if (pathname === LEGACY_STATS_PATH) return 'stats';
  const entry = Object.entries(NAV_PATHS).find(([, path]) => path === pathname);
  return entry ? (entry[0] as NavDest) : null;
}

export interface HomeTab {
  key: TabKey;
  /** The word under the icon in the tab bar. */
  label: string;
  /** The tab's accessible name. Playwright scripts and the runbook select tabs by these. */
  ariaLabel: string;
  icon: LucideIcon;
  /** Active colour: gold for every tab but Custom, which is teal to match its screen. */
  activeText: string;
}

/**
 * Home's five tabs, in render order: the single source of the page order, the tab bar's
 * labels and icons, and the index-key maps below. `ModeSelect` renders the `ModePager`
 * children in this same order. Its own module so `HomeTabBar` and `ModeSelect` can both
 * read it without importing each other.
 */
export const TABS: readonly HomeTab[] = [
  { key: 'home', label: 'Daily', ariaLabel: 'Go home', icon: Home, activeText: 'text-accent' },
  {
    key: 'archive',
    label: 'Archive',
    ariaLabel: 'Past decks',
    icon: Archive,
    activeText: 'text-accent',
  },
  // Sliders: "build your own". The cog is the Settings tab's.
  {
    key: 'custom',
    label: 'Custom',
    ariaLabel: 'Custom game',
    icon: SlidersHorizontal,
    activeText: 'text-accent-secondary',
  },
  {
    key: 'timeline',
    label: 'Timeline',
    ariaLabel: 'View my timeline',
    icon: Hourglass,
    activeText: 'text-accent',
  },
  // Last, where settings are looked for.
  {
    key: 'stats',
    label: 'Settings',
    ariaLabel: 'Settings',
    icon: Settings,
    activeText: 'text-accent',
  },
];

export const tabKeyForIndex = (i: number): TabKey => TABS.at(i)?.key ?? 'home';

export const indexForTabKey = (key: TabKey): number =>
  Math.max(
    0,
    TABS.findIndex((tab) => tab.key === key)
  );
