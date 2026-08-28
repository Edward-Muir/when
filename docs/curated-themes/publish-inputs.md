# Publishing a run of themes

The decks themselves live in [`themes/bank.json`](../../themes/bank.json) — id, name and slug
list, nothing else. Dates are **not** in that file: a deck is a fixed thing and a schedule is
not, so re-running the bank on different dates is a dispatch input rather than a commit.

That file is publish _input_, not a runtime source. The calendar still lives in exactly one
place, `themes:calendar` in Redis, so a theme can never be half-published. Nothing the client
loads reads the bank. See [index.md](index.md).

## Scheduling the bank

**Actions → Publish Theme → Run workflow**, then:

| Input        | Value                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| `themes`     | `all`, or a comma-separated list of bank ids in the order you want them |
| `start`      | the date the first one runs, `YYYY-MM-DD`                               |
| `every_days` | `7` for weekly                                                          |
| `theme`      | leave blank                                                             |
| `mode`       | `validate` first, then `publish`                                        |

Dates are derived from `start`, so the run log is where you check the schedule — it prints
each date with its weekday next to the deck that lands on it, which is how a mistyped `start`
gets caught before anything is written.

`themes` and `theme` are mutually exclusive and the script refuses both, because a precedence
rule is invisible to whoever is filling in the form. Use `theme` for a one-off deck that is
not in the bank yet; the shape is `{"id","name","eventNames":[...],"dates":["YYYY-MM-DD"]}`.

## Bank order is the schedule, and it is load-bearing

`RECENCY_DAYS` is 7, so on a weekly cadence every deck is filtered against **the one before
it** — seven days back is inside the window. Two adjacent decks sharing a card would silently
drop that card from the second one. Bank order is therefore kept adjacent-disjoint, and
`src/utils/themeBank.test.ts` fails if that stops holding. Non-adjacent decks may overlap
freely (`cosmic-ideas` and `eureka` share five cards and sit two weeks apart); fourteen days
back is outside the window.

If you pass an explicit id list rather than `all`, you are choosing the order yourself and the
test cannot help you — check the overlaps.

## Rescheduling, and what cannot be undone

A date can only be set **before it opens**. Puzzle date `D` opens at `D-1 10:00Z` (midnight in
UTC+14), so from Pacific time tomorrow is settable until 03:00 PT and after that the next clean
date is the day after.

Re-publishing a deck that is already in the calendar **keeps the dates it has already run on**
and replaces only its future ones. That is deliberate: `dailyRecency` replays the last 28 days
to build its exclusion chain, so dropping a date a deck really ran on makes the following week
exclude cards nobody saw. To take a deck out entirely, use the `remove` input.

## Adding a deck to the bank

1. Author it per [index.md](index.md) — scope rule first, then `npm run theme:gap`, then the
   missing events via the `add-events` skill. Art is a hard gate: `loadAllEvents` hides an
   event without Cloudinary art, so an unillustrated slug can never be dealt.
2. Append it to `themes/bank.json`, positioned so it shares no card with either neighbour.
3. `CI=true npm test -- --watchAll=false --testPathPattern=themeBank` — this checks every slug
   still resolves, the deck opens on enough easy cards, and the adjacency rule holds.
4. Dispatch in `validate`, read the report, then `publish`.

## The bank as it stands

Nineteen decks, 34–36 cards each, every one clearing the four gates the publish Action
enforces: size 30–36, 6+ of 8 spread bins, 5+ band-zero footholds, no two cards sharing a
year. All slugs resolve against the current catalogue — the art backlog that once blocked the
whole bank is closed.

Scheduled weekly from 2026-08-30. `kings-of-england` leads deliberately — the opening Sunday
is the one most people will meet the format on. Everything after it is alphabetical, which
happens to satisfy the adjacency rule above on its own:

| #   | Date       | Deck                | Name                 | Cards |
| --- | ---------- | ------------------- | -------------------- | ----: |
| 1   | 2026-08-30 | `kings-of-england`  | Kings of England     |    36 |
| 2   | 2026-09-06 | `assassinations`    | Assassinations       |    36 |
| 3   | 2026-09-13 | `automata`          | Automata             |    35 |
| 4   | 2026-09-20 | `ciphers`           | Codes & Ciphers      |    36 |
| 5   | 2026-09-27 | `clockwork`         | Clockwork            |    36 |
| 6   | 2026-10-04 | `cosmic-ideas`      | Cosmic Ideas         |    36 |
| 7   | 2026-10-11 | `crossings`         | Bridges & Tunnels    |    36 |
| 8   | 2026-10-18 | `eureka`            | Eureka Moments       |    36 |
| 9   | 2026-10-25 | `games`             | The Games Board      |    36 |
| 10  | 2026-11-01 | `light`             | Let There Be Light   |    35 |
| 11  | 2026-11-08 | `lost-and-found`    | Lost & Found         |    35 |
| 12  | 2026-11-15 | `mapmakers`         | Mapmakers            |    36 |
| 13  | 2026-11-22 | `money`             | Hard Currency        |    36 |
| 14  | 2026-11-29 | `nations-of-europe` | Nations of Europe    |    35 |
| 15  | 2026-12-06 | `numbers`           | Numbers & Proofs     |    36 |
| 16  | 2026-12-13 | `plagues`           | Plague Years         |    36 |
| 17  | 2026-12-20 | `the-deep`          | The Deep             |    34 |
| 18  | 2026-12-27 | `upheaval`          | When the Earth Moved |    36 |
| 19  | 2027-01-03 | `what-we-drink`     | What We Drink        |    36 |

Every other day falls through to the seeded category theme, exactly as before.

## Watching for staleness

A quarter of Sundays booked in advance is a quarter for a deck to rot in: deprecating an
event, renaming a slug or an image regression all shrink a stored theme silently, and the
calendar (Redis) and the catalogue (this repo) cannot see each other. `.github/workflows/verify-themes.yml`
runs `scripts/verify-themes.js` daily and on every push to `main` that touches the catalogue,
and fails the run if a scheduled deck no longer resolves. Locally that is `npm run theme:verify`.
