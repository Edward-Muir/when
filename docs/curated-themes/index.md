# Curated daily themes

Hand-authored themes — a named list of event slugs pinned to explicit dates — alongside the
seeded theme (Everything, category, region, country or pairing) the daily deals on every other
day.

## Where they live, and why not in the repo

The calendar is **one JSON document in Redis** under `themes:calendar`, served by
`GET /api/themes` and written by `POST /api/themes/publish`. There is deliberately **no
bundled fallback copy**: one home means a theme can never be half-published. Either the
client has the calendar or the date falls through to the seeded theme.

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

This is also why **reminder copy never names the theme**. Notifications are scheduled up
to `REMINDER_WINDOW_DAYS` (14) ahead and the OS keeps the text as written, so any theme name
in the body is a promise about a date that may not be decided yet. Generic copy is what buys
the scheduling freedom.

## Cadence: Mondays and Fridays

Curated themes run twice a week, on Mondays and Fridays; every other day is a seeded theme
(Everything, category, region, country or pairing). Nothing in the code knows about weekdays:
the cadence exists only in which dates the calendar holds, so changing it means re-publishing
each unplayed theme's id with new `dates` (dates that have not opened can be dropped freely).
The current plan is the schedule table at the top of [publish-inputs.md](publish-inputs.md).

## Seeded themes: the dated menu

The days no curated theme claims draw from a dated menu of Everything, the 21 categories,
regions ("East Asia"), countries ("Italy") and category + place pairings ("Art in Italy",
"Warfare in the United States"), weighted Everything 30, category 25, region 10, country 15,
pairing 20 in the first epoch (from **2026-10-06**). The menu is `src/data/dailyThemeMenu.json`,
written by `npm run daily-menu` (`scripts/daily-theme-menu.js`); the draw is `menuTheme` in
`dailyTheme.ts`. The pool is `filterPool` over every region, then `eventInPlace` (`regions.ts`):
a region through `eventRegionSet`, a country by its own tag. Deliberately not the Custom region
filter, whose rules are the picker's to change; a daily's pool must never move.

**The menu is frozen and dated, never derived at runtime.** A seeded theme is
`list[floor(random() * list.length)]`, so any change to a list re-themes every date it covers,
including days already played; the recency chain then replays decks nobody was dealt, and stored
results name the wrong theme. So the menu is a list of **epochs**, each in force from its `from`
date. Dates before the first epoch run the original generator untouched, Everything about half
the time and one category otherwise (a test pins every date from #1 to 2026-10-05), and each
epoch carries its own copy of the category list, so a future 22nd category cannot re-roll a live
epoch. Computing candidates from `allEvents` at load was rejected for the same reason: any
catalogue edit could add or drop a candidate and shift every later index. **Change the menu by
appending an epoch from a date that has not opened** (`npm run daily-menu -- --from YYYY-MM-DD`,
which refuses an opened date), never by editing a live one.

**Two gates, and the second is the one that matters.** An entry needs 30+ cards and **8+ in
band 0**, both measured over the pool the daily would deal. Pool size says little about easy
cards: South Korea has 56 cards and 1 in band 0, Sports in France 43 and 1, Greece 185 and 111.
The ramp's opening takes about 4 from band 0, so 8 leaves room for an overlapping theme earlier
in the week (Italy, then Art in Italy) having used some. The first epoch holds 10 regions
(Global is a footprint, not a theme), 28 countries and 78 pairings; the script prints
what it rejected and what sits near a gate. `dailyThemeMenu.test.ts` re-checks the latest
epoch against the live catalogue, so catalogue work that pushes an entry under a gate fails
CI; the fix is a new epoch.

**Place and pairing days get the curated escape hatches below, plus `footholdFloor`.**
Measured over 240 days, pairings on the default options dealt the hardest quartile into the
opening hand on **39.5%** of days; with `bandSpread: 1` and the lowered exclusion floor they
match ordinary days (9.3% against 9.8%, and 2.7-3.1 band-0 cards in the first six against
2.9). `footholdFloor: 4` lets band 0 alone ignore the seven-day exclusion when it would leave
fewer than 4 easy cards. It never fired in that measurement, since the 8-card gate already
covers it; it is the guarantee rather than the mechanism. Everything, category and curated
days do not get it: their past decks sit in the recency chain, and changing their options would
re-deal them.

**Smaller things.** Names reach 46 characters ("Architecture in the Middle East & North
Africa"). The home card wraps them, and the in-game `TopBar` pill wraps to two lines rather than
truncating, since a pairing's place comes last and is the part one line would cut off. The
Middle East & North Africa pairings still clip on a 320px phone ("Architecture in / the
Middle…"); the home card and the share text carry the full name. A daily deck of 60 cards or
fewer is kept out of the intro in full, like a curated one (`THIN_DAILY_DECK` in `App.tsx`).
Nothing server-side depends on the menu: the bot ceiling of 20 is below any 30-card pool, and
the API never derives a theme. "Theme Cleared!" stays curated-only, although a 30-card pairing
is clearable; that and keeping the same place off consecutive days are open follow-ups.

## Two deck-builder escape hatches, and why they are not optional

Both default to the ordinary values, so only the days that pass them (curated, place and
pairing days) change.

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
check that consumed one would silently re-theme the whole year — the same failure mode as
changing a seeded list's length (see `leaderboard-daily/`). A test pins 120 dates as unchanged.

## Sizing

Minimum **16** events, enforced by the API — but that is a backstop, not a target. The
authoring floor is **30**, and the working band is **30-36**; every banked theme sits in it.
`scripts/theme-gap.js --slugs` reports the 30-36 band, band zero and same-year pairs as gates.
The publish script enforces only resolvable slugs and band zero (the API enforces the minimum of
16), so a same-year pair passes publishing: run `theme-gap` first.

**Timeline spread is advisory, not a gate.** A theme may deliberately live in one
stretch of history (a single dynasty, the age of the pharaohs, deep time) and the order within
it is still a real puzzle. `theme-gap` prints the bins as `INFO` and `publish-theme.js` prints a
"clustered" note instead of failing. What protects the opening hand is band 0, which is a
hard gate at 5; spread is only a proxy for it.

No hard maximum, but two soft notes:

- The **cleared** end state fires when the deck runs dry, which needs `n - 6` correct
  placements against a realistic best of ~30. So it is reachable up to ~36 cards and
  effectively never above that.
- Scores bunch at the ceiling on a clearable theme, since `score = correctCount * 100` and
  equal scores tie. Nothing breaks; a real tie-break is a separate change.

Bots are clamped to the day's ceiling in `botGeneration.ts`, because they sample Poisson(6)
with no idea how many cards exist. Reading the theme size from the stored calendar is **not**
the pattern `submit.ts` forbids — that is the API keeping its own copy of `ALL_CATEGORIES` to
re-derive the theme, which drifts. Reading a count from the
one authoritative record has nothing to drift against, and it fails open.

## The cleared end state

A daily (and an Archive replay, below) deals five cards and ends when the hand empties. The hand shrinks on a wrong placement,
and also on a _correct_ one when the deck has nothing left to draw. So a game ending with
fewer than five mistakes can only have got there by emptying the deck — exact, with no new
state to track.

It is **not** a claim the player saw every card: drawing the last card and then missing five
times also exhausts the pool, with five mistakes. Hence "Theme Cleared!" rather than anything
implying completeness; "Perfect Clear!" (zero mistakes) is exact.

The outcome is gated to games that belong to a curated theme (`getCuratedThemeIdForConfig` in
`themeReplay.ts`), **not** to any single-player game that ran dry. A Custom filter thin enough
to exhaust is not a theme, and "Theme Cleared!" on it would be a lie; a seeded daily that runs
dry ends as an ordinary game over.

## Replaying past days: the Archive calendar

The home pager's second tab is a GitHub-style calendar of every daily since 2026-07-01
(`DAILY_REPLAY_FROM`): the days the player played are filled, and the curated days are ringed
in gold. Tapping a day opens a day card (`ArchiveDayCard`) that plays it. The pieces, and the
decisions behind them:

**A past day is a `suddenDeath` game with `dailyReplayDate` on the config, never a `daily`
with an old seed.** Everything keyed on `gameMode === 'daily'` / `dailySeed` — the single
stored daily result and board, the in-progress save, the leaderboard warm and submit, the
reminder — would otherwise fire for a date that is not today, and the first of those would
overwrite today's result with yesterday's. The leaderboard also accepts yesterday's date, so
only the client keeps a replay off it. It carries no challenge code because a code cannot encode
a date-seeded deck or a hand-picked pool. `src/utils/dailyReplay.ts` builds the config.

**What a day deals.** An ordinary day deals its own daily deck, `buildDailyDeck(date)`, rebuilt
from today's catalogue, so it can differ slightly from what was dealt on the day; the point is
to play the day, not reproduce it. A curated day deals the theme's reshuffled replay
(`buildThemeReplayConfig` plus the date): `buildThemeReplayDeck` seeds `buildRampedDeck` with
`archive:<id>:<random>` and applies no seven-day exclusion, and Restart reseeds too. Rebuilding
a curated day's exact deck was considered and rejected: it makes beating your best a memory
test, and the exclusion chain would drop cards from the theme. `bandSpread: 1` still applies —
the cap's rationale above assumes a curated theme fires on a handful of dates, and replays
break that assumption, so the same ~5 band-0 footholds will open most replays of a theme.
Accepted: the alternative is the measured 99.7%-hardest-quartile opening. A curated day whose
resolved pool has fallen under `REPLAY_MIN_POOL` (8, `startGame`'s own floor) deals the date's
deck instead of failing.

**A missed day counts; a played one is practice.** The stats recorder passes the finished game
through `asRecordedDaily`, which turns a replay of a day not in `playedDates` into that day's
daily (mode `daily`, the date as `dailySeed`) for recording only, so it fills the square and
rejoins the daily run. A day already played records like any other replay. See
[../stats-achievements/](../stats-achievements/index.md#back-filled-days).

**Today.** Today's square opens the ordinary daily while it is unplayed, so the result, resume and
leaderboard work as on the Daily tab; once played it says "Replay from tomorrow".

**The day card's art is the real opening card**, `getDailyPreviewEvent(date)`, which walks the
28-56-day recency chain (a couple of hundred milliseconds the first time). A list of every day
could not afford that, but one tap can: it runs a frame after the card opens, behind a
placeholder. The grid itself draws no art, so nothing downloads until a day is opened, and each
opening card already fronted the Daily tab on its day, so the card adds no new Cloudinary
conversions.

**The teaser.** Of the curated days still to come, exactly one — the next scheduled — is ringed
(not tappable) and named under the grid; the rest stay hidden so the calendar is not laid bare.
"Today" is `useToday`'s date passed down as a prop, and the panel also takes a
`calendarVersion` that `ModeSelect` bumps after each calendar refetch — the refetch mutates
module state that nothing re-renders on, so without it a theme fetched after boot stays
unringed until the next unrelated render.

**Personal bests** live in `when-theme-bests` (`themeBests.ts`), written by the stats recorder
for the daily on a curated day and for every replay, so the day's score is the first record.
`correctCount` is stored — the leaderboard's number, not the timeline length — and a curated
day's card says "High score: N/M", M being the resolved pool minus the seed card so a perfect clear is a full fraction. A `bestThemeScore` milestone fires when a run beats a previous non-zero
record. See [../stats-achievements/](../stats-achievements/index.md).

**Tests seam.** `__setCuratedThemesForTest` populates the list as well as the date index;
`themeReplay.test.ts`, `dailyReplay.test.ts` and `ArchivePanel.test.tsx` build synthetic catalogues rather than
loading the real one.

## The theme bank

Nineteen themes, one note each. Every deck is 34-36 cards, authored to size 30-36, 5+ band-zero
footholds and no two cards sharing a year, and spread across 6+ of 8 bins (advisory, see
Sizing). Ready-to-paste workflow inputs are in
[publish-inputs.md](publish-inputs.md); art prompts for the events they needed are in
[art/all_prompts.csv](art/all_prompts.csv), built by
`scripts/events/theme-art-prompts.py` from the hand-authored scenes in `art/scenes/`.

**That CSV is five columns**,
`event_name,research_prompt,image_prompt,image_generated,saved_filename`, because the consumer
sends the research prompt and the image prompt as two messages in one Gemini chat; see
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
| Indonesia            | [indonesia-theme.md](indonesia-theme.md)     | the worked example: why these 36 and not others                  |

**The scope rule is the theme.** A concept a keyword net returns 100-350 hits for —
"scientific discoveries", "astrophysics", "European country foundings", "games" — is a category
rather than a deck. Narrowed to a rule answerable yes/no about any candidate, each of those nets
11-43. If a new theme's anchored probe returns more than ~100, narrow the rule before picking
anything.

## Traps found authoring the bank

Four traps, all cheap to avoid once named.

**A slug can be named for the cause while its title names the event.** `english-civil-war-aftermath`
_is_ the Restoration of Charles II card, with that exact `friendly_name`. An agent greps for
"charles" or "restoration", finds nothing, and writes a duplicate. `theme-gap` will not save
you either — it matches `friendly_name description`, never the slug. **Before authoring any
card, check what already sits on its year**, not just what matches its name.

**`candidates.json` is live.** It is in `manifest.json`, so its events are dealt, validated and
part of the slug namespace like any other file; its name does not mean "staged".

**Anchor short regex alternatives with `\b`.** `theme-gap` matches `friendly_name description`,
so unanchored `tea` matches "s**tea**m" and "ins**tea**d"; `led ` matches "cal**led** ";
`illuminat` matches manuscript illumination. Unanchored nets report 714, 460 and 102 hits for
themes whose real coverage is 34, 87 and 22 — and an inflated net reads as "this theme is
rich", which is the wrong conclusion.

**A net above ~100 after anchoring means the concept is too loose.** "Scientific discoveries"
and "European country foundings" are categories, not decks. Narrow the scope rule to something
answerable yes/no about a single candidate, then re-probe.

One tooling note: `npm run find-duplicates` is O(n²) in _pairs_, so at catalogue scale a
per-pair seen-set overflows V8's maximum Set size. If it ever dies with `RangeError` rather than
reporting, that is the shape of the problem.

## Bank 2

Twenty-two more themes, authored with Sonnet sub-agents in two strictly separated steps, which
is the part worth copying:

1. **A blind spine.** One agent per theme got only the name and the scope rule, and was told not
   to open anything in the repository. It wrote 40-45 dated beats from the subject alone, with a
   quick search per date. Not seeing the catalogue is the point: a spine written from what the
   game already holds can only rediscover it, while a blind one is how the missing events are
   found. The bank added 414 events this way; Pirates & Privateers found 33 of its 34 cards
   missing.
2. **A reconcile.** A fresh agent per theme matched every beat against the catalogue **by year,
   not only by name** (the `english-civil-war-aftermath` trap), reused an existing card wherever
   one covered the beat, authored the rest, and cut to 30-36 against the gates.

Every deck is 31-36 cards (Stolen! 33, Before Us 32 after review), band 0 at least 5 and no
same-year pair, measured against the merged catalogue with `--include-pending`. Spread is not a
gate (see Sizing): Pharaohs sits in 2 bins and Before Us in 1, by design.
Ready-to-paste inputs are the second half of [publish-inputs.md](publish-inputs.md); art prompts
are [art/bank-2_prompts.csv](art/bank-2_prompts.csv), built from `art/scenes-bank-2/` (a separate
folder because `theme-art-prompts.py` refuses to run while any scene names an illustrated event,
and the first bank is fully illustrated).

| Theme                | Note                                         | Scope rule — a card is in only if…                                |
| -------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| Before Us            | [before-us.md](before-us.md)                 | it happened before _Homo sapiens_ existed                         |
| Capitals Founded     | [founding-cities.md](founding-cities.md)     | it founded a city that is a national capital today                |
| Cities Ablaze        | [great-fires.md](great-fires.md)             | a city burned, or it is a step in fighting urban fire             |
| Ends of the Earth    | [ends-of-the-earth.md](ends-of-the-earth.md) | people first reached a pole, a summit or an unvisited extreme     |
| Famine Years         | [famine.md](famine.md)                       | it is a named famine, or a decisive step in ending one            |
| Mandate of Heaven    | [chinese-dynasties.md](chinese-dynasties.md) | it is a Chinese dynasty's founding, peak act or fall              |
| On Stage             | [on-stage.md](on-stage.md)                   | it is a stage form, a landmark premiere or a famous playhouse     |
| Peace at Last        | [peace.md](peace.md)                         | it is a treaty or armistice that ended a named war                |
| Pharaohs             | [pharaohs.md](pharaohs.md)                   | it is an act of an Egyptian ruler, Narmer to Cleopatra            |
| Pirates & Privateers | [pirates.md](pirates.md)                     | it is armed robbery at sea, or the war on it                      |
| Places of Learning   | [schools.md](schools.md)                     | it founded or destroyed a school, university or great library     |
| Sail & Steam         | [ships.md](ships.md)                         | it is a new kind of ship, or one vessel that changed seafaring    |
| Stolen!              | [heists.md](heists.md)                       | it is a famous theft, robbery or fraud carried out for gain       |
| Taking Flight        | [flight.md](flight.md)                       | a person left the ground in a craft (atmosphere only)             |
| Tallest in the World | [skyline.md](skyline.md)                     | it became the tallest structure of its day, or let us build up    |
| Tamed                | [tamed.md](tamed.md)                         | it is an animal brought into human service                        |
| The First Woman      | [first-women.md](first-women.md)             | it is the first time a woman did or held something                |
| The Roman Story      | [rome.md](rome.md)                           | it is a defining moment of the Roman state, to 1453               |
| Under Siege          | [sieges.md](sieges.md)                       | it is the siege of a named city or fortress                       |
| Under the Knife      | [under-the-knife.md](under-the-knife.md)     | it is a surgical procedure or tool, or a way to survive one       |
| Walls & Fortresses   | [walls.md](walls.md)                         | it built or brought down a fortification meant to keep people out |
| Waterworks           | [waterworks.md](waterworks.md)               | it moves or holds back water by design                            |

**Three decks sit exactly on the band-0 floor**: Ends of the Earth, Famine Years and Under the
Knife. Band 0 depends on how crowded a card's neighbourhood is, so these are the first to
recheck whenever the catalogue grows; each note says which card to swap in.

### What review changed after the agents finished

Agents follow a scope rule loosely when a keyword fits. Every deck was read by hand afterwards,
and the edits are recorded in each note's "Review edits" section. The ones worth knowing:

- **Cities Ablaze** had admitted five general sacks (Carthage, Jerusalem in 70, Rome in 410,
  Constantinople in 1204, Baghdad in 1258) because fire was part of each. Four were already
  Under Siege cards. The rule admits a wartime burning only when the fire itself is the event.
- **Under the Knife** leaned on `rhinoplasty` as a foothold, a card dated 2,400 years before the
  text it describes. A deck should not teach a wrong date because the error makes it easy.
- **Before Us** carried the Schöningen spears at 337,000 years; a 2025 re-dating puts them at
  about 200,000, after _Homo sapiens_, so the card moved and left the deck.
- Two events were written twice by different themes (Ramesses III against the Sea Peoples,
  Bessie Coleman's licence) and were merged to one record each.

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

**Images are a gate.** `loadAllEvents` hides any event without Cloudinary art, so an
unillustrated event can never be dealt. Every live event has art; any event you author still
needs art before it can be themed, and the image pipeline lives outside this repo — so confirm
it runs before committing to a theme that needs new art.

## The scripts duplicate src/, on purpose

`scripts/themes/catalogue.js` re-implements the playable-event filter and the difficulty index
in plain CommonJS, because the workflow runs it with a bare `node` and no build step.
`src/utils/themeScripts.test.ts` asserts the two agree, which is what makes that safe. The
subtle case: `u` is an event's **position in the year-sorted catalogue**, not a binary search
for its year, and on the catalogue's large year ties those differ by up to 0.015, a fifth of a
spread bin.

Note also that the eligible set excludes anything past year 2100: `ERA_DEFINITIONS` stops there,
so validating against the raw catalogue would let through a slug the daily can never deal.
