import { useCallback, useSyncExternalStore } from 'react';
import { readString, writeString } from '../utils/storage';

type Theme = 'light' | 'dark';

const THEME_KEY = 'when-theme';

/**
 * The theme is one value for the whole page, held here rather than in each caller's state:
 * the in-game toggle (`GameHud`) and the Menu's can be mounted at once, and two `useState`
 * copies drifted apart, so the second toggle pressed did nothing.
 */
let current: Theme | null = null;
const listeners = new Set<() => void>();

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = readString(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  // Fall back to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  writeString(THEME_KEY, theme, 'theme');
}

function getTheme(): Theme {
  if (current === null) {
    current = initialTheme();
    if (typeof document !== 'undefined') applyTheme(current);
  }
  return current;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setTheme(theme: Theme) {
  current = theme;
  applyTheme(theme);
  listeners.forEach((listener) => listener());
}

/** Test-only: forget the cached theme so the next read comes from storage again. */
export function resetThemeForTests() {
  current = null;
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);

  const toggleTheme = useCallback(() => {
    setTheme(getTheme() === 'light' ? 'dark' : 'light');
  }, []);

  const isDark = theme === 'dark';

  return { theme, toggleTheme, isDark };
}
