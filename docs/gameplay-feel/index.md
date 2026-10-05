# Gameplay & Feel

Deck composition, fuzzy placement, tombstones, streak feedback, transitions, and the colour
system.

## Repo-wide trap: Tailwind opacity modifiers on our colour tokens compile to nothing

`text-text-muted/60`, `bg-accent/20`, `border-accent-secondary/50` — **none of these do
anything.** The tokens in `tailwind.config.js` are plain `var(--color-x)` values with no
`<alpha-value>` channel, so Tailwind's `parseColor` returns `null` and it **drops the whole
declaration**. The utility class is _absent from the built CSS_ — it does not fall back to the
flat colour. There is no error, no warning.

That distinction matters, because the failure is louder than "wrong colour": an element whose
only background is `bg-surface/60` renders **fully transparent**, so text meant to sit on a
scrim sits on unobscured card artwork instead (the game-start overlay below is built to avoid
exactly that).

```
.bg-bg{background-color:var(--color-bg)}   ← emitted
.bg-bg\/85                                 ← ABSENT from the stylesheet
.bg-black\/50{background-color:#00000080}  ← emitted (hex parses fine)
```

Use `opacity-60` on the element, or a `color-mix(in srgb, var(--color-accent) 60%, transparent)`
utility in `index.css` — `.bg-player-row` and `.scrim-band` are the two live precedents.
Standard Tailwind colours (`bg-black/50`, `text-white/70`) are unaffected and do work.

**There are dozens of these in `src/`** — they are latent, not urgent, but don't add more,
and don't be surprised when an existing one has no visual effect. To recount:

```bash
grep -rEoh '\b(bg|text|border|from|via|to|ring|fill|stroke)-(bg|surface|text|text-muted|border|accent|accent-secondary|success|error)/[0-9]+' src/ --include='*.tsx' | wc -l
```

To check a specific one really landed, grep the build output rather than trusting the source:
`npm run build && grep -o '\.scrim-band{[^}]*}' build/static/css/*.css`.

## Curated themes and thin pools

`BuildRampedDeckOptions` has two escape hatches, `bandSpread` and `minAfterExclusion`, both
defaulting to the measured tuning below so nothing outside a curated day changes.

They are not cosmetic. With the default `SPREAD`, a pool whose band-0 population is under ~12
gives every band a budget of 1, and since `availableBands` prefers bands inside their budget,
deck positions 0-3 become a round-robin of one card per band. Positions 1-5 are the opening
hand, so the hardest quartile lands in it on **99.7%** of seeds against **11.7%** on the full
catalogue — a direct inversion of the foothold this whole section exists to guarantee. Curated
days pass `bandSpread: 1` to lift the cap; `Infinity` does NOT work (it floors the budget to 0
and `max(1, 0)` is the pathological value again).

Both options must be derived from the date in one place — `getDailyBuildOptions` in
`dailyPool.ts` — and used by every builder call site on the daily path, including
`dailyRecency`'s chain walk. See [curated-themes/](../curated-themes/index.md).

## Fuzzy placement: events that name a period

An optional `year_end` upper bound on an event whose date the record gives as a window. `year`
stays the lower bound **and the sole anchor for everything else** — difficulty scoring, deck
composition, era filtering, recency. Only placement judging and the year label read `year_end`,
which is what makes adding one provably unable to move a daily deck.

### The neighbour rule is unsound — do not re-propose it

The obvious generalisation is to compare the card's interval against its two immediate
neighbours. It is wrong, and the failure is not an edge case:

> Seed `P = 2000-3000`. Drop `Q = 1000-2500` after it: passes, `2500 >= 2000`. Now drop
> `C = 1100-1200` after `Q`: passes, `1200 >= 1000`. The board reads
> `2000-3000 | 1000-2500 | 1100-1200` and no left-to-right reading of it is non-decreasing.
> The game said "correct" for putting an 1100-1200 event after a 2000-3000 one.

Correctness of a board of intervals is a **global** property; adjacency is local. So judge
against the accumulated bounds instead — the latest start committed to by everything on the
left, the earliest end committed to by everything on the right. That buys four things:

1. The board stays readable after any accepted insertion.
2. A valid gap always exists, so `findCorrectPosition` can never fall through wrongly.
3. The valid gaps form one **contiguous** band. Adjacency produces non-contiguous bands
   (gaps 0 and 2 valid, gap 1 not), which cannot be explained to a player.
4. On a point-only timeline it is byte-identical to comparing points, so point cards judge
   exactly as they always would.

Both (1) and (2) rest on `start <= end` for every event, which is why `eventEnd` **clamps
rather than trusts**: the JSON is hand-editable and fetched at runtime, so a malformed
`year_end` degrades the card to a point card instead of producing an unjudgeable board.

**The property test in `gameLogic.test.ts` is the guard.** It inserts random intervals at
randomly chosen valid gaps and asserts the board stays readable. It goes red against the
adjacency rule and green against this one, and **no other test catches the difference** — the hand-written cases all pass under both. If you touch the predicate, run it
against your change before trusting a green suite.

### Other decisions worth not re-deriving

- **A correct card settles at its `year`**, the start of its window, via `settledPosition` —
  so the board is always sorted by `year` and a card won on a window slides there from
  wherever it was dropped. Inserting at the player's own index instead (to avoid the slide) is
  the wrong trade: it lets the board read `1400 | 1350-1450`, which looks like a bug, and makes
  the in-game order disagree with the My Timeline tab, which sorts by `year` independently. The
  slide is legible because the card shows its span.
  - **The sorted slot is always a legal placement**, which is what makes settling
    unconditional rather than a special case: every card left of it has
    `year <= this year <= this end`, and every card at or right of it has
    `end >= year >= this year`. A property test pins it.
  - The player's index is preserved when it already sits in the sorted band, so equal-year
    ties stay on the side they chose instead of snapping left.
- **A close-enough is a full success** — streak, replacement draw, green square. Only the
  feedback differs; stats, sharing and the leaderboard treat it as correct.
- **Confetti is withheld, not reduced.** A smaller burst reads as a rendering glitch; its
  absence reads as a different outcome. The vignette takes `accent-secondary` and the haptic
  drops to a single tick.
- **The explanation rides the one-shot hint machinery**, sitting above `correct` in
  `SETTLE_PRIORITY` so a first placement that happens to be close-enough explains the
  surprising part rather than the ordinary one. Seen once per install; the vignette and
  confetti carry it after that.
- **`closeEnough` requires something adjacent to be ranged**, not just that the collapsed
  predicate disagreed. On a board that carries ranges the collapsed predicate can go
  degenerate and report _every_ placement as close-enough.
- **There is no span ceiling, and re-proposing one would be a regression.** A per-era cap
  looks like obvious balance: a window wide enough to cover the board makes its card
  unloseable, and a wide range does genuinely slacken the running bounds for every placement
  around it. It is still wrong. The uncertainty is real — a prehistoric window is millions of
  years and `boats` carries ~850,000 of them — and suppressing it to protect the game makes the
  card lie. A flat cap also binds hardest on the agriculture and domestication cards (a
  1,000-year rule for -10000..0), which are the clearest processes in the catalogue. Width is an
  editorial judgement, visible through the apply script's widest-ranges and nested-pairs
  printout, not a validation.
- **Known cosmetic tension, deliberately not fixed:** a ranged card dropped above its band
  tombstones back to the band's first gap, so the miss-travel animation runs longer than the
  error deserves. Clamping to the nearest valid gap instead makes tombstone position depend on
  a stale attempted index and lets tombstones drift as the board grows.
- `TimelinePanel` re-sorts the collection by `.year`, which matches the in-game row order
  because a correct card settles at its `year`.

## Deck composition

Decks are **composed, not shuffled**: the first `RAMP_WINDOW` (24) cards are chosen so a game
opens easy and well-spread and ramps from there; the tail is a plain seeded shuffle. Applies
to every mode — daily and Custom both funnel through the same builder.

The mechanism is documented in the header comments of `deckBuilder.ts`, `difficultyScore.ts`
and `dailyRecency.ts`. What follows is the evidence and the constraints, which are not.

**Why it exists.** Only a small share of the eligible pool is easy, so a uniform deal makes a
beginner's opening card a coin flip. Worse, the _level of a day_ would swing with the daily
theme — the easy share varies about tenfold between categories, against ~±1.2 cards of shuffle
noise. A score would measure the day, not the player.

**Why the `difficulty` label alone can't drive it.** The label grades _recognition_; placement
difficulty is mostly _placeability_ — how crowded the timeline is where the card belongs.
Measured, they disagree **backwards**: Pearson r between label and log-density is **−0.161**.
Fame concentrates in the modern era, so the "easiest" cards sit in the most crowded stretch.

| label     | median events within ±25 years |
| --------- | ------------------------------ |
| easy      | 325                            |
| medium    | 293                            |
| hard      | 137                            |
| very-hard | 114                            |

The canonical pair: **First Moon Landing** is `easy` with 634 neighbours (famous, genuinely
hard to place); **Archean Eon Begins** is `very-hard` with 0 (unrecognisable, impossible to
get wrong). A ramp on the raw label would open games with the most crowded cards.

Hence `C = 0.6·recognition + 0.4·placeability`, banded by **global quartiles** of C.
`w = 0.6` is the measured optimum — 0.5 drops the smallest band-0 pool to 23 cards, 0.4 to 13.
Distance for the spacing kernel is in **empirical-CDF rank space**, not years (the catalogue
spans 4.5 billion of them) and not log-age (measured worse on every metric).

**Results** over 113 scored days, against a uniform shuffle: open-to-close gap ratio 8.7x →
**11.1x**; repeats within 7 days **46.9% of days → 7.1%**. Cost: ~1.81 ms per deck build with
the chain memoised. (Jest/jsdom inflates timings ~5x — don't benchmark from a test run.)

**`very-hard` is in `DEFAULT_DIFFICULTIES`.** Excluding it is a blunt anti-punishment measure
the ramp makes unnecessary: it places those events properly (~1% of opening cards, ~22% by
card 24), and including them raises the distinct cards seen per year.

### Rules for changing any of this

- **Never unsaturate the spacing kernel.** Replacing `min(distance, τ)` with `distance` looks
  like a harmless simplification; it rewards being _maximally_ extreme, so the same temporal
  outliers win every day and repeats nearly double. Guarded by a test.
- **Never hard-exclude an approximate history.** Sourcing recency from decks rebuilt without
  their own exclusion is the obvious way to delete the chain walk, and is measurably **worse
  than no recency at all** (51.3% of days repeat vs 46.9%). A cheap history may only ever be a
  soft weight; only an accurate one may be a hard filter.
- **Band thresholds must be global quartiles, never the day's pool.** Per-pool quartiles
  guarantee every theme has a "band 0", but it means something different per theme — which is
  the day-to-day swing this whole design exists to remove.
- **Don't change the RNG.** `introEvents.test.ts` pins `shuffleArraySeeded` output by name
  list. Layer on top of `seededRandom` / `stringToSeed`; never modify them.
- **Don't do raw-year arithmetic.** `year` spans −4.5e9 to 30000. Use the `u` coordinate.
- **Keep both call sites on the shared builder.** `buildDailyDeck` and `startGame` must not
  duplicate filter-and-shuffle logic: if they diverge, the `/daily` preview card silently stops
  matching the deck actually dealt.

A recurring question, already answered: **recency does not make games harder.** Largest delta
in mean band index at any position is 0.025 on a 0–3 scale. The exclusion changes _which_ card
is dealt, not which band.

## Tombstones

A single-player miss shows no popup. The failed card FLIP-morphs from the attempted slot to
its **correct** gap and settles as a greyscale "dead card".

- **Tombstones are mechanically neutral** — a hard requirement. They never subdivide gaps or
  affect correctness, drag insertion math, centering or ripples. Never put
  `data-timeline-index` / `data-timeline-year` on tombstone DOM.
- **Their gap position is derived per render** via `findCorrectPosition`, not stored. Stale
  index bugs are impossible by construction.
- Multiplayer keeps the incorrect popup (turn handoff needs it) but still records tombstones.

**The drag mechanic over a tombstone is approved:** tombstone rows are full card-height with
the same footprint as real rows; hovering their gap swaps the ghost card into that row with
**zero displacement** of anything else, and only the tombstone's content slides right — never
up or down. Don't re-propose the rejected alternatives: a slim full-width row (reads as a
timeline anchor), a right-aligned margin-note chip (still displaced vertically during drag),
and collapse-to-0px-plus-slide-out.

**The miss reveal:** the card travels slowly, scaled by distance; verify how the path rows'
layout shift animates before relying on it. Two framer-motion rules:

- For a shared-`layoutId` FLIP, the **top-level** `transition` of the entering element wins;
  a nested `layout:` key is masked by the surrounding spring.
- **Animating `y` on the projection element kills in-flight layout animations**, so ripple
  bumps live on an inner wrapper div. Similarly, leaving a `layoutId` in place after a FLIP
  leaves a stale projection transform that blocks later x-animations — remount with a `key`.

No automated check covers the tombstone drag invariants; before touching `TombstoneRow.tsx`,
write a Playwright check (see [../driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md)).
Measure the tombstone **button**, not the row — transforms live there.

## Streak feedback

`streakFeedback.ts` is the single source of tier config; `getStreakFeedback(streak)` returns
every tier-dependent value at once (confetti count, haptics, glow class, ripple multiplier,
bolt classes). Add new streak-driven effects there, not inline.

| Tier | Streak | Bolt                 | Card glow      | Confetti |
| ---- | ------ | -------------------- | -------------- | -------- |
| 0    | 0–1    | outline grey + count | normal green   | 50       |
| 1    | 2–3    | filled grey + count  | brighter green | 70       |
| 2    | 4–5    | filled gold + pulse  | golden         | 90       |
| 3    | 6+     | filled gold + glow   | golden intense | 120      |

Glow keyframes use `color-mix()` against the CSS custom properties so they adapt to dark mode
automatically, and all are inside the `prefers-reduced-motion` block.

## Colour system

All colours are CSS custom properties in `src/index.css` (`:root` and `.dark`), referenced by
Tailwind as semantic tokens: `bg`, `surface`, `text`, `text-muted`, `border`, `accent`
(goldenrod), `accent-secondary` (teal), `success`, `error`. **Write `bg-bg`, never
`bg-light-bg dark:bg-dark-bg`** — no `dark:` prefixes are needed anywhere. To change the
palette, edit the two blocks in `index.css` and nothing else.

## Game start transition

3 s before handing off to `playing`, over a 7.5 s linear scroll of 20 events through 66%
of their height, reusing the real `TimelineEvent` component. Reduced-motion users get a static
screen that auto-completes in 500 ms. Constants live at the top of `GameStartTransition.tsx`.
It is an unskippable fake load.

**`SCROLL_DURATION` sets the scroll _speed_, not how long the transition lasts.** The component
unmounts at `TOTAL_DURATION` (3 s), so only the first ~40% of the 7.5 s animation is ever seen —
raising it slows the drift, it does not make the transition longer. `SCROLL_PERCENTAGE` (0.66)
is likewise a distance, not a duration. To change how long players wait, edit `TOTAL_DURATION`.

The "Loading events from across time…" overlay is **not a card** — it deliberately has no
panel, border or shadow. It is a full-width band of `backdrop-blur-xl` plus a 95% `--color-bg`
wash (`.scrim-band` in `index.css`), **masked with a vertical linear-gradient** so it fades to
nothing above and below. The scrolling timeline therefore stays sharp at the top and bottom of
the screen and dissolves only behind the title, leaving no edge anywhere to read as a box.

Three things are load-bearing, and a "simplification" will break one of them:

- **The mask is what makes it pretty.** An unmasked full-screen frost flattens the whole
  timeline into grey mush and throws away the artwork the transition exists to show off.
- **The wash must be `--color-bg`, not black.** A dark scrim reads as a grey smudge over the
  light page background outside the cards. A bg-coloured one vanishes against the page and
  only bites where the artwork is.
- **`backdrop-blur-xl` is not decoration.** The 5% of artwork coming through the wash is only
  an unreadable colour cast once blurred; drop the blur and card text becomes legible again
  right behind the serif.

Rejected alternatives: a bordered frosted card (reads as a modal
dialog interrupting the scene), a full-bleed band with hard gold rules, a minimal pill with a
spinner (loses the serif entirely), an unmasked full-screen frost, and a radial/elliptical
mask (the rectangular band was preferred).

## Elastic draggable cards — not built

Making the timeline feel physical (first card centred, elastic pan, momentum fling) has no
implementation. The numeric vocabulary for "subtle & refined": framer spring
`stiffness 300–400 / damping 30–40 / mass 1` (the placed-card `bounceSpring` in
`animationTuning.ts` is 400/25, slightly bouncier), `dragElastic 0.1–0.15`, use-gesture
`rubberband: 0.15`. Centring the first card is a layout problem (≈50vh padding +
`scrollIntoView({block:'center'})`), not a physics one. Framer's drag doesn't expose release
velocity cleanly for a true momentum fling — that is the argument for `@use-gesture` +
`react-spring` if this is picked up.
