# Master Plan — Stats Foundation + Per-Category Achievements (PHASED)

**Date:** 2026-06-27 · **Branch:** `feature/people` · **Status:** Planning complete, no code written.

This is a **self-contained, phased restart point**. Each phase below is sized to run in its own
session. It supersedes `docs/stats-achievements/session-2026-06-21-stats-category-achievements-plan.md` (same skeleton,
updated to current code: **no generator script exists**, art chosen by per-category sub-agents,
and a new unlock-presentation phase). Read the **Grounding facts** section before starting any phase.

---

## Context — why this change

Two earlier threads need joining:

1. **Achievement cards are visual-design only.** `src/data/achievements.ts` holds 36 display-only
   `AchievementDef`s rendered by `src/components/AchievementCard.tsx` on the `/cards-preview`
   harness (`src/pages/CardsPreview.tsx`). **No unlock logic, no stats tracking, no in-app page.**
2. **Category taxonomy grew 7 → 20.** `ALL_CATEGORIES` in `src/types/index.ts` now has 20 values,
   so the achievement config is **stale**: badge rows 09–15 still name the old 7 categories
   (Conflict/Cultural/Diplomatic/Disasters/Exploration/Infrastructure/People) and Polymath (08)
   says "all 7 categories".

**Goal:** build the full stats foundation, wire real achievement unlock logic, replace the stale 7
category badges with **20 themed per-category badges** that unlock at **20 distinct correctly placed
events** of that category, present unlocks to the player, and add a stats / trophy-case page. The
design must absorb future category additions with **zero stored-data schema change**.

**Not in prod yet** → breaking changes to stored stats are fine; **no migration needed** (except the
one-time high-score read-through in Phase 1).

---

## THE KEY DESIGN PRINCIPLE (the whole answer to "how do categories affect stats")

**Store generic primitives; derive every per-category stat at read time.** The key primitive is
`CollectionState.placedEventIds: string[]` — the UNIQUE set of correctly-placed event `name`s
(stable IDs), unioned across all modes. Per-category counts are **derived** by resolving each id
against loaded event data (`name → category`) and grouping.

**Never store `Record<Category, number>` counters** — they couple stored data to the taxonomy:

- A new category's events already carry `category:'newcat'` and their names are already in
  `placedEventIds`, so its count derives the instant a new `AchievementDef` exists — no stored-data
  change, no back-fill.
- A renamed category would silently corrupt a counter; the set re-resolves category from current
  event JSON at read time, so renames reclassify automatically.
- The same set also powers era / difficulty / "spanning N centuries" / collection-meter badges.

So **recording is category-count-agnostic by construction.** The only per-category cost is the
_display card_ (art + name) = one config row per category.

---

## Phase 1 — Stats storage foundation

**Deliverable:** invisible storage layer + tests. No gameplay or UI change yet.

**NEW `src/utils/statsStorage.ts`**, mirroring `src/utils/playerStorage.ts` (typed `getX`/`saveX`,
one localStorage key per object, fail-silent `try/catch`, zero-default getters). Five primitives:

| Object            | localStorage key      | Fields                                                                                                                                                                                                                                                                         |
| ----------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LifetimeStats`   | `when-lifetime-stats` | `gamesPlayed:{daily,suddenDeath,freeplay}`, `eventsPlacedCorrect`, `eventsPlacedWrong`, `timelineLengthSum:{daily,suddenDeath,freeplay}`, `longestTimeline:{daily,suddenDeath,freeplay}`, `bestInGameStreakEver`, `flawlessFreeplayGames`, `firstPlayedDate`, `lastPlayedDate` |
| `CollectionState` | `when-collection`     | `placedEventIds: string[]` — unique correct placements, ALL modes incl. custom                                                                                                                                                                                                 |
| `DailyCadence`    | `when-daily-cadence`  | `currentDailyStreak`, `maxDailyStreak`, `lastDailyDate`, `playedDates: string[]`, `bestDailyCorrect`, `dailyCorrectSum`, `dailyCorrectHistogram: number[]`                                                                                                                     |
| `Achievements`    | `when-achievements`   | `unlocked: { [achievementId: string]: string }` (id → ISO date)                                                                                                                                                                                                                |
| `CustomStats`     | `when-custom-stats`   | isolated bucket: `gamesPlayed`, `eventsPlacedCorrect`, `eventsPlacedWrong`, `longestTimeline`, `timelineLengthSum`, `bestInGameStreak` — NO daily/streak fields                                                                                                                |

Also in this file:

- `buildEventCategoryMap(events: HistoricalEvent[]): Map<string, HistoricalEvent>` — keyed by `name`,
  stores the **full event** (so era/difficulty derivations reuse it, not just category).
- **High-score migration:** on first `getLifetimeStats()` read, if
  `LifetimeStats.longestTimeline.suddenDeath` is unset and `getTimelineHighScore()` (from
  `playerStorage.ts`) returns a value, seed it. One-time, idempotent.

**Reuse:** storage pattern + `getTimelineHighScore` from `playerStorage.ts`;
`eventLoader.loadAllEvents()` for the catalogue + name→event map.

**Verify — NEW `src/utils/statsStorage.test.ts`** (Jest, style of `src/utils/eventNameLength.test.ts`):
getters return zero-defaults on empty storage; `saveX`/`getX` round-trip; `placedEventIds` unions
without duplicates; high-score migration seeds `longestTimeline.suddenDeath` exactly once; each key
is independent (writing one doesn't clobber another). Then `npm run typecheck` + `npm run lint` +
`npm test`.

**Files:** `src/utils/statsStorage.ts` (NEW), `src/utils/statsStorage.test.ts` (NEW).

---

## Phase 2 — `recordGameResult` hook + achievement unlock logic

**Deliverable:** every finished game updates stats and unlocks achievements (still no visible UI;
unlocks only observable in localStorage / via the test). Depends on Phase 1.

### 2a. Recording

**`recordGameResult(state: WhenGameState): string[]` in `statsStorage.ts`** — returns the ids
unlocked _this call_. Called from a **NEW game-over effect in `src/hooks/useWhenGame.ts`**, placed
beside the existing `useSaveDailyResult` and using the same `phase === 'gameOver'` trigger, but
firing for **all** modes (daily / SD / freeplay / custom), not just daily.

**Classify from `state.lastConfig`** (`GameConfig` has `dailySeed?`, `challengeSeed?`, `challengeCode?`):

- `dailySeed` truthy → **daily**: advance `DailyCadence` + `LifetimeStats` + `CollectionState`.
- else `challengeCode` truthy → **custom**: write ONLY `CustomStats` + union into `CollectionState`.
  Never touch `LifetimeStats` / `DailyCadence` / streak badges.
- else → **default** (SD / Freeplay): advance `LifetimeStats` + `CollectionState`.

**Correctly-placed names this game** — no new per-placement tracking needed. The game inserts an
event into `state.timeline` only on a correct placement; the seed card is `sortByYear([shuffled[0]])`
built in `startGame`. So:

```ts
placedThisGame = state.timeline.map((e) => e.name).filter((name) => name !== seedEventName);
```

**Add `seedEventName?: string` to `WhenGameState`** (in `src/hooks/useWhenGame.ts`), set in
`startGame` at the line that builds the seed timeline (`const timelineEvents = sortByYear([shuffled[0]])`,
~line 163) → `seedEventName: shuffled[0].name`. Union `placedThisGame` into
`CollectionState.placedEventIds` via a `Set`.

_Multiplayer note (write in code):_ `state.timeline` mixes all players' correct placements; v1
unions the whole final timeline as a single-device personal collection — acceptable for now.

### 2b. Unlock logic

**NEW hand-authored `src/data/achievementLogic.ts`** (parallels hand-authored
`src/data/achievementTiers.ts`), keyed by the same ids as `ACHIEVEMENTS`. **Do NOT add `test` to
`achievements.ts`** — it's nominally CSV-generated and a hand edit there would be clobbered if ever
regenerated.

```ts
export type AchievementTest = (
  stats: StatsSnapshot,
  eventsByName: Map<string, HistoricalEvent>
) => boolean;
export const ACHIEVEMENT_TESTS: Record<string, AchievementTest> = {
  /* ... */
};
```

- `StatsSnapshot` bundles the read primitives (`lifetime`, `collection`, `cadence`, `custom`).
- Implement a `test` for every existing family per the original spec's "Derived from" column
  (Milestone / Volume / Streak / Cadence / Single-Game / Difficulty / era). See
  `docs/stats-achievements-plan.md` for the per-badge derivations.
- **Category tests generated from `ALL_CATEGORIES`:**
  ```ts
  export const CATEGORY_THRESHOLD = 20;
  const categoryBadgeId = (c: Category) => `cat-${c}`;
  // for each c in ALL_CATEGORIES:
  ACHIEVEMENT_TESTS[categoryBadgeId(c)] = (s, byName) =>
    s.collection.placedEventIds.filter((id) => byName.get(id)?.category === c).length >=
    CATEGORY_THRESHOLD;
  ```
- **Polymath (id '08'), auto-derived:**
  ```ts
  ACHIEVEMENT_TESTS['08'] = (s, byName) =>
    new Set(s.collection.placedEventIds.map((id) => byName.get(id)?.category).filter(Boolean))
      .size >= ALL_CATEGORIES.length;
  ```
- **Dev-only consistency assert:** every `Collection`/category `AchievementDef.id` ↔
  `ACHIEVEMENT_TESTS` entry (fail loudly if a card lacks logic, or logic lacks a card).

**`reevaluateAchievements(eventsByName): string[]` in `statsStorage.ts`:** run every `test`; for each
newly-passing id not already in `Achievements.unlocked`, write it with today's ISO date (idempotent,
never un-sets); **return the array of ids unlocked this call**. `recordGameResult` calls this after
updating primitives and returns its result. The game-over effect stores the returned ids in game/UI
state for Phase 5.

**Reuse:** `streakFeedback.ts` data-driven-config pattern; `ALL_CATEGORIES` / `Category` from
`src/types/index.ts`.

**Verify (extend `src/utils/statsStorage.test.ts`):**

- seed event excluded from `placedThisGame`; per-mode counters increment correctly.
- **custom game** (`challengeCode` set) writes only `CustomStats` + `CollectionState`; no streak /
  volume / daily badge fires.
- category `test` fires at **exactly 20 distinct** (not 19); repeats of the same event don't advance.
- **rename test:** same `placedEventIds`, but the fixture `eventsByName` reclassifies a category →
  derived counts move accordingly (proves no stored coupling).
- Polymath fires only when all `ALL_CATEGORIES` are represented.
- daily streak advances/breaks across simulated `lastDailyDate` / `playedDates`.
- dev consistency assert passes for the shipped config.

Then `npm run typecheck` + `npm run lint` + `npm test`.

**Files:** `src/utils/statsStorage.ts` (extend), `src/data/achievementLogic.ts` (NEW),
`src/hooks/useWhenGame.ts` (`seedEventName` + game-over effect), `src/utils/statsStorage.test.ts` (extend).

---

## Phase 3 — Category badge data (20 themed rows)

**Deliverable:** `achievements.ts` has 20 correct category badge rows + fixed Polymath text. Art
(`eventName`/`imageUrl`) filled with placeholders here, finalized in Phase 4. Depends on Phase 2
(for the `cat-<category>` ids to line up with logic).

Replace stale rows 09–15 in **both** files with **20 rows**, one per `ALL_CATEGORIES`:

- `src/data/achievements.ts` — **the real source the app consumes** (hand-edit directly; there is no
  generator — see Grounding facts).
- `images/when-achievement-badge-prompts.csv` — kept in sync **only as an image-prompt record**.

Each row: `id = cat-<category>`, `family = 'Collection'`, `tier = 'steel'` (escalate later if
desired), themed `name`, `unlockCriteria = "Place 20 <Category> events"`. Fix **Polymath 08**
`unlockCriteria` → "Place an event in all 20 categories".

Themed names (tweak freely; avoid existing names like Master Builder / Polymath):

| Category     | Badge       | Category    | Badge      |
| ------------ | ----------- | ----------- | ---------- |
| empires      | Imperator   | commerce    | Tycoon     |
| revolution   | Firebrand   | law         | Magistrate |
| architecture | Architect   | agriculture | Cultivator |
| writing      | Wordsmith   | warfare     | Warmonger  |
| invention    | Inventor    | science     | Empiricist |
| figures      | Luminary    | trade       | Navigator  |
| media        | Trendsetter | migration   | Wayfarer   |
| craft        | Artisan     | art         | Maestro    |
| diplomacy    | Diplomat    | medicine    | Physician  |
| disasters    | Survivor    | nature      | Naturalist |

**Verify:** the Phase 2 dev consistency assert passes (20 `cat-*` ids ↔ 20 tests); `npm run typecheck`.

**Files:** `src/data/achievements.ts`, `images/when-achievement-badge-prompts.csv`.

---

## Phase 4 — Per-category card art (sub-agent search, one agent per category)

**Deliverable:** each of the 20 category rows has a real `eventName` + Cloudinary `imageUrl`.
Depends on Phase 3.

**Approach: spawn one sub-agent per category** (fan-out — parallel `Agent`/`Explore` calls, or a
Workflow over the 20 categories). Each agent:

1. Reads the event catalogue for its category. Events live in `public/events/*.json` (grouped files;
   see `public/events/manifest.json` `files`), each `{name, friendly_name, year, category,
image_url, difficulty, …}`. Filter to `category === <C>` **and** Cloudinary-backed
   (`isCloudinaryImage(image_url)` from `src/utils/cloudinaryImage.ts` — only these are
   playable/displayable).
2. Picks the single most **recognizable, high-profile** event whose image **center-crops cleanly in
   a circle** (prior session's "Angkor Wat over Statue of Liberty" criterion) and clearly evokes the
   badge theme/name (e.g. `architecture`→Architect, `warfare`→Warmonger).
3. Returns `{ category, eventName, friendly_name, image_url, why }`.

Then for each category, copy the chosen event's `image_url` into the matching `achievements.ts` row's
`imageUrl` (raw Cloudinary URL — `AchievementCard` runs it through `getImageUrl()`) and set
`eventName`. Mirror into the CSV. **Surface the 20 picks (with `why`) for a quick confirm/override
before committing.**

**Reuse:** `eventLoader`, `cloudinaryImage.isCloudinaryImage` / `getImageUrl`.

**Verify:** `/cards-preview` renders all 20 category cards with real art; `npm run typecheck`.

**Files:** `src/data/achievements.ts`, `images/when-achievement-badge-prompts.csv`.

---

## Phase 5 — Unlock-moment presentation (after game-over popup)

**Deliverable:** finishing a game that crosses a threshold shows the new badge(s). Depends on Phase 2
(ids) + Phase 4 (art).

Flow: player sees the **existing game-over / leaderboard popup first**; on its dismiss, if the
game-over effect captured newly-unlocked ids, a **dedicated achievement-unlock modal** appears.

- **NEW `src/components/AchievementUnlock.tsx`** — reuses the `GamePopup` modal frame (framer-motion
  spring backdrop) at **`z-[60]`** so it sits above the game-over layer (`GamePopup` is `z-50`).
  Renders one `AchievementCard` (always `unlocked`) at a time. **Tap / swipe advances** through the
  queue; the last tap dismisses. Celebratory entrance reusing existing assets: `entrance` /
  `animate-banner-in` CSS + `react-confetti-explosion` (already used for streak feedback) on each
  reveal. (See `src/index.css` for `entrance`, `animate-banner-in`, streak glows.)
- **Wiring in `src/components/Game.tsx`:** the Phase-2 game-over effect captures the ids returned by
  `recordGameResult` into local state (e.g. `newlyUnlocked: string[]`). Gate the modal to open only
  **after** the `gameOver` `GamePopup` is dismissed — mirror the existing `gameOverPopupShown`
  sequencing / `useBackdropDismiss` pattern. Resolve ids → `AchievementDef` via `ACHIEVEMENTS`.
- Empty list → no modal, no behavior change. Multiplayer v1: same single-device list.

**Verify (manual, `npm start`, no API):** simulate a game crossing a category threshold (use the
Custom category filter to place 20 of one category) → game-over popup → dismiss → one card per
unlock, tap-to-advance, confetti; zero unlocks → straight to controls. Then `npm run typecheck` +
`npm run lint`.

**Files:** `src/components/AchievementUnlock.tsx` (NEW), `src/components/Game.tsx`.

---

## Phase 6 — UI surfaces (stats + trophy case)

**Deliverable:** a browsable stats / trophy page reachable from the menu. Depends on Phases 1–4.

- **Entry point:** add "Stats / Achievements" to the Menu drawer (`src/components/Menu.tsx`, after
  "View Timeline") + optional `Trophy` / `BarChart3` button in `src/components/TopBar.tsx` (follow
  the existing lucide-icon button pattern).
- **Stats + trophy-case page:** NEW route in `src/index.tsx` (`/stats`) → NEW `src/pages/Stats.tsx`.
  Reuse the `StatsPopup` 3-stat card visual language for a headline trio (games played, longest/avg
  timeline, max streak) + a collection meter (`placedEventIds.length / loadAllEvents().length`).
  Trophy case = grid of `AchievementCard`s with `unlocked` from `Achievements.unlocked[def.id]`
  (replaces the `/cards-preview` placeholder `isUnlocked(i)`). `AchievementCard.tsx` needs no change.
- **(Optional) "My Collection":** extend `src/components/ViewTimeline.tsx` to optionally show only
  `placedEventIds`-resolved events, reusing `Timeline.tsx`. Keep all new props **optional** so the
  existing gameplay `viewTimeline` usage is unaffected (Timeline.tsx convention — see MEMORY.md).

**Verify (manual):** `/stats` shows real counts + collection meter; unlocked badges full-colour,
locked greyed; advance system date → daily streak reflects; `localStorage.clear()` → clean zero
state. Then `npm run typecheck` + `npm run lint` + `npm test`.

**Files:** `src/pages/Stats.tsx` (NEW), `src/index.tsx`, `src/components/Menu.tsx`,
`src/components/TopBar.tsx`, `src/components/ViewTimeline.tsx` (optional).

---

## Critical files (cross-phase summary)

| File                                                                       | Phase   | Change                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/statsStorage.ts`                                                | 1–2     | **NEW** — 5 primitives, accessors, `buildEventCategoryMap`, `recordGameResult` (returns newly-unlocked ids), `reevaluateAchievements`, high-score migration |
| `src/utils/statsStorage.test.ts`                                           | 1–2     | **NEW** — zero-defaults, union/dedupe, rename test, custom isolation, threshold-exact, daily streak, dev assert                                             |
| `src/data/achievementLogic.ts`                                             | 2       | **NEW** — hand-authored `ACHIEVEMENT_TESTS`; category + Polymath generated from `ALL_CATEGORIES`                                                            |
| `src/hooks/useWhenGame.ts`                                                 | 2       | add `seedEventName` to state in `startGame`; game-over effect → `recordGameResult`                                                                          |
| `src/data/achievements.ts` (+ `images/when-achievement-badge-prompts.csv`) | 3–4     | replace stale 09–15 with 20 themed category rows; fix Polymath 08; fill art from Phase 4                                                                    |
| `src/components/AchievementUnlock.tsx` + `src/components/Game.tsx`         | 5       | **NEW** unlock modal (tap-to-advance, after game-over popup); Game.tsx sequences + feeds it the ids                                                         |
| `src/pages/Stats.tsx` + `src/index.tsx`                                    | 6       | **NEW** stats/trophy page + `/stats` route                                                                                                                  |
| `src/components/Menu.tsx` / `TopBar.tsx`                                   | 6       | entry point                                                                                                                                                 |
| `src/components/ViewTimeline.tsx`                                          | 6 (opt) | optional museum/collection mode (optional props)                                                                                                            |

**Reuse targets:** `playerStorage.ts` (storage pattern + high-score migration),
`eventLoader.loadAllEvents()`, `streakFeedback.ts` (config pattern),
`cloudinaryImage` (`isCloudinaryImage` / `getImageUrl`), `achievementTiers.ts` (tier styles),
`StatsPopup.tsx` (stat-card visual language), `GamePopup.tsx` + `useBackdropDismiss` (modal frame +
gating), `react-confetti-explosion` (already a dep).

---

## Grounding facts (verified 2026-06-27 — read before any phase)

- **No generator script exists.** Nothing in `scripts/` rebuilds `achievements.ts` from the CSV
  (the `// AUTO-GENERATED` header is aspirational). → **Hand-edit `achievements.ts`**; treat the CSV
  as an image-prompt record only.
- `src/types/index.ts`: `type Category` = **20** values; `ALL_CATEGORIES: Category[]` (20, same
  order): empires, revolution, architecture, writing, invention, figures, media, craft, diplomacy,
  disasters, commerce, law, agriculture, warfare, science, trade, migration, art, medicine, nature.
  `GameConfig` has `dailySeed?`, `challengeSeed?`, `challengeCode?`. `HistoricalEvent` =
  `{name, friendly_name, year, category, description, difficulty, image_url?, image_width?,
image_height?, color?, text_color?}`. `GamePhase` = loading | modeSelect | transitioning | playing
  | gameOver | viewTimeline.
- `src/data/achievements.ts`: 36 `AchievementDef { id, name, family, tier, unlockCriteria, eventName,
imageUrl }`; **no `test`**. Families: Milestone/Volume/Collection/Difficulty/Streak/Cadence/
  Single-Game. Tiers: none/bronze/copper/silver/gold/steel/platinum/diamond/obsidian/verdigris.
  Category badges = ids **09–15 (stale, 7 old names)**; Polymath = id **08** ("all 7 categories").
  `imageUrl` is a raw Cloudinary URL run through `getImageUrl()` at display.
- `src/data/achievementTiers.ts`: hand-authored `TierStyle { label, ring, glow?, shimmer?, labelColor }`
  - `LOCKED_RING`.
- `src/utils/playerStorage.ts`: typed `getX`/`saveX`, fail-silent try/catch. Keys: `when-daily-result`,
  `when-modes-played`, `when-timeline-high-score`, `when-display-name`, `when-leaderboard-submitted`,
  `when-custom-settings`. `getTimelineHighScore()` available for migration.
- `src/hooks/useWhenGame.ts`: `WhenGameState` = `{ phase, gameMode, timeline, deck, placementHistory:
boolean[], lastPlacementResult, isAnimating, animationPhase, lastConfig, players,
currentPlayerIndex, turnNumber, roundNumber, winners, activePlayersAtRoundStart, currentStreak,
bestStreak }` — **no `seedEventName` yet**. `useSaveDailyResult` fires on `phase==='gameOver' &&
gameMode==='daily' && lastConfig?.dailySeed`. `startGame` builds seed via
  `const timelineEvents = sortByYear([shuffled[0]])` (~line 163), `deck = shuffled.slice(1)`. Correct
  placement inserts into `timeline`; incorrect inserts-then-removes. `showGameOverPopup` sets
  `pendingPopup` of type `gameOver`.
- `src/components/Game.tsx`: renders for both `playing` and `gameOver`. Game-over effect (~line 179)
  guards with `gameOverPopupShown` then calls `showGameOverPopup()`. `GameOverControls` (Share/Restart/
  Home) replace the bottom bar at game over. `useBackdropDismiss` gates daily dismissal until
  leaderboard submit.
- `src/components/GamePopup.tsx`: generic modal frame, `type: 'description'|'correct'|'incorrect'|
'gameOver'`, framer-motion spring, backdrop `z-50`, ESC dismisses, daily backdrop gated.
- `src/components/Toast.tsx`: `{message, isVisible, onClose, duration=2000}`, `fixed bottom-20`,
  `animate-slide-in`. `react-confetti-explosion` already used for streak feedback.
- `src/components/StatsPopup.tsx`: `{isOpen, cardsInHand, timelineLength, currentStreak, onDismiss}`;
  3-stat card layout (Layers/Ruler/Zap). `src/components/ViewTimeline.tsx`: `{allEvents, onHomeClick}`;
  renders via `Timeline.tsx`.
- `src/index.tsx` routes: `/`, `/daily`, `/challenge/:code`, `/privacy`, `/terms`, `/support`,
  `/cards-preview`, `*`→`/`.
- `src/utils/eventLoader.ts`: `loadAllEvents()` fetches `public/events/manifest.json` (`{files:[...]}`),
  flattens, dedupes by `name`, filters to `isCloudinaryImage(image_url)`. Catalogue size = result length.
- `src/utils/cloudinaryImage.ts`: `isCloudinaryImage(url)` true iff url contains `res.cloudinary.com`
  AND `/image/upload/`; `getImageUrl()` formats for display.

## Related docs

- `docs/stats-achievements/session-2026-06-21-stats-category-achievements-plan.md` — prior handoff (superseded by this).
- `docs/stats-achievements-plan.md` — full original spec (List 1 stats, List 2 badges, per-badge
  "Derived from" derivations — use when implementing the Phase 2 non-category tests).
- `docs/stats-achievements/session-2026-06-21-achievement-cards.md` — card visual-design session.
- `docs/dev-tooling/session-2026-06-21-category-clustering.md` — 20-category taxonomy + counts.
