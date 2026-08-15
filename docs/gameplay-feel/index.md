# Gameplay & Feel

Deck composition, tombstones, streak feedback, transitions, and the colour system.

## Repo-wide trap: Tailwind opacity modifiers are silent no-ops on our colour tokens

`text-text-muted/60`, `bg-accent/20`, `border-accent-secondary/50` — **none of these do
anything.** The tokens in `tailwind.config.js` are plain `var(--color-x)` values with no
`<alpha-value>` channel, so Tailwind cannot apply the alpha modifier and emits the flat
colour. There is no error; the design just silently doesn't happen.

Use `opacity-60` on the element, or `color-mix(in srgb, var(--color-accent) 60%, transparent)`
in CSS. Standard Tailwind colours (`bg-black/50`, `text-white/70`) are unaffected and do work.

**There are ~46 of these in `src/` today** — they are latent, not urgent, but don't add more,
and don't be surprised when an existing one has no visual effect.

## Deck composition (2026-08-13)

Decks are **composed, not shuffled**: the first `RAMP_WINDOW` (24) cards are chosen so a game
opens easy and well-spread and ramps from there; the tail is a plain seeded shuffle. Applies
to every mode — daily and Custom both funnel through the same builder.

The mechanism is documented in the header comments of `deckBuilder.ts`, `difficultyScore.ts`
and `dailyRecency.ts`. What follows is the evidence and the constraints, which are not.

**Why it exists.** The eligible pool is ~13% easy and was dealt uniformly, so a beginner's
opening card was a coin flip. Worse, the _level of a day_ swung with the daily theme — easy
share runs 3.4% (`trade`) to 33.6% (`figures`), a 10x spread against ~±1.2 cards of shuffle
noise. A score measured the day, not the player.

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
get wrong). A ramp on the raw label would have opened games with the most crowded cards.

Hence `C = 0.6·recognition + 0.4·placeability`, banded by **global quartiles** of C.
`w = 0.6` is the measured optimum — 0.5 drops the smallest band-0 pool to 23 cards, 0.4 to 13.
Distance for the spacing kernel is in **empirical-CDF rank space**, not years (the catalogue
spans 4.5 billion of them) and not log-age (measured worse on every metric).

**Results** over 113 scored days: open-to-close gap ratio 8.7x → **11.1x**; eras covered
7.1 → 7.8 of 9; repeats within 7 days **46.9% of days → 7.1%**. Cost: ~1.81 ms per deck build
with the chain memoised. (Jest/jsdom inflates timings ~5x — don't benchmark from a test run.)

**`very-hard` is back in `DEFAULT_DIFFICULTIES`.** It used to be excluded as a blunt
anti-punishment measure; the ramp places those 693 events properly (~1% of opening cards,
~22% by card 24) and including them raised distinct cards seen per year from 3,876 to 4,185.

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
- **Keep both call sites on the shared builder.** `buildDailyDeck` and `startGame` used to
  duplicate filter-and-shuffle logic kept in sync by convention. If they diverge, the `/daily`
  preview card silently stops matching the deck actually dealt.

A recurring question, already answered: **recency does not make games harder.** Largest delta
in mean band index at any position is 0.025 on a 0–3 scale. The exclusion changes _which_ card
is dealt, not which band.

## Tombstones (2026-07-01 → 2026-07-05)

A single-player miss shows no popup. The failed card FLIP-morphs from the attempted slot to
its **correct** gap and settles as a greyscale "dead card".

- **Tombstones are mechanically neutral** — a hard requirement. They never subdivide gaps or
  affect correctness, drag insertion math, centering or ripples. Never put
  `data-timeline-index` / `data-timeline-year` on tombstone DOM.
- **Their gap position is derived per render** via `findCorrectPosition`, not stored. Stale
  index bugs are impossible by construction.
- Multiplayer keeps the incorrect popup (turn handoff needs it) but still records tombstones.

**The approved drag mechanic is iteration 4** ("yes that is the mechanic I was after"):
tombstone rows are full card-height with the same footprint as real rows; hovering their gap
swaps the ghost card into that row with **zero displacement** of anything else, and only the
tombstone's content slides right — never up or down. Three earlier attempts were rejected, so
don't re-propose them: a slim full-width row (read as a timeline anchor), a right-aligned
margin-note chip (still displaced vertically during drag), and collapse-to-0px-plus-slide-out
("horrid").

**Miss-reveal choreography v2 was left unresolved on 2026-07-05** — verify current behaviour
before trusting this. The card's slow distance-scaled travel works, but the path rows' layout
shift snapped rather than animating. Two framer-motion learnings from the hunt are worth
keeping regardless:

- For a shared-`layoutId` FLIP, the **top-level** `transition` of the entering element wins;
  a nested `layout:` key is masked by the surrounding spring. This is why an earlier 450 ms
  tween never applied.
- **Animating `y` on the projection element kills in-flight layout animations.** Ripple bumps
  had to move to an inner wrapper div. Similarly, leaving a `layoutId` in place after a FLIP
  leaves a stale projection transform that blocks later x-animations — remount with a `key`.

Puppeteer verifiers were written for this (`verify-miss-reveal.js`, `verify-tombstone-drag.js`)
but lived in a session scratchpad and are **gone**. `verify-tombstone-drag.js` checked 7 drag
invariants and was meant to gate any change here; recreating it is worthwhile before touching
`TombstoneRow.tsx`. Measure the tombstone **button**, not the row — transforms live there.

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

3 s before handing off to `playing`, over a 6 s linear scroll of 20 random events through 66%
of their height, reusing the real `TimelineEvent` component. Reduced-motion users get a static
screen that auto-completes in 500 ms. Constants live at the top of `GameStartTransition.tsx`.
Noted in an old design review as an unskippable fake load — still true.

## Elastic draggable cards — research only, nothing built

`elastic-draggable-cards-research.md` was an options document for making the timeline feel
physical (first card centred, elastic pan, momentum fling). **No implementation exists.** Its
durable content is the numeric vocabulary for specifying "subtle & refined": framer spring
`stiffness 300–400 / damping 30–40 / mass 1` (the existing `springBounce` is 400/25, slightly
bouncier), `dragElastic 0.1–0.15`, use-gesture `rubberband: 0.15`. Centring the first card is a
layout problem (≈50vh padding + `scrollIntoView({block:'center'})`), not a physics one. The one
thing framer's drag doesn't expose cleanly is release velocity for a true momentum fling —
that is the argument for `@use-gesture` + `react-spring` if this is ever picked up.
