# Brief: rethink the game screen from first principles

Kickoff for a fresh session. Written after three rejected attempts to restyle the timeline
surface (see [index.md](index.md#timeline-surface-three-directions-ruled-out-2026-09)); the
lesson of those rounds is that the look was never the problem, so this brief is about the
interaction. Paste the prompt at the bottom into a new session, on a new branch off `main`.

## The problem in the maintainer's words

The game needs three things: **events**, **a timeline**, and **the ability to draft an event
between many other events easily.** Today's screen — a gold rail on the left, year labels in a
96px gutter, 240×80 cards to the right, the hand in a bottom bar, drag to insert — works but
feels plain, gives no sense of motion or of where in history you are, and placing a card
precisely between neighbours gets harder as the board fills. A typical game places ~12 events;
a good one 25–40; My Timeline holds hundreds.

## Fixed

- The rules: hand of N, a correct placement draws a replacement, a wrong one shrinks the hand,
  game over when the hand empties. Daily / Archive / Custom as the three entry points.
- The event data, images (square `thumbnail` rung; see `docs/cloudinary-cost-controls.md`),
  `friendly_name` ≤ 35 chars, no dates in player-visible text.
- Mobile-first (design at 402px, verify at 320px), both themes, the existing tokens and fonts
  (Playfair Display / Inter / DM Mono) unless a change is argued for.
- The engine (`src/hooks/useWhenGame.ts`) and its multiplayer branches stay; the UI may call it
  differently.

## Open

Everything on the game screen: orientation; whether the board is a list, a strip or a field;
how the hand is shown; how a drop target is found, previewed and confirmed; whether placement is
a drag at all; how the board scales from 4 cards to 40; how the player knows where in history
they are; what the My Timeline tab shares with the board.

## Method (the part that was missing before)

1. **Interaction before appearance.** Wireframe as grey boxes and type only; no colour, no
   images, no polish until a mechanic has been chosen.
2. **Explore at least five genuinely different placement mechanics.** Starting points, not a
   list to copy: two-stage placement (coarse drop, then a fine-adjust step between the two
   neighbours); a magnified drop region under the finger; tap a gap instead of dragging; press-
   and-hold to expand the region near the thumb (fisheye); a horizontal strip with the hand
   below; a list with explicit insert handles; placing by scrubbing a year and confirming.
3. **Score them against explicit criteria** before building: placement precision at 12 / 25 /
   40 cards; one-thumb reach; time to place; legibility of the neighbours' years at the moment
   of decision; sense of position in history; how the miss animation and tombstones survive;
   accessibility (Reduce Motion, no drag-only paths).
4. **Make the top two playable**, not screenshotted: a dev route (`/ui-lab`, no `vercel.json`
   rewrite) that mounts the real engine with a seeded deck, playable on a phone via
   `npm start` or a Vercel preview. Screenshots are for the record, not for judging.
5. **Check in twice**: after the wireframes (before any code), and after the first playable.
   Do not iterate visually past either gate without a steer.

## Read first

`CLAUDE.md`; `docs/ui-redesign/index.md` (the whole file — the board-column invariant, the
onboarding hints, and the ruled-out directions); `docs/gameplay-feel/index.md` (deck
composition, tombstones, streak feedback); `src/components/Game.tsx` (at the `complexity`
ceiling — do not grow it), `src/components/Timeline/Timeline.tsx` (near the line ceiling),
`src/hooks/useDragAndDrop.ts` (insertion is computed from `[data-timeline-year]` midpoints
snapshotted at drag start); `docs/driving-the-app-with-playwright.md` (the drag recipe).

## The prompt

> I want to rethink the game screen of "When" from first principles. The game needs three
> things: events, a timeline, and the ability to draft an event between many other events
> easily — with ~12 placed cards in a typical game and up to 40 in a good one, on a phone,
> one-handed. Three rounds of restyling the existing timeline (rail decorations, restyles of
> the same layout, a research-led "plates" design) have been tried and rejected; read
> `docs/ui-redesign/index.md` § "Timeline surface: three directions ruled out" and
> `docs/ui-redesign/timeline-rethink-brief.md` before anything else, and do not propose another
> surface restyle.
>
> Work on a new branch off `main`. Start with the interaction, not the look: propose at least
> five genuinely different placement mechanics as grey-box wireframes (no colour, no images),
> score them against the brief's criteria, and stop to show me before writing any code. After I
> pick, make the top two playable on my phone through a dev route that mounts the real engine
> with a seeded deck, then stop again. Keep `Game.tsx` and `Timeline.tsx` under their ESLint
> ceilings by building beside them, not inside them. Verify with `npm run lint`,
> `npm run typecheck`, `CI=true npm test -- --watchAll=false` and `CI=true npm run build`.
