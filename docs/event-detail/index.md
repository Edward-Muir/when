# Event detail — the long-form "read more"

**Status: Phase 1 is DONE (the mechanism and the design). Phases 2 and 3 are the plan below
and have not started.** Nothing is enabled in production yet: no event carries `has_detail`, so
no info button renders anywhere. That is deliberate — see Guardrail 1.

## Why this exists

Card `description` is capped at 1-2 sentences and may not state a date, because it is shown
**before** placement and would otherwise be the answer. That restraint is right for the puzzle
and leaves the player with no way to satisfy the curiosity the card just created. So: once a
card is placed — and anywhere in My Timeline — an info button turns the card over onto 2-3
paragraphs about the event.

The prose for 5,460 events is far more than one session, so the work splits three ways. Phase 1
built everything except the words, so Phases 2 and 3 are a pure content exercise.

## The decisions, and why

**The button lives in the detail popup only, top-right.** Not on the timeline cards: they are
240x80px, already tappable as a single `<button>`, and a nested control would have been invalid
HTML as well as visual noise on every row.

**The card turns over; it does not open a second overlay.** One modal, a back face, a back arrow
home. A second overlay would be a second thing to dismiss for what is still one card.

**The turn is a crossfade plus an 8px slide, not a 3D flip.** A real `rotateY` was tried first
and rejected: both faces have to share a height for the rotation to read, and these two differ
by the whole 384px image box, so the card visibly jumped mid-rotation. The slide keeps the
metaphor without constraining the height. Under Reduce Motion it degrades to a plain crossfade.

**The reading face has no image.** The header still carries the title and year, and the front
face's image box is most of a phone screen. The point of this face is reading room.

**The card does not change size when it is turned over.** The reading face is pinned to the
height the card face measured (`usePinnedFaceHeight`), and the prose scrolls inside it — so the
card holds its exact position and dimensions across turn, scroll and turn back. Measuring rather
than pinning to a constant matters because the card face's height is content-driven: a fixed
384px image plus a description of anywhere from 32 to 169 characters, so any constant would leave
dead space under the short ones. Measuring is safe because the card face is always shown first —
the face resets whenever the event changes — so a height is always recorded before the info
button can be tapped, and the image box is a fixed height so a late-decoding image cannot move it.
A consequence worth knowing: `Modal` is given no `scroll` prop on either face, because the shell
is now identical on both and the scroll region lives inside the reading face.

**The button is unreachable before placement, and that is load-bearing.** The gate is
`type === 'description' && showYear && has_detail`, and `showYear` is already false exactly when
the card is still in the player's hand (`shouldShowYearInPopup`, `Game.tsx`). This is _why_ the
long-form prose may name years, decades and centuries freely — which is most of the point of
having it.

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

1. **No lorem reaches production.** `scripts/events/detail-placeholder.js` fills all 5,460 events
   so the design can be judged on real layout, but it is a **local tool**: because it sets
   `has_detail`, a committed run would ship placeholder text to players. Run it, look, then
   `--revert` and confirm `git status public/events/` is clean before committing. Phase 1's
   committed diff changes nothing a player sees.
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
| The reading face and the two header controls                  | `src/components/EventDetailFace.tsx`          |
| Header row, face state, the gate                              | `src/components/GamePopup.tsx`                |
| Shape rules, shared by scripts and Jest                       | `scripts/events/detail-spec.js`               |
| Disk access, shard read/write, slug→file                      | `scripts/events/detail-catalogue.js`          |
| Map-then-apply, writes prose **and** `has_detail`             | `scripts/events/detail-apply.js`              |
| Local placeholder filler, `--revert`                          | `scripts/events/detail-placeholder.js`        |
| Worklist generator and progress meter                         | `scripts/events/detail-report.js`             |

Both player-facing surfaces route through `GamePopup` with `type: 'description'` — the game board
(`Game.tsx`, `showDescriptionPopup`) and My Timeline (`panels/TimelinePanel.tsx`) — so there was
one insertion point, not two.

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
- **Ships progressively.** `has_detail` is per-event, so each merged batch lights up its own
  info buttons and nothing else. There is no big-bang launch and no half-written state visible
  to players.
- `npm run find-duplicates` scores on `description`, which this never touches, so no baseline
  dance is needed (unlike the 2026-08 date-clue pass).

## Verifying it

```bash
npm run typecheck && npm run lint
CI=true npm test -- --watchAll=false
CI=true npm run build
```

The design itself has to be looked at, and that needs the placeholder:

1. `node scripts/events/detail-placeholder.js`
2. `BROWSER=none npm start`, then open a placed card in My Timeline or mid-game.
3. **Check the gate**: tap a card still in your hand — there must be no info button.
4. Widths 320 / 402 / 1440, light and dark, Reduce Motion on. Two- and three-paragraph entries
   both occur. The card must not move or resize between the two faces — measure
   `[data-testid="modal-card"]`'s bounding box on each face if in doubt; it was 340x606 at 402px
   wide on both when this shipped.
5. `node scripts/events/detail-placeholder.js --revert`, then confirm `git status public/events/`
   is clean.

Driving it with Playwright: `docs/driving-the-app-with-playwright.md`. Note the timeline card is
reached by its **title** — `[data-timeline-year]` is the year label beside it, and clicking that
opens nothing.

## Known, not chased

`docs/desktop-experience/index.md` D5 (the card popup overlapping the "Later ↓" label at
1440x900) is marginally worse with a tall reading face. Still cosmetic, still open.
