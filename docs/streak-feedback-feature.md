# Streak Feedback Feature

## What Was Built

A "combo streak" system that provides escalating visual feedback when players place multiple cards correctly in a row. The streak is communicated through:

1. **A lightning bolt icon** in the bottom-left GameInfoCompact area (replacing the old trophy/high score display)
2. **Escalating confetti** — more particles, wider spread as streaks grow
3. **Escalating card glow** — green → brighter green → golden glow on timeline cards
4. **Escalating ripple wave** — stronger amplitude as streaks grow
5. **Escalating haptics** — more intense vibration patterns
6. **Best streak in share text and game over stats**

### Tier System

| Tier | Streak | Bolt Appearance             | Card Glow      | Confetti      |
| ---- | ------ | --------------------------- | -------------- | ------------- |
| 0    | 0–1    | Hidden                      | Normal green   | 50 particles  |
| 1    | 2–3    | Green bolt + count          | Brighter green | 70 particles  |
| 2    | 4–5    | Gold bolt + pulse animation | Golden         | 90 particles  |
| 3    | 6+     | Gold bolt + glow animation  | Golden intense | 120 particles |

## Files Changed

### New Files

- `src/utils/streakFeedback.ts` — Centralized tier config. `getStreakFeedback(streak)` returns all tier-specific values (confetti, haptics, glow class, ripple multiplier, bolt CSS classes). All tier logic is here.

### Modified Files

- `src/types/index.ts` — Added `currentStreak: number` and `bestStreak: number` to `WhenGameState`
- `src/hooks/useWhenGame.ts` — Increments `currentStreak` on correct placement, resets to 0 on incorrect, tracks `bestStreak` via `Math.max`. Saves `bestStreak` to daily result.
- `src/index.css` — Added CSS keyframes: `successGlowBright` (brighter green glow), `successGlowGolden` (gold glow for tier 2+), `streakPulse` (bolt scale oscillation for tier 2), `streakGlow` (bolt glow+scale for tier 3). All added to `prefers-reduced-motion: reduce` block.
- `src/components/Game.tsx` — Confetti uses streak-based params from `streakFeedbackRef`. Haptics use streak-based vibration pattern via `navigator.vibrate()`. Passes `currentStreak` to `Timeline` and `GameInfoCompact`. Removed `getTimelineHighScore` import.
- `src/components/Timeline/Timeline.tsx` — Accepts optional `currentStreak` prop (defaults to 0 for ViewTimeline compat). Computes `streakConfig` and passes `glowIntensity` + `rippleAmplitudeMultiplier` to animated `TimelineEvent`.
- `src/components/Timeline/TimelineEvent.tsx` — Accepts `glowIntensity` and `rippleAmplitudeMultiplier` props. Uses `GLOW_CLASS_MAP` to select CSS class (`animate-success-glow` / `animate-success-glow-bright` / `animate-success-glow-golden`). Multiplies `BASE_Y_OFFSET` by `rippleAmplitudeMultiplier` in ripple hook.
- `src/components/PlayerInfo.tsx` — Removed trophy/high score display (`Trophy` import, `getTimelineHighScore`, `highScore` state, `useEffect`). Added `StreakBolt` component with `Zap` icon from lucide-react. Uses `AnimatePresence` for enter/exit. `GameInfoCompact` accepts `currentStreak` prop.
- `src/components/StatsPopup.tsx` — Shows "Best streak this game" instead of "Your longest timeline ever". Changed prop from `highScore` to `bestStreak`. Uses `Zap` icon instead of `Trophy`.
- `src/components/GamePopup.tsx` — Shows "Best streak: Nx" in game over stats when `bestStreak >= 2`.
- `src/utils/share.ts` — Appends `| Best streak: Nx` to share text for all single-player modes when `bestStreak >= 2`.
- `src/utils/playerStorage.ts` — Added `bestStreak?: number` to `DailyResult` interface.

## Known Issues To Fix

### 1. Bolt icon feels out of place visually

The `Zap` icon from lucide-react uses `fill-current` which makes it a solid filled shape, looking different from the outline-style `Ruler` icon next to it. It should use the same outline style to be consistent.

**Fix:** In `PlayerInfo.tsx` line 162, remove `fill-current` from the Zap icon:

```tsx
// Before:
<Zap className="w-3.5 h-3.5 fill-current" />
// After:
<Zap className="w-3.5 h-3.5" />
```

### 2. Tier 1 bolt color (green) clashes with surrounding grey icons

At tier 1, the bolt uses `text-success` (green), which looks jarring next to the `text-text-muted` grey of the ruler icon. The accent gold color fits the theme better.

**Fix:** In `src/utils/streakFeedback.ts`, change the tier 1 `boltColorClass` from `text-success` to `text-text-muted` or `text-accent` to stay consistent with the existing color palette:

```typescript
// Tier 1 (streak 2-3): change boltColorClass
boltColorClass: 'text-text-muted',  // matches ruler icon, then gold at tier 2+
// OR
boltColorClass: 'text-accent',  // gold from the start, consistent with app accent
```

### 3. Streak only appears at 2+ — consider showing from first correct

The bolt currently only appears when `currentStreak >= 2`. The user expected it to show from the first correct placement. Consider lowering the threshold:

**Fix:** In `PlayerInfo.tsx` line 146, change `streak >= 2` to `streak >= 1`. Also update the tier 0 config in `streakFeedback.ts` to have a `boltColorClass` so it renders correctly at streak 1.

### 4. The golden glow CSS uses hardcoded rgba values instead of CSS variables

The `successGlowGolden` keyframes in `index.css` use `rgba(184, 134, 11, ...)` which won't adapt to dark mode's `--color-accent`. The dark mode accent is `#d4a84b`.

**Fix:** Either use `color-mix()` with `var(--color-accent)` in the keyframes, or add separate dark-mode keyframes. Since keyframes can't directly use CSS variables for box-shadow rgba values in all browsers, the simplest fix is to accept the slight color difference or use the `filter: drop-shadow()` approach used in `streakGlow`.

### 5. `saveTimelineHighScore` still called in useWhenGame.ts

The high score save effect at line 112-116 of `useWhenGame.ts` still runs. Since the trophy display was removed, this is dead code.

**Fix:** Remove the `useEffect` that calls `saveTimelineHighScore` in `useWhenGame.ts` (lines 112-116). Optionally remove `saveTimelineHighScore` and `getTimelineHighScore` from `playerStorage.ts` if nothing else uses them (check `ModeSelect.tsx` first).
