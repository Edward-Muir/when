# Handoff — event detail "read more"

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                             |
| ---------- | --------------------------------------------------------------------------- |
| Branch     | `claude/event-details-info-button-hu8mpk`                                   |
| HEAD       | `9b99e6e`, six commits, rebased onto main v1.22.0 (`946d4aa`) on 2026-09-16 |
| PR         | none, deliberately                                                          |
| Production | nothing. The branch does not merge until the prose corpus is written        |

**Branch off _this_ branch, never off main** — the feature does not exist on main.

## What exists

An info button in the top-right of a card's detail popup turns the card over onto 2-3 paragraphs
about the event. It is reachable from a placed card in a game and from anything in My Timeline.
The prose is a lazily-fetched sidecar under `public/events/detail/`, sharded to mirror the 19
manifest files; it is never inlined into the event JSON.

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

Open `/timeline`, tap a placed card, tap the **(i)** in the top right. Or play a game from the
Custom tab and tap a card once it is on the timeline.

Driving it with Playwright: [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md).
One gotcha that costs a cycle every time — reach a timeline card by its **title**
(`getByRole('button', { name: /<friendly_name>/i })`). `[data-timeline-year]` is the year label
_beside_ the card; clicking it opens nothing, which reads as a broken feature rather than a bad
selector.

## Don't break these

- **The info button must stay unreachable before a card is placed.** The gate is
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the long-form prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **The card must not change size or position between its two faces.** The reading face is pinned
  to the height the card face measured, and the prose scrolls inside it. The measuring ref goes on
  the **faces**, never on the wrapper that holds both — that was a real bug (the card grew on
  every turn until it ran off the screen). Pinned by `src/hooks/usePinnedFaceHeight.test.ts`.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** That is
  the merge gate. It is deliberately not part of `npm test`, which would otherwise be red for the
  whole of the writing phase.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
- **No `bg-*/NN` opacity modifiers on the CSS-variable colour tokens** — Tailwind drops the whole
  rule and the element gets no colour at all. Use `opacity-60`. (`CLAUDE.md` → Styling.)
- **`CI=true npm run build`**, not a plain build, and run tests through `npm` only (the `TZ` pin).

## Open UI items — the worklist

1. **The tombstone reading face has never been looked at, and has no test.** A failed placement
   _does_ reach the info button (`shouldShowYearInPopup` returns true for revealed tombstones,
   `src/components/Game.tsx:77`), and `EventDetailFace` does take the `tombstone` prop and mute the
   text — but `GamePopup.test.tsx` has zero tombstone cases and no screenshot was ever taken. Check
   this first; it is the most likely place something is quietly wrong.
2. **The scroll affordance.** Where the prose overflows it clips against the hairline above
   "Report an issue". Conventional, but a fade would read better. `mask-image` is the candidate
   rather than a gradient, because it needs no knowledge of the card's per-event inline background
   colour. Deliberately deferred until there was prose to judge it against.
3. **Dark mode was last seen before the card-size fix.** Re-check rather than assume.
4. **Reading measure.** The card is `max-w-[340px] sm:max-w-[400px]`. `Modal` has a `wide` size
   this has never used — worth seeing whether the line length wants it.
5. **The header-to-prose gap** on the reading face, and the desktop overlap with the "Later ↓"
   label at 1440x900 (`docs/desktop-experience/index.md` D5 — pre-existing, marginally worse with
   a tall card).

## Numbers to check against

The card measured **340x606** at 402px wide and **651** tall at 320px, holding that across turn,
scroll to the end, and turn back. 5,460 events, all carrying placeholder. Full suite was **757
tests across 64 suites** after the rebase.

## Kick-off prompt for the next session

> Continue the "read more" event-detail work on the `when` repo.
>
> Branch off `claude/event-details-info-button-hu8mpk` — **not** main, the feature only exists on
> that branch.
>
> Read `HANDOFF.md` at the repo root first. It points at `docs/event-detail/index.md` for the
> decisions behind the design and why they were made.
>
> This session is **UI polish of the detail view only** — not the prose writing spec, which is a
> later phase. Every entry you will see is committed placeholder text: judge layout, spacing and
> feel against it, don't rewrite it.
>
> Start by running it and actually looking: `npm ci`, then `BROWSER=none npm start`, open
> `/timeline`, tap a placed card, tap the (i) in the top right. Then work the "Open UI items" list
> in `HANDOFF.md`, starting with the tombstone reading face, which has never been seen.
>
> Two things must not change: the info button stays unreachable before a card is placed, and the
> card must not resize or move between its two faces. Both are pinned by tests — if you find
> yourself editing those tests, stop and ask.
