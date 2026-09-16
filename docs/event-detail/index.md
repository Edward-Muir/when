# Event detail — the long-form "read more"

**Status: Phase 1 is DONE (the mechanism and the design). Phases 2 and 3 are the plan below
and have not started.** Nothing is in production: the branch does not merge until the corpus is
written. On the branch itself every event carries placeholder prose so the preview deploy is
testable — see Guardrail 1 for what keeps that from shipping.

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

**The button sits in the popup's header, right of the title**, and not on the timeline cards.
Those are 240x80px and already tappable as a single `<button>`, so a nested control would have been
invalid HTML as well as visual noise on every row.

It is flat and tinted with the card's own text colour — a watermark on the card rather than a
control stuck to it. Over the image it was a frosted disc, for contrast against arbitrary art, and
that is exactly what made it read as a button bolted on to the picture.

The Daily hero has no header to put it in, so there it is watermarked into the image's corner:
flat white with a drop shadow, no disc and no ring (`ImageInfoWatermark`, beside
`EventInfoButton` in the same file so the two share a name and their `stopPropagation`).

**The prose replaces the description in place; there is no second face and no second overlay.**
One box, one text, and the same button toggles back. A back arrow, a face swap and a transition
are three pieces of interface for what is still one card. The button's label cannot change with
its direction without breaking every query that finds it, so it carries `aria-expanded` instead.

**Everything between the header and the "Report an issue" row is one scroll region, image
included.** The header and the report row stay put; the image scrolls up and out of the way and
the prose takes the whole region — **476px at 402px wide, around 24 lines**. Scrolling the prose
alone was tried first and is the reason this exists: the text box is only as tall as the short
description, which is 1 to 4 lines, so ~600px of prose crawled through a 70-115px window under a
fixed 384px image that was doing nothing.

**The card does not change size when the text swaps.** The region is pinned to what it occupied
with the description in it — the image box plus the height that description measured
(`usePinnedFaceHeight` plus `IMAGE_CONTAINER_HEIGHT`) — so the card holds its exact position and
dimensions across the swap, the scroll to the end, and the swap back: 340x606 at 402px, 272x651 at
320px, 400x606 at 1440px, identical in both states. Measuring rather than pinning to a constant
matters because that height is content-driven: descriptions run from 32 to 169 characters, so any
constant would leave dead space under the short ones. Collapsed, the region carries no height and
no overflow at all, so it is naturally that same size and cannot scroll.

> **The measuring ref goes on the description, never on the scroll region.** A height taken from
> the prose is the whole text at full unclipped height, and pinning to that grows the card on
> every open — 606px → 724px at phone width on the first cycle, further on each one, eventually
> off the screen. The description unmounts while the prose is up, so the hook's layout effect
> finds no node and a fresh measurement is taken when it comes back; the region survives the swap
> and would be measured while pinned and while the event changes underneath it.
> `usePinnedFaceHeight` refuses to measure anything handed to it while pinned, and
> `usePinnedFaceHeight.test.ts` fails if that guard is removed.

**A surface that opens on the prose still renders the description first, for one commit.** The
pin has nothing to pin to otherwise, and the prose renders at full height — a card twice the
height of the phone. `GamePopup` therefore resets to the description in a _layout_ effect and
applies `openExpanded` from the same effect, so the swap lands before paint and is invisible.
That surface also shows no info button: it was asked for the read, so there is nothing to toggle
to.

**Tapping the card stops dismissing the popup while the prose is up.** `Modal`'s `tap-advance`
mode would turn every scroll drag into a dismissal, so `GamePopup` switches to `backdrop` for as
long as the prose is showing; the backdrop and ESC still work, and it switches back on collapse.
This is the same failure the leaderboard had to work around when a row tap closed the board.

**The clipped line fades rather than cutting.** `.fade-scroll-y` is a `mask-image`, not a gradient
overlay, because the region sits on a per-event inline background colour that no stylesheet can
know. It is applied only while the prose is up — collapsed there is nothing below to signal and
the mask would just dim the last line of the description.

**The button is unreachable before placement, and that is load-bearing.** The gate is
`type === 'description' && showYear && has_detail`, and `showYear` is already false exactly when
the card is still in the player's hand (`shouldShowYearInPopup`, `Game.tsx`). This is _why_ the
long-form prose may name years, decades and centuries freely — which is most of the point of
having it.

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

**`has_detail` on the event record is how the button knows.** It has to be answered
synchronously, before any fetch, or the button pops in after a delay. It is written by
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
   - every placeholder entry's first paragraph literally begins `PLACEHOLDER —`, so it cannot be
     mistaken for real prose in a review.

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
| The prose itself                                              | `src/components/EventDetailText.tsx`          |
| The header control and the image watermark                    | `src/components/EventInfoButton.tsx`          |
| Pins the scroll region to the description's height            | `src/hooks/usePinnedFaceHeight.ts`            |
| Header, image, scroll region, expand state, dismissal, gate   | `src/components/GamePopup.tsx`                |
| Shape rules, shared by scripts and Jest                       | `scripts/events/detail-spec.js`               |
| Disk access, shard read/write, slug→file                      | `scripts/events/detail-catalogue.js`          |
| Map-then-apply, writes prose **and** `has_detail`             | `scripts/events/detail-apply.js`              |
| Local placeholder filler, `--revert`                          | `scripts/events/detail-placeholder.js`        |
| Worklist generator and progress meter                         | `scripts/events/detail-report.js`             |

All three player-facing surfaces route through `GamePopup` with `type: 'description'` — the game
board (`Game.tsx`, `showDescriptionPopup`), My Timeline (`panels/TimelinePanel.tsx`) and the Daily
hero (`panels/DailyPanel.tsx` → `ModeSelect.tsx`, which passes `openExpanded`) — so there is one
insertion point, not three.

## Phase 2 — the writing spec (next)

Phase 1 fixed the shape; Phase 2 fixes the voice. Deliverables:

- **`docs/event-detail/writing-spec.md`**, settling:
  - **The hook.** Every entry opens with something the player did not know and would not guess.
    This is the thing most likely to come out bland at 5,460 scale, so it needs worked
    right-vs-wrong examples, not an adjective.
  - Length band per paragraph and overall, as numbers, then tightened in `detail-spec.js` so the
    corpus test enforces them.
  - Register: how far from encyclopaedic toward conversational, and where that breaks down —
    atrocities, deaths, contested history.
  - Its relationship to the existing `description`: paragraph one must not restate it.
  - What a writer may assert and what must be hedged or omitted.
  - Hard bans (second person, "Did you know", rhetorical questions).
  - An explicit note that **dates are allowed and wanted here**, with the reason, or every writer
    will assume the `description` rule applies.
- **`.claude/skills/write-event-detail/SKILL.md`**, modelled on `add-events/SKILL.md`: for each
  rule give the rule, _why_ it exists in game terms, the file that enforces it, and a
  right-vs-wrong example — closing with a scannable "Common mistakes" list tied to the failing test.
- Calibrate by hand-writing ~10 entries across difficulty and era, then reading them cold.

## Phase 3 — writing 5,460 entries

- **One shard per batch, smallest first** (`candidates` 53 → `migration` 54 → … →
  `exploration` 1,040), so the pipeline is proven on cheap files before the expensive ones.
  `node scripts/events/detail-report.js --chunks` emits 40-event worklist chunks and exits
  non-zero until nothing is left, so it is both the worklist and the progress meter.
- **Sonnet sub-agents write map files, never the catalogue.** Each emits
  `untracked_data/event-detail/batch-NNN.json`; `detail-apply.js` validates the merged map and
  refuses the whole run on one bad entry, so a half-applied batch is unreachable.
- **Per-batch gate:** `npm run typecheck`, `CI=true npm test -- --watchAll=false`, and
  `CI=true npm run build`.
- **Read a random 5 per batch cold against the spec** before committing. Drift is the failure
  mode here, not corruption — the scripts already make corruption hard.
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
2. **Check the gate**: tap a card still in your hand — there must be no info button.
3. Widths 320 / 402 / 1440, light and dark. Two- and three-paragraph entries both occur. The card
   must not move or resize between the two states, **or after scrolling the prose to the end** —
   measure `[data-testid="modal-card"]`'s bounding box in each if in doubt; see the numbers above.
4. While the prose is up, a tap on the card must not dismiss the popup, and the backdrop must.
5. `node scripts/events/detail-report.js` must still exit non-zero — that is the merge gate.

Driving it with Playwright: `docs/driving-the-app-with-playwright.md`. Note the timeline card is
reached by its **title** — `[data-timeline-year]` is the year label beside it, and clicking that
opens nothing.

## Known, not chased

`docs/desktop-experience/index.md` D5 (the card popup overlapping the "Later ↓" label at
1440x900). The card is now the same height in both states, so this is exactly as it was before
the feature. Still cosmetic, still open.
