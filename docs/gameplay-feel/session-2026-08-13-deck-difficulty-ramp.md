# Deck Difficulty Ramp (2026-08-13)

Decks used to be a single seeded shuffle of the eligible pool, dealt off the top. They are
now **composed**: the first 24 cards are chosen deliberately so a game opens with an easy,
well-spread placement and ramps from there, and the daily additionally refuses to repeat a
card used in the previous week.

Applies to **all modes** — daily, sudden death and challenge-code games all funnel through
`startGame`, which now shares one builder with `buildDailyDeck`.

Everything below was measured against the real catalogue, not reasoned about. If you are
retuning this, **read §5 first** — several of the obvious simplifications are actively
worse, and that is not visible from the code.

## 1. The problem

Difficulty swung more between days than a player's skill moves in a day, so a score
measured the day rather than the player — you couldn't tell "I'm improving" from "today was
easier". Investigation found three separate causes, not one.

**No ordering bias.** The eligible pool is ~13% easy, dealt uniformly, so a beginner's
opening card was a coin flip.

**Theme selection dominated the variance.** `getDailyTheme` picks a single category ~50% of
days. Easy share by category runs from 3.4% (`trade`) and 3.8% (`empires`) to 27.7%
(`media`) and 33.6% (`figures`) — a 10x spread, against only ~±1.2 cards of binomial noise
from the shuffle. The original bug report's two extremes (an Empires day dealing 10 hard
cards of 12, an Everything day dealing 2) were the theme axis, not shuffle noise.

**The `difficulty` labels grade the wrong thing.** They grade _recognition_ — would you
know this event — but placement difficulty is mostly _placeability_: how crowded the
timeline is where the card belongs. Measured, the two disagree, and in the wrong direction:

| label     | median events within ±25 years |
| --------- | ------------------------------ |
| easy      | 325                            |
| medium    | 293                            |
| hard      | 137                            |
| very-hard | 114                            |

Pearson r between label and log-density is **−0.161** — backwards. Fame concentrates in the
modern era, so the cards labelled easiest sit in the most crowded stretch of timeline. The
two canonical cases:

- **First Moon Landing** — `easy`, **634** neighbours within ±25y. Famous, genuinely hard to place.
- **Archean Eon Begins** — `very-hard`, **0** neighbours. Unrecognisable, impossible to get wrong.

A ramp built on the raw label would therefore have opened games with the _most crowded_
cards on the board. This is why `difficultyScore.ts` exists.

## 2. How a deck is built

Four pieces, in `src/utils/difficultyScore.ts`, `src/utils/deckBuilder.ts` and
`src/utils/dailyRecency.ts`. Selection is two multiplied weights over a pool that recency
has already filtered:

```
pool = eligible cards minus those used in the last 7 dailies      (daily only)
P(pick c at position i)  ∝  bandWeight(band(c), i) · spacingWeight(c | already picked)
```

### Composite difficulty score → four bands

```
C = 0.6 · recognition + 0.4 · placeability
    recognition  = label rank (easy 0, medium ⅓, hard ⅔, very-hard 1)
    placeability = log1p(d25) / log1p(maxD25),  d25 = events within ±25 years
```

Bands are the **global quartiles** of `C` — absolute, not per-pool, so a card means the same
thing on every theme. That is what keeps difficulty consistent day to day. Computed at load
from a sorted-year binary search, memoised against the catalogue array; **not persisted to
JSON**, so the event data stays the source of truth for recognition only.

Side benefit: this alone lifts the smallest warm-up pool across the 20 categories from
**6 cards to 27** (`trade` 6→30, `art` 7→33, `medicine` 8→27, `nature` 10→88, `craft` 12→78).

`w = 0.6` is the measured optimum. 0.5 drops the minimum band-0 pool to 23, 0.4 to 13 —
over-weighting density makes some categories density-uniform.

### Band curve by position

| position | band0 | band1 | band2 | band3 |
| -------- | ----- | ----- | ----- | ----- |
| 1–2      | 0.72  | 0.22  | 0.05  | 0.01  |
| 3–5      | 0.42  | 0.43  | 0.13  | 0.02  |
| 6–9      | 0.14  | 0.50  | 0.30  | 0.06  |
| 10–14    | 0.05  | 0.35  | 0.45  | 0.15  |
| 15+      | 0.02  | 0.22  | 0.48  | 0.28  |

Bands that are empty or over budget drop out and the vector renormalises — that is how a
thin band cascades into its neighbours.

### Spacing kernel

Distance is measured in **empirical-CDF rank space** (`u` = the event's percentile in the
catalogue's year distribution). Not raw years — the catalogue spans 4.5 billion of them —
and not log-age, which assumes density decays exponentially and measured worse on every
metric. CDF rank makes the catalogue uniform by construction, and a distance in it reads
directly as "how many catalogue events lie between these two", i.e. placement ambiguity.

```
w(c) = min( minDist(u_c, alreadyPicked), τ ) ^ α(i)
       τ = 1/24                (one slot-width)
       α(i) = 8 · (1 − i/24)   (strong early, decaying to zero)
```

α decays so the ramp steepens: spread wide early (easy placements land in wide gaps), allow
clustering late (narrow gaps, hard placements).

### Band capacity cap

A band may supply at most `max(1, floor(bandSize / 6))` cards to one deck. Soft — if every
band is spent the budget is ignored rather than dealing a short deck. This is what makes the
ramp safe on thin themes: `trade` warms up on bands 0 _and_ 1 instead of burning its whole
easy band, and that falls out for free rather than needing a special case. On an
"Everything" day the budget is in the hundreds against a 24-card window, so it never fires.

### Seven-day no-repeat (daily only)

A hard filter on the pool, sourced from a **chain**: day N excludes the real decks of
N−1…N−7, each of which excluded its own predecessors. Anchored to a rolling 28-day block
starting one block back, so chain length stays bounded at 28–55 days.

## 3. Measured results

Over 113 scored days against the real catalogue (era filter applied, `very-hard` included —
i.e. exactly what ships). `gap@n` is the median normalised width of the gap the nth card
lands in on an ideal run; **bigger = easier placement**.

|               | gap@2 | gap@5 | gap@23 | eras covered | distinct cards/yr |
| ------------- | ----- | ----- | ------ | ------------ | ----------------- |
| plain shuffle | 0.464 | 0.250 | 0.059  | 7.1 / 9      | 4878              |
| composed deck | 0.523 | 0.291 | 0.047  | 7.8 / 9      | 4907              |

- A gap ramp exists **for free** (0.46 → 0.06) purely from the timeline filling up. The
  design steepens it: open-to-close ratio 8.7x → **11.1x**.
- Repeats within 7 days: **46.9% of days → 7.1%**; 86 repeated cards → **12**.
- Cost, in real V8: cold chain walk median **21.8ms** (13.5–87.2ms); one full deck build
  with the chain memoised, **1.81ms**. (Jest/jsdom inflates this ~5x — don't trust a
  timing taken from the test run.)

### Recency does not make games harder

This gets asked, because the ramp spends band-0 cards early so the excluded set is enriched
in easy ones. Measured, it doesn't matter — mean band index by position, with and without
exclusion:

| position | no exclusion | with exclusion |
| -------- | ------------ | -------------- |
| 1        | 0.358        | 0.358          |
| 5        | 0.658        | 0.658          |
| 14       | 1.642        | 1.625          |
| 24       | 1.942        | 1.917          |

Largest delta anywhere is 0.025 on a 0–3 scale; band-0 share at the opening is identical to
a decimal place. The exclusion changes _which_ card is dealt, not which band — bands hold
~1,320 cards each and only ~16 of the ~168 excluded per day are band 0. The band-0 _budget_
does shrink on 14 of 58 themed days, but it still exceeds what the curve asks for.

## 4. `very-hard` is back in `DEFAULT_DIFFICULTIES`

It used to be excluded as a blunt way to stop decks being punishing. The ramp makes that
unnecessary — those 693 events now land where they belong (~1% of opening cards, ~22% by
card 24) — and including them measurably _increases_ variety, from 3,876 to 4,185 distinct
cards seen per year.

Note this also flipped the Custom screen's default filter from three ticked tiers to four,
for players with no saved settings only (`ModeSelect.tsx:213` reads
`savedSettings?.selectedDifficulties ?? DEFAULT_DIFFICULTIES`). The number of pills rendered
is driven by `ALL_DIFFICULTIES` and was never affected. This was reviewed and kept.

## 5. Rules for changing any of this

**Never unsaturate the spacing kernel.** Replacing `min(distance, τ)` with `distance` looks
like a harmless simplification. It rewards being _maximally_ extreme, so the same handful of
temporal outliers win every day and repeats nearly double (5.4 → 10.4 on the per-category
measure). Guarded by a test in `deckBuilder.test.ts`.

**Never hard-exclude an approximate history.** Sourcing the recency set from decks rebuilt
_without_ their own exclusion is the obvious way to delete the chain walk. Measured, it is
**worse than doing nothing**: 51.3% of days repeat, against 46.9% with no recency at all.
Removing cards on the basis of a history that is wrong pushes selection toward exactly the
cards the real previous decks used. A cheap history may only ever be a soft weight; only an
accurate one may be a hard filter.

**Don't compute band thresholds from the day's pool.** They must be global quartiles.
Per-pool quartiles guarantee every theme has a "band 0", but that band means something
different on each theme, which is the day-to-day swing this whole change exists to remove.

**Don't change the RNG.** `introEvents.test.ts` pins `shuffleArraySeeded` output by name
list. Layer on top of `seededRandom` / `stringToSeed`, never modify them.

**Don't do raw-year arithmetic.** `year` spans −4.5e9 to 30000. Use the `u` coordinate.

**Keep both deck-building call sites on the shared builder.** `buildDailyDeck`
(`dailyConfig.ts`) and `startGame` (`useWhenGame.ts`) were previously duplicated
filter-and-shuffle logic kept in sync by convention. If they diverge, the `/daily` preview
card silently stops matching the deck actually dealt.

## 6. Measured and rejected

- **Hard slot quotas** ("cards 1–3 easy, 4–7 medium, 8+ hard"). Makes the deck predictable —
  players learn where the wall is — and gives up all variety for no measured gain over a
  probability curve.
- **Log-age instead of CDF rank** for the spacing coordinate. Worse on every metric; it
  assumes density falls off exponentially and it doesn't.
- **Sort-by-difficulty-with-jitter.** Fixes ordering only. The window stays a random sample
  of the pool, so an `empires` day is still an `empires` day.
- **Soft recency downweight.** Only reaches ~26.5% of days (from 46.9%), and plateaus there
  — stronger penalties (×0.01, ×0.002) don't help, because the limit is history accuracy,
  not penalty strength. Kept the chain instead. Revisit if the ~22ms ever matters.
- **A 56-day chain block.** Same 6 leaked cards as 28, just spread over fewer days, at ~1.7x
  the cost.

## 7. Known residuals

- **The 7-day rule is exact only within a chain block.** The rolling anchor moves every 28
  days, and across that boundary the recomputed history stops matching what was actually
  played. Costs ~12 repeated cards per 113 days. An exact guarantee needs a fixed epoch and
  therefore unbounded startup cost. Both behaviours are asserted in `deckBuilder.test.ts`.
- **Small total category pools.** `nature` has 116 events, so a 24-card window overlaps
  heavily day to day whatever the algorithm does. The fix is more events, not more code.
- **`wikipedia_views` is still unused.** Present on only 38% of the catalogue, but its
  medians fall cleanly with the label (649k → 335k → 199k → 62k). It's the natural
  refinement of the _recognition_ half of `C`, and slots in without changing anything else.
- **Difficulty reclassification is outstanding.** Density already rescues `nature` (90
  sparse events), `craft` (77) and `agriculture` (64). It cannot help `trade` (4),
  `warfare` (2) or `medicine` (5) — those are intrinsically modern and crowded, and need
  genuine recognition review. See `events-images/difficulty-grading-rubric.md`.
