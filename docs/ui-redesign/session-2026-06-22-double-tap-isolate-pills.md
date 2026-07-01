# Session Summary: Double-Tap Isolate/Restore on Filter Pills

**Date:** 2026-06-22
**Branch:** `feature/people`
**Subject:** Plotly-style double-tap behavior for category/difficulty/era filter pills

## Overview

Added Plotly-legend-style interaction to the filter pills on the **Custom** game settings screen. With 20 categories, isolating a single category previously meant tapping off 19 others. Now:

- **Single tap** — toggles a pill on/off (instant, no delay).
- **Double tap (same pill)** — isolates to only that pill; double-tapping the lone-selected pill restores all.

Applied to **all three pill groups** (Categories, Difficulty, Eras) per user choice. No helper/hint text was added (also per user choice).

## Files Modified

### `src/components/FilterControls.tsx` (only file changed)

This shared component renders all three pill groups and is consumed by `CustomGameSettings.tsx` and `FilterPopup.tsx`, so the behavior propagates everywhere automatically. State lives in `ModeSelect.tsx` and required **no changes** — the new logic just dispatches through the existing `on*Change` callbacks and `toggle*` functions.

Changes:

- Added `DOUBLE_TAP_MS = 400` constant.
- Added a `lastTap` ref (`{ key, time, before }`) and a generic `handlePillTap<T>(item, key, selected, all, onChange, toggle)` helper.
- Rewired each pill's `onClick` (Difficulty / Categories / Eras) to call `handlePillTap(...)` instead of the direct `toggle*` call. Eras pass `era.id` as both item and key and derive `all` via `ERA_DEFINITIONS.map((e) => e.id)`.

## Key Decisions & Rationale

1. **Instant single tap (no debounce).**
   The first implementation used a 250ms `setTimeout` debounce to distinguish single vs. double tap. The user reported it felt "sticky/slow" and the double-click was buggy (raced with React re-renders). **Rewrote to toggle immediately on the first tap** and detect a double-tap by timestamp comparison.

2. **Act on pre-tap state (`before`), not the live prop.**
   On the first tap we store the current `selected` array in `lastTap.current.before`. A double-tap's two toggles net to a no-op on that pill, so we apply isolate/restore from `before` — making the result deterministic regardless of render timing. `wasOnlyThis = before.length === 1 && before[0] === item` → restore all; otherwise isolate to `[item]`.
   - Trade-off: a brief flicker during a double-tap (first toggle shows momentarily before isolate lands). Accepted in exchange for instant single-tap responsiveness.

3. **No `onDoubleClick`.**
   App is mobile-first; React's `onDoubleClick` is unreliable on touch. Timestamp-on-`click` works for both mouse and touch.

4. **400ms double-tap window** (raised from 300ms after research).
   - Windows default double-click: 500ms; macOS ~400–500ms; iOS/WebKit touch threshold: 350ms; common JS implementations: 300–500ms.
   - 400ms matches OS norms and sits just above WebKit's 350ms. Since single tap is instant, a wider window adds **no** input lag — it only makes double-taps easier to land. Capped below 500ms so two intentional rapid single toggles aren't misread as a double-tap.

## Verification

- `npm run typecheck` — passes.
- `npm run lint` — passes.
- Manual (recommended): `npm start`, open Custom screen:
  - Single tap a category → toggles instantly.
  - Double tap a category → header shows `1/N`.
  - Double tap the lone category again → header shows `All`.
  - Repeat for Difficulty and Eras.
  - Confirm on touch/mobile emulation, and that "Play · N events" count + "select at least one" guard update.

## Status

Complete. No unfinished work. Single-file change, ready to commit (not yet committed).
