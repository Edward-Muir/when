# Session Summary — Stats Foundation: Phases 1 & 2

**Date:** 2026-06-27 · **Branch:** `feature/stats-achievments`
**Master plan:** `docs/session-2026-06-27-stats-achievements-master-plan.md` (6 phases)
**Status this session:** Phase 1 ✅ and Phase 2 ✅ complete. Phases 3–6 remain.

---

## Overview

Built the invisible stats/achievement engine behind the "When" timeline game's 36 achievement cards
(previously visual-design-only, with no tracking or unlock logic). Two phases of the master plan:

- **Phase 1** — localStorage stats storage layer + tests.
- **Phase 2** — `recordGameResult` recorder wired into game-over, plus the full achievement unlock
  logic (`ACHIEVEMENT_TESTS`) keyed to the existing 36 cards + 20 generated category tests.

No visible UI yet — unlocks are observable only via localStorage / tests. **Full suite green: 88/88
tests, typecheck clean, lint clean (0 warnings).**

The guiding principle (from the master plan): **store generic primitives, derive every per-category
stat at read time.** The key primitive is `CollectionState.placedEventIds` (unique correctly-placed
event names across all modes); per-category/era/difficulty counts are derived by resolving ids against
loaded event data. No `Record<Category, number>` counters are ever stored, so new/renamed categories
need zero stored-data change.

---

## Files Created

| File                                | Purpose                                                                                                                                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/statsStorage.ts`         | **NEW** (Phase 1, extended in Phase 2). 5 storage primitives + accessors, `buildEventCategoryMap`, one-time high-score migration, `recordGameResult`, `reevaluateAchievements`, date helpers. |
| `src/utils/statsStorage.test.ts`    | **NEW**. Zero-defaults, round-trip, union/dedupe, migration-once, key independence, recording, per-mode increments, cadence idempotency, daily-streak advance/hold/reset.                     |
| `src/data/achievementLogic.ts`      | **NEW** (Phase 2). `StatsSnapshot`, `AchievementTest`, `ACHIEVEMENT_TESTS` (all stable ids + 20 generated `cat-*`), century/difficulty helpers, dev consistency detector.                     |
| `src/data/achievementLogic.test.ts` | **NEW** (Phase 2). Per-family thresholds, category-at-exactly-20, rename test, Polymath, century coverage, difficulty, consistency-gap assertion.                                             |

## Files Modified

| File                       | Change                                                                                                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/index.ts`       | Added `seedEventName?: string` to `WhenGameState`.                                                                                                                                                                                                  |
| `src/hooks/useWhenGame.ts` | Set `seedEventName` in `startGame`/`initialState`; new **ref-guarded game-over effect** calling `recordGameResult` (via `useMemo`'d `buildEventCategoryMap(allEvents)`); exposes `newlyUnlockedAchievements: string[]` from the hook (for Phase 5). |
| `src/data/achievements.ts` | Text-only: appended " (Daily only)" to streak badges 19–23; rewrote id 17 `unlockCriteria` to "Place an event in every century from the 1st to the 21st".                                                                                           |

---

## Storage Schema (Phase 1)

One localStorage key per object; all accessors `try/catch` fail-silent; getters return fully-populated
zero-default objects (never null), merging partial/older stored shapes over defaults.

| Interface         | Key                   | Notes                                                                                                                                                                                                          |
| ----------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LifetimeStats`   | `when-lifetime-stats` | per-mode `gamesPlayed`/`timelineLengthSum`/`longestTimeline`, `eventsPlacedCorrect/Wrong`, `bestInGameStreakEver`, **`bestGameCorrectEver`** (added Phase 2), `flawlessFreeplayGames`, first/last played dates |
| `CollectionState` | `when-collection`     | `placedEventIds: string[]` (de-duped on read & write; `addPlacedEventIds()` Set-union helper)                                                                                                                  |
| `DailyCadence`    | `when-daily-cadence`  | streaks, `playedDates`, `bestDailyCorrect`, `dailyCorrectSum`, `dailyCorrectHistogram`                                                                                                                         |
| `Achievements`    | `when-achievements`   | `unlocked: { [id]: ISODate }`                                                                                                                                                                                  |
| `CustomStats`     | `when-custom-stats`   | isolated bucket — **now effectively unused** (see decision 1); accessors kept, recorder does not write it                                                                                                      |

`buildEventCategoryMap(events)` → `Map<name, HistoricalEvent>` (full event, not just category).
High-score migration in `getLifetimeStats()` seeds `longestTimeline.suddenDeath` from legacy
`getTimelineHighScore()` once — **a harmless no-op in practice** because `saveTimelineHighScore` is
never called anywhere in the codebase.

---

## Key Decisions (Phase 2)

These were made **with the user** and override the master plan where they differ:

1. **Custom games count for everything EXCEPT in-game streak.** Discovery: every non-daily game now
   unconditionally carries a `challengeCode` (ModeSelect.tsx:278 generates one for sharing; the UX is
   a two-way Daily/Custom pager — there is no "plain SD/Freeplay" path). The master plan's
   `challengeCode → custom-only bucket` rule would have starved every lifetime/volume/single-game
   badge. **Resolution:** classification collapses to **daily vs non-daily** (via `lastConfig.dailySeed`).
   Non-daily games feed LifetimeStats + Collection like normal play. The `CustomStats` bucket and the
   planned `challengeCode`/App.tsx flag are not needed.

2. **In-game streak badges (19–23) are daily-only.** `LifetimeStats.bestInGameStreakEver` advances
   only on daily games; those 5 cards now say "(Daily only)".

3. **`bestGameCorrectEver` added to `LifetimeStats`** so single-game badges (28–32) count custom games
   too (allowed: not in prod, no migration). Single-game tests read this, not `bestDailyCorrect`.

4. **Across the Ages (17)** redefined as set-coverage: an event in **every century 1st–21st CE**
   (`centuryCE(y) = y>=1 ? floor((y-1)/100)+1 : null`), not a span threshold.

5. **Idempotency:** `recordGameResult` increments counters (unlike the daily save, which overwrites a
   date-keyed record), so the hook uses a **`useRef` once-per-game guard** that resets when the phase
   leaves `gameOver`. Cadence has an extra `playedDates`-membership guard so a same-date re-record is a
   no-op. (Lifetime double-count is prevented by the ref guard only.)

6. **`achievementLogic.ts` ↔ `statsStorage.ts` no runtime cycle:** statsStorage value-imports
   `ACHIEVEMENT_TESTS`; achievementLogic only **type-imports** the stat interfaces back.

---

## Achievement Test Coverage (Phase 2)

`ACHIEVEMENT_TESTS` (in `achievementLogic.ts`) — thresholds taken from each card's `unlockCriteria`
(source of truth, more current than the docs spec):

- **Milestone 01–04:** total games (daily+SD+freeplay) ≥ 1/10/50/100.
- **Volume 05–07:** `eventsPlacedCorrect` ≥ 100/500/1000.
- **Polymath 08:** distinct categories ≥ `ALL_CATEGORIES.length` (20).
- **Ancient Historian 16:** a placed event `year < -1000`.
- **Across the Ages 17:** every century 1–21 CE covered.
- **Difficulty 18/34/35/36:** placed very-hard≥10 / easy≥80 / medium≥40 / hard≥20.
- **In-game streak 19–23:** `bestInGameStreakEver` ≥ 5/10/15/20/25 (daily-only stat).
- **Daily-cadence 24–27:** `maxDailyStreak` ≥ 3/7/30/100.
- **Old Faithful 33:** `playedDates.length` ≥ 50.
- **Single-game 28–32:** `bestGameCorrectEver` ≥ 10/15/20/25/30.
- **Category `cat-<c>`:** generated per `ALL_CATEGORIES`; ≥ `CATEGORY_THRESHOLD` (20) of that category.

`findAchievementConfigMismatches()` is a dev-only, non-fatal consistency detector (console.warn).

---

## ⚠️ Expected Cross-Phase Artifact (the Phase 2→3 seam)

The dev consistency check intentionally reports a mismatch **right now**, and a test asserts exactly it:

- `missingTests`: `['09','10','11','12','13','14','15']` — the 7 stale category cards have no logic.
- `missingCards`: all 20 `cat-*` test ids — the generated category tests have no cards yet.

This **resolves in Phase 3** when the 7 stale rows (ids 09–15, old 7-category names) are replaced with
20 themed `cat-<category>` rows. After Phase 3 the detector should report empty, and the test in
`achievementLogic.test.ts` (`findAchievementConfigMismatches` describe block) must be updated to expect
empty arrays. **A failing test there after Phase 3 is the intended signal, not a regression.**

---

## Verification (this session)

```bash
npm run typecheck   # clean
npm run lint        # clean, 0 warnings (added inline security/detect-object-injection
                    # suppressions matching repo convention for typed-key bracket access)
CI=true npm test    # 88/88 across 7 suites
```

**Note:** tests run via `npm test` (react-scripts/CRA babel), **not** `npx jest` — `npx jest` fails to
parse TSX here.

---

## Next Steps (Phases 3–6, not started)

- **Phase 3** — replace stale category rows 09–15 in `achievements.ts` with 20 themed `cat-<category>`
  rows (`family:'Collection'`, `tier:'steel'`, `unlockCriteria:"Place 20 <Category> events"`); fix
  Polymath 08 text "all 7" → "all 20"; mirror into `images/when-achievement-badge-prompts.csv`.
  **Then update the `findAchievementConfigMismatches` test to expect empty.** Themed names table is in
  the master plan.
- **Phase 4** — per-category card art via one sub-agent per category (pick a recognizable,
  circle-croppable Cloudinary event per category); fill `eventName` + `imageUrl`.
- **Phase 5** — `AchievementUnlock.tsx` modal (after game-over popup), consuming the hook's
  `newlyUnlockedAchievements` via Game.tsx; tap-to-advance, confetti.
- **Phase 6** — `/stats` route + `Stats.tsx` trophy case + Menu/TopBar entry points.

### Hooks already in place for later phases

- `useWhenGame()` returns **`newlyUnlockedAchievements: string[]`** → wire to Phase 5 modal in Game.tsx.
- `getAchievements().unlocked` → Phase 6 trophy case (`isUnlocked` per `def.id`).
- `getCollectionState().placedEventIds.length` / `loadAllEvents().length` → Phase 6 collection meter.
