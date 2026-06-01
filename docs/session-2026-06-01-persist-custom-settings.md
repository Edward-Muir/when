# Session — Persist Custom Game Settings + Dev Service Worker Fix

**Date:** 2026-06-01
**Branch:** main (working tree)
**Plan file:** `~/.claude/plans/users-emuir-documents-github-vibes-time-validated-truffle.md`

## Overview

Implemented persistence for the Custom-page game configuration so a player's last selections
(difficulties, categories, eras, mode, hand size, player count) survive a browser refresh,
while keeping the per-play deck seed random so each play still produces a different game.

During verification on `vercel dev`, the user reported a refresh still showed defaults even
though DevTools confirmed `when-custom-settings` was being written to Local Storage. Root cause
turned out to be the project's customised service worker serving cache-first on localhost,
which intercepted refreshes and ran a cached older bundle while HMR pushed the new code live.
A second commit gated SW registration to production builds and actively unregisters in
development, restoring expected dev-loop behaviour.

## Files Modified

### `src/utils/playerStorage.ts`

- Extended the existing `when-`-prefixed JSON localStorage pattern.
- New `CustomSettings` interface (named to avoid clashing with the `CustomGameSettings`
  component): `isSuddenDeath`, `selectedDifficulties`, `selectedCategories`, `selectedEras`,
  `playerCount`, `cardsPerHand`, `suddenDeathHandSize`.
- New `saveCustomSettings(settings)` — JSON write inside try/catch, silent-fail with
  `console.warn`, matching `saveDailyResult`'s shape.
- New `getCustomSettings(): CustomSettings | null` — parses + validates (filter arrays must
  be non-empty, numbers finite, mode boolean); returns `null` on any corruption so callers
  fall back to defaults.
- Imports extended: `import { GameMode, Difficulty, Category, Era } from '../types';`.
- Storage key: `'when-custom-settings'`.

### `src/components/ModeSelect.tsx`

- Imports `getCustomSettings` and `saveCustomSettings` from `playerStorage`.
- Added a lazy initializer that reads localStorage once on mount:
  `const [savedSettings] = useState(() => getCustomSettings());`
- All seven setting `useState` calls now seed from `savedSettings?.X ?? <existing default>`
  (e.g. `useState(savedSettings?.isSuddenDeath ?? true)`), preserving the original defaults
  as a fallback when nothing is saved or storage is corrupted.
- Added a single `useEffect` that re-saves the seven settings on every change. Because
  applying a shared challenge code in `CustomGameSettings.tsx` routes through the same parent
  setters, pasting a friend's code also persists automatically — no extra wiring.

### `src/index.tsx`

- Replaced the unconditional `serviceWorkerRegistration.register();` with a NODE_ENV guard:
  ```ts
  if (process.env.NODE_ENV === 'production') {
    serviceWorkerRegistration.register();
  } else {
    serviceWorkerRegistration.unregister();
  }
  ```
- `unregister()` was already exported from `src/serviceWorkerRegistration.ts:121-131`; no
  changes there.

## Key Decisions

- **JSON object in localStorage vs reusing the challenge-code encoding.** Went with a JSON
  object (matching `DailyResult` conventions) rather than re-encoding settings as a challenge
  code, because the share-code is purpose-built for transport+seed and JSON is clearer for
  pure local persistence.
- **Save on every change**, not only on Play (user confirmed). A `useEffect` writes whenever
  any of the seven settings change, so tweaks the user never plays are still remembered —
  matching the "preserve user effort" intent.
- **No reset-to-defaults button** (user confirmed). Kept scope minimal.
- **Seed remains random**, untouched. `handlePlayStart` already calls `generateChallengeSeed()`
  per play (`ModeSelect.tsx:217`), and the seed is intentionally _not_ persisted, so refresh
  restores settings but the deck still differs.
- **SW guard at the call site (`index.tsx`)**, not inside `serviceWorkerRegistration.ts`.
  Keeps the diff minimal and leaves the localhost branch of `register()` available if anyone
  intentionally re-enables it. Mirrors the standard CRA template's pattern.

## Diagnosis Highlights (worth keeping)

The persistence code was correct from the first commit; the apparent "doesn't persist" was
purely environmental:

- `ModeSelect` is rendered with a stable `key="modeSelect"` in `src/App.tsx:136-137` across
  the `loading` and `modeSelect` phases — it mounts once and the lazy initializer runs once,
  so restore from localStorage is well-defined.
- The repo's `src/serviceWorkerRegistration.ts` is a customised variant that registers and
  serves cache-first on localhost (lines 50-55), unlike CRA's default which is
  production-only.
- The user had a `build/service-worker.js` and `build/static/js/main.*.js` from a prior
  `npm run build`. A previously-registered SW on `localhost:3000` was therefore intercepting
  full-page reloads with the cached old bundle while HMR was simultaneously patching the new
  code in-memory — explaining the contradiction that writes succeeded (new code via HMR) yet
  refreshes appeared to revert (cached old bundle).

## Verification

- `npm run typecheck` and `npm run lint` — both clean after each change.
- Manual browser verification is pending the one-time SW cleanup below.

## Next Steps / What the user needs to do

One-time cleanup of the currently-cached SW on the user's browser before the dev fix takes
effect:

1. DevTools → **Application → Service Workers → Unregister**.
2. DevTools → **Application → Storage → Clear site data** (also wipes localStorage, so any
   existing `when-custom-settings` goes — fine, re-toggle filters to repopulate).
3. Hard refresh `localhost:3000`. Console should no longer log
   `[SW] PWA is being served cache-first by a service worker.`
4. Verify on the Custom page: deselect a couple of categories/eras → refresh → selections
   restored, `when-custom-settings` present in Local Storage.
5. Press Play twice from identical settings → decks differ (seed still random).

After this, every `vercel dev` / `npm start` session will run live code without the SW
shadowing it. Production PWA caching is unchanged.

## Context for Future Sessions

- **Storage key**: `when-custom-settings` (JSON). Follows the existing `when-`-prefixed
  pattern in `src/utils/playerStorage.ts`. If the persisted shape ever changes, prefer adding
  fields with optional types or stricter validation in `getCustomSettings` returning `null` on
  shape mismatch — callers already fall back to defaults.
- **Naming**: type is `CustomSettings`, kept distinct from the `CustomGameSettings` React
  component in `src/components/CustomGameSettings.tsx`.
- **Save trigger**: any toggle in `FilterControls` (or applying a share code, which calls the
  parent setters) triggers the persistence effect — there is exactly one effect to maintain
  if more persisted fields are added later. Keep the dependency array aligned with the
  object being saved.
- **Seed handling**: do NOT persist the deck seed. `handlePlayStart` in
  `src/components/ModeSelect.tsx` is the source of truth for per-play randomness, and the
  Custom page's display seed is regenerated on mount inside `CustomGameSettings.tsx`.
- **Service worker**: now production-only. If anyone wants to re-test PWA cache behaviour on
  localhost, build the app and serve `build/` separately (e.g. `npx serve -s build`) rather
  than reinstating the SW under `vercel dev`/`react-scripts start` — otherwise the same
  stale-cache footgun returns.
- **Plan file** (kept for traceability):
  `~/.claude/plans/users-emuir-documents-github-vibes-time-validated-truffle.md`.
