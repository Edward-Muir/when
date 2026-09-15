# Handoff: timeline visual interest / progression

Paste this into a fresh session. It is written to be read cold.

## Where things stand

Branch: **`claude/timeline-visual-interest-oz659a`** (11 commits ahead of `main`, all pushed).
Latest: `e4ac46b feat(timeline): the drag marker becomes the tick when a card lands`.
Preview: https://when-1idgry6xh-edward-muirs-projects.vercel.app (Vercel SSO — sign in first).
**No PR has been opened, and none should be unless the maintainer asks.**

Everything ships **in the real game** (`Timeline.tsx`), so it is live on Daily, Archive, Custom and
My Timeline alike. There is no second implementation behind a flag.

Four things landed, in order:

1. **The paper.** One continuous gradient behind the board's scroll content
   (`usePaperField.ts`, `--paper-early/-late`). A **fixed-length crossfade centred on the board**:
   1100px of warm → cool straddling the content's midpoint, flat beyond it both ways. A short
   board sits inside the ramp and shows its muted middle; a long one reaches past and saturates
   at both ends. Progression is in how much of the sweep you have uncovered.
2. **The rail.** Drawn one segment per row (`TimelineRail.tsx`), so it spans exactly the rows that
   exist and cannot detach from the ticks. Each segment fills its whole row, so the line runs half
   a card-gap past the first and last tick, and a one-card board is a stroke, not a point.
3. **The travelling marker.** One persistent lit node (`TimelineMarker.tsx`) that glides the rail
   for the whole of a drag on a soft under-damped spring and settles into the landing gap.
   Portalled to `body` above dnd-kit's drag overlay, inside a fixed clip box the size of the board
   so it never reaches the hand bar. Each end's rail growth plays once per drag (`useRailGrowth`).
4. **The landing** (newest). The marker **becomes the tick** — see below.

## The landing, in detail (the newest and least settled part)

- **Correct drop**: the dot slides ~8px off the rail into the gutter and flattens from a 6×8
  glowing pill into the 12×4 dash, glow decaying over ~400ms to a plain tick.
- **Wrong drop**: the marker snuffs where it stands during the 400ms red flash (glow out, down to
  the tombstone dash's opacity) and steps off the rail; then the tombstone's own dash takes over
  as a dead grey dot, rides to the card's true slot on the reveal FLIP's own tween and ease, and
  grows there.
- **The gap itself draws no dash** (`TimelineTick` `variant="none"`). It used to draw a faint one,
  which meant the landing morphed into a tick that had been sitting there for the whole drag. Two
  places render that gap — `GhostCard` and `TombstoneRow`'s `ghostEvent` branch — and the 12×4
  footprint box stays in both; only the painted dash goes. Drop the box and the `?` jumps 12px
  right into the rail.

Files: `TimelineTick.tsx` (one component for all four board ticks), `tickLanding.ts` (pure
geometry + clocks, with `tickLanding.test.ts`), plus a `tick` block in `animationTuning.ts` wired
to `/anim-jig` sliders.

## Rules that cost real time to learn — do not re-derive these

- **`bg-accent/50` and friends compile to NOTHING.** Opacity modifiers on this project's theme
  tokens are dropped by Tailwind entirely, so the element gets no background at all. Use
  `opacity-NN` on the element or a `color-mix()` utility. (Two board ticks had been invisible for
  this reason; now fixed.) The rule is in CLAUDE.md and `src/index.css:84` — read it before adding
  any translucent colour.
- **`CI=true npm run build`, never a plain build.** Vercel sets it; warnings become errors. The
  warnings block prints _above_ the cheerful success banner, so do not `tail` the output.
- **Run tests through npm**, never `npx react-scripts test` — the script pins `TZ` and five tests
  across three suites fail without it.
- **`animate-entrance` is on the card slot, not the row** (`TimelineEvent.tsx`). A row-level
  opacity fade composites onto the gutter and would fade the landing tick up from zero. Do not put
  it back on the row.
- **An animation whose element rests in the loud state is a landmine.** A CSS animation with no
  resting value and no `fill-mode` snaps back to the keyframe start on completion — that is what
  made the placement vignette flash twice. Always give such an element an explicit resting value.
- **`Timeline.tsx` is at its ESLint ceilings** (complexity 15, 310 lines per function, 450 per
  file). New logic goes in a hook or a new module, not inline.
- **The BOARD COLUMN invariant** (`src/index.css`) is checkable as
  `tick.getBoundingClientRect().right === rail.getBoundingClientRect().left`. Anything new in the
  gutter must preserve it. Nothing in the landing hardcodes the 8px between them except
  `RAIL_TO_TICK`, which is derived from the dash and rail widths and pinned by a test.
- **`useInsertionMarker` reports the marker's TARGET, not where it is painted.** The marker
  deliberately trails on a spring. Anything needing the dot's real position reads
  `TimelineMarker`'s per-frame `onPosition`.
- **The rigs cover the drag but not the drop.** `/anim-jig` drives the board with
  `isDragging={false}`, so no marker exists there at all — but `/timeline-lab?ghost=…` fakes a
  real drag onto `Timeline`'s props, so the ghost row and the marker are both live and it is the
  right place to look at the gap. Neither can commit a placement, so the landing animation still
  sits out by design. Verify the landing in a real game.

## How to verify a change

```bash
npm run lint && npm run typecheck && CI=true npm test -- --watchAll=false && CI=true npm run build
npx serve -s build -l 4178          # then, in another shell:
node scripts/tick-landing-probe.js  # plays a real game, samples the landing every frame
```

`scripts/tick-landing-probe.js` prints the handoff gap, whether any frame shows both a lit marker
and a moving dash, the dash's width track, and the tick column's spread at rest. Its docblock says
what each number means. **Screenshots are the wrong tool for the morph** — it is ~350ms and the
screenshot pipeline lags a CPU-throttled page badly enough to miss it; sample geometry instead.
Playwright setup gotchas (proxy, TLS, the drag recipe) are in
`docs/driving-the-app-with-playwright.md`. Scripts outside the repo need
`NODE_PATH=/home/user/when/node_modules`.

`/timeline-lab?n=&ghost=&slowmo=&theme=&bare=1` mounts the real Timeline on a seeded board.
`/anim-jig` drives the exact success and miss placement sequences with live tuning sliders. Neither
has a `vercel.json` rewrite, so both are local-dev only.

## Design constraints the maintainer set

- Subtlety level: **"restrained but deliberate"**. A new mark on the board is allowed only if it is
  **typographic and monochrome** — a hairline, a figure set in Playfair. **Never colour coding,
  never a badge or a bar.**
- The **era-palette family is rejected twice** (era wash, chapter headings, era spine, coverage
  bar, colour-coded rail, rail beads). Do not rebuild any of it. See
  `docs/ui-redesign/index.md` § "Timeline progression".
- Materials in play are **the paper and the rail** only.
- They like juice at the moment of interaction: the rail's growth preview and the travelling
  marker were both called out as the good parts.

## Open threads (not started, no commitment made)

- On a very long board (My Timeline, hundreds of rows) the paper's sweep completes within
  `RAMP_PX` of the middle and the rest is flat. One rule kept rather than two; flagged to the
  maintainer, never answered.
- Centring the crossfade means a placement shifts the ramp by half a row (~44px against 1100px).
  Not visible, but it is no longer the strictly-static ramp the previous revision had.
- The landing dash is not portalled, so a drop within 56px of the board's top or bottom hands over
  from an unmasked marker to a dash under `.tl-edge-mask` — a possible brightness step at the
  seam. Known, unmeasured, probably rare since drops cluster mid-board.
- Neither rig can exercise the landing: `/timeline-lab` has a marker but cannot commit a
  placement, `/anim-jig` commits one but has no marker. Giving the jig a short fake pre-drag
  before its placement commit would make it the authoring surface for this too.

## Read before touching anything

`docs/ui-redesign/index.md` § "Timeline progression: the paper and the rail" — it holds the
decisions, the rejected directions and every trap above, and it is up to date as of the gap-dash
fix.
