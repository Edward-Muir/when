# Event detail — the long-form "read more"

**Status: Phases 1 and 2 are DONE (the mechanism and the design; the writing spec and the first
ten written entries). Phase 3, the remaining 5,450, has not started.** Nothing is in production: the branch does not merge until the corpus is
written. On the branch itself every event carries placeholder prose so the preview deploy is
testable — see Guardrail 1 for what keeps that from shipping.

- **The voice rules: [writing-spec.md](writing-spec.md)** — the hook, the band as numbers, the
  register carve-out, what may be asserted, and the banned machine tells. The working version of
  the same rules, for someone about to write a batch, is
  [.claude/skills/write-event-detail/SKILL.md](../../.claude/skills/write-event-detail/SKILL.md)
- **Current branch state and the next session's worklist: [/HANDOFF.md](../../HANDOFF.md)** —
  branch-scoped, deleted before merge
- [2026-09-12 — Designing the read-more view](session-2026-09-12-detail-view-design.md) — where the
  branch stands, the open questions Phase 2 has to settle, the corpus and payload measurements
  worth not re-deriving, and the environment traps that cost this session a cycle each

## Why this exists

Card `description` is capped at 1-2 sentences and may not state a date, because it is shown
**before** placement and would otherwise be the answer. That restraint is right for the puzzle
and leaves the player with no way to satisfy the curiosity the card just created. So: once a
card is placed — and anywhere in My Timeline — an info button turns the card over onto 2-3
paragraphs about the event.

The prose for 5,460 events is far more than one session, so the work splits three ways. Phase 1
built everything except the words, so Phases 2 and 3 are a pure content exercise.

## The decisions, and why

**There is no control. A placed card opens on the prose.** Once a card is on the timeline it has
nothing left to hide, so the popup shows the long-form read instead of the short description — no
button, no toggle, no second face. A control here would be a thing to find and explain for a
choice the player has no reason to make. Don't add one back; if the prose should not show, that is
the gate's job, below.

**The short description is the fallback, in both senses of unavailable**: an event with no prose
written (`has_detail` unset, so it is decided before render) and an event whose shard would not
load (the description plus a retry row). A card therefore always says something about its event,
and the feature works against a partly written corpus — the events that have prose show it, the
rest read exactly as they did before it existed.

**The description also shows where the prose must not**: a card still in the player's hand, and
the correct/wrong reveals, which are a beat in the game loop rather than a reading surface.

**A ✕ in the header, on the detail popup only.** The reveals keep their tap-to-advance, where a
close button would read as a decision to make.

**Everything between the header and the "Report an issue" row is one scroll region, image
included.** The header and the report row stay put; the image scrolls up and out of the way and
the prose takes the whole region — **476px, around 24 lines**. Scrolling only the text under the
fixed 384px image gives one to four lines to read ~600px of prose through; the image has to be
inside the scroller, not above it.

**The region is a constant height — the image box plus a 92px strip of text — so every detail card
is the same size**: 340x606 at 402px wide, 400x606 at 1440px, and identical before and after the
shard loads and after scrolling to the end. A constant works precisely because the region only ever
holds prose, which always overflows it — there is no text for a measured height to fit.

**Tapping the card stops dismissing the popup while the prose is up.** `Modal`'s `tap-advance` mode
would turn every scroll drag into a dismissal, so `GamePopup` uses `backdrop` there; the backdrop,
ESC and the ✕ all still work. The reveals and a hand card, with nothing to scroll, keep
`tap-advance`. This is the same failure the leaderboard had to work around when a row tap closed
the board.

> **The scroll region carries `overflow` and nothing else — no mask, no filter, no `backdrop-*`,
> no `transform`.** Anything that promotes it to its own compositing layer breaks it on iOS
> Safari: a `mask-image` there left the image painting at its unscrolled position while the text
> moved over it. That reproduces on neither desktop Chromium nor Linux WebKit, so **this region
> cannot be checked locally — scroll it on a device.** Decoration goes on a sibling drawn over the
> region, which is what the fade is: a `pointer-events-none` gradient coloured inline from
> `event.color` (or `var(--color-surface)` for a tombstone, which has none).

**The prose is unreachable before placement, and that is load-bearing.** The gate is
`showsProseFor`: `type === 'description' && showYear && has_detail`, and `showYear` is already
false exactly when the card is still in the player's hand (`shouldShowYearInPopup`, `Game.tsx`).
This is _why_ the prose may name years, decades and centuries freely — which is most of the point
of having it. The shard is not even fetched where the gate fails.

The Daily hero passes that gate deliberately. `getDailyPreviewEvent` is `buildDailyDeck(...)[0]`,
which `useWhenGame` places on the timeline as the starting card with its year showing on turn 1,
so the read gives away nothing that tapping Play would not. No other pre-game surface may carry
the button on that reasoning — it holds for the seed card only.

> **Do not add the detail text to `CLUE_FIELDS` in `scripts/events/date-clues.js`.** That rule
> guards `description` and `friendly_name` because both are shown to a player who has not placed
> the card yet. Detail prose is not. Extending the rule there would gut the writing for no gain.
> The gate above is what makes that safe, so it is pinned by `GamePopup.test.tsx` rather than
> left to a reviewer to notice.

**The prose is a sidecar, fetched lazily; it is not in the event records.** At full corpus it is
roughly 2.4 MiB gzipped against a 0.49 MiB catalogue, and `loadAllEvents` blocks the loading
screen. Inlining it would make every cold start pay ~5x for text most players never open, and
the service worker caches `/events/*.json` in a _versioned_ cache that is wiped every release,
so it would be re-downloaded after each deploy. A shard is fetched on the info-button tap and
never before — not even on popup-open, which would spend a shard on anyone who merely glances.

**Shards mirror the 19 manifest filenames exactly, and there is no index file.** `eventLoader`
already fetches per file, so it records `slug -> source file` in memory as it goes
(`getSourceFile`), which costs nothing in the payload. One authoring batch, one shard and one
review unit are then the same thing.

- The cost accepted: the largest shard (`exploration.json`, 1,040 events) will land around
  **375 KB gzipped** once written — a real first-tap wait on a slow connection. After that the
  whole shard is warm for the session and the service worker has it.
- **Escape hatch if that proves too slow:** emit per-event files at build time from the same
  authored shards. `src/utils/eventDetail.ts` is the only thing that would change.
- Rejected: even hash-sharding into ~64 chunks. Fetches would be smaller and more even, but the
  shard an event lands in would be unrelated to its file, making Phase 3 batches and review
  harder to reason about — and it needs an index to find a slug.

**`has_detail` on the event record is how the popup knows which text to render.** It has to be
answered synchronously, before any fetch, or the card would flip from description to prose after a
delay. It is written by
`detail-apply.js` in the same pass as the prose, never by hand. `eventDetailCorpus.test.ts`
pins the pairing in both directions, because either half alone is a live defect a player meets:
a flag with no prose is a button that opens nothing, prose with no flag is writing nobody can
reach.

## Guardrails

1. **No lorem reaches production — but it does live on the branch.**
   `scripts/events/detail-placeholder.js` fills all 5,460 events, and **its output is committed**.
   It has to be: `has_detail` is what makes the info button render, so without it the branch's own
   preview deploy shows nothing at all and is useless for looking at the thing it exists to show.
   An earlier revert-before-commit rule traded that away for a protection the branch does not
   need. Three things keep it safe instead:
   - the branch never merges until the corpus is written, so it cannot reach players;
   - every placeholder entry carries `placeholder: true`, and
     `node scripts/events/detail-report.js` counts those as still to do and **exits non-zero**
     while any remain. **Do not merge while that script exits non-zero.** It is deliberately not
     part of `npm test`, which would otherwise be red for the whole of Phase 3;
   - every placeholder entry's first paragraph literally begins `PLACEHOLDER: `, so it cannot be
     mistaken for real prose in a review. (It used to be `PLACEHOLDER —`; the em dash became a
     banned character in Phase 2 and a marker that fails the spec it sits inside is a confusing
     signal.)

   `detail-apply.js` replaces an entry wholesale, so real prose drops the flag and starts counting
   automatically — the corpus converges on written as Phase 3 lands, with no cleanup step.

2. **Cold start must not regress.** Detail is never fetched at start-up. If you find yourself
   wanting it in `loadAllEvents`, re-read the numbers above.
3. **Never rewrite the `name` slug** — it is the sidecar key as well as the identity used for
   dedup, collection tracking, recency and card reports (`docs/events-images/index.md`).
4. **Bulk edits go through a map-then-apply script.** Sub-agents write `slug -> {paragraphs}`
   maps into `untracked_data/event-detail/`; one deterministic `detail-apply.js` pass validates
   the whole merged map before writing anything. Agents editing a shared 600 KB array directly
   corrupt it — this repo has already paid for that lesson once.
5. **`CI=true npm run build`**, not a plain build, and tests through `npm` only (the `TZ` pin).

## What Phase 1 shipped

| Piece                                                         | File                                          |
| ------------------------------------------------------------- | --------------------------------------------- |
| Sidecar loader, per-shard cache + in-flight dedupe            | `src/utils/eventDetail.ts`                    |
| `slug -> source file`, in memory                              | `getSourceFile` in `src/utils/eventLoader.ts` |
| Fetch-on-tap state, seeded from cache so re-flips don't flash | `src/hooks/useEventDetail.ts`                 |
| The prose, and its fallback to the description                | `src/components/EventDetailText.tsx`          |
| The (i) on the Daily hero's image                             | `src/components/ImageInfoWatermark.tsx`       |
| Header, ✕, image, scroll region, dismissal, the gate          | `src/components/GamePopup.tsx`                |
| Shape **and voice** rules, shared by scripts and Jest         | `scripts/events/detail-spec.js`               |
| Disk access, shard read/write, slug→file                      | `scripts/events/detail-catalogue.js`          |
| Map-then-apply, writes prose **and** `has_detail`             | `scripts/events/detail-apply.js`              |
| Placeholder filler, `--revert`; both preserve written prose   | `scripts/events/detail-placeholder.js`        |
| Worklist generator and progress meter                         | `scripts/events/detail-report.js`             |

All three player-facing surfaces route through `GamePopup` with `type: 'description'` — the game
board (`Game.tsx`, `showDescriptionPopup`), My Timeline (`panels/TimelinePanel.tsx`) and the Daily
hero (`panels/DailyPanel.tsx` → `ModeSelect.tsx`) — so there is one insertion point, not three, and
none of them passes an argument about which text to show. The gate decides.

## Phase 2 — the writing spec (done)

Phase 1 fixed the shape; Phase 2 fixed the voice. It produced
[writing-spec.md](writing-spec.md), `.claude/skills/write-event-detail/SKILL.md`, a tightened
`detail-spec.js`, and the corpus's first ten written entries. What it settled, and would otherwise
be re-argued:

**The band is exactly two paragraphs, 220-450 characters each, 480-830 total, target ~700.**
Derived from the 476px scroll region (about 20 lines at 402px, so ~700 characters is about half a
screen past the image) and checked against the ten hand-written entries, which run 647-746. The old
200-900/2,200 placeholders are gone.

It was set once at 2-3 paragraphs and up to 1,250 before being cut to this. The reason is the
finding that a three-paragraph allowance does not produce occasional three-paragraph entries, it
produces three-paragraph entries: all ten calibration entries and all four sub-agent entries came
back at three, near the top of the band. Both totals bind, so neither a two-stub entry nor two
walls of text passes, and the atrocity entry lost a paragraph rather than its attribution twice
over.

**Difficulty is not depth, and there is no skip list.** `difficulty` grades how hard a card is to
_place_, not how much record exists, so a `very-hard` card is written at the same length as an
`easy` one. An event whose specific record is thin gets the lens widened onto what is attested, not
an exemption. `detail-report.js` still demands 5,460 of 5,460 and is still the merge gate.

**`detail-spec.js` now enforces voice, not just shape.** Second person, question marks, card-art
references, missing terminal punctuation, em and en dashes, curly quotes, the "not just X but Y"
parallelism, copula avoidance, legacy closers, vague attribution and a puffery lexicon all fail an
entry, as does a 7-word run shared with the event's own `description`. Every pattern was measured
against all 5,460 existing descriptions before adoption and carries its count in a comment; 20 of
37 have zero precedent in the catalogue. An unenforced rule across 137 batches is a suggestion.

**`entryProblems(slug, entry)` takes an optional third argument, `event`**, because the restatement
check needs the event's own `description`. Both callers already had the records to hand.

**The placeholder filler no longer eats written prose.** It used to overwrite every entry
unconditionally, and `--revert` deleted whole shards and stripped every `has_detail` — which this
document recommends doing before syncing with `origin/main`. Until Phase 2 there was no written
prose to lose. Both paths now preserve anything not flagged `placeholder: true`.

## Phase 3 — writing 5,460 entries

- **One shard per batch, smallest first** (`candidates` 53 → `migration` 54 → … →
  `exploration` 1,040), so the pipeline is proven on cheap files before the expensive ones.
  `node scripts/events/detail-report.js --chunks` emits 40-event worklist chunks and exits
  non-zero until nothing is left, so it is both the worklist and the progress meter.
- **Read [writing-spec.md](writing-spec.md) and the ten calibration entries first.** The gold set
  transmits tone better than the rules do; the rules are what catch it when it slips.
- **Sonnet sub-agents write map files, never the catalogue.** Each emits
  `untracked_data/event-detail/batch-NNN.json`; `detail-apply.js` validates the merged map and
  refuses the whole run on one bad entry, so a half-applied batch is unreachable.
- **Per-batch gate:** `npm run typecheck`, `CI=true npm test -- --watchAll=false`, and
  `CI=true npm run build`.
- **Read a random 5 per batch cold against the spec** before committing. Drift is the failure
  mode here, not corruption — the scripts already make corruption hard. Sample specifically for
  the two things calibration showed converge: every entry pressed against the ceiling, and every
  hook the same kind.
- **A half-written state is impossible, but it is not being shipped either.** `has_detail` is
  per-event and written in the same pass as the prose, so a partly-written corpus renders exactly
  the buttons it has prose for and no others — merging mid-run would be safe. The decision
  (2026-09-12) is nonetheless to **hold everything back until the corpus is complete**: no PR, and
  nothing reaches production until every event is written. Phase 2 and every Phase 3 batch
  therefore land on the one long-lived branch, which needs syncing with `origin/main`
  periodically rather than being left to drift. Rebase or merge both work — it is a solo,
  unmerged branch with no PR against it, so rewriting its history costs nothing (rebased onto
  v1.22.0 on 2026-09-16, five commits, no conflicts). The caveat that does the real work is
  about the data, not the strategy: see Guardrail 1.
- `npm run find-duplicates` scores on `description`, which this never touches, so no baseline
  dance is needed (unlike the 2026-08 date-clue pass).

## Verifying it

```bash
npm run typecheck && npm run lint
CI=true npm test -- --watchAll=false
CI=true npm run build
```

The placeholder corpus is already committed, so the design can be looked at on the branch's
preview deploy or locally with no setup. Regenerate with
`node scripts/events/detail-placeholder.js` if you have reverted it:

1. `BROWSER=none npm start`, then open a placed card in My Timeline or mid-game, or tap the (i)
   on the Daily hero image.
2. **Check the gate**: tap a card still in your hand — it must show the short description, and no
   prose anywhere in the DOM.
3. Widths 320 / 402 / 1440, light and dark. Two- and three-paragraph entries both occur. The card
   must not move or resize between the two states, **or after scrolling the prose to the end** —
   measure `[data-testid="modal-card"]`'s bounding box in each if in doubt; see the numbers above.
   The scroll region is `[data-testid="detail-scroll"]`.
   **Scroll it on a real iOS device**, not only in a desktop browser: the compositing fault this
   region has already hit once appears on neither Chromium nor Linux WebKit.
4. While the prose is up, a tap on the card must not dismiss the popup, and the backdrop must.
5. `node scripts/events/detail-report.js` must still exit non-zero — that is the merge gate.

Driving it with Playwright: `docs/driving-the-app-with-playwright.md`. Note the timeline card is
reached by its **title** — `[data-timeline-year]` is the year label beside it, and clicking that
opens nothing.

## Known, not chased

`docs/desktop-experience/index.md` D5 (the card popup overlapping the "Later ↓" label at
1440x900). The card is now the same height in both states, so this is exactly as it was before
the feature. Still cosmetic, still open.
