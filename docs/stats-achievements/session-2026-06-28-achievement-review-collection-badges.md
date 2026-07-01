# Session — Achievement Review + 10 New Collection Badges

**Date:** 2026-06-28 · **Branch:** `feature/stats-achievments`

---

## Overview

Reviewed the existing achievement set for sense, difficulty gradient, and gaps, grounded against the
**real event catalogue** (5,291 playable Cloudinary events) and actual gameplay (~5-min games,
~10–15 placements typical). Then implemented a curated set of **10 new "fun" collection badges**,
all derived from already-stored data (no recording/schema change). All code is written, typechecked,
linted, and tested green (**102/102 full suite**).

---

## The review (findings)

Computed the real distribution of playable events (deduped, Cloudinary-backed) by category,
difficulty, and century:

- **No badge is mathematically impossible.** Every category has ≥20 events (smallest `nature`=116),
  every century 1–21 CE is represented (rarest C03=31), every difficulty bucket has supply.
- **Deck reality:** the deck is the whole catalogue minus the dealt hand; in Daily/Sudden-Death a
  _correct_ placement draws a replacement, so a game ends only when mistakes empty the hand. The
  "10–15 events" is the typical _outcome with errors_, not a cap → streak-25 / 30-correct badges are
  reachable (they just demand near-flawless play).
- **Difficulty-family has an INVERTED gradient** (flagged, left as optional/out-of-scope): thresholds
  ignore pool size. easy=609 (rarest!), hard=2,115 (most common). So **Warm-Up** (80 easy, _bronze_)
  ≈60–70 games while **Uphill Battle** (20 hard, _gold_) ≈5–6 games — the bronze is harder than the
  gold. Suggested later fix: lower Warm-Up to ~30 easy, raise Uphill to ~60 hard.
- **Other notes:** category badges all `steel` but vary ~5× in grind; `Across the Ages` (gold) gated
  by rarest century, effectively harder than gold; `Ancient Historian` (verdigris) is a trivial
  one-off (thematic tier, not difficulty); `gold` used 10×.

### Scope chosen by user

User selected **"Add new collection badges"** + **"Think of more fun achievements"**, and explicitly
**dropped** an earlier-proposed "Group B" (single-game/Sudden-Death badges needing new `recordGameResult`
fields like `hadFlawlessGame`/`widestCenturySpanInGame`/`bestCustomStreakEver`-based). Only the
pure-derivation "Group A" was implemented.

---

## What was implemented — 10 new badges

All `family: 'Collection'`, art hardcoded via `eventName` → resolved to the event's `image_url` at
runtime (the single-source-of-truth pattern; `AchievementDef` has **no** `imageUrl`). All event names
verified to exist with Cloudinary art and chosen distinct from art already used by other badges.

| id                  | name                    | tier     | unlock                          | art `eventName`              |
| ------------------- | ----------------------- | -------- | ------------------------------- | ---------------------------- |
| `coll-100`          | Curator                 | bronze   | 100 unique events               | `rosetta-stone`              |
| `coll-500`          | Archivist               | silver   | 500 unique events               | `library-alexandria`         |
| `coll-1500`         | Custodian               | gold     | 1,500 unique events             | `british-museum-founded`     |
| `coll-3000`         | Keeper of Time          | diamond  | 3,000 unique events (~57%)      | `stonehenge`                 |
| `era-bce`           | Antiquarian             | silver   | 25 BCE events                   | `code-hammurabi`             |
| `era-modern`        | Present Tense           | silver   | 50 events from the 21st century | `iphone-released`            |
| `era-epochs`        | Epoch Hopper            | gold     | 15 in each of 5 great eras      | `antikythera-mechanism`      |
| `theme-renaissance` | Renaissance Soul        | gold     | 15 each Art/Science/Writing     | `italian-renaissance-begins` |
| `theme-statecraft`  | Power Broker            | gold     | 15 each Empires/Law/Diplomacy   | `peace-westphalia`           |
| `meta-categories`   | The Complete Collection | obsidian | all 20 category badges earned   | `hanging-gardens-babylon`    |

**Epoch Hopper bands** (each ≥15): Prehistory `<-3000`, Antiquity `-3000..476`, Medieval `476..1500`,
Early-Modern `1500..1800`, Modern `>=1800`.

---

## Files modified

| File                             | Change                                                                                                                                                                                                                                                                                                                                                            |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/data/achievements.ts`       | Added the 10 new `AchievementDef` rows (after id `36`), grouped with comment headers (collection milestones / era / themed / completionist meta).                                                                                                                                                                                                                 |
| `src/data/achievementLogic.ts`   | Added 10 matching `ACHIEVEMENT_TESTS` entries; added an `epochBands(events)` helper beside `centuryCE`. `meta-categories` derives from per-category counts (every category ≥ `CATEGORY_THRESHOLD`) rather than reading `unlocked`, so it can't lag a category unlock by a game.                                                                                   |
| `src/utils/statsStorage.test.ts` | Added a `collection / era / themed / meta` describe block (7 tests) exercising the real `reevaluateAchievements` path via a `seed()` fixture helper, plus an `achievement config consistency` test calling `findAchievementConfigMismatches()`. Imported `Category, Difficulty, ALL_CATEGORIES`, `reevaluateAchievements`, and `findAchievementConfigMismatches`. |

**No `statsStorage.ts` change** — every new test derives from already-stored `placedEventIds`.

---

## Key decisions & rationale

- **Group A only (pure derivation).** No `recordGameResult`/schema changes; new badges read
  `CollectionState.placedEventIds` resolved against current event data. Keeps recording
  category/year-agnostic.
- **`meta-categories` derives from counts, not the `unlocked` map.** Avoids a one-game lag and avoids
  coupling the test to achievement-unlock ordering / circular imports (`achievementLogic` only
  type-imports from `statsStorage`).
- **Dropped the CSV mirror step.** `../when-images/when-achievement-badge-prompts.csv` is an offline
  image-prompt record the **app never reads** — badge art resolves at runtime from `eventName`. The
  user questioned why it was being touched; it was only ever _read_, never modified. The plan and
  approach were corrected to drop it entirely.
- **Tier choices:** milestones escalate bronze→silver→gold→diamond; the completionist meta is
  `obsidian`; themed/era badges silver–gold.

---

## Verification

- `npm run typecheck` ✅
- `npm run lint` ✅
- Tests: **`statsStorage.test.ts` 40/40**, **full suite 102/102** via `npx react-scripts test` (CI mode).
- **Run tests with `npm test` / `npx react-scripts test`, NOT bare `npx jest`** — the latter doesn't
  load the project's TypeScript preset and throws a false syntax error on existing TS type annotations.
- Manual eyeball (not yet done): `npm start` → `/cards-preview` to see the 10 new cards render with art.

---

## Unfinished / possible next steps

1. **Manual visual check** of the 10 new cards on `/cards-preview` (and `/stats` if/when that page
   exists per the master plan Phase 6).
2. **Optional: Difficulty-family rebalance** (out of this session's scope) — fix the inverted
   gradient: e.g. Warm-Up ~30 easy, Uphill ~60 hard. Pure threshold edits in
   `achievementLogic.ts` + criteria text in `achievements.ts`.
3. **Optional: move new unlock-predicate tests** into the existing `src/data/achievementLogic.test.ts`
   if co-locating with logic tests is preferred (currently they live in `statsStorage.test.ts`,
   testing the real `reevaluateAchievements` path).
4. The dropped "Group B" fun badges (Perfect Game, Sudden-Death survivor, single-game span/variety)
   remain available if the user later wants them — they'd need cheap "best-ever" fields added to
   `LifetimeStats` in `recordGameResult`. `flawlessFreeplayGames` and `bestCustomStreakEver` are
   already tracked but currently unused.

---

## Context for future sessions

- Achievement system: cards in `src/data/achievements.ts` (`AchievementDef`, no `imageUrl` — art from
  `eventName`), unlock logic in `src/data/achievementLogic.ts` (`ACHIEVEMENT_TESTS` keyed by id;
  category tests generated from `ALL_CATEGORIES`; a dev consistency assert requires every card↔test).
- Recording/eval in `src/utils/statsStorage.ts`: `recordGameResult(state, eventsByName)` →
  `reevaluateAchievements(eventsByName)` returns newly-unlocked ids.
- Related plan: `docs/stats-achievements/session-2026-06-27-stats-achievements-master-plan.md` (phased build of the whole
  stats/achievements system — Phases 5 (unlock modal) and 6 (Stats/trophy page) still pending there).
- Plan file for this session: `/Users/emuir/.claude/plans/users-emuir-documents-github-vibes-time-vast-newt.md`.
