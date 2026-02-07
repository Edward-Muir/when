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

| Tier | Streak | Bolt Appearance                    | Card Glow      | Confetti      |
| ---- | ------ | ---------------------------------- | -------------- | ------------- |
| 0    | 0–1    | Outline grey bolt + count          | Normal green   | 50 particles  |
| 1    | 2–3    | Filled grey bolt + count           | Brighter green | 70 particles  |
| 2    | 4–5    | Filled gold bolt + pulse animation | Golden         | 90 particles  |
| 3    | 6+     | Filled gold bolt + glow animation  | Golden intense | 120 particles |

The bolt is always visible (from streak 0) and escalates through outline → filled, grey → gold, static → animated.

## Files Changed

### New Files

- `src/utils/streakFeedback.ts` — Centralized tier config. `getStreakFeedback(streak)` returns all tier-specific values (confetti, haptics, glow class, ripple multiplier, bolt CSS classes, `boltFilled` boolean). All tier logic is here.

### Modified Files

- `src/types/index.ts` — Added `currentStreak: number` and `bestStreak: number` to `WhenGameState`
- `src/hooks/useWhenGame.ts` — Increments `currentStreak` on correct placement, resets to 0 on incorrect, tracks `bestStreak` via `Math.max`. Saves `bestStreak` to daily result. Removed dead `saveTimelineHighScore` call and import.
- `src/index.css` — Added CSS keyframes: `successGlowBright` (brighter green glow), `successGlowGolden` (gold glow for tier 2+), `streakPulse` (bolt scale oscillation for tier 2), `streakGlow` (bolt glow+scale for tier 3). All glow keyframes use `color-mix()` with CSS custom properties (`--color-success`, `--color-accent`) so colors adapt to dark mode automatically. All added to `prefers-reduced-motion: reduce` block.
- `src/components/Game.tsx` — Confetti uses streak-based params from `streakFeedbackRef`. Haptics use streak-based vibration pattern via `navigator.vibrate()`. Passes `currentStreak` to `Timeline`, `GameInfoCompact`, and `StatsPopup`.
- `src/components/Timeline/Timeline.tsx` — Accepts optional `currentStreak` prop (defaults to 0 for ViewTimeline compat). Computes `streakConfig` and passes `glowIntensity` + `rippleAmplitudeMultiplier` to animated `TimelineEvent`.
- `src/components/Timeline/TimelineEvent.tsx` — Accepts `glowIntensity` and `rippleAmplitudeMultiplier` props. Uses `GLOW_CLASS_MAP` to select CSS class (`animate-success-glow` / `animate-success-glow-bright` / `animate-success-glow-golden`). Multiplies `BASE_Y_OFFSET` by `rippleAmplitudeMultiplier` in ripple hook.
- `src/components/PlayerInfo.tsx` — `StreakBolt` always renders (no threshold gate). Zap icon conditionally applies `fill-current` based on `config.boltFilled` — outline at tier 0, filled at tier 1+. `GameInfoCompact` accepts `currentStreak` prop.
- `src/components/StatsPopup.tsx` — Shows "Current streak" with `currentStreak` prop. Uses `Zap` icon.
- `src/components/GamePopup.tsx` — Shows "Best streak: Nx" in game over stats when `bestStreak >= 2`.
- `src/utils/share.ts` — Appends `| Best streak: Nx` to share text for all single-player modes when `bestStreak >= 2`.
- `src/utils/playerStorage.ts` — Added `bestStreak?: number` to `DailyResult` interface. `saveTimelineHighScore` and `getTimelineHighScore` still exist but are unused.
