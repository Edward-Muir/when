import { Archive, BarChart3, Home, Hourglass, LucideIcon, SlidersHorizontal } from 'lucide-react';
import type { NavDest } from './TopBar';

export type TabKey = NavDest;

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
  // Sliders: "build your own", not a settings cog.
  {
    key: 'custom',
    label: 'Custom',
    ariaLabel: 'Custom game',
    icon: SlidersHorizontal,
    activeText: 'text-accent-secondary',
  },
  {
    key: 'stats',
    label: 'Stats',
    ariaLabel: 'View stats',
    icon: BarChart3,
    activeText: 'text-accent',
  },
  {
    key: 'timeline',
    label: 'Timeline',
    ariaLabel: 'View my timeline',
    icon: Hourglass,
    activeText: 'text-accent',
  },
];

export const tabKeyForIndex = (i: number): TabKey => TABS.at(i)?.key ?? 'home';

export const indexForTabKey = (key: TabKey): number =>
  Math.max(
    0,
    TABS.findIndex((tab) => tab.key === key)
  );
