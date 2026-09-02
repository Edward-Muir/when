# Stats & Achievements

Lifetime stats, achievement badges, personal-best milestones, and the My Timeline collection
view. Built over 2026-06-21 → 06-28 as a phased effort; this is the resulting design, not the
phase-by-phase narrative.

## The one architectural rule

**Store generic primitives; derive every per-category stat at read time.**

The key primitive is `CollectionState.placedEventIds` — the unique event names a player has
correctly placed, across all modes. Per-category, per-era, per-century and per-difficulty
counts are all computed by resolving those ids against the loaded event catalogue.

**No `Record<Category, number>` counter is ever stored.** That is what let the taxonomy go from
7 categories to 20 with zero stored-data migration, and it is why per-category achievements are
generated (`cat-<category>`) rather than hand-written. Anything new that "just needs a counter"
should almost certainly be a derivation instead.

## Storage

Five localStorage keys, one per object. Every accessor is `try`/`catch` fail-silent and returns
a fully-populated zero-default object, never null, merging partial or older stored shapes over
the defaults.

| Key                   | Holds                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| `when-lifetime-stats` | per-mode games/timeline sums/longest, events placed correct+wrong, best streaks, first/last played |
| `when-collection`     | `placedEventIds`, de-duped on read and write                                                       |
| `when-daily-cadence`  | daily streaks, `playedDates`, best/sum/histogram of daily correct counts                           |
| `when-achievements`   | `unlocked: { [id]: ISODate }`                                                                      |
| `when-theme-bests`    | per-curated-theme best `correctCount`, cleared/perfect flags, play count (`themeBests.ts`)         |

`recordGameResult` splits on **daily vs non-daily only**, via `lastConfig.dailySeed`. Older plan
documents describe a third "default" bucket for a plain game started from a menu; that path has
never existed — every non-daily start is a Custom game, either from the Custom page or a
challenge code (both carry a code) or an Archive replay of a curated theme (which carries
`curatedThemeId` instead, since a code cannot encode a hand-picked pool). Replays land in the
`suddenDeath` buckets like any Custom game.

**`when-theme-bests` is the one per-thing record**, and it is keyed by theme id rather than
derived because nothing else stores a per-game score: the daily keeps a single result record,
overwritten daily, and the cadence keeps dates. It is written by `useGameStatsRecorder` for any
game `getCuratedThemeIdForConfig` resolves — the daily on a curated day and every Archive
replay — so the day's score is the first "best" a replay tries to beat. Curated days played
before it existed are not recoverable; accepted.

`getLifetimeStats()` also runs a one-time idempotent fold of retired keys (a legacy high score,
and the removed `freeplay` buckets). Copy that pattern for future shape changes rather than
migrating in place.

## Milestones ("Personal Best" popups)

Text-and-icon popups shown after the game-over popup and **before** the achievement-unlock
modal, revealed one at a time. Both are steps in the end-of-game sequence, which always ends
on a share step — see `src/hooks/useEndOfGameSequence.ts` and
[sharing-challenges](../sharing-challenges/index.md#the-share-is-the-last-step-of-the-end-of-game-sequence).

- **Ephemeral — never persisted.** They celebrate a moment; they are not achievements.
- **Only fire when the previous record was `> 0`**, so a first-ever game and trivial "1 day"
  cases never celebrate.
- Daily and custom records are tracked separately, and a game can only fire its own side's kinds.
  The exception is `bestThemeScore`, which sits outside the split: a curated theme's record is
  beaten by the daily on its day or by an Archive replay, so `detectMilestones` takes the prior
  record (`prev.themeBest`) only for games that belong to a theme.

**The detection trick matters:** `recordGameResult` overwrites records in place via `Math.max`,
so after it runs you cannot tell what the game beat. The recorder **snapshots the records
first**, records, then calls the pure `detectMilestones(state, prev)`. This kept
`recordGameResult`'s signature and tests untouched. Don't try to detect inside the recorder.

`useGameStatsRecorder` exists because this pushed `useWhenGame` past the 310-line
`max-lines-per-function` budget — it owns the events-by-name memo, the once-per-game ref guard,
and the snapshot→record→detect flow.

## Badges

- **Art is real event art, not generated medals.** An `AchievementDef` carries an `eventName`,
  resolved to that event's `image_url` at runtime — `AchievementDef` deliberately has **no
  `imageUrl` field**, so there is one source of truth for every image. The CSV's `gemini_prompt`
  column is ignored; no AI medal art was ever generated.
- Tiers are conveyed by a pure-CSS metallic `conic-gradient` ring (bronze → silver → gold →
  platinum → shimmering diamond, plus steel/copper/obsidian/verdigris), not by new art.
- **Locked badges still show their criterion** and a greyscale, veiled glimpse of the art behind
  a frosted lock chip — the tease is deliberate.
- Unlock reveal uses the "Staggered Shine" animation, chosen from four candidates compared in a
  dev-only jig (`/anim-jig`). Badge art is prefetched at game over, the moment unlocks are known,
  so the modal shows art instantly.
- Unlock sequencing is driven by **popup-dismissal transitions, not timers**. The queue lives in
  `useEndOfGameSequence`, which starts when `pendingPopup?.type` goes from `'gameOver'` to
  undefined and advances as each step dismisses.
- **Do not call `onDismiss` from inside a `setIndex` updater** in either reveal modal. Updaters
  must be pure and StrictMode double-invokes them, so the dismissal fired twice and silently
  skipped the next step of the sequence.

## Known issue: the difficulty badge family has an inverted gradient

Flagged during the 2026-06-28 review and **deliberately left unfixed**. The thresholds ignore
pool size:

- `easy` is the **rarest** label (609 events), `hard` the most common (2,115).
- So **Warm-Up** (80 easy, _bronze_) takes ~60–70 games, while **Uphill Battle** (20 hard,
  _gold_) takes ~5–6. The bronze badge is an order of magnitude harder than the gold.

Suggested fix if anyone picks it up: lower Warm-Up to ~30 easy and raise Uphill Battle to ~60
hard. Related, lesser: category badges are all `steel` but vary ~5× in grind, and
`Across the Ages` is gated by the rarest century so it is effectively harder than its gold tier
implies.

## Catalogue facts the badge set relies on

Measured against the real catalogue, so thresholds are known reachable:

- **No badge is mathematically impossible.** Every category has ≥20 events (smallest is `nature`
  at 116); every century from the 1st to the 21st CE is represented (rarest is C03 at 31).
- **The deck is effectively the whole catalogue**, minus the dealt hand. A correct placement
  draws a replacement, so a game ends only when mistakes empty the hand — the typical "10–15
  placements" is an outcome with errors, not a cap. Streak-25 and 30-correct badges are
  therefore reachable; they just demand near-flawless play.

Re-verify these if the catalogue or the difficulty labels are regraded.

## My Timeline

The `/timeline` view (and Timeline pager tab) is the **collection** view: it renders
`placedEventIds`, i.e. the catch-'em-all set, not the current game's board. It shares the
`Timeline` component with gameplay, which is why `Timeline` takes `failedPlacements` and
`currentStreak` as optional props defaulting to empty/0 — the collection view passes neither.
It also passes `gameMode={null}` to `TopBar`, which is what hides the in-game rules item.
