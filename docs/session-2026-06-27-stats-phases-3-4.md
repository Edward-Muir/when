# Session Summary — Stats Foundation: Phases 3 & 4

**Date:** 2026-06-27 · **Branch:** `feature/stats-achievments`
**Master plan:** `docs/session-2026-06-27-stats-achievements-master-plan.md` (6 phases)
**Prior session:** `docs/session-2026-06-27-stats-phases-1-2.md` (Phase 1 ✅, Phase 2 ✅)
**Status this session:** Phase 3 ✅ and Phase 4 ✅ complete. Phases 5–6 remain.

---

## Overview

Continued the achievement system for the "When" timeline game.

- **Phase 3** — Replaced the 7 stale old-taxonomy category cards with **20 themed `cat-<category>`
  rows** (one per `ALL_CATEGORIES`), fixed Polymath's text, and closed the Phase 2→3 consistency seam.
- **Phase 4** — Two parts: **(A)** a single-source-of-truth refactor so achievement card art derives
  from the linked event (no stored URL), and **(B)** filled all 20 category badges with real,
  recognizable per-category art via a one-sub-agent-per-category fan-out.

**All verification green throughout:** `npm run typecheck` clean, `npm run lint` clean (0 warnings),
`CI=true npm test` → **88/88 across 7 suites**.

---

## Phase 3 — Category badge data (20 themed rows)

### Files modified

| File                                | Change                                                                                                                                                                                                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/achievements.ts`          | Replaced stale rows `09`–`15` (old 7-category names) with **20 `cat-<category>` rows** in `ALL_CATEGORIES` order (`family:'Collection'`, `tier:'steel'`, `unlockCriteria:'Place 20 <Category> events'`). Fixed Polymath `08`: "all 7 categories" → "all 20 categories". |
| `src/data/achievementLogic.test.ts` | Flipped the `findAchievementConfigMismatches` test from asserting the expected Phase-2 gap to asserting **empty** `missingTests`/`missingCards`.                                                                                                                        |
| `src/data/achievementLogic.ts`      | Refreshed now-stale "expected until Phase 3" comments; the consistency `console.warn` is now a genuine bug signal.                                                                                                                                                      |
| `.eslintrc.json`                    | Added `src/data/achievements.ts` to the existing `max-lines: off` override (alongside `wordlists.ts`) — the data file grew past 450 lines; it's a flat data table.                                                                                                      |

### Key facts

- **The CSV does not exist** (`images/when-achievement-badge-prompts.csv`) and there is no generator —
  the master plan's "mirror into CSV" step was correctly **skipped**. `achievements.ts` is the sole source.
- Card count went 36 → 49 (36 − 7 + 20). Nothing hardcodes a card count; `CardsPreview` iterates
  dynamically and `statsStorage` keys unlocks by `def.id`.
- Themed names: Imperator, Firebrand, Architect, Wordsmith, Inventor, Luminary, Trendsetter, Artisan,
  Diplomat, Survivor, Tycoon, Magistrate, Cultivator, Warmonger, Empiricist, Navigator, Wayfarer,
  Maestro, Physician, Naturalist. The card ids are `cat-<category>` and match the generated
  `ACHIEVEMENT_TESTS` from Phase 2 exactly.

---

## Phase 4 — Per-category art + single-source-of-truth refactor

### Part A — Refactor (a design improvement the user called out)

**Achievement art is now linked only to an event; the image URL derives from that event at render.**
Previously each `AchievementDef` stored BOTH `eventName` and a frozen `imageUrl`, duplicating the
source of truth. Now the event JSON (`public/events/*.json`) is the only place an `image_url` lives.

| File                                 | Change                                                                                                                                                                                                                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/achievements.ts`           | Removed the `imageUrl` field from the `AchievementDef` interface and from **all 49 rows**; kept `eventName` (updated its doc comment).                                                                                                                                  |
| `src/components/AchievementCard.tsx` | Added optional prop `eventsByName?: Map<string, HistoricalEvent>`; resolves `const event = eventsByName?.get(achievement.eventName); const imageSrc = getImageUrl(event?.image_url, 'detail')`. The existing `imageSrc && (...)` guard handles the map-not-loaded case. |
| `src/pages/CardsPreview.tsx`         | Loads the catalogue once (`loadAllEvents()` → `buildEventCategoryMap()`) into state and passes `eventsByName` to every `<AchievementCard>`.                                                                                                                             |

**Verified safe before refactor:** all 29 existing card `eventName`s resolve in `loadAllEvents()`
(which filters to Cloudinary-backed events; catalogue = 5291). The only consumer of the old
`imageUrl` field was `AchievementCard.tsx`.

### Part B — The 20 picks (one sub-agent per category)

Approach: a node script built ranked candidate shortlists per category (Cloudinary-backed events
sorted by `wikipedia_views`, since `image_width/height` aspect was a uniform 0.75 portrait and didn't
differentiate). Then **20 parallel `Agent` calls (Haiku)**, one per category, each picking the most
recognizable + theme-fitting event from its shortlist (excluding the 29 eventNames already on other
cards). All 20 picks validated: distinct, resolve to Cloudinary events, category matches.

**Final picks** (written into the `cat-<category>` rows' `eventName`):

| Badge       | Category     | eventName                           |
| ----------- | ------------ | ----------------------------------- |
| Imperator   | empires      | `roman-empire-founded` _(override)_ |
| Firebrand   | revolution   | `tiananmen-square`                  |
| Architect   | architecture | `taj-mahal-completed`               |
| Wordsmith   | writing      | `frankenstein-published`            |
| Inventor    | invention    | `wheel-invented`                    |
| Luminary    | figures      | `shakespeare-born` _(override)_     |
| Trendsetter | media        | `instagram-launched`                |
| Artisan     | craft        | `chain-mail-evolution`              |
| Diplomat    | diplomacy    | `swiss-confederation`               |
| Survivor    | disasters    | `titanic-disaster`                  |
| Tycoon      | commerce     | `google-founded`                    |
| Magistrate  | law          | `magna-carta`                       |
| Cultivator  | agriculture  | `domestication-cattle`              |
| Warmonger   | warfare      | `d-day`                             |
| Empiricist  | science      | `periodic-table`                    |
| Navigator   | trade        | `panama-canal`                      |
| Wayfarer    | migration    | `columbus-americas`                 |
| Maestro     | art          | `van-gogh-starry-night`             |
| Physician   | medicine     | `florence-nightingale-crimea`       |
| Naturalist  | nature       | `earth-formation`                   |

**Two overrides** of the agents' top picks, for variety/theme:

- **empires**: agent picked `death-genghis-khan`, but Genghis Khan is already on streak badge `20`;
  `roman-empire-founded` better fits "Imperator" (the Roman title).
- **figures**: agent picked `birth-napoleon`, but Napoleon is already on streak badge `22`;
  `shakespeare-born` is a secular, towering, non-duplicate "Luminary".

**Worth a visual look:** `Artisan (craft)` → `chain-mail-evolution` — the craft category is
image-poor (most candidates have 0 wiki views), so this is the best _theme_ fit rather than a famous image.

---

## Key Decisions

1. **CSV skipped** (Phase 3) — the file referenced by the master plan doesn't exist; `achievements.ts`
   is hand-edited as the sole source.
2. **Single-source-of-truth art** (Phase 4A) — user's correction: store only `eventName`, derive the
   URL from the event. Recorded in memory: `achievement-art-single-source.md`.
3. **Haiku for the 20 pick agents** — each is a bounded "pick best from an inline list" task, so a
   small model was sufficient and far cheaper than 20 Opus/Sonnet agents.
4. **Two manual overrides** of agent picks to avoid the same historical person appearing on two badges.

---

## Verification

```bash
npm run typecheck   # clean
npm run lint        # clean, 0 warnings
CI=true npm test    # 88/88 across 7 suites
```

Tests run via `npm test` (CRA/react-scripts babel), NOT `npx jest` (fails to parse TSX here).

**Not yet done — manual visual review:** open `/cards-preview` (`npm start`) and confirm the 20
category badges render real, cleanly-circle-cropped art in both locked (greyed) and unlocked states.
Nothing has been committed.

---

## Next Steps (Phases 5–6, not started)

- **Phase 5** — `src/components/AchievementUnlock.tsx` modal shown after the game-over popup,
  consuming the hook's `newlyUnlockedAchievements` (already exposed from `useWhenGame`) via `Game.tsx`;
  tap-to-advance, confetti. **Must pass `eventsByName` to `AchievementCard`** (load the catalogue).
- **Phase 6** — `/stats` route + `src/pages/Stats.tsx` trophy case + Menu/TopBar entry. Trophy case
  uses `getAchievements().unlocked` per `def.id`; collection meter = `placedEventIds.length /
loadAllEvents().length`. **Also must pass `eventsByName` to `AchievementCard`.**

### Hooks/contracts in place for later phases

- `AchievementCard` requires an `eventsByName: Map<name, HistoricalEvent>` prop to show art — see
  `CardsPreview.tsx` for the reference loading pattern. No `imageUrl` field exists anymore.
- `useWhenGame()` returns `newlyUnlockedAchievements: string[]` (Phase 5).
- `getAchievements().unlocked` (id → ISO date) drives the Phase 6 trophy case `unlocked` state.

### Possible follow-ups

- Visual QA of all 20 category images on `/cards-preview`; swap any that crop poorly (each pick agent
  also returned 2 alternates, available in this session's transcript).
- Reconsider `Artisan (craft)` art if a more iconic craft image is preferred.
