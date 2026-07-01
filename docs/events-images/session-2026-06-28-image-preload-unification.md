# Session Summary — Unified Image Preloading Architecture

**Date:** 2026-06-28
**Branch:** `feature/stats-achievments`
**Status:** ✅ Complete — typecheck, lint, and all 94 tests pass (2 new)

## Overview

Unified the game's scattered image-preloading code onto a single, layered
architecture and added three new look-ahead prefetch points so players never see
Cloudinary image pop-in across the **loading → intro → play** flow.

Before this change, preloading was ad-hoc:

- a low-level `preloadImage()` util,
- a single-URL `useImagePreload()` hook (Card/TimelineEvent detail popups),
- two hand-rolled `new Image()` loops (Game.tsx achievement art, ImageQc.tsx).

Images loaded on demand, so the 3s intro animation loaded cards as it scrolled,
the first game render loaded the active card/timeline thumbnails fresh, and each
drawn card loaded only when it entered the hand.

## Architecture (3 layers)

1. **`preloadImage(url, priority?)`** — primitive. Fire-and-forget, deduped via a
   module-level `Set`. New optional `priority` arg; `'low'` sets
   `img.fetchPriority = 'low'` so background warming never competes on the wire
   with visible `<img>` tags (HTTP/2 multiplexing can otherwise starve on-screen
   thumbnails).
2. **`preloadEventImages(events, variants, priority?)`** — fan-out. Maps each
   event through `getImageUrl(event.image_url, variant)` per variant and calls
   `preloadImage`. Thumbnail vs detail are distinct URLs → independently deduped.
   Skips `undefined` events. Used by direct call sites with `['detail']`.
3. **`useImagePrefetch(state, introEvents)`** — single App-level orchestrator,
   mounted once (App survives `AnimatePresence mode="wait"` phase swaps, which
   would otherwise cancel a phase component's pending idle callbacks). Branches by
   `state.phase` and idle-schedules a **low-priority thumbnail** warm.

Per-render detail-popup warming in `Card.tsx:32` and `TimelineEvent.tsx:233`
(`useImagePreload(detail)`) stays as-is — correct colocation; the orchestrator
owns only look-ahead (not-yet-rendered) warming.

## Three prefetch points

| Phase           | Warmed set                                                 | Goal                                                                           |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `modeSelect`    | the intro-animation cards (shown next)                     | Home-screen dwell warms the intro                                              |
| `transitioning` | first game render's cards = seed timeline + dealt hands    | No pop-in entering play (deliberately NOT the whole deck — won't finish in 3s) |
| `playing`       | next 5 deck cards (`deck.slice(0, 5)`), re-warmed per draw | Drawn cards appear instantly                                                   |

## Files Modified

### New files

- **`src/utils/introEvents.ts`** — `pickIntroEvents(allEvents, count=20)` (random
  subset sorted by year) + `INTRO_EVENT_COUNT`. Extracted from
  GameStartTransition so App owns selection.
- **`src/hooks/useImagePrefetch.ts`** — the orchestrator + internal `useWarm`
  helper. `useWarm` depends on a **stable join-key** (`events.map(e =>
e.image_url).join('|')`), not array identity, so `state.deck`/`state.players`
  churning every placement only reschedules when contents actually change. Uses
  module-level `EMPTY` and `THUMB` constants for stable refs. `NEXT_PREFETCH = 5`.

### Modified

- **`src/utils/preloadImage.ts`** — added `priority` arg to `preloadImage`; added
  `preloadEventImages`. Now imports `getImageUrl`/`ImageVariant` from
  `cloudinaryImage.ts`.
- **`src/App.tsx`** — holds `introEvents` in `useState`; an effect re-rolls them
  on entering `modeSelect` (`[state.phase, allEvents]`). Calls
  `useImagePrefetch(state, introEvents)`. Passes `events={introEvents}` to
  `<GameStartTransition>` (was `allEvents`). Added `useState` + `HistoricalEvent`
  imports.
- **`src/components/GameStartTransition.tsx`** — prop changed from `allEvents` to
  pre-selected `events`. Removed internal `Math.random` `useMemo` pick (and the
  now-unused `useMemo` import + `EVENT_COUNT` const). Guarantees the warmed set ==
  the rendered set.
- **`src/components/Game.tsx`** — achievement-art warming (game over) now uses
  `preloadEventImages(unlockedDefs.map(d => eventsByName.get(d.eventName)),
['detail'])`. Removed `preloadImage` + `getImageUrl` imports (replaced by
  `preloadEventImages`).
- **`src/pages/ImageQc.tsx`** — next-image prefetch loop replaced with
  `preloadEventImages(queue.slice(pos + 1, pos + 6), ['detail'])`. Added
  `preloadEventImages` import (kept `getImageUrl`, still used for the on-screen
  `<img>`).
- **`src/utils/preloadImage.test.ts`** — added a `'low'` fetch-priority test and a
  `preloadEventImages` describe block (distinct variant URLs + skips undefined).

## Key Decisions & Rationale

- **Intro selection lives in App state, not `useMemo`.** A `Math.random`-based
  `useMemo` is impure (React may discard/recompute), which could make the
  prefetched set diverge from the rendered set. State set once per modeSelect
  entry guarantees they match **and** gives a fresh intro per game (matches
  today's per-game re-roll, since AnimatePresence remounts the transition).
- **Low fetch-priority for all background warming.** `requestIdleCallback` only
  delays _when_ `img.src` is assigned; the request still goes out at default
  priority. `fetchPriority='low'` is what actually keeps warm requests from
  starving visible thumbnails.
- **Transition warm is limited to first-render cards**, not the whole deck — the
  full deck won't finish warming in the 3s window and would just compete for
  bandwidth. Deck warming is deferred to `playing` (next 5, re-warmed per draw).
- **Join-key effect deps** instead of array identity — avoids reschedule churn
  from the 3–4 setStates per placement that don't touch deck/players.
- **App-level orchestration** over scattering hooks into ModeSelect/
  GameStartTransition/Game: AnimatePresence tears down component-local hooks, and
  the intro pick must be shared between the modeSelect prefetch and the transition
  render — that shared state has to live above both (App).

## Verification

- `npm run typecheck` ✅
- `npm run lint` ✅
- `CI=true npm test` ✅ — 94 passed (7 suites)

### Manual runtime check (not yet performed — for whoever validates in-browser)

Run `vercel dev`, open DevTools Network (throttle Fast 3G, "Disable cache" OFF):

- Home screen: ~20 low-priority Cloudinary thumbnail requests fire during dwell;
  starting a game shows the intro cards already cached as they scroll in.
- Entering game: active card + timeline thumbnails show no pop-in.
- During play: place a card → newly drawn card's thumbnail already cached; warm
  requests carry Priority "Low" and don't delay the active card image.
- Achievement-unlock art (game over) and ImageQc next-image stepping still
  prefetch (detail variant) after the refactor.

## Next Steps / Unfinished

- The in-browser Network verification above is the only outstanding item.
- Optional future cleanup: the older single-URL `useImagePreload` hook
  (Card/TimelineEvent) could route through `preloadImage`'s new `priority` arg
  if detail warms ever need deprioritizing — not needed now.

## Reference

- Plan file:
  `/Users/emuir/.claude/plans/users-emuir-documents-github-vibes-time-breezy-pancake.md`
