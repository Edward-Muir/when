# Curated daily themes

Hand-authored themes — a named list of event slugs pinned to explicit dates — alongside the
seeded category themes the daily has always had.

## Where they live, and why not in the repo

The calendar is **one JSON document in Redis** under `themes:calendar`, served by
`GET /api/themes` and written by `POST /api/themes/publish`. There is deliberately **no
bundled fallback copy**: one home means a theme can never be half-published. Either the
client has the calendar or the date falls through to the seeded category theme, exactly as
before curated themes existed.

Redis rather than a repo file because publishing a theme must not be a code change. Redis
rather than a new backend because this is a ~10 KB read-mostly config blob with no relations,
no per-user rows and no queries — the canonical key-value workload. If social login ever
brings a relational store, moving one document is an afternoon; it is not a reason to build
one now.

`GET /api/themes` is **shared-cached on purpose** (`s-maxage=300`), which is the exact
opposite of `api/leaderboard/[date].ts`. That response varies per device by design, so caching
it would leak one player's view to another. This one is byte-identical for everyone, so the
CDN absorbs essentially all reads and Upstash command volume stays flat. Don't "fix" either to
match the other.

## Where the code lives

The two routes are `api/themes/index.ts` (GET) and `api/themes/publish.ts` (POST). Everything
else — the schema, its validation and the admin gate — sits in `lib/`, because Vercel deploys
every file under `api/` as a Serverless Function and the Hobby plan allows 12. See
[dev-tooling/](../dev-tooling/index.md); `src/utils/apiRoutes.test.ts` enforces it.

## Publishing

Through **`.github/workflows/publish-theme.yml`** (`workflow_dispatch`), so the admin secret
stays in GitHub Secrets and never reaches whoever composed the theme. `mode` defaults to
`validate`, so a mis-click writes nothing.

The decks live in **`themes/bank.json`** and the dispatch schedules them: `themes: all`,
`start`, `every_days: 7` puts the whole bank on consecutive Sundays in one run. Dates stay out
of that file on purpose — a deck is fixed, a schedule is not — and the bank is publish input
only, never something the client reads, so the calendar is still the one home. Bank **order is
the schedule** and has to stay adjacent-disjoint, because a weekly cadence lands each deck
exactly `RECENCY_DAYS` after the one before it; `src/utils/themeBank.test.ts` enforces that,
along with every slug still resolving. Re-publishing a deck keeps the dates it has already run
on and replaces only its future ones, for the reason in "Never rewrite a date" below. Full
dispatch instructions: [publish-inputs.md](publish-inputs.md).

`.github/workflows/verify-themes.yml` runs `scripts/verify-themes.js` daily and on catalogue
pushes to `main`. That matters far more once a quarter is booked ahead: a deck can go stale
months before the day it breaks.

The split of validation is the part worth remembering:

- **The Action / `scripts/publish-theme.js`** owns everything needing the event catalogue — do
  these slugs resolve to _playable_ events, is the theme spread across the timeline, does it
  open on an easy card. The serverless function cannot do this: `api/` is a separate tsconfig
  project and `public/events/` is served statically, not bundled.
- **`api/themes/publish.ts`** owns structure — sizes, name length, id shape, date collisions,
  whether a date has already opened. Validate mode asks it via `dryRun` rather than keeping a
  second copy of those rules in the script.

`scripts/verify-themes.js` re-checks the **live** calendar against the **current** catalogue.
Publish-time validation proves a theme was sound when written; this catches it going stale,
which is a real risk when the calendar is in Redis and the events are in the repo. Deprecating
an event or an image regression silently shrinks a stored theme.

## The date rule: you can schedule tomorrow, but not this afternoon

A puzzle date `D` opens at midnight in UTC+14, i.e. **`D-1 10:00Z`** — the same fact
`lib/leaderboard/dateWindow.ts` derives its ~50-hour submission window from. Once `D` has
opened somewhere, changing its theme splits the day: two populations play different decks and
submit to the same board, and nothing downstream can tell them apart.

So publishing rejects a date that has already opened. From Pacific time that means tomorrow is
settable until 03:00 PT (10:00 UTC); after that the next clean date is the day after. `force`
overrides it, and the only people affected are UTC+13/+14. A date already in the calendar is
exempt as it ages, or the document could never be edited again.

**Never rewrite a date that is today or past.** `dailyRecency.ts` replays the last 28 days to
build the exclusion chain, and a retroactive edit makes it replay decks nobody played.

This is also why **reminder copy no longer names the theme**. Notifications are scheduled up
to `REMINDER_WINDOW_DAYS` (14) ahead and the OS keeps the text as written, so any theme name
in the body is a promise about a date that may not be decided yet. Generic copy is what buys
the scheduling freedom.

## Two deck-builder escape hatches, and why they are not optional

Both default to today's values, so nothing outside a curated day changes.

**`bandSpread`.** `SPREAD = 6` gives each band a budget of `max(1, floor(bandSize / 6))`. On a
pool small enough that every budget floors to 1, `availableBands` prefers bands still inside
budget — so deck positions 0-3 become a forced round-robin of one card per band. Deck indices
1-5 _are_ the opening hand, so measured over 300 seeds on a 30-card pool the hardest quartile
lands in the opening hand **99.7%** of the time, against **11.7%** on the full catalogue. The
trigger is a **band-0 population under ~12**, not pool size, so no size floor protects against
it: a realistic 81-card volcanoes theme is fully affected while a 62-card space theme is
nearly fine.

Curated days pass `bandSpread: 1`, which lifts the cap and restores the full-catalogue profile
exactly. **Not `Infinity`** — that floors the budget to 0 and `max(1, 0)` lands straight back
on the pathological value. The cap's purpose is to stop a _recurring_ thin category theme
burning the same band-0 cards daily; a curated theme fires on a handful of explicit dates, so
that rationale does not apply.

**`minAfterExclusion`.** A curated pool is far below `MIN_POOL_AFTER_EXCLUSION` (72), so
without lowering it the seven-day no-repeat filter always backs out and a curated day gets no
protection at all.

**Both must come from `getDailyBuildOptions(date)` in `dailyPool.ts`, and every builder call
site on the daily path must use it** — `buildDailyDeck` for the deck that is dealt, and
`dailyRecency`'s chain walk for the decks it replays. If those diverge the following week
excludes cards nobody saw and fails to exclude cards everybody saw, which `dailyRecency`'s own
header calls measurably worse than having no recency at all. `curatedThemes.test.ts` deals a
curated day and asserts every card it dealt is in the next day's exclusion set.

## The curated lookup must come before the RNG

`getDailyTheme` checks the calendar and returns early _before_ touching `seededRandom`. Every
ordinary day's theme depends on how many random numbers have been drawn from its seed, so a
check that consumed one would silently re-theme the whole year — the failure mode adding the
21st category caused (see `leaderboard-daily/`). A test pins 120 dates as unchanged.

## Sizing

Minimum **16** events, enforced by the API — but that is a backstop, not a target. The
authoring floor is **30**, and the working band is **30-36**; every theme in the bank above
sits in it. `scripts/theme-gap.js --slugs` reports the 30-36 band as a gate, alongside the
bins and band-zero checks the publish script enforces.

No hard maximum, but two soft notes:

- The **cleared** end state fires when the deck runs dry, which needs `n - 6` correct
  placements against a realistic best of ~30. So it is reachable up to ~36 cards and
  effectively never above that.
- Scores bunch at the ceiling on a clearable theme, since `score = correctCount * 100` and
  equal scores tie. Nothing breaks; a real tie-break is a separate change.

Bots are clamped to the day's ceiling in `botGeneration.ts`, because they sample Poisson(6)
with no idea how many cards exist. Reading the theme size from the stored calendar is **not**
the pattern `submit.ts` forbids — what broke there was the API keeping its own copy of
`ALL_CATEGORIES` and re-deriving the theme, and that copy drifting. Reading a count from the
one authoritative record has nothing to drift against, and it fails open.

## The cleared end state

A daily deals five cards and ends when the hand empties. The hand shrinks on a wrong placement,
and also on a _correct_ one when the deck has nothing left to draw. So a game ending with
fewer than five mistakes can only have got there by emptying the deck — exact, with no new
state to track.

It is **not** a claim the player saw every card: drawing the last card and then missing five
times also exhausts the pool, with five mistakes. Hence "Theme Cleared!" rather than anything
implying completeness; "Perfect Clear!" (zero mistakes) is exact.

This also fixes thin category days — `sports` has ~50 playable events and has always been able
to run the deck dry and call it Game Over.

## The theme bank

Nineteen themes authored in one parallel pass, one note each. Every deck is 34-36 cards and
clears all four gates: size 30-36, 6+ of 8 spread bins, 5+ band-zero footholds, no two cards
sharing a year. The decks themselves are `themes/bank.json`; how to schedule them is in
[publish-inputs.md](publish-inputs.md); art prompts for the events they needed are in
[art/all_prompts.csv](art/all_prompts.csv), built by
`scripts/events/theme-art-prompts.py` from the hand-authored scenes in `art/scenes/`.

**That CSV is five columns**, `event_name,research_prompt,image_prompt,image_generated,saved_filename`,
because the consumer sends the research prompt and the image prompt as two messages in one
Gemini chat. Both in-repo generators used to write four and drop the research step; see
[events-images/](../events-images/index.md) for the skeleton and why it is as short as it is.

| Theme                | Note                                         | Scope rule — a card is in only if…                               |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Assassinations       | [assassinations.md](assassinations.md)       | a named person was killed for political reasons                  |
| Automata             | [automata.md](automata.md)                   | it is a machine built to act on its own                          |
| Clockwork            | [clockwork.md](clockwork.md)                 | it is a device or convention for measuring time                  |
| Codes & Ciphers      | [ciphers.md](ciphers.md)                     | it makes or breaks secret writing                                |
| Cosmic Ideas         | [cosmic-ideas.md](cosmic-ideas.md)           | it is an idea about what the universe _is_                       |
| Bridges & Tunnels    | [crossings.md](crossings.md)                 | it is a built crossing of water, valley or rock                  |
| Eureka Moments       | [eureka.md](eureka.md)                       | it is the specific moment a discovery landed                     |
| The Games Board      | [games.md](games.md)                         | it is a game played at a table, or a machine that beat us at one |
| Kings of England     | [kings-of-england.md](kings-of-england.md)   | it is a monarch's accession, death or defining act               |
| Let There Be Light   | [light.md](light.md)                         | it is a way of making artificial light                           |
| Lost & Found         | [lost-and-found.md](lost-and-found.md)       | something buried was found, or a dead script read                |
| Mapmakers            | [mapmakers.md](mapmakers.md)                 | it changed what people thought the world looked like             |
| Hard Currency        | [money.md](money.md)                         | it is a form of money, or the institution issuing one            |
| Nations of Europe    | [nations-of-europe.md](nations-of-europe.md) | it is _the_ founding moment of a European country                |
| Numbers & Proofs     | [numbers.md](numbers.md)                     | it is a mathematical idea entering human thought                 |
| Plague Years         | [plagues.md](plagues.md)                     | it is a named outbreak, or a decisive step in ending one         |
| The Deep             | [the-deep.md](the-deep.md)                   | it is going deliberately under water, or finding what sank       |
| When the Earth Moved | [upheaval.md](upheaval.md)                   | it is an eruption, earthquake or tsunami                         |
| What We Drink        | [what-we-drink.md](what-we-drink.md)         | it is a drink made on purpose, or a rule about drinking it       |
| Indonesia            | [indonesia-theme.md](indonesia-theme.md)     | the first theme, and the model the rest follow                   |

**The scope rule is the theme.** Four of these started as concepts that a keyword net returned
100-350 hits for — "scientific discoveries", "astrophysics", "European country foundings",
"games" — which is the signature of a category rather than a deck. Each was narrowed to a rule
answerable yes/no about any candidate, and each then netted 11-43. If a new theme's anchored
probe returns more than ~100, narrow the rule before picking anything.

**Anchor short alternatives with `\b`.** `theme-gap` matches `friendly_name description`, so
bare `tea` matches "steam" and "instead", bare `led ` matches "called ", and `illuminat`
matches manuscript illumination. Unanchored nets reported 714, 460 and 102 hits for themes
whose real coverage was 34, 87 and 22.

## Traps found authoring the bank

Four things cost real time across nineteen parallel themes. All four are cheap to avoid once
named.

**A slug can be named for the cause while its title names the event.** `english-civil-war-aftermath`
_is_ the Restoration of Charles II card, with that exact `friendly_name`. An agent greps for
"charles" or "restoration", finds nothing, and writes a duplicate. `theme-gap` will not save
you either — it matches `friendly_name description`, never the slug. **Before authoring any
card, check what already sits on its year**, not just what matches its name.

**`candidates.json` is live.** The `add-events` skill calls it "events staged for review" and
says not to hand-add to it, which reads as "not in the game". It is in `manifest.json`, so its
events are dealt, validated and part of the slug namespace like any other file.

**Anchor short regex alternatives with `\b`.** Unanchored `tea` matches "s**tea**m" and
"ins**tea**d"; `led ` matches "cal**led** "; `illuminat` matches manuscript illumination.
These inflated three themes' nets to 714, 460 and 102 hits against real coverage of 34, 87
and 22 — and an inflated net reads as "this theme is rich", which is the wrong conclusion.

**A net above ~100 after anchoring means the concept is too loose.** "Scientific discoveries"
and "European country foundings" are categories, not decks. Narrow the scope rule to something
answerable yes/no about a single candidate, then re-probe.

One tooling note: `npm run find-duplicates` is O(n²) in _pairs_, and at ~5,985 events it
crashed on V8's maximum Set size until the redundant seen-sets were removed. If it ever dies
with `RangeError` rather than reporting, that is the shape of the problem.

## Authoring: themes lead, the catalogue follows

Pick the theme on its merits, then find out what is missing:

1. `npm run theme:gap "<keywords>" -- --list` — coverage, spread, and **which stretches of the
   timeline are empty**. The empty bins are the brief; a bare count is not.
2. Hand-pick the slugs that genuinely belong. A keyword sweep is a net, not a theme.
3. Author whatever is missing per the `add-events` skill.
4. Dispatch the Action in `validate`, read the report, then `publish`.

A worked example, including the two traps that only show up on a real theme:
[indonesia-theme.md](indonesia-theme.md). `theme:gap` filters to _playable_ events, so it cannot
see slugs you just authored — project the band/spread over `playable + pending` or the numbers
will describe a theme half its size. And `MIN_BAND_ZERO` is the constraint that actually bites: band 0
blends the `difficulty` label with how sparse the timeline is around the event, so a regional
theme rarely holds enough of them and the footholds have to be found rather than graded into
existence.

**Images are a gate, but as of 2026-08-23 it is open.** `loadAllEvents` hides any event without
Cloudinary art, so an unillustrated event can never be dealt. That gap is now **zero**: all 5,107
playable events have art, including the 324 `sports` events that had long been curated but
unillustrated (see
[../events-images/session-2026-08-23-catalogue-image-completion.md](../events-images/session-2026-08-23-catalogue-image-completion.md)).
Any event you author from here still needs art before it can be themed, and the image pipeline
lives outside this repo — so confirm it still runs before committing to a theme that needs new
art.

## The scripts duplicate src/, on purpose

`scripts/themes/catalogue.js` re-implements the playable-event filter and the difficulty index
in plain CommonJS, because the workflow runs it with a bare `node` and no build step.
`src/utils/themeScripts.test.ts` asserts the two agree, which is what makes that safe — it
caught a real divergence already: `u` is an event's **position in the year-sorted catalogue**,
not a binary search for its year, and on the catalogue's large year ties those differ by up to
0.015, a fifth of a spread bin.

Note also that the eligible set is **5,289**, not 5,290: `ERA_DEFINITIONS` stops at year 2100
and one event sits beyond it, so validating against the raw catalogue would let through a slug
the daily can never deal.
