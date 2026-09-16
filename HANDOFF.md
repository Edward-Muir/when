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

An info button beside a card's title in its detail popup swaps the short description for 2-3
paragraphs about the event; the same button swaps back. Everything between the title and the
"Report an issue" row then scrolls as one region, image included, inside the height it already
occupied — so the card never changes size. It is on a placed card in a game and on anything in My
Timeline. The Daily hero carries the same control watermarked into its image and opens straight
onto the prose with no button in the header; its event is the deck's starting card, placed face-up
with its year on turn 1, so the read gives nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`, sharded to
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
timeline; the (i) is beside the card's title.

Driving it with Playwright: [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md).
Two gotchas that cost a cycle each — reach a timeline card by its **title**
(`getByRole('button', { name: /<friendly_name>/i })`, since `[data-timeline-year]` is the year
label _beside_ the card and clicking it opens nothing), and scope the info button to
`[data-testid="modal-card"]` once a popup is open, or the query also matches the hero's button
behind the backdrop.

## Don't break these

- **The info button must stay unreachable before a card is placed.** The gate is
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the long-form prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **The card must not change size or position when the text swaps**, nor after the prose is
  scrolled to the end. The scroll region is pinned to the image box plus the height the
  description measured. The measuring ref goes on the **description**, never on the scroll region
  — the description unmounts while the prose is up, which is what keeps a height from ever being
  taken off the prose; the region survives the swap and would be measured while pinned. A height
  taken off the prose grows the card on every open until it runs off the screen. Pinned by
  `src/hooks/usePinnedFaceHeight.test.ts`. A surface opening straight on the prose
  (`openExpanded`) still renders the description for one commit so there is a height to pin to;
  that is why `GamePopup` resets in a **layout** effect.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** That is
  the merge gate. It is deliberately not part of `npm test`, which would otherwise be red for the
  whole of the writing phase.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
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

Closed: the tombstone read (looked at, correct, covered by a test); the scroll affordance (a
`mask-image` fade, `.fade-scroll-y`); dark mode; the desktop D5 overlap (unchanged from before the
feature, since the card no longer grows); and the reading window, which the whole-region scroll
took from 70-115px to 454-499px.

One thing seen once and not reproduced: a full-page Playwright screenshot in dark mode caught
white bands above and below the card image. Two controlled re-runs are clean and a DOM probe puts
the `<img>` at exactly 384px, `top: 0`, `object-cover`, so it is a capture artifact rather than a
layout fault. Worth a second look if it is ever seen on a real device.

## Numbers to check against

The card measured **340x606** at 402px, **272x651** at 320px and **400x606** at 1440px, identical
across the swap, the scroll to the end, and the swap back. The scroll region inside it is
**454-499px** holding 761-1183px of placeholder prose. 5,460 events, all carrying placeholder.
Full suite is **765 tests across 65 suites**.

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
