# Session Handoff — Stats Foundation + Per-Category Achievements (PLAN, not yet built)

**Date:** 2026-06-21
**Branch:** `feature/people`
**Status:** Planning complete, **no code written yet.** This doc is a self-contained restart point.

---

## What we're doing & why

Two prior 2026-06-21 sessions left two threads to join:

1. **Achievement cards** — only the _visual design_ exists. `src/data/achievements.ts`
   (auto-generated from `images/when-achievement-badge-prompts.csv`) is **display-only**:
   36 `AchievementDef`s rendered by `src/components/AchievementCard.tsx` on the
   `/cards-preview` harness (`src/pages/CardsPreview.tsx`). **No unlock logic, no stats
   tracking, no in-app page.** Spec lives in `docs/stats-achievements-plan.md`.
   See `docs/session-2026-06-21-achievement-cards.md`.
2. **Category re-clustering** — taxonomy went **7 → 20 categories** (`type Category` /
   `ALL_CATEGORIES` in `src/types/index.ts`). The achievement config is now **stale**:
   badges 09–15 are "Category Buff: <OldCategory>" (Conflict/Cultural/Diplomatic/Disasters/
   Exploration/Infrastructure/People) and Polymath (08) says "all 7 categories".
   See `docs/session-2026-06-21-category-clustering.md`.

**Goal:** build the full stats foundation from `docs/stats-achievements-plan.md`, and add a
**per-category achievement** that unlocks when the player has correctly placed **20 distinct
events of that category**. Must absorb future category additions with **zero stored-data
schema change**.

## Decisions locked with the user (2026-06-21)

- **Scope:** FULL stats foundation (not just the minimal slice).
- **Threshold:** **20 distinct** events per category (collection-set, dedupes across games/modes).
- **Naming:** **themed hand-crafted** per-category names (NOT "Category Buff: X").
- **Polymath:** require ≥1 placement in **every** category, threshold **auto-derived** from
  `ALL_CATEGORIES.length`.
- Not in prod → breaking changes to stored stats are fine; **no migration needed.**

---

## THE KEY DESIGN PRINCIPLE (this is the whole answer to "how do categories affect stats")

**Store generic primitives; derive every per-category stat at read time.** The key primitive is
`CollectionState.placedEventIds: string[]` — the UNIQUE set of correctly-placed event `name`s
(stable IDs), unioned across all modes. Per-category counts are **derived** by resolving each id
against loaded event data (`name → category`) and grouping.

**Never store `Record<Category, number>` counters** — they couple stored data to the taxonomy:

- New category needs a new field + back-fill. With the set, the new category's events already
  carry `category: 'newcat'`, their names are already in `placedEventIds`, so the count derives
  the instant a new `AchievementDef` exists — no stored-data change.
- A renamed category silently corrupts a counter; the set re-resolves category from current event
  JSON at read time, so renames reclassify automatically.
- The same set also powers era / difficulty / "spanning N centuries" / collection-meter badges.

So: **recording is category-count-agnostic by construction.** The only per-category cost is the
_display card_ (art + name) = one config row per category.

---

## Part A — Stats storage foundation

**New `src/utils/statsStorage.ts`** (mirror `src/utils/playerStorage.ts`: typed accessors, one
localStorage key per object, fail-silent `try/catch`). Five primitives from
`docs/stats-achievements-plan.md`:

| Object            | localStorage key      | Purpose                                                                                                                                                                                                                       |
| ----------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LifetimeStats`   | `when-lifetime-stats` | `gamesPlayed{daily,suddenDeath,freeplay}`, `eventsPlacedCorrect`, `eventsPlacedWrong`, `timelineLengthSum{...}`, `longestTimeline{...}`, `bestInGameStreakEver`, `flawlessFreeplayGames`, `firstPlayedDate`, `lastPlayedDate` |
| `CollectionState` | `when-collection`     | `placedEventIds: string[]` — unique correct placements, ALL modes (incl. custom)                                                                                                                                              |
| `DailyCadence`    | `when-daily-cadence`  | `currentDailyStreak`, `maxDailyStreak`, `lastDailyDate`, `playedDates[]`, `bestDailyCorrect`, `dailyCorrectSum`, `dailyCorrectHistogram[]` (omit `freezeTokens` → v2)                                                         |
| `Achievements`    | `when-achievements`   | `unlocked: { [achievementId]: string }` (id → ISO date)                                                                                                                                                                       |
| `CustomStats`     | `when-custom-stats`   | isolated custom/challenge bucket: `gamesPlayed`, `eventsPlacedCorrect`, `eventsPlacedWrong`, `longestTimeline`, `timelineLengthSum`, `bestInGameStreak` — NO daily/streak fields                                              |

Each: `getX()` (zero-default) + `saveX()`. Add `buildEventCategoryMap(events): Map<string,
HistoricalEvent>` (richer than just category so era/difficulty derivations reuse it).
Migrate existing `when-timeline-high-score` → `LifetimeStats.longestTimeline.suddenDeath` on
first read.

## Part B — `recordGameResult` hook

**`recordGameResult(state)` in `statsStorage.ts`**, called from a **new game-over effect in
`src/hooks/useWhenGame.ts`** beside the existing `useSaveDailyResult` (reuse `phase ===
'gameOver'` trigger). Fires for **all** modes (daily/SD/freeplay), not just daily.

**Classify from `state.lastConfig`** (`GameConfig` has `dailySeed?` and `challengeCode?`):

- `dailySeed` truthy → **daily** (advances `DailyCadence` + `LifetimeStats` + `CollectionState`)
- else `challengeCode` truthy → **custom** (writes ONLY `CustomStats` + unions into
  `CollectionState`; never `LifetimeStats`/`DailyCadence`/streak badges)
- else → **default** SD/Freeplay (advances `LifetimeStats` + `CollectionState`)

**Correctly-placed names this game** (no new per-placement tracking needed): the game inserts an
event into `state.timeline` only on a correct placement; seed card is `sortByYear([shuffled[0]])`
in `startGame`. So:

```
placedThisGame = state.timeline.map(e => e.name).filter(name => name !== seedEventName)
```

**Add `seedEventName?: string` to `WhenGameState`**, set in `startGame` where the seed timeline
is built. Union `placedThisGame` into `CollectionState.placedEventIds` via a `Set`.

After updating primitives → call **`reevaluateAchievements(eventsByName)`**: run every `test`,
write newly-passed ids into `Achievements.unlocked` (today's date; idempotent, never un-sets).

**Multiplayer note:** `state.timeline` mixes players' correct placements; v1 unions the whole
final timeline (single-device personal collection) — acceptable, note in code.

## Part C — Unlock logic (split from generated display config)

**New hand-authored `src/data/achievementLogic.ts`** (parallels how `src/data/achievementTiers.ts`
is hand-authored), keyed by the same `id`s as `ACHIEVEMENTS`. **Do NOT add `test` to
`achievements.ts`** — it's regenerated from CSV and would clobber hand edits.

```ts
export type AchievementTest = (stats: StatsSnapshot, eventsByName: Map<string, HistoricalEvent>) => boolean;
export const ACHIEVEMENT_TESTS: Record<string, AchievementTest> = { ... };
```

`StatsSnapshot` bundles the read primitives. Implement `test`s for every existing family per the
doc's "Derived from" column (Milestone/Volume/Streak/Cadence/Single-Game/Difficulty/era).

**Category tests — generated from `ALL_CATEGORIES`:**

```ts
export const CATEGORY_THRESHOLD = 20;
const categoryBadgeId = (c: Category) => `cat-${c}`;
// for each c: ACHIEVEMENT_TESTS[categoryBadgeId(c)] =
//   (s, byName) => s.collection.placedEventIds.filter(id => byName.get(id)?.category === c).length >= CATEGORY_THRESHOLD
```

**Polymath (id 08), auto-derived:**

```ts
ACHIEVEMENT_TESTS['08'] = (s, byName) =>
  new Set(s.collection.placedEventIds.map((id) => byName.get(id)?.category).filter(Boolean)).size >=
  ALL_CATEGORIES.length;
```

**Dev-only consistency assert:** every `Collection`/category `AchievementDef.id` ↔
`ACHIEVEMENT_TESTS` entry (fail loudly if a card lacks logic or vice-versa).

## Part D — The 20 per-category cards (data + art)

Replace stale CSV rows 09–15 in `images/when-achievement-badge-prompts.csv` with **20 rows**, one
per `ALL_CATEGORIES`, then **re-run the Python generator** to rebuild `src/data/achievements.ts`.
Each row: `badge_id = cat-<category>`, `family = Collection`, `tier = steel` (or escalate),
themed `badge_name`, `unlock_criteria = "Place 20 <Category> events"`, representative
`event_name` + `cloudinary_url`.

**Themed names (proposed starting set — tweak freely; avoid existing names like Master
Builder/Polymath):**

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

**Art selection rule (one event per category):** from loaded events filtered to `category === C`
AND Cloudinary-backed (`isCloudinaryImage(image_url)` — only these are playable/displayable),
pick a recognizable, high-profile event whose image **center-crops cleanly in a circle** (prior
session's Angkor-Wat-over-Statue-of-Liberty criterion). Copy that event's existing `image_url`
into the CSV `cloudinary_url`. Surface a candidate shortlist per category for a quick pick during
implementation.

Fix **Polymath 08** criterion text → "Place an event in all 20 categories" (ideally interpolate
`ALL_CATEGORIES.length`).

## Part E — UI surfaces

- **Entry point:** add "Stats / Achievements" to Menu drawer (`src/components/Menu.tsx`) +
  optional `Trophy`/`BarChart3` button in `src/components/TopBar.tsx` (existing lucide pattern).
- **Stats + trophy-case page:** new route in `src/index.tsx` (e.g. `/stats`) → new
  `src/pages/Stats.tsx`. Reuse `StatsPopup` 3-stat card visual language for headline trio (games
  played, longest/avg timeline, max streak) + collection meter
  (`placedEventIds.length / loadAllEvents().length`). Trophy case = grid of `AchievementCard`s
  with `unlocked` from `Achievements.unlocked[def.id]` (replaces `/cards-preview` placeholder
  `isUnlocked(i)`). `AchievementCard.tsx` needs no change.
- **Museum / "My Collection":** restyle/rename `src/components/ViewTimeline.tsx`
  (props `{ allEvents, onHomeClick }`) to optionally show only `placedEventIds`-resolved events,
  reusing `Timeline.tsx` (keep new props optional so gameplay usage is unaffected).

---

## Critical files

| File                                                                     | Change                                                                                                             |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `src/utils/statsStorage.ts`                                              | **NEW** — 5 primitives, accessors, `recordGameResult`, `reevaluateAchievements`, `buildEventCategoryMap`           |
| `src/data/achievementLogic.ts`                                           | **NEW** — hand-authored `ACHIEVEMENT_TESTS` keyed by id; category tests + Polymath generated from `ALL_CATEGORIES` |
| `src/hooks/useWhenGame.ts`                                               | game-over effect → `recordGameResult`; add `seedEventName` to state in `startGame`                                 |
| `images/when-achievement-badge-prompts.csv` + `src/data/achievements.ts` | replace stale 09–15 with 20 themed category rows; fix Polymath 08; regenerate                                      |
| `src/pages/Stats.tsx` + `src/index.tsx`                                  | **NEW** stats/trophy page + route                                                                                  |
| `src/components/Menu.tsx` / `TopBar.tsx`                                 | entry point                                                                                                        |
| `src/components/ViewTimeline.tsx`                                        | optional museum/collection mode (optional props)                                                                   |

**Reuse:** `playerStorage.ts` (storage pattern + high-score migration), `eventLoader.loadAllEvents()`
(catalogue size + name→category map), `streakFeedback.ts` (data-driven-config pattern),
`cloudinaryImage.getImageUrl()` (card art), `achievementTiers.ts` (tier styles).

## Grounding facts confirmed during exploration

- `src/types/index.ts`: `type Category` = 20 values; `ALL_CATEGORIES: Category[]` (20).
- `src/data/achievements.ts`: 36 `AchievementDef { id, name, family, tier, unlockCriteria,
eventName, imageUrl }`; AUTO-GENERATED from CSV; NO `test`. Families: Milestone/Volume/
  Collection/Difficulty/Streak/Cadence/Single-Game. Tiers: none/bronze/copper/silver/gold/steel/
  platinum/diamond/obsidian/verdigris. Category badges are ids 09–15 (stale), Polymath = 08.
- `src/utils/playerStorage.ts`: `DailyResult` overwritten daily (nothing accumulates); keys
  `when-daily-result`, `when-timeline-high-score`, `when-modes-played`, `when-custom-settings`, etc.
- `src/hooks/useWhenGame.ts`: `WhenGameState` has `phase, gameMode, timeline, deck,
placementHistory(boolean[]), lastConfig, players, winners, currentStreak, bestStreak`.
  `useSaveDailyResult` fires on `phase==='gameOver' && gameMode==='daily'`. `startGame` builds
  seed via `sortByYear([shuffled[0]])`; correct placement inserts into `timeline`, incorrect is
  inserted-then-removed.
- `GameConfig` (`src/types/index.ts`) has `dailySeed?`, `challengeSeed?`, `challengeCode?`.
- `src/index.tsx` routes: `/`, `/daily`, `/challenge/:code`, `/privacy`, `/terms`, `/support`,
  `/cards-preview`, `*`→`/`.
- `src/components/TopBar.tsx`: Share / theme toggle / filter / home / menu buttons. Menu drawer
  (`Menu.tsx`) has Share App, Add to Home Screen, How to Play, View Timeline, Feedback, Privacy,
  Terms, version.
- `src/components/ViewTimeline.tsx`: props `{ allEvents: HistoricalEvent[]; onHomeClick }`;
  invoked from `App.tsx` when `phase==='viewTimeline'`; renders via `Timeline.tsx`.
- `src/components/StatsPopup.tsx`: props `{ isOpen, cardsInHand, timelineLength, currentStreak,
onDismiss }`; 3-stat card layout (Layers/Ruler/Zap icons) — mid-game only today.
- `src/utils/eventLoader.ts`: `loadAllEvents()` reads `public/events/manifest.json`, flattens,
  dedupes, filters to `isCloudinaryImage(image_url)`. Catalogue size = `allEvents.length`.

## Verification (when built)

- **Unit `src/utils/statsStorage.test.ts`** (Jest, style of `src/utils/eventNameLength.test.ts`):
  per-mode counters; seed excluded; `placedEventIds` unions without dup; **custom game**
  (`challengeCode`) writes only `CustomStats`+`CollectionState`, no streak/volume badge; category
  `test` fires at exactly 20 distinct (not 19), repeats don't advance; **rename test** (same ids,
  renamed category in fixture map → counts reclassify); Polymath fires only when all
  `ALL_CATEGORIES` represented; dev consistency assert; daily streak across simulated dates.
- **Manual (`npm start`, no API):** use Custom category filter to place 20 of one category →
  themed badge unlocks; reload persists `when-*` keys; `localStorage.clear()` → clean zero state;
  advance system date → daily streak. Then `npm run typecheck` + `npm run lint`.

## Related docs / plan

- `docs/stats-achievements-plan.md` — full original spec (List 1 stats, List 2 badges, primitives).
- `docs/session-2026-06-21-achievement-cards.md` — card visual design session.
- `docs/session-2026-06-21-category-clustering.md` — 20-category taxonomy + counts.
- Plan-mode file (same content as this doc): `~/.claude/plans/users-emuir-documents-github-vibes-time-tender-neumann.md`
