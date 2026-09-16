# Handoff — event detail

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Branch     | `claude/event-detail-read-more-polish-1i4ai5`, HEAD `1cae7f8`        |
| PR         | none, deliberately                                                   |
| Production | nothing — see **The release option** below, which is a live decision |

**Phase 1 — the mechanism and the UI — is done. Phase 2 is the writing spec**, and is what the
next session picks up.

**Branch off _this_ branch, never off main** — the feature does not exist on main.

## What exists

A placed card's detail popup shows 2-3 paragraphs about the event in place of its short
description — no control, no toggle. Everything between the title and the "Report an issue" row is
one scroll region, image included, at a constant height, so every detail card is the same size.
A ✕ in the header closes it. The description is what shows wherever the prose is unavailable: a
card still in hand (the spoiler gate), an event with no prose written, a shard that would not load,
and the correct/wrong reveals. The Daily hero carries a watermarked (i) on its image that opens the
same popup; its event is the deck's starting card, placed face-up with its year on turn 1, so the
read gives nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`,
sharded to mirror the 19 manifest files; it is never inlined into the event JSON.

All 5,460 events currently carry **committed placeholder prose**, so the branch's preview deploy
is testable. Every placeholder entry is flagged `placeholder: true` and opens `PLACEHOLDER —`.

The decisions behind all of that are in
**[docs/event-detail/index.md](docs/event-detail/index.md)**. Read it before changing anything
structural. The corpus measurements and the open questions Phase 2 has to settle are in
[docs/event-detail/session-2026-09-12-detail-view-design.md](docs/event-detail/session-2026-09-12-detail-view-design.md).

## Seeing it in 60 seconds

```bash
npm ci                 # deps are not pre-populated; without this `npm run typecheck`
                       # silently resolves a global tsc and looks like it passed
BROWSER=none npm start
```

Fastest: tap the **(i)** watermarked into the Daily hero image on `/`. Otherwise open `/timeline`
and tap a placed card, or play a game from the Custom tab and tap a card once it is on the
timeline — the prose is what the card opens on.

Driving it with Playwright: [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md).
Three things worth knowing here:

- Reach a timeline card by its **title** (`getByRole('button', { name: /<friendly_name>/i })`).
  `[data-timeline-year]` is the year label _beside_ the card; clicking it opens nothing, which
  reads as a broken feature rather than a bad selector.
- The scroll region is `[data-testid="detail-scroll"]`, and the card is `[data-testid="modal-card"]`.
- **WebKit can be installed** in a fresh container, which the Playwright doc does not mention:
  `PLAYWRIGHT_BROWSERS_PATH=<dir> npx playwright install webkit`, then
  `npx playwright install-deps webkit` (needs root, takes a few minutes). Useful for engine
  differences in general — and useless for the one below: Linux WebKit renders both the broken and
  the fixed version of the scroll region correctly.

## Don't break these

- **The prose must stay unreachable before a card is placed.** The gate is `showsProseFor`:
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **Wherever the prose is unavailable, the description shows** — no prose written, or a shard that
  would not load. A card is never contentless, and that is what lets this ship against a partly
  written corpus.
- **Bulk edits go through `scripts/events/detail-apply.js` from a map file, never by editing a
  shard directly.** Sub-agents write `slug -> {paragraphs}` maps into
  `untracked_data/event-detail/`; one deterministic apply pass validates the whole merged map
  before writing anything, and refuses the run on a single bad entry. Agents editing a shared
  600 KB array corrupt it — this repo has already paid for that lesson once.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** It is
  deliberately not part of `npm test`, which would otherwise be red for the whole writing phase.
- **The length band in `scripts/events/detail-spec.js` is deliberately wide** (2-3 paragraphs,
  200-900 chars each, 2,200 total) so Phase 1 could not reject good writing sight-unseen. Tightening
  it is Phase 2's job; `src/utils/eventDetailCorpus.test.ts` enforces whatever ends up in it.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
- **The detail scroll region carries `overflow` and nothing else.** No mask, no filter, no
  `backdrop-*`, no `transform` — anything that promotes it to its own compositing layer has already
  broken it on iOS while looking perfect on every browser available here. Decoration goes on a
  sibling drawn over it. **Scroll it on a device before believing it.**
- **No `bg-*/NN` opacity modifiers on the CSS-variable colour tokens** — Tailwind drops the whole
  rule and the element gets no colour at all. Use `opacity-60`. (`CLAUDE.md` → Styling.)
- **`CI=true npm run build`**, not a plain build, and run tests through `npm` only (the `TZ` pin).

## Phase 2 — what the next session does

Phase 1 fixed the shape; Phase 2 fixes the voice. Two deliverables, both specified in
[docs/event-detail/index.md](docs/event-detail/index.md):

- **`docs/event-detail/writing-spec.md`** — the hook, the length band as numbers, register,
  its relationship to the existing `description`, what may be asserted, the hard bans, and an
  explicit note that dates are allowed and wanted here.
- **`.claude/skills/write-event-detail/SKILL.md`**, modelled on `.claude/skills/add-events/SKILL.md`
  (291 lines, the house pattern): rule, _why_ it exists in game terms, the file that enforces it,
  a right-vs-wrong example, and a "Common mistakes" list tied to the failing test.

The eight open questions it has to settle — the hook and the template problem at 5,460 scale, the
register carve-out for atrocities and deaths, the `wikipedia_url` accuracy trap (1,830 events carry
one, undeclared, and at least one points at the wrong event), the events with little to say — are
in [session-2026-09-12-detail-view-design.md](docs/event-detail/session-2026-09-12-detail-view-design.md).
They are starting positions to argue with, not conclusions.

Calibrate by hand-writing ~10 entries across era and difficulty, then reading them cold against the
spec. **Do not start Phase 3** (the other 5,450) in the same session — drift, not corruption, is
the failure mode there, and it needs a spec that has been read cold first.

## The release option

The description fallback changed what is possible here, and this is the only place it is written
down. **A partly written corpus is now safe to ship**: events with prose show it, events without
read exactly as they did before this feature existed. The "hold everything until all 5,460 are
written" decision from 2026-09-12 is therefore a choice now, not a constraint.

What blocks doing it today is the committed placeholder — every event carries `PLACEHOLDER —`
text, so shipping as-is puts lorem in front of every player. Releasing early means first running
`node scripts/events/detail-placeholder.js --revert`, after which only genuinely written events
carry `has_detail` and `detail-report.js` stops being a merge gate and becomes a progress meter.

The cost, and the reason this is the maintainer's call rather than a step in a plan: reverting the
placeholder makes the branch's preview deploy show no prose at all, which is exactly the state that
made a previous session commit the placeholder in the first place.

## Numbers to check against

Every detail card is **340x606** at 402px, **272x628** at 320px (the title wraps to two lines) and
**400x606** at 1440px — identical before and after the shard loads and after scrolling to the end.
The scroll region is **476px** holding 739-1183px of placeholder prose. 5,460 events, all carrying
placeholder. Full suite is **757 tests across 64 suites**.

Corpus numbers worth not re-deriving (catalogue size, gzip ratios, shard sizes, where Phase 3
should start) are in the session notes, not here.

## Kick-off prompt for the next session

> Start Phase 2 of the event-detail work on the `when` repo: **the writing spec**.
>
> Branch off `claude/event-detail-read-more-polish-1i4ai5` — **not** main, the feature only exists
> on that branch.
>
> Read `HANDOFF.md` at the repo root first, then `docs/event-detail/index.md` for the decisions
> behind the design. Run `npm ci` before trusting any check — without it `npm run typecheck`
> resolves a global `tsc` and prints something that looks exactly like a pass.
>
> **The UI is done and out of scope.** This session produces two things:
> `docs/event-detail/writing-spec.md`, and `.claude/skills/write-event-detail/SKILL.md` modelled on
> `.claude/skills/add-events/SKILL.md`. Both are specified in `docs/event-detail/index.md`; the
> open questions they have to settle — the hook and the template problem at 5,460 scale, the
> register carve-out for atrocities, the `wikipedia_url` accuracy trap, what to do with events that
> have little to say — are in `docs/event-detail/session-2026-09-12-detail-view-design.md`. Treat
> those as starting positions to argue with.
>
> Settle the length band as real numbers and tighten `scripts/events/detail-spec.js` to match;
> `src/utils/eventDetailCorpus.test.ts` enforces whatever is in that file.
>
> Every entry in the corpus today is committed placeholder text. Calibrate the spec by
> hand-writing ~10 entries across era and difficulty and reading them cold against it — then stop.
> **Do not start Phase 3.**
