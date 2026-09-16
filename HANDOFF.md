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

An info button in the top-right of a card's image swaps its short description for 2-3 paragraphs
about the event, scrolling in the same box so the card never changes size; the same button swaps
back. It is on a placed card in a game, on anything in My Timeline, and on the Daily hero image —
whose event is the deck's starting card, placed face-up with its year on turn 1, so the read gives
nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`, sharded to
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

Fastest: tap the **(i)** on the Daily hero image on `/`. Otherwise open `/timeline` and tap a
placed card, or play a game from the Custom tab and tap a card once it is on the timeline; the
(i) is in the top right of the card's image.

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
- **The card must not change size or position when the text swaps.** The box is pinned to the
  height the description measured, and the prose scrolls inside it. The measuring ref goes on the
  **description**, never on a wrapper holding both texts — a height taken from the prose grows the
  card on every open until it runs off the screen. Pinned by
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

1. **Reading room.** The box is as tall as the short description, so the prose scrolls through a
   1-4 line window: measured 70-115px of viewport against a 317-648px read, at 320/402/1440. This
   is the shape that was asked for, judged against placeholder prose. If it proves too tight once
   real prose exists, the fix is to shrink the image box on expand (384px → ~120px) and give the
   freed height to the text — the card's total height, and therefore the invariant above, is
   unaffected, and it is a change to `EventPopupContent` alone.
2. **Reading measure.** The card is `max-w-[340px] sm:max-w-[400px]`. `Modal` has a `wide` size
   this has never used. It buys ~60px at desktop width and nothing on a phone, so it is only worth
   revisiting alongside item 1.
3. **The Daily hero's image fallback.** When Cloudinary fails, `DailyDeckPreview` falls back to a
   pale `bg-border/30` panel, and the frosted disc is washed out on it. Over real art it reads
   cleanly, in both themes. Only worth chasing if the fallback turns out to be common.

Closed this session: the tombstone read (looked at, correct, now covered by a test); the
scroll affordance (a `mask-image` fade, `.fade-scroll-y`); dark mode (re-checked at 402px); the
desktop D5 overlap (unchanged from before the feature, since the card no longer grows).

## Numbers to check against

The card measured **340x606** at 402px, **272x651** at 320px and **400x583** at 1440px, identical
in both states across swap, scroll to the end, and swap back. The scroll window inside it was
70-115px. 5,460 events, all carrying placeholder. Full suite is **764 tests across 65 suites**.

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
