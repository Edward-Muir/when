# Event detail — the long-form "read more"

Every event in the manifest has two paragraphs of prose behind it, shown once the card is placed.
`node scripts/events/detail-report.js` reports every manifest event written and exits 0; a
non-zero exit means new events still owe prose, or something regressed.

- **The voice rules: [writing-spec.md](writing-spec.md)** — the hook, the band as numbers, the
  register carve-out, what may be asserted, and the banned machine tells. The working version of
  the same rules, for someone about to write a batch, is
  [.claude/skills/write-event-detail/SKILL.md](../../.claude/skills/write-event-detail/SKILL.md)
- **The catalogue errors this work surfaced:
  [../events-images/catalogue-error-backlog.md](../events-images/catalogue-error-backlog.md)** —
  wrong years, wrong names, duplicate cards, found by reading every record against a source

## Why this exists

Card `description` is capped at 1-2 sentences and may not state a date, because it is shown
**before** placement and would otherwise be the answer. That restraint is right for the puzzle
and leaves the player with no way to satisfy the curiosity the card just created. So once a card
is placed — and anywhere in My Timeline — its popup shows two paragraphs about the event.

## The decisions, and why

**There is no control. A placed card opens on the prose.** Once a card is on the timeline it has
nothing left to hide, so the popup shows the long-form read in place of the short description —
no button, no toggle, no second face, no second overlay. A control here would be a thing to find
and explain for a choice the player has no reason to make. Don't add one; if the prose should not
show, that is the gate's job, below.

**The short description is the fallback, in both senses of unavailable**: an event with no prose
written (`has_detail` unset, so it is decided before render) and an event whose shard would not
load (the description plus a retry row). A card therefore always says something about its event,
and the feature works against a partly written corpus — the events that have prose show it, the
rest show their description. That is what makes adding events safe before their prose lands.

**The description also shows where the prose must not**: a card still in the player's hand, and
the correct/wrong reveals, which are a beat in the game loop rather than a reading surface.

**The ✕ shares the bottom row with "Report an issue", on every description popup.** Report takes
the left half and the ✕ the right, because the bottom of the card is where a thumb lands to
dismiss it, and a full-width report row there catches those taps. It is a real button, not a
decoration: a hand card closes on any tap anyway, but a card showing prose ignores taps on itself,
so there the ✕ is the in-card way out. While the report reasons are up the ✕ steps aside, since
the 2x2 chips need the full width. The reveals keep their tap-to-advance, where a close button
would read as a decision to make.

**Everything between the header and the "Report an issue" row is one scroll region, image
included.** The header and the report row stay put; the image scrolls up and out of the way and
the prose takes the whole region — **476px, around 24 lines**. Scrolling only the text under the
fixed 384px image gives one to four lines to read ~700 characters of prose through; the image has
to be inside the scroller, not above it.

**The region is a constant height — the image box plus a 92px strip of text — so every detail card
is the same size**: 340x606 at 402px wide, 400x606 at 1440px, and identical before and after the
shard loads and after scrolling to the end. A constant works precisely because the region only ever
holds prose, which always overflows it — there is no text for a measured height to fit.

**Tapping the card does not dismiss the popup while the prose is up.** `Modal`'s `tap-advance` mode
would turn every scroll drag into a dismissal, so `GamePopup` uses `backdrop` there; the backdrop,
ESC and the ✕ all still work. The reveals and a hand card, with nothing to scroll, keep
`tap-advance`. The leaderboard has the same constraint, where a row tap would close the board.

> **The scroll region carries `overflow` and nothing else — no mask, no filter, no `backdrop-*`,
> no `transform`.** Anything that promotes it to its own compositing layer breaks it on iOS
> Safari: a `mask-image` there leaves the image painting at its unscrolled position while the text
> moves over it. That reproduces on neither desktop Chromium nor Linux WebKit, so **this region
> cannot be checked locally — scroll it on a device.** Decoration goes on a sibling drawn over the
> region, which is what the fade is: a `pointer-events-none` gradient coloured inline from
> `event.color` (or `var(--color-surface)` for a tombstone, which has none).

**The prose is unreachable before placement, and that is load-bearing.** The gate is
`showsProseFor`: `type === 'description' && showYear && has_detail`, and `showYear` is false
exactly when the card is still in the player's hand (`shouldShowYearInPopup`, `Game.tsx`). This is
_why_ the prose may name years, decades and centuries freely — which is most of the point of
having it. The shard is not even fetched where the gate fails.

The Daily hero passes that gate deliberately. Its card is the first card of today's daily deck
(`useDailyPreview` in `ModeSelect.tsx`), which `useWhenGame` places on the timeline as the starting
card with its year showing on turn 1, so the read gives away nothing that tapping Play would not.
No other pre-game surface may carry the (i) button on that reasoning — it holds for the seed card
only.

> **Do not add the detail text to `CLUE_FIELDS` in `scripts/events/date-clues.js`.** That rule
> guards `description` and `friendly_name` because both are shown to a player who has not placed
> the card yet. Detail prose is not. Extending the rule there would gut the writing for no gain.
> The gate above is what makes that safe, so it is pinned by `GamePopup.test.tsx` rather than
> left to a reviewer to notice.

**The prose is a sidecar under `public/events/detail/`, fetched lazily; it is never inlined into
the event records.** It is about 1.6 MiB gzipped against a ~0.56 MiB catalogue, and
`loadAllEvents` blocks the loading screen. Inlining it would make every cold start pay ~3x for text
most players never open, and the service worker caches `/events/*.json` in a _versioned_ cache
that is wiped every release, so it would be re-downloaded after each deploy. A shard is fetched
when a popup that passes the gate opens, and never before.

**Shards mirror the manifest filenames exactly, and there is no index file.** `eventLoader`
already fetches per file, so it records `slug -> source file` in memory as it goes
(`getSourceFile`), which costs nothing in the payload. One authoring batch, one shard and one
review unit are then the same thing.

- The cost accepted: the largest shard (`exploration.json`, ~1,000 events) is about **290 KB
  gzipped** — a real first-open wait on a slow connection. After that the whole shard is warm for
  the session and the service worker has it.
- **Escape hatch if that proves too slow:** emit per-event files at build time from the same
  authored shards. `src/utils/eventDetail.ts` is the only thing that would change.
- Rejected: even hash-sharding into ~64 chunks. Fetches would be smaller and more even, but the
  shard an event lands in would be unrelated to its file, making batches and review harder to
  reason about — and it needs an index to find a slug.

**`has_detail` on the event record is how the popup knows which text to render.** It has to be
answered synchronously, before any fetch, or the card would flip from description to prose after a
delay. It is written by `detail-apply.js` in the same pass as the prose, never by hand.
`eventDetailCorpus.test.ts` pins the pairing in both directions, because either half alone is a
live defect a player meets: a flag with no prose opens nothing, prose with no flag is writing
nobody can reach.

## Guardrails

1. **Never run `scripts/events/detail-placeholder.js` against the complete corpus.** There is
   nothing to fill and nothing to revert, yet either mode rewrites every detail shard and every
   event file, so a run only risks the real prose. Any event that does lack prose gets
   `PLACEHOLDER:` lorem plus `has_detail: true`, which players would see once it reaches `main`.
   The script exists to exercise the layout at scale; both it and `--revert` preserve anything not
   flagged `placeholder: true`.

   `node scripts/events/detail-report.js` is the gate that keeps lorem from shipping: it counts a
   `placeholder: true` entry as unwritten and **exits non-zero while any manifest event lacks
   prose**. `detail-apply.js` replaces an entry wholesale, so real prose drops the flag as it
   lands. It is deliberately not part of `npm test`: a batch of new events would turn the whole
   suite red until their prose lands, which teaches everyone to ignore it.

2. **Cold start must not regress.** Detail is never fetched at start-up. If you find yourself
   wanting it in `loadAllEvents`, re-read the numbers above.
3. **Never rewrite the `name` slug** — it is the sidecar key as well as the identity used for
   dedup, collection tracking, recency and card reports (`docs/events-images/index.md`).
4. **Bulk edits go through a map-then-apply script.** Sub-agents write `slug -> {paragraphs}`
   maps into `untracked_data/event-detail/`; one deterministic `detail-apply.js` pass validates
   the whole merged map before writing anything, and refuses the whole run on one bad entry.
   Agents editing a shared shard directly corrupt it.
5. **`CI=true npm run build`**, not a plain build, and tests through `npm` only (the `TZ` pin).

## Where it lives

| Piece                                                       | File                                          |
| ----------------------------------------------------------- | --------------------------------------------- |
| Sidecar loader, per-shard cache + in-flight dedupe          | `src/utils/eventDetail.ts`                    |
| `slug -> source file`, in memory                            | `getSourceFile` in `src/utils/eventLoader.ts` |
| Fetch state, seeded from cache so re-opens don't flash      | `src/hooks/useEventDetail.ts`                 |
| The prose, and its fallback to the description              | `src/components/EventDetailText.tsx`          |
| The (i) on the Daily hero's image                           | `src/components/ImageInfoWatermark.tsx`       |
| Header, image, scroll region, dismissal, the gate           | `src/components/GamePopup.tsx`                |
| Bottom row: report on the left, ✕ on the right              | `src/components/ReportIssueButton.tsx`        |
| Shape **and voice** rules, shared by scripts and Jest       | `scripts/events/detail-spec.js`               |
| Disk access, shard read/write, slug→file                    | `scripts/events/detail-catalogue.js`          |
| Map-then-apply, writes prose **and** `has_detail`           | `scripts/events/detail-apply.js`              |
| Placeholder filler, `--revert`; both preserve written prose | `scripts/events/detail-placeholder.js`        |
| Worklist generator and progress meter, the gate             | `scripts/events/detail-report.js`             |
| The writer sub-agent for new prose                          | `.claude/agents/event-detail-writer.md`       |

All three player-facing surfaces route through `GamePopup` with `type: 'description'` — the game
board (`Game.tsx`, `showDescriptionPopup`), My Timeline (`panels/TimelinePanel.tsx`) and the Daily
hero (`panels/DailyPanel.tsx` → `ModeSelect.tsx`) — so there is one insertion point, not three, and
none of them passes an argument about which text to show. The gate decides.

## The writing decisions

The voice rules themselves are in [writing-spec.md](writing-spec.md). These are the decisions
behind them that would otherwise be re-argued.

**The band is exactly two paragraphs, 220-450 characters each, 480-830 total, target ~700.**
Derived from the 476px scroll region (about 20 lines at 402px, so ~700 characters is about half a
screen past the image) and checked against the ten hand-written calibration entries. A
three-paragraph allowance produces three-paragraph entries near the ceiling, every time. Both
totals bind, so neither a two-stub entry nor two walls of text passes.

**Difficulty is not depth, and there is no skip list.** `difficulty` grades how hard a card is to
_place_, not how much record exists, so a `very-hard` card is written at the same length as an
`easy` one. An event whose specific record is thin gets the lens widened onto what is attested, not
an exemption.

**`detail-spec.js` enforces voice, not just shape.** Second person, question marks, card-art
references, missing terminal punctuation, em and en dashes, curly quotes, the "not just X but Y"
parallelism, copula avoidance, legacy closers, vague attribution and a puffery lexicon all fail an
entry, as does a 7-word run shared with the event's own `description`. Every pattern is measured
against the catalogue's descriptions before adoption and carries its count in a comment. An
unenforced rule across hundreds of batches is a suggestion.

**`entryProblems(slug, entry, event)` takes the event as an optional third argument**, because the
restatement check needs the event's own `description`.

**The prose is researched, not recalled.** "Write only what you would stake without a link" is a
rule against fabricating, not a rule for verifying: it tells a model to trust its own confidence.
Entries written that way read perfectly and carry confident errors — one merged Broughton's
amphitheatre on Oxford Road with his separate academy on Tottenham Court Road.

**Checking against one source that happens to be open is itself a way to be confidently wrong**, in
both directions: it invents errors as well as catching them. Krakatoa's four explosions on 27
August is the standard count, where a single article consulted was the outlier; the transistor
entry's Chicago hotel and royalty-free hearing-aid licence are both attested, though one research
pass cut them for finding no source.

So the rule is draft, then check, then cut: one or two searches per event, and a claim the first
few results do not support is dropped rather than hunted down or softened. **Nothing is stored** —
no sources sidecar, no citation trail, no two-source rule, no enforcement in `detail-apply.js`. The
shard holds `{ paragraphs }` and nothing else. It is a check, not a bibliography.

**`wikipedia_url` is never passed to a writer, and must not be added.** `detail-report.js` emits
only `name`, `friendly_name`, `year`, `category`, `difficulty` and `description` into a worklist
chunk. The field is a byproduct of `scripts/difficulty/wikipedia_pageviews.py`, and it is
unreliable: `battle-megiddo` is the 1457 BCE battle and links `Battle_of_Megiddo_(1918)`. A search
finds the right article; the field hands over a wrong one with the authority of being in the data.

## Writing prose for new events

New prose runs on the `event-detail-writer` sub-agent (`.claude/agents/event-detail-writer.md`):
`model: sonnet`, `effort: low`, `skills: [write-event-detail]` so the spec is preloaded rather than
restated in every batch prompt, and a `tools` list narrow enough that it can reach the web and the
map file and nothing else.

- `node scripts/events/detail-report.js --chunks` emits 40-event worklist chunks into
  `untracked_data/event-detail/worklist/`, smallest shard first, and exits non-zero until nothing
  is left, so it is both the worklist and the progress meter.
- **Read [writing-spec.md](writing-spec.md) and the ten calibration entries first.** The gold set
  transmits tone better than the rules do; the rules are what catch it when it slips.
- **Sub-agents write map files, never the catalogue.** Each emits
  `untracked_data/event-detail/batch-NNN.json`; `detail-apply.js` validates the merged map and
  refuses the whole run on one bad entry, so a half-applied batch is unreachable.
- **Gate:** `npm run typecheck`, `CI=true npm test -- --watchAll=false`, `CI=true npm run build`,
  and `detail-report.js` exiting 0.
- **Read a random 5 per batch cold against the spec** before committing. Drift is the failure
  mode here, not corruption — the scripts already make corruption hard. Sample specifically for
  every entry pressed against the ceiling, and every hook the same kind.
- **Hook drift is a read-and-reject problem.** On a shard of people, most first sentences open on
  vital statistics ("X was born in YEAR in PLACE to FAMILY"), which is the encyclopaedia opener
  Rule 1 forbids. Where the record is thin the writer is forced to widen the lens and produces a
  real opening; where it is rich it produces a curriculum vitae. Nothing in `detail-spec.js` can
  catch this and nothing should try: a regex for "was born in" fires on good writing.
- **Check that the writer actually searched.** Count its `WebSearch` / `WebFetch` calls against
  the batch size. A writer can skip the research half of Rule 6, write from recall, clear every
  mechanical gate and still state a confident, checkable, wrongly attributed fact that one search
  would have caught. That error class is exactly what the gates are blind to.
- `npm run find-duplicates` scores on `description`, which this never touches, so no baseline is
  needed.

## Verifying it

```bash
npm run typecheck && npm run lint
CI=true npm test -- --watchAll=false
CI=true npm run build
```

`npm run typecheck` resolves a global `tsc` when `node_modules` is missing and prints only
unrelated warnings, which reads exactly like a pass; run `npm ci` first in a fresh container.

Every event has prose, so any card will do and there is no setup:

1. `BROWSER=none npm start`, then open a placed card in My Timeline or mid-game, or tap the (i)
   on the Daily hero image.
2. **Check the gate**: tap a card still in your hand — it must show the short description, and no
   prose anywhere in the DOM.
3. Widths 320 / 402 / 1440, light and dark. The card must not move or resize while the prose
   loads, **or after scrolling the prose to the end** — measure `[data-testid="modal-card"]`'s
   bounding box in each if in doubt; see the numbers above. The scroll region is
   `[data-testid="detail-scroll"]`. **Scroll it on a real iOS device**, not only in a desktop
   browser: the compositing fault this region is prone to appears on neither Chromium nor Linux
   WebKit.
4. While the prose is up, a tap on the card must not dismiss the popup, and the backdrop must.
5. `node scripts/events/detail-report.js` must report every manifest event written and **exit 0**.
   A non-zero exit means prose or a `has_detail` flag is missing.

Driving it with Playwright: `docs/driving-the-app-with-playwright.md`. Note the timeline card is
reached by its **title** — `[data-timeline-year]` is the year label beside it, and clicking that
opens nothing.

## Known, not chased

`docs/desktop-experience/index.md` D5 (the card popup overlapping the "Later ↓" label at
1440x900). The card is the same height whether it shows the description or the prose, so this
feature does not affect it. Cosmetic, open.
