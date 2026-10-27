import { useCallback, useMemo, useState } from 'react';
import { WhenGameState } from '../types';
import { CuratedTheme, getCuratedThemeById } from '../utils/curatedThemes';
import { getCuratedThemeIdForConfig } from '../utils/themeReplay';
import { getSeenThemeIntros, markThemeIntroSeen } from '../utils/playerStorage';

/** The slice of game state the decision reads. Game passes its whole state. */
export type ThemeIntroGameState = Pick<
  WhenGameState,
  'phase' | 'lastConfig' | 'isReview' | 'placementHistory' | 'failedPlacements'
>;

export interface ThemeIntroState {
  /** The curated theme this game belongs to, kept after dismissal so the exit animates. */
  theme: CuratedTheme | undefined;
  open: boolean;
  dismiss: () => void;
}

/**
 * Whether a game should open on its theme's intro: a fresh game in play (nothing placed or
 * missed yet, so not a resumed daily, which skipped the loading scroll), not a review, of a
 * theme that has an intro this install has not seen.
 */
export function shouldOpenThemeIntro(
  state: ThemeIntroGameState,
  theme: CuratedTheme | undefined
): boolean {
  if (!theme?.intro || state.phase !== 'playing' || state.isReview) return false;
  if (state.placementHistory.length > 0 || state.failedPlacements.length > 0) return false;
  return !getSeenThemeIntros().has(theme.id);
}

/**
 * The curated theme's intro popup: opens as play begins, after "Loading events from across
 * time" has scrolled past, on the first game of a theme this install has played.
 *
 * Decided once, on mount. Game remounts for every new game and mounts straight into
 * `playing`, so the mount is the moment the loading transition hands over.
 * `getCuratedThemeIdForConfig` covers today's daily, a past day from the Archive and a theme
 * replay alike, so a theme is introduced however it is reached, and only once. Extracted from
 * Game.tsx, which sits on the ESLint `complexity` ceiling.
 */
export function useThemeIntro(state: ThemeIntroGameState): ThemeIntroState {
  const { lastConfig } = state;

  const theme = useMemo(() => {
    const id = getCuratedThemeIdForConfig(lastConfig);
    return id ? getCuratedThemeById(id) : undefined;
  }, [lastConfig]);

  const [open, setOpen] = useState(() => shouldOpenThemeIntro(state, theme));

  // Marked on dismissal rather than on show, so a game abandoned behind the popup (the app
  // backgrounded and killed) introduces the theme again next time.
  const dismiss = useCallback(() => {
    setOpen(false);
    if (theme) markThemeIntroSeen(theme.id);
  }, [theme]);

  return { theme, open, dismiss };
}
