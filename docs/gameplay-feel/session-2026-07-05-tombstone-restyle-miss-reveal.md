# Session 2026-07-05 — Tombstone Mechanic Approved, Dead-Card Restyle, Miss-Reveal Choreography

## Overview

Continuation of the tombstone work from [session-2026-07-01](session-2026-07-01-tombstone-reveal.md). Four pieces of work, in order:

1. **Iteration-4 drag mechanic — APPROVED by user** ("yes that is the mechanic I was after"): tombstone rows are full card-height with the same footprint as real card rows; when a drag hovers a tombstone's gap, the ghost card swaps into the tombstone's row with **zero displacement** of any other card, and only the tombstone's content slides right (never up/down). The old shrink-all-tombstones-on-drag-start behavior is deleted (it also silently invalidated the drag-start `[data-timeline-year]` position snapshot).
2. **"Dead card" restyle** (user-specified, verified, feel-approved implicitly by follow-ups): tombstone = regular landscape card geometry with greyscale image (`grayscale opacity-70`), muted title (`text-text-muted`) on transparent background, `border-border` (same as real cards), faint year on the rail (`text-text-muted opacity-70`, tick `bg-accent opacity-40`, still **no** `data-timeline-year`). Whole card slides right (`x:'105%'`, opacity 0.35) when displaced. Detail popup for tombstoned cards matches: greyscale image, muted text, `bg-surface` instead of event color (`tombstone` prop threaded Game.tsx → GamePopup).
3. **Vertical-move parity fix**: tombstones previously glided on layout changes while real cards snapped — cause was the permanent framer `layoutId`. Now the layoutId exists only during the reveal FLIP (`revealing` prop) with a `key` remount when it ends (dropping a layoutId in place leaves a stale projection transform that blocks later x-animations).
4. **Miss-reveal choreography v1 → v2 (v2 IN PROGRESS, not working yet — see below)**: replacing the "card zooms to its spot, then a ripple plays" feel with slow distance-scaled travel + a wake that trails the card.

## Files changed this session

- `src/utils/timelineRows.ts` + test — tombstone rows carry their `gap` index
- `src/components/Timeline/TombstoneRow.tsx` — rewritten twice (full-height slot w/ chip → dead card); props now `failed, onTap, displaced, ghostEvent, revealing, travelMs, layoutShiftDelay`; `TRAVEL_EASE` export; z-20/shadow/bg-surface while revealing
- `src/components/Timeline/Timeline.tsx` — ghost hosting in tombstone rows (`ghostGap`/`ghostHostRowIndex`, index-0 GhostCard special case removed); `renderTombstoneRow` helper (lint complexity); wave scheduler (`successWave`, `missWaveBumps`, `wakeDelays`, `wakeTrigger`, `missReveal`, `missTravelMs`)
- `src/components/Timeline/TimelineEvent.tsx` — ripple API generalized to one `ripple?: RippleSpec {delay, amplitudePx, trigger}` prop (old distance/trigger/multiplier props gone); `layoutShiftDelay` prop → transient `layout="position"` + delayed spring; ripple bump moved to an **inner wrapper div** (animating `y` on the projection element kills in-flight layout animations); exports `RIPPLE_STAGGER_S`, `BASE_Y_OFFSET`, `HALF_LIFE_CARDS`, `RippleSpec`
- `src/hooks/useWhenGame.ts` — `MISS_FLASH_MS = 400` and `getMissTravelMs(pathLen) = clamp(550+170·pathLen, 700, 1500)` exported; miss finalize timeout now dynamic: `flash + travel + 200`
- `src/components/Game.tsx` / `src/components/GamePopup.tsx` — `tombstone` popup treatment
- Fixed en route: `text-text-muted/60`-style **opacity modifiers are silent no-ops** repo-wide (tokens lack `<alpha-value>`); use `text-text-muted opacity-60`. Saved to auto-memory (`tailwind-opacity-modifier-noop.md`).

## ⚠️ UNRESOLVED — miss-reveal v2 wake shift snaps (continue next session)

User's spec: the incorrect card should **visibly travel** to its correct slot and **emit a ripple as it moves** — each row bumps as the card passes, wave trailing at the card's speed, continuing past the landing.

State of v2 at session end (all committed to working tree, tests/lint/typecheck pass):

- ✅ Slow distance-scaled travel works and is frame-verified: tween `getMissTravelMs`, cubic-out `TRAVEL_EASE [0.33,1,0.68,1]`, estimate ≈786–835ms measured via t50 inversion. **Key learning:** for a shared-layoutId FLIP the _top-level_ `transition` of the entering element applies — while revealing, TombstoneRow's whole transition is the tween (a nested `layout:` key alone was masked by the surrounding spring 400/30, which is why v1's 450ms tween never actually applied; framer resolves `options.transition || props.transition || default`, then `getValueTransition(t,'layout')`).
- ✅ Wave scheduling is derived, no mid-flight re-renders: `wakeTrigger` stamped at **flash** render; bump delays = `MISS_FLASH_MS/1000 + invEase((order+0.5)/pathLen)·travelS + 0.05`, keyed by **event name** (indices differ between flash and moving renders); run-out bumps past the gap decay 0.5^extra. Bumps animate an inner wrapper, not the projection element.
- ❌ **The path rows' one-row layout shift still SNAPS** (0 intermediate frames in `verify-miss-reveal.js`) despite: bump moved off the projection element, wake-trigger re-render moved to flash time, damping 22 spring with delay ≈ `passage − 0.1s`. It animated in v1 (11 intermediates, onset 415ms) before the ripple/bump refactor — so something about the current render/prop sequence still cancels the delayed layout spring on `TimelineEvent`. Next candidates to investigate: (a) the `wakeTrigger` re-render at flash+ε re-snapshots rows so the _moving_-render displacement measures against a fresh snapshot — check if removing the re-render entirely (trigger = derived counter/`seq`, no state) fixes it; (b) whether `transition={{ layout: {...} }}` with `layout="position"` honors `delay` in framer 12 (test with delay 0); (c) whether the memoized `missWaveBumps` map identity churn re-renders rows at the wrong moment.

### Verification tooling (scratchpad, reusable)

- `verify-miss-reveal.js` — rAF recorder of scroll-normalized row positions through a forced miss; asserts mover glide (distinct positions), travel duration via t50/0.206 cubic-out inversion, path-row animation + onsets, static rows still; `REDUCED=1` env for reduced-motion. Gotchas encoded: measure the tombstone **button** (transforms live there, not the row); exclude rows that unmount mid-recording (the mover's flash-phase row, which also has a pre-existing −20px `animate-entrance` drift).
- `verify-tombstone-drag.js` — 7 drag invariants (no drag-start shift, chip/card slides right same-y, ghost in row, zero displacement, restores). **Must pass after any change here.** Control gap must be picked dynamically (tombstone's gap depends on the daily deck/date).
- `verify-tombstone-popup.js` — tombstone detail popup screenshots light/dark.
- Scripts live in the session scratchpad (`/private/tmp/claude-501/...4a2bbf23.../scratchpad/`) — copy out if needed; localStorage seeds and drag simulation per `headless-verification-puppeteer` memory.

## Key decisions

- Miss input lock is now dynamic (`400 + getMissTravelMs + 200` ≈ 1.3–2.1s) — accepted trade-off for the reveal payoff; success timing untouched (600ms).
- Ripple system refactored so Timeline owns all wave scheduling (per-row `{delay, amplitudePx, trigger}`); success wave behavior preserved 1:1 via the old formulas.
- Tombstone rows in the travel path get the same layout-shift treatment via `wakeDelays.byIndex` on their gap.
- All animation paths respect `useReducedMotion` (instant appearance, no travel/wake).
