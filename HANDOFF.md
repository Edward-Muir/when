# Handoff — event detail "read more"

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Branch     | `claude/event-detail-read-more-polish-1i4ai5`, on top of `e2669f1`   |
| PR         | none, deliberately                                                   |
| Production | nothing. The branch does not merge until the prose corpus is written |

**Branch off _this_ branch, never off main** — the feature does not exist on main.

## What exists

A placed card's detail popup shows 2-3 paragraphs about the event in place of its short
description — no control, no toggle. Everything between the title and the "Report an issue" row is
one scroll region, image included, at a constant height, so every detail card is the same size.
A ✕ in the header closes it. The description is what shows wherever the prose is unavailable: a
card still in hand (the spoiler gate), an event with no prose written, a shard that would not load,
and the correct/wrong reveals. The Daily hero carries a watermarked (i) on its image that opens the
same popup; its event is the deck's starting card, placed face-up with its year on turn 1, so the
read gives nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`, sharded to
mirror the 19 manifest files; it is never inlined into the event JSON.

All 5,460 events currently carry **committed placeholder prose**, so the branch's preview deploy
is testable. Every placeholder entry is flagged `placeholder: true` and opens `PLACEHOLDER —`.

The decisions behind all of that, and why each alternative was rejected, are in
**[docs/event-detail/index.md](docs/event-detail/index.md)**. Read that before changing anything
structural. The background, the corpus measurements and the open questions for the (later) prose
phase are in
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
Two gotchas that cost a cycle each — reach a timeline card by its **title**
(`getByRole('button', { name: /<friendly_name>/i })`, since `[data-timeline-year]` is the year
label _beside_ the card and clicking it opens nothing), and scope the info button to
`[data-testid="modal-card"]` once a popup is open, or the query also matches the hero's button
behind the backdrop.

## Don't break these

- **The prose must stay unreachable before a card is placed.** The gate is `showsProseFor`:
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **Wherever the prose is unavailable, the description shows** — no prose written, or a shard that
  would not load. A card is never contentless, and that is what lets this ship against a partly
  written corpus.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** That is
  the merge gate. It is deliberately not part of `npm test`, which would otherwise be red for the
  whole of the writing phase.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
- **The detail scroll region (`[data-testid="detail-scroll"]`) carries `overflow` and nothing
  else.** No mask, no filter, no `backdrop-*`, no `transform` — anything that promotes it to its
  own compositing layer has already broken it on iOS while looking perfect on every browser
  available here. Decoration goes on a sibling drawn over it. **Scroll it on a device before
  believing it.**
- **No `bg-*/NN` opacity modifiers on the CSS-variable colour tokens** — Tailwind drops the whole
  rule and the element gets no colour at all. Use `opacity-60`. (`CLAUDE.md` → Styling.)
- **`CI=true npm run build`**, not a plain build, and run tests through `npm` only (the `TZ` pin).

## Open UI items — the worklist

1. **Reading measure.** The card is `max-w-[340px] sm:max-w-[400px]`. `Modal` has a `wide` size
   this has never used. It buys ~60px at desktop width and nothing on a phone. Worth a look once
   there is real prose to judge line length against, not before.
2. **The Daily hero's image fallback.** When Cloudinary fails, `DailyDeckPreview` falls back to a
   pale `bg-border/30` panel, and a white watermark on it is faint. Over real art it reads cleanly
   in both themes. Only worth chasing if the fallback turns out to be common.

## Numbers to check against

Every detail card is **340x606** at 402px, **272x628** at 320px (the title wraps to two lines) and
**400x606** at 1440px — identical before and after the shard loads and after scrolling to the end.
The scroll region is **476px** holding 739-1183px of placeholder prose. 5,460 events, all carrying
placeholder. Full suite is **757 tests across 64 suites**.

## Kick-off prompt for the next session

> Continue the event-detail work on the `when` repo.
>
> Branch off `claude/event-detail-read-more-polish-1i4ai5` — **not** main, the feature only exists
> on that branch.
>
> Read `HANDOFF.md` at the repo root first. It points at `docs/event-detail/index.md` for the
> decisions behind the design and why they were made.
>
> The UI is done. **This session is Phase 2, the writing spec** — `docs/event-detail/writing-spec.md`
> and `.claude/skills/write-event-detail/SKILL.md`, described in `docs/event-detail/index.md`, with
> the open questions it has to settle in
> `docs/event-detail/session-2026-09-12-detail-view-design.md`.
>
> Every entry in the corpus today is committed placeholder text. Judge the spec by hand-writing
> ~10 entries across difficulty and era and reading them cold — do not start Phase 3.
