# Leaderboard Skeleton Loading & Mobile Web Spacing

**Date:** 2026-02-28

## Overview

Fixed two UX issues: (1) the homepage leaderboard section showed a blank area while fetching data instead of skeleton loading indicators, and (2) the "When?" title was too close to the browser top bar on mobile web Safari. Through several iterations, resolved invisible skeleton bars, added skeleton loading to the full leaderboard modal, and eliminated layout shift when data loads.

## Files Modified

| File                             | Change                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useLeaderboard.ts`    | Changed initial `isLoading` state from `false` to `true` so skeleton shows from the very first render (before the `useEffect` fires `fetchLeaderboard`) |
| `src/components/ModeSelect.tsx`  | Multiple changes to MiniLeaderboard component (see below) and increased top padding from `pt-14` to `pt-20` for mobile web spacing                      |
| `src/components/Leaderboard.tsx` | Replaced plain "Loading..." text with 5 skeleton rows matching the entry layout (rank, name, score bars with `animate-pulse`)                           |

## Key Issues & Fixes

### 1. Skeleton bars were invisible (`bg-border/50`)

Tailwind cannot apply opacity modifiers (`/50`) to colors defined as raw `var()` CSS variables (e.g., `'border': 'var(--color-border)'` in tailwind.config.js). The `/50` opacity was silently ignored, rendering the skeleton bars as transparent.

**Fix:** Changed `bg-border/50` to `bg-border` (full opacity) — visible in both light and dark modes.

### 2. Initial loading state timing

`useLeaderboard` hook initialized with `isLoading: false`. The `fetchLeaderboard()` call happens in a `useEffect` (after first render), so the first render saw `isLoading=false` + empty entries, showing either blank space or "No entries yet" instead of skeletons.

**Fix:** Changed initial state to `isLoading: true` in `useLeaderboard.ts`.

### 3. Layout shift when data loads (MiniLeaderboard)

The skeleton and loaded states originally used completely separate render branches with different DOM structures. Even after unifying them, the skeleton bars used `h-[1em]` (14px, matching font-size) while loaded text spans had a natural line-height of ~20px. The `items-center` flex alignment centered content differently within each row.

**Fix (iterative):**

1. First unified the row structure — single `div.space-y-1` with 4 identical `div.flex.items-center.gap-2.text-sm.py-0.5` row wrappers, only swapping inner content
2. Changed skeleton bar height from `h-[1em]` (14px) to `h-5` (20px) to match `text-sm` line-height exactly

### 4. Mobile web top spacing

On mobile web Safari, `env(safe-area-inset-top)` resolves to `0`, leaving the TopBar shorter and the "When?" title uncomfortably close to the browser chrome. On native Capacitor, the status bar safe area provides natural spacing.

**Fix:** Increased ModeSelect container top padding from `pt-14` (56px) to `pt-20` (80px).

## Current MiniLeaderboard Architecture

- Unified row structure: always renders 4 rows with identical wrappers
- Each row conditionally renders: loaded entry text, skeleton bars, or invisible placeholder
- Container: fixed `h-[156px]` with `overflow-hidden` to prevent external layout shift
- Uses `top4.at(i)` instead of bracket notation to satisfy ESLint `security/detect-object-injection` rule

## Decisions Made

- **`bg-border` not `bg-border/50`**: Tailwind opacity modifiers don't work with raw CSS variable colors. Full opacity provides good contrast in both themes.
- **`isLoading: true` initial state**: Safe because `useLeaderboard` is only consumed by ModeSelect (which always fetches immediately on mount) and LeaderboardSubmit (which only uses submission state).
- **`h-5` for skeleton bars**: Matches `text-sm` line-height (20px), not font-size (14px). This is the key insight — skeleton placeholders must match line-height, not font-size.
- **Unified row structure over dual branches**: Eliminates all structural DOM differences between loading and loaded states.

## Tailwind CSS Variable Opacity Limitation

Important for future reference: colors in `tailwind.config.js` defined as `'border': 'var(--color-border)'` do NOT support Tailwind's opacity modifier syntax (`bg-border/50`). For opacity to work, colors must use the `<alpha-value>` format:

```js
'border': 'rgb(var(--color-border-rgb) / <alpha-value>)'
```

Since the project uses hex values in CSS variables, always use full-opacity color classes (e.g., `bg-border`) or apply opacity via a separate `opacity-50` class.
