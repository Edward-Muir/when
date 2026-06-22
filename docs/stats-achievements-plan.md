# Stats & Achievement Badges — Plan

> A plan for an in-game **stats screen** and **achievement badges** for "When". The design principle:
> store a small set of **generic primitives** in the browser, then **derive** every displayed stat and
> badge from them — so new stats/badges can be added later with **zero new instrumentation**.
> **No backend required** for any of this (per-device `localStorage`, confirmed fine for v1).

---

## Context & corrections baked in

- **The daily game has no "win."** It's an **endless score-chase** (seeded Sudden-Death rules — you
  keep going until your mistakes run out the hand; the deck never empties). The only "winning" is
  leaderboard rank, which we are **not** trying to track per-player. → **Drop `win %` entirely.**
  Daily's signal is **correct-count / timeline length / in-game streak**, same shape as Sudden Death.
- **Store generic primitives, derive the rest.** The biggest gap today: `DailyResult` in
  `src/utils/playerStorage.ts` is overwritten daily and nothing accumulates. We add one new module
  that records **raw facts** at game-over; the stats screen and badges are pure read-time
  derivations. Storing the **set of correctly-placed event IDs** (not booleans) is the key move —
  it lets us invent collection / era / difficulty / category badges later for free.
- **Custom games are tracked separately and never advance streaks or non-collection stats/badges.**
  Custom (and shared-challenge) games let players pick their own difficulty/category filters, so
  counting them in the headline stats/streaks would let players _farm_ easy numbers. They get their
  own isolated `CustomStats` bucket. **One exception:** correctly-placed events from custom games
  **do** count toward the one-time **collection set** — they're real placements — so the collection
  meter (and the collection-derived badges that are simply its milestones) fills from custom too.
  Everything else (streaks, volume/skill/cadence stats and badges) stays custom-free.
  **Detection (no `isCustom` flag exists):** at game-over, classify from `state.lastConfig` —
  `dailySeed` truthy → **daily**; else `challengeCode` truthy → **custom**; else → **default**
  (a plain Sudden Death / Freeplay game started from the menu). `gameMode` alone can't tell custom
  from default — both reuse `'suddenDeath'`/`'freeplay'`.
- **No backend.** Everything below is `localStorage`, mirroring the existing typed-accessor +
  fail-silent pattern in `playerStorage.ts`. (Push notifications, cross-player rarity %, and
  cross-device sync are the _only_ backend-needing features and are explicitly out of scope here.)

---

## The generic foundation (what we actually store)

One new module, `src/utils/statsStorage.ts`, holding these objects. Everything in the two lists
further down is **derived** from these — nothing in the lists is stored directly.

**1. `LifetimeStats` — cumulative counters (cheap, never recomputed)**

```
gamesPlayed:        { daily, suddenDeath, freeplay }   // counts
eventsPlacedCorrect: number                            // lifetime, counts repeats
eventsPlacedWrong:   number                            // attempts = correct + wrong (derived)
timelineLengthSum:  { daily, suddenDeath, freeplay }   // for averages
longestTimeline:    { daily, suddenDeath, freeplay }   // longest already exists for SD; generalize
bestInGameStreakEver: number                           // max of per-game bestStreak
flawlessFreeplayGames: number                          // freeplay games finished with 0 mistakes
firstPlayedDate, lastPlayedDate: string                // YYYY-MM-DD
```

**2. `CollectionState` — the finite-catalogue collection**

```
placedEventIds: string[]   // UNIQUE set of event `name` (stable ID) ever placed correctly,
                           // unioned across ALL modes. Resolve against loaded event data at
                           // read time to derive per-category / per-era / per-difficulty cuts.
```

**3. `DailyCadence` — daily-habit primitives**

```
currentDailyStreak, maxDailyStreak: number   // consecutive days the daily was PLAYED (no "win")
lastDailyDate: string
playedDates: string[]                        // (or a count) — enables calendar/heatmap + "days played"
bestDailyCorrect: number
dailyCorrectSum: number                      // for average daily correct
dailyCorrectHistogram: number[]              // distribution of daily correct-counts (Wordle-style)
freezeTokens: number                         // streak safety net — DEFERRED TO v2 (omit field in v1)
```

**4. `Achievements`**

```
unlocked: { [achievementId: string]: string }   // id -> unlock date/timestamp
```

**4b. `CustomStats` — isolated bucket for custom / shared-challenge games**

```
gamesPlayed:         number          // custom games only
eventsPlacedCorrect: number
eventsPlacedWrong:   number
longestTimeline:     number
timelineLengthSum:   number          // for an average
bestInGameStreak:    number
// Deliberately NO daily-streak fields and NO contribution to LifetimeStats / DailyCadence.
// Custom games never advance any streak or volume/skill stat.
// EXCEPTION: custom placements DO union into CollectionState.placedEventIds (real placements).
```

**5. `RecentGames` (optional, capped ~50) — future-proofing**

```
GameRecord[]   // compact per-game raw record (mode, date, correct, wrong, timelineLength,
               // bestStreak, placedEventIds). Lets us add distribution/recent-form stats later
               // without having pre-aggregated them. Capped so storage stays bounded.
```

**One hook point:** a single `recordGameResult(state)` call on the game-over transition in
`src/hooks/useWhenGame.ts` / `src/utils/placementLogic.ts` (`buildPopupData` / `shouldGameEnd`)
updates all of the above. At game-over you already have `placementHistory`, `bestStreak`, `timeline`,
`deck`, `lastConfig`, and the daily `correctCount` / `totalAttempts`. **`recordGameResult` first
classifies the game** (daily / default / custom — see Context). A **custom** game writes only
`CustomStats` **and** unions its correctly-placed IDs into `CollectionState` — it leaves
`LifetimeStats`, `DailyCadence`, and the non-collection `Achievements` untouched. Only **daily**
games advance `DailyCadence` (the daily streak).

**Why this is "generic":** the stats screen and badges read these primitives and compute. To add a
new badge ("placed an event from every continent", "10 BCE events", "3 perfect days in a row") we
write a new `test(stats)` against the _existing_ stored data — no change to what we record.

---

## List 1 — Stats to display (the stats screen)

Every row is **derived** from the primitives above. No `win %` (daily has no win).

| Displayed stat                                            | Derived from                                                                  |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Games played (total + per mode)                           | `LifetimeStats.gamesPlayed`                                                   |
| Events placed correctly (lifetime)                        | `LifetimeStats.eventsPlacedCorrect`                                           |
| Accuracy %                                                | `correct / (correct + wrong)`                                                 |
| **Collection: unique events placed — X / catalogue (Y%)** | `CollectionState.placedEventIds.length` ÷ catalogue size from `manifest.json` |
| Collection by category (6 album rows)                     | resolve `placedEventIds` against event data, group by `category`              |
| Longest timeline (per mode)                               | `LifetimeStats.longestTimeline`                                               |
| Average timeline length (per mode)                        | `timelineLengthSum ÷ gamesPlayed`                                             |
| Best in-game streak ever                                  | `LifetimeStats.bestInGameStreakEver`                                          |
| Daily streak — current / max                              | `DailyCadence.currentDailyStreak` / `maxDailyStreak`                          |
| Best daily score (correct)                                | `DailyCadence.bestDailyCorrect`                                               |
| Average daily correct                                     | `dailyCorrectSum ÷ daily gamesPlayed`                                         |
| Daily distribution (histogram of correct-counts)          | `DailyCadence.dailyCorrectHistogram`                                          |
| Days played                                               | `DailyCadence.playedDates.length`                                             |
| Flawless freeplay games                                   | `LifetimeStats.flawlessFreeplayGames`                                         |
| Custom games (shown in a separate "Custom" section)       | `CustomStats.*`                                                               |

All rows above cover **daily + default** games only and exclude custom — **except the two collection
rows**, which include custom placements — plus custom is surfaced in its own small "Custom games"
panel (games played, best/avg timeline, best streak) so it never inflates the headline numbers.

**Headline trio to feature**: **games played**, **longest / average timeline**, **max streak**, and
the **events-placed collection meter** (show % of current catalogue, since the catalogue grows toward
~10,000 — surface "new events added" so it never feels stuck).

**The "museum" view** — a personal read-only timeline showing **only** correctly-placed events — is
delivered by **restyling and renaming the existing `ViewTimeline`** (e.g. "My Timeline" / "My
Collection") rather than adding a new screen. Feed it the `CollectionState` set resolved against event
data, sorted by `year`; it already renders through the shared `Timeline.tsx` (keep any new props
optional). It's the emotional payoff of the collection stat.

---

## List 2 — Achievement badges to display (the trophy case)

Mix of archetypes so every playstyle earns something. The **Derived from** column proves each is
computable from the generic primitives — no badge needs its own tracking.

**Milestone / volume (everyone climbs — onboards newcomers)**
| Badge | Unlocks when | Derived from |
|---|---|---|
| First Steps | play your 1st game | `gamesPlayed total ≥ 1` |
| Regular / Dedicated / Centurion | 10 / 50 / 100 games | `gamesPlayed total` |
| Placer I / II / III | 100 / 500 / 1,000 events placed correctly | `eventsPlacedCorrect` |

**Collection / exploration (uses the placed-ID set — the generic payoff)**
| Badge | Unlocks when | Derived from |
|---|---|---|
| Polymath | placed ≥1 event in all 6 categories | `placedEventIds` grouped by `category` |
| Category Buff (×6) | place 5 events in a given category | per-category count from `placedEventIds` |
| Ancient Historian | place an event older than 1000 BCE | look up `year` of placed IDs in catalogue |
| Across the Ages | placed events spanning ≥ N centuries | min/max `year` of placed IDs |
| Hard Mode | place 10 `very-hard` events correctly | `difficulty` of placed IDs |

**Streak (loss-aversion lever)**
| Badge | Unlocks when | Derived from |
|---|---|---|
| On a Roll → Unstoppable (×5) | in-game streak of 5 / 10 / 15 / 20 / 25 | `bestInGameStreakEver` |
| Habit (×4) | daily streak of 3 / 7 / 30 / 100 days | `DailyCadence.maxDailyStreak` |

**Single-game performance**
| Badge | Unlocks when | Derived from |
|---|---|---|
| Chronologist (×5) | best single game ≥ 10 / 15 / 20 / 25 / 30 events placed correctly | `bestDailyCorrect` (or best correct-count across daily + default) |

_(Name "Chronologist" is a suggestion — anything timeline-flavoured works, e.g. Time Keeper, Historian.)_

**Cadence**
| Badge | Unlocks when | Derived from |
|---|---|---|
| Loyal | played on N distinct days | `playedDates.length` |

**Custom games earn no streak/volume/skill/cadence badges.** Those `test`s read `LifetimeStats` /
`DailyCadence`, which custom never writes — so easy-filter farming can't unlock them. **The
collection family is the deliberate exception:** because custom placements feed `CollectionState`,
the collection badges — Polymath / Category Buff / era / Hard Mode, which are just collection-set
milestones — _do_ advance from custom. (If desired, a tiny separate set of custom-only badges could
read `CustomStats`, but the default is: custom is otherwise unbadged.)

Badges are a **data-driven config array** — `{ id, name, description, icon, tier, test(stats) }` —
mirroring how `src/utils/streakFeedback.ts` centralizes tier config. `recordGameResult` runs the
tests after updating primitives and fills `Achievements.unlocked`. Adding a badge = appending one
config entry.

---

## Implementation notes

- **New:** `src/utils/statsStorage.ts` (the 5 primitives + typed accessors, fail-silent like
  `playerStorage.ts`) and an achievements config array (data-driven).
- **Hook:** one `recordGameResult(state)` at the game-over path in `src/hooks/useWhenGame.ts` /
  `src/utils/placementLogic.ts`.
- **UI:** a Stats/Collection screen + a TopBar entry point (today `StatsPopup` only shows mid-game in
  Sudden Death; stats need a permanent home). Trophy case lists badges (locked = silhouette). Museum
  view = restyled/renamed `ViewTimeline`, reusing `Timeline.tsx`.
- **Reuse:** `playerStorage.ts` (`DailyResult`, existing longest-timeline value to migrate in),
  `eventLoader.ts` + `public/events/manifest.json` (catalogue size for the %), `share.ts` (fold
  collection % / streak into share text). Events expose `name` (ID), `friendly_name`, `year`,
  `category`, `difficulty` — every dimension the derived badges need.

---

## Open decisions

**Decided:**

- **Daily streak = play-streak** (came back that day; no "win" exists).
- **Streak freeze → v2** (omit `freezeTokens` and the safety-net UX in v1).
- **Museum view → restyle + rename the existing `ViewTimeline`** (e.g. "My Timeline"), not a new screen.
- **Custom games & the collection meter:** custom placements **count toward the collection set** (and
  therefore its milestone badges), but custom earns **no streaks and no volume/skill/cadence badges**.
  (Accepted tradeoff: the collection meter can be filled faster via custom.)
- **Badge set:** removed Curator, Sharpshooter, Marathoner, Flawless, Comeback; Category Buff = 5 in a
  category; in-game-streak badges run 5→25 in 5s; single-game badge "Chronologist" runs 10→30 in 5s.

**Still open:**

1. **Collection denominator:** show "% of _current_ catalogue" (recommended, given growth) vs raw count.
2. **Final badge names/icons** (esp. the "Chronologist" single-game badge name).
3. **Stats entry point:** TopBar icon, mode-select screen, or both.

---

## Verification (for when this gets built)

- **Unit (`npm test`, style of `eventNameLength.test.ts`):** `recordGameResult` increments the right
  counters per mode; **a custom game (config with `challengeCode`) writes only `CustomStats` and the
  shared `CollectionState`, leaves `LifetimeStats` / `DailyCadence` untouched, never advances any
  streak, and unlocks no streak/volume/skill badge**; `placedEventIds` unions without duplicating an
  ID seen in a prior game; daily streak advances/breaks across simulated dates and only for daily
  games; each badge `test` fires at its threshold and not before (and not via custom games); derived
  stats (accuracy, averages, collection %) compute correctly from primitives.
- **Manual (`npm start` — frontend only, no API needed):** play across all three modes; confirm games
  played, longest/average timeline, max streak, lifetime + unique correct, collection meter, museum
  view, and unlocked badges all update; reload → persists; advance system date → daily streak logic;
  `localStorage.clear()` → clean zero state + graceful first run.
- `npm run typecheck` + `npm run lint` before shipping.

---

## Out of scope (would require a backend — future phases)

The game already has a backend (Vercel API routes + Upstash Redis + a `deviceId` anonymous identity
via `src/utils/deviceFingerprint.ts`), but none of the above needs it. These three would:

- **Cross-player rarity stats** ("only X% of players placed this") — needs a per-event aggregate
  counter; easy to add to the _existing_ Redis (increment on the daily submit you already POST), not
  a BaaS migration.
- **Push / daily-reminder notifications** — server-initiated by nature; can run on the existing Redis
  - a Vercel cron later.
- **Guaranteed cross-device sync / never-lose-on-reinstall** — needs real accounts (anonymous auth +
  optional Apple/Google sign-in). This is the only thing that justifies the larger backend buildout in
  the original `play-when-stats-plan.md`, and is deferred until push/accounts become the goal.
