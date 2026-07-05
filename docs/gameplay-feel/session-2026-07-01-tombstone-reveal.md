# Session 2026-07-01 — Tombstone Reveal, Daily Countdown, Teach-the-Verb Copy

## Overview

Started from a harsh design review of the game (judged against daily-game / game-feel best practices), then implemented the three fixes the user picked:

1. **Ghost → tombstone reveal** — single-player misses no longer show the blocking "Wrong!" popup. The failed card FLIP-morphs (framer-motion shared `layoutId`) from the attempted slot to its **correct** gap and settles as a small dashed "tombstone" chip showing its year. Tombstones are display-only: placement rules, drag insertion math, centering, and ripples ignore them entirely.
2. **Daily return hook** — `NextDailyCountdown` (UTC-midnight `HH:MM:SS` ticker) under the "Challenge a Friend" CTA on mode select and in the daily game-over popup ("Come back tomorrow — …").
3. **Teach the verb** — rules copy now starts with "Drag each card onto the timeline where you think it happened — dates are hidden until you place it"; first-time rules modal got an explicit **Got it** button; mode-select tagline is now "Drag events into place — build the longest timeline".

Also removed (by user request, mid-session): the "off by N spots" miss banner — misses now have no text popup at all; the tombstone itself carries the year.

## ⚠️ UNRESOLVED — tombstone drag UX (continue next session)

The tombstone's behavior **during card placement** went through three iterations and the user rejected all of them:

1. Full-width slim row in the card lane with year on the rail → _rejected_: looked like a timeline anchor; the single ghost slot beside it read as "only one side allowed".
2. Right-aligned margin-note chip (`✗ 1289 · Name`), no year on rail → _rejected_: still occupies a row, so the ghost slot still displaces it vertically during drag.
3. Slide-out during drag: row collapses to 0px height and the chip slides right to the screen edge at 35% opacity (spring 400/30), restoring on release → **user's verdict: "horrid."**

The user's stated intent: with timeline A – T – B (T = tombstone), dragging card C into the A–B gap should make T move **right, out of the way**, never up/down — but iteration 3's implementation of exactly that felt bad in practice. Next session should rethink the resting/drag presentation (ideas not yet tried: tombstones permanently docked in a right-hand rail/column outside the lane; collapsing to year-only `✗ 1289` micro-chips; a toggleable "misses" layer; or showing failed cards only in the game-over view). The underlying state/logic layer is solid and rejection-proof — only `TombstoneRow.tsx` presentation needs to change.

## Files changed

- `src/types/index.ts` — `FailedPlacement { event, attemptedPosition, seq }`; `failedPlacements: FailedPlacement[]` on `WhenGameState`
- `src/utils/timelineRows.ts` (new) — `buildTimelineRows(events, failedPlacements)` interleaves tombstones into render rows; positions **derived per render** via `findCorrectPosition` so they stay correct as the timeline grows; per-gap ordering by year then seq
- `src/utils/timelineRows.test.ts` (new) — 7 tests (gaps, ends, multi-tombstone ordering, year ties, empty)
- `src/hooks/useWhenGame.ts` — popup condition now `if (!isSinglePlayer)` (multiplayer keeps the incorrect popup for turn handoff); 400ms timeout also appends to `failedPlacements`; kept the full 800ms `isAnimating` lock (unlocking earlier races `useDragAndDrop`'s drag-start `[data-timeline-year]` snapshot against smooth scroll)
- `src/hooks/useWhenGame.test.ts` — 4 new tombstone tests (13 total pass)
- `src/components/Timeline/TombstoneRow.tsx` (new) — current state = iteration 3 (collapse + slide-right during drag); **this is the file to redesign**
- `src/components/Timeline/Timeline.tsx` — optional `failedPlacements` prop (default `[]`, so TimelinePanel/collection view unaffected); renders `buildTimelineRows`; `LayoutGroup` wrapper; auto-scroll to a new tombstone (`data-tombstone-name`, smooth unless reduced-motion)
- `src/components/Timeline/TimelineEvent.tsx` — optional `layoutId` on the card button (set only for the animating failed card → FLIP source)
- `src/components/Game.tsx` — passes `failedPlacements`; `shouldShowYearInPopup` helper (tombstone taps reveal year); MissBanner added then removed
- `src/components/NextDailyCountdown.tsx` (new) — `formatCountdown` pure export; 1s interval off `Date.now()` so it self-corrects on resume
- `src/components/ModeSelect.tsx` — `DailyCta` extracted to module level (lint max-lines); countdown under played-state CTA; new tagline
- `src/components/GamePopup.tsx` — countdown line in daily `GameOverContent`
- `src/components/Menu.tsx` — drag rule line prepended to `GameRules` (both modes)
- `src/utils/statsStorage.test.ts` — fixture gained `failedPlacements: []`

## Key decisions

- Tombstones are **mechanically neutral** (user requirement): they never subdivide gaps or affect correctness — the difficulty ramp comes from real cards only. No `data-timeline-index`/`data-timeline-year` on tombstone DOM, ever.
- Derive tombstone gap position per render rather than storing an index (stale-index bugs impossible).
- Multiplayer records tombstones too (shared board) but keeps its popup.
- Cross-unmount `layoutId` FLIP verified working in-browser (frame captures); fallback (entrance animation + scroll) not needed.

## Verification tooling (reusable)

Headless puppeteer scripts in the session scratchpad drove the dev server (user's own on :3000): simulated dnd-kit drags via `page.mouse` (move >8px after mousedown, then steps), forced misses by dropping at index 0 repeatedly, screenshotted mid-animation frames. Selectors: `[aria-roledescription="draggable"]`, `[data-timeline-index]`, `[data-tombstone-name]`. localStorage seeds: `when-daily-result` (played-today), `when-modes-played`, `when:modeSwipeHintSeen`. Tests must run as `CI=true npm test -- --watchAll=false` (bare `npx jest` fails). Also recorded in auto-memory (`headless-verification-puppeteer.md`).

## State at session end

- All code compiles; 113 tests, typecheck, lint pass (one pre-existing warning).
- Everything works and is verified **except** the tombstone drag-time presentation, which the user hates — do not ship without resolving.
- Design review findings not yet actioned (potential future work): 600ms/800ms input locks, unskippable 3s fake start transition, scroll-disabled-during-drag on long timelines, coerced daily leaderboard submit, no bounded daily score, null encouragement for <3 correct, invisible card difficulty.
