# UI & Layout

Home-screen pager, gameplay layout, and the Custom settings screen.

Most of this folder's history is superseded UI narrative — several sessions describe a
`SettingsPopup` that no longer exists, and a Marathon/Casual mode picker that was removed
along with the `freeplay` mode. What survives is below.

## Gameplay layout

Full-width vertical stack, not the original 40/60 horizontal split:

```
TopBar  (fixed, safe-area aware — see ../mobile-ios/index.md for pt-topbar*)
Timeline (flex-1) — spine 96px from the board column's left edge, cards aligned to it
Bottom bar (120px mobile / 140px desktop, pb-safe) — hand count + active card stack
```

- **Cards have two shapes.** Landscape on the timeline (240×80 mobile, 280×96 desktop, image
  left 40% / title right 60%); portrait in the hand (144×176 / 160×192).
- The bottom bar's drop zone id is **`bottom-bar-zone`** (renamed from `hand-zone`) — the
  Playwright/puppeteer selectors depend on it.
- Cards are fixed-width and aligned to the spine, not stretched.
- **The board column is `96px gutter + 12px gap + 280px card = 388px`, and at ≥1024px it is
  centred rather than pinned left** (2026-09). The arithmetic, the alignment invariant and the
  reason it is done with percentage padding rather than `max-width`/`mx-auto` all live in one
  place: the `BOARD COLUMN` comment in `src/index.css`. Read it before changing the gutter, the
  gap or the card width — all three feed the same `--board-*` vars, and getting it wrong
  detaches the accent rail from every row's tick. The same three classes (`board-center`,
  `board-center-item`, `board-rail`) do the job in `Timeline`, `Game`'s bottom bar,
  `GameStartTransition` and `ArchivePanel`.

## Home is a five-tab pager (2026-06-28; Archive added 2026-09, Achievements folded into Stats 2026-09)

`Daily · Archive · Custom · Stats · Timeline`, driven by **both** swipe and the TopBar buttons. It
replaced two competing navigation models (a two-page pager plus TopBar buttons that
`navigate()`d to separate full-page routes).

- **The order lives in one place**: the `TABS` array in `ModeSelect.tsx`. Labels, indicator
  colours, the index↔key maps and the idle pre-mount set are all derived from it, and the
  `ModePager` children must be rendered in that order. It used to be four hand-maintained
  mirrors of the same list; inserting Archive at index 1 is what collapsed them.
- **Archive** (`panels/ArchivePanel.tsx`) is the past curated decks, laid out on the game's own
  timeline by the date each ran — see [../curated-themes/](../curated-themes/index.md#replaying-past-decks-the-archive-tab).
  Like every tab it has a path (`/archive`) that opens the home screen on it (see below).
- **Achievements are a section of the Stats tab, not a page** (2026-09). They were a pager
  tab from 2026-06, then briefly a burger-menu link when the home screen got cluttered — and
  nothing in the burger menu gets found, so they now sit inline at the very bottom of Stats
  (`stats/AchievementsSection.tsx`, after the collection meter): an "Achievements" header with
  the live count, the unlocked badges newest first, and a "Show all 60" expander for the
  locked ones. **The locked grid mounts only while expanded, and badge art is prefetched only for
  the unlocked badges until then** — the always-mounted 60-card grid is what used to stall
  the swipe on iOS (below), and it must not come back. `/achievements` redirects to `/stats`
  (`pages/Home.tsx`) and keeps its `vercel.json` rewrite so old links still land.
- **My Timeline is a tab again** (2026-09), the fifth, with its own path (`/timeline`) and
  top-bar button (Hourglass, "View my timeline"). Its burger-menu spell lasted a day, for the
  same reason.
- **The one-time "new" dots sit on the buttons they belong to**: Stats (re-armed on every
  badge unlock by `useGameStatsRecorder`, cleared on visiting the tab) and Timeline. The menu
  button carries none. `hasSeenNav` / `markNavSeen` / `markNavUnseen` in `playerStorage.ts`
  are unchanged apart from the retired `achievements` key.
- **Six buttons fit a 320px phone at `gap-2` / `p-2`**: 6 × 38px (20px icon + 16px padding +
  2px border) + 5 × 8px gaps + 16px container padding = 284px. Seven did not (the
  Achievements-and-Timeline-as-tabs era needed 6px gaps), so don't add a seventh without
  re-measuring.

- **Every tab has a path, and the path opens the home screen on that tab** (2026-09):
  `/`, `/archive`, `/custom`, `/stats`, `/timeline` are one route (`/:tab?` → `pages/Home.tsx` →
  `App initialTab` → `ModeSelect` → `ModePager initialIndex`), and `ModeSelect` replaces the
  path as the player swipes so a refresh or a shared link comes back to the same tab. The
  tab↔path map is `pathForNav` / `navForPath` in `TopBar.tsx`. There is no standalone Stats
  page any more; the panel components in `src/components/panels/` are mounted by the pager.
  Before this, Archive and Custom had no path, so their buttons rendered only in pager mode,
  and once Achievements and My Timeline briefly moved to the menu the route pages were left
  with a lone Stats button — the regression this rule exists to prevent: **the top bar shows
  the same five nav buttons on every non-game page.**
- **`TopBar` stays backward-compatible** via an optional `onNavClick`: when provided the
  buttons scroll the pager, when absent they navigate to the tab's path. The in-game bar
  (`Game.tsx`) deliberately shows Home and Menu only.
- **Heavy tabs lazy-mount** (on first visit or at idle, whichever is first): Stats and
  Timeline. Idle pre-mount rather than mount-on-swipe because mounting mid-swipe stalled the
  iOS scroll-snap gesture. `TimelinePanel` additionally holds its (unvirtualised) timeline back
  until the tab has been shown once, and `StatsPanel`'s badge art waits for `active` too.
- A vertically-scrolling panel nests inside the horizontal pager with **no gesture conflict** —
  this was an upfront concern that turned out to be unfounded. Don't re-litigate it.
- Custom's active nav colour is `accent-secondary` (teal) to match that screen; every other
  tab, Archive included, is `accent` (gold).
- The indicator shows only the active tab's label, with all labels stacked in one grid cell
  (inactive ones `invisible`) so its width never shifts as you navigate.

## The Daily's eye: reopening today's finished board (2026-09)

Once the daily is played, an eye sits beside **Challenge a Friend** on the hero card and reopens
the board the player built, so the cards can be turned over and read. The long-form prose is what
made this worth having: before it, a finished board was a score.

- **It rehydrates the real game screen rather than rendering a review of its own.** `App` already
  routes `phase === 'gameOver'` to `Game`, `Timeline` already takes `failedPlacements` and draws
  the tombstones, and `GameOverControls` is already the daily's Share + Home bar. So the work is
  restoring the state (`utils/dailyBoard.ts` → `useWhenGame`'s `enterReview`), not building a
  screen. A bespoke overlay would have been a second timeline surface to keep in step with the
  first.
- **It opens straight onto the board, with no game-over popup.** That is also what keeps
  `useEndOfGameSequence` dormant: the milestone → achievement → share queue arms on the
  transition `popupType === 'gameOver'` → `undefined`, so a popup that never opens is a queue
  that never replays.
- **Re-entering `gameOver` re-arms every game-over effect, and two of them write.** This is the
  trap worth not rediscovering, because both failures are silent and permanent:
  `useSaveDailyResult` would rewrite `when-daily-result` and wipe the `leaderboardRank` that
  `updateDailyResultWithLeaderboard` stored after submission, and `useGameStatsRecorder` would
  count the game a second time — lifetime stats, the cadence streak, the collection, a duplicate
  `when-game-history` record, and re-fired achievements. `WhenGameState.isReview` guards both,
  and `useSaveDailyResult.test.ts` fails without either guard. `Game` carries three more, all
  cosmetic by comparison: no game-over popup, no leaderboard fetch or warm, and the TopBar's
  Home skips the "progress will be lost" confirm.
- **One slot, stamped with the puzzle date** (`when-daily-board`), holding slugs rather than
  events. `getTodayDailyBoard` returns null unless the stamp is today, so the next daily
  overwrites it and no history accumulates — the self-invalidating shape `when-daily-result`
  already uses, with no cleanup pass and no timer. Slugs the catalogue has since dropped are
  skipped on restore, and a board with nothing left resolves to null, which is what the eye's
  visibility is gated on: `ModeSelect` restores up front so the button is never a no-op.
- **The prose gate needed no new insertion point.** `shouldShowYearInPopup` (`Game.tsx`) tests
  membership of `timeline` / `failedPlacements`, which a restored board satisfies by
  construction — and legitimately, since every card on it was placed. See
  [../event-detail/](../event-detail/index.md) for why that gate is load-bearing.
- **A one-shot strip names it the first time it is on screen** (`reviewEye`), since the eye is
  an unlabelled icon. See the hints section above for how it is gated and why it shares the
  Daily strip's slot.
- `useSaveDailyResult` moved out of `useWhenGame.ts` into its own hook file in the process; that
  file was on the `max-lines` ceiling, the same squeeze `Game.tsx` is under for `complexity`.

## Timeline progression: the rail (2026-09)

The board looked identical at 5 cards and at 30, so a long timeline was a bigger number rather
than a better-looking thing. **This now ships in the game** — `Timeline.tsx`, so it is on the
Daily, Archive, Custom and My Timeline alike. `/timeline-lab` is a dev-only harness (no
`vercel.json` rewrite, no in-app link) that mounts the _real_ `Timeline` with a seeded board:
`?n= &ghost=earlier|later &over=0 &slowmo= &row= &theme= &bare=1`. There is no second
implementation.

**The era-palette family is now rejected twice.** An eight-colour era wash, era chapter
headings, an era spine, a history coverage bar, a colour-coded rail and rail beads were all
built on real data and shot at 5 / 14 / 30 cards; the verdict was that the earlier rounds'
work (see § "Timeline surface: three directions ruled out") is _an example of what not to do_
and must not be the basis of anything. Do not rebuild it. The standing rule from that steer:
**a new mark on the board is allowed only if it is typographic and monochrome — a hairline, a
figure set in Playfair. Never colour coding, never a badge or a bar.**

**A tinted background was tried and rejected too** (2026-09). "The paper" was one continuous
warm → cool gradient behind the board's scroll content, two tones a few percent either side of
`--color-bg`, with a fixed-length crossfade centred on the board: a short board sat inside the
ramp and showed its muted middle, a long one reached past and saturated at both ends, so the
progression was in how much of the sweep you had uncovered. It worked as designed and the verdict
was still that the old clean board looked better. **Do not rebuild it.** It is gone in full —
`usePaperField.ts`, the `--paper-early/-late` tokens, and the edge treatment it forced (see
below). Anything that survives it is listed here because it earns its place on its own:

- `src/utils/yearScale.ts` (was `paperTone.ts`) — the year → 0..1 log-of-time-before-now scale.
  It tinted nothing by the end; /timeline-lab uses it to spread its sample draw across history.
- The board's edge fade went **back** to what it was at 1.21.0: a 48px `from-bg` gradient scrim
  top and bottom with the "↑ Earlier" / "Later ↓" labels on it. The paper had replaced that with
  a mask over the board's own content plus a `text-shadow` halo on the labels, because a flat
  `--color-bg` scrim no longer matched a tinted page. With the tint gone the original works
  again, and `.tl-edge-mask` / `.tl-edge-label` are deleted. If you ever reintroduce a tint you
  will hit the same problem and be tempted by the same fix.
- One thing the mask quietly did: it was `scripts/tick-landing-probe.js`'s handle on the
  scrolling element. The scroller now carries `data-board-scroller` for that, since
  `board-center` is also on the hand bar and on ArchivePanel.

What shipped is the rail, and the two lit things that ride it:

- **The rail** (`src/components/Timeline/TimelineRail.tsx`). Drawn one segment per row rather
  than as one absolute bar, for two reasons: it then spans exactly the rows that exist, so the
  runway above the first card and below the last is empty; and it is aligned to the ticks
  by construction at any row height (see the BOARD COLUMN invariant in index.css). Each segment
  fills its **whole row**, so the line runs half a card-to-card gap past the first and last tick
  rather than stopping dead on them, and a one-card board is a stroke about as tall as the card.
  Only the two open ends are rounded — rounding every segment notches the rail at each row
  boundary, because the segments butt together. Nothing else is drawn on it.

The drag indicator is **one persistent lit node** (`TimelineMarker`) that runs along the rail for
the whole of a drag and settles into the gap the card will land in, on a soft under-damped spring
so it trails the pointer and overshoots rather than flicking between slots. That it is a _single_
element is the whole trick: a node born and destroyed with each ghost row can only ever pop. Its
target is measured off the ghost row (`data-ghost-row`, `useInsertionMarker`) rather than computed
from the gap index — the gap index is not a display-row index (tombstones interleave), a gap that
already holds a tombstone hosts the ghost inside that row instead of inserting one, and the two
ends extend the rail instead of sitting between neighbours. Measuring covers all of it with no
special cases.

**The marker is portalled to `body`, above dnd-kit's drag overlay.** Drawn inside the board it
was invisible almost exactly where it mattered: the dragged card is centred on the pointer, and
the pointer sits on the insertion boundary, which is where the marker is — so the overlay
(`z-index: 999`) covered it for most of a drag, and the "Earlier"/"Later" scrims covered it
near the board's top and bottom as well. It only ever read at the _ends_, where the rail's growth
extends a whole row beyond the card. Rendering it to `body` at `z-index: 1001` in viewport
coordinates fixes both without changing how it looks — **inside a fixed clip box the size of the
board**, because it must clear the overlay without ever reaching the hand bar or the top bar, and
z-index alone cannot express that: `#root` is its own stacking context at `z-index: 1`, so the
overlay on `body` is above every piece of app chrome and anything clearing the overlay clears the
chrome too. At the board's edges the marker and its glow are simply cut off, which against the
opaque hand bar is indistinguishable from passing behind it. Two consequences worth knowing: viewport
coordinates go stale if anything moves under them, so the hook re-measures on scroll and on a
ResizeObserver (a real drag freezes scrolling, but a ghost can be mounted before the board has
settled — the harness holds one from first paint); and the node is keyed per drag so it is
re-created between drags rather than flying in from wherever the last one left it.

**Each end grows once per drag** (`useRailGrowth`). The ghost row is rendered in flow, so moving
off an end unmounts it and moving back mounts a fresh one — and framer applies `initial` on every
mount, which replayed the growth every time the pointer crossed the boundary. Per _end_ rather
than per drag: the other end's first visit is an extension the player has not seen yet. The flag
is read by `initial` and nothing else, on purpose — it flips to false on the render after the
first one, while the spring is still in flight, and gating the `transition` on it too would swap
the spring for `duration: 0` mid-flight and snap the rail to full length halfway through.

The moment that carries the idea is the **extension preview**: while a drag hovers past either
end, the ghost row gets a rail segment that springs out of the existing line — `scaleY` from
the anchored edge, never a fade — with a glowing tip that settles. The spring is deliberately
under-damped (ζ ≈ 0.6, peak ×1.10 at ~225ms, settled ~450ms); a critically damped version
arrived in ~150ms and nothing registered as having happened. The rail does **not** draw its own
tip any more — the travelling marker is parked there when the gap is an end, so there is one
glowing thing and one code path.

### The landing: the dot becomes the tick (2026-09)

The marker does not fade out at the end of a drag any more — it **turns into the tick** on the
row the card lands as. The two were always neighbours: the board column invariant puts the dash
at board-left 84→96 and the rail at 96→100, with the marker riding the rail's centre at 98. So a
correct placement is an ~8px slide left plus a change of shape, 6×8 and round becoming 12×4 and
square, with the glow decaying over ~400ms to an ordinary tick. Nothing new appears on the board.

That 8px is **never written down as the distance between the two**. `dotStart` measures both ends
and subtracts, so the landing follows the board column if it ever moves rather than quietly
pointing at the wrong place. (`RAIL_TO_TICK` in `tickLanding.ts` does state 8, derived from the
dash and rail widths — it is needed for the snuff step below, before either end exists, and a test
pins it against the measured path.)

A **wrong** drop is the same two halves with the middle filled in: the marker snuffs where it
stands during the red flash (glow out, down to the tombstone dash's opacity) and steps off the
rail into the gutter; then, at 400ms, the tombstone's own dash takes over as a dead grey dot,
rides to the card's true slot on the reveal FLIP's own tween and ease, and grows there. The guess
ends by pointing at where the card belonged.

- **The step off the rail is not decoration.** An unlit dot at 40% on top of a full-strength
  accent rail is invisible — measured, not guessed. The travel only reads because the dot is on
  the bare gutter by the time it starts moving.
- **The origin is where the marker was _painted_, not where it was going.** `useInsertionMarker`
  reports the spring's target and the marker deliberately trails it; on a quick drop the two are
  tens of pixels apart. `TimelineMarker` therefore reports its live position through `onPosition`
  every frame, into a ref the dash reads once.
- **Both ends are measured in one layout effect**, which is what makes plain viewport coordinates
  safe: nothing can scroll between two reads in the same effect. Neither end is ever stored.
- **The animation starts from a layout effect, not framer's `initial`.** The offset is only
  knowable once the element is in the DOM, and a render → measure → re-render would paint one
  frame of the dash at rest before the marker had handed over — the exact seam this removes. The
  props are snapshotted at mount, because the "this row just landed" flags clear a few hundred ms
  later while the animation is still running.
- **The dash is two boxes.** A fixed 12×4 placeholder keeps the gutter's layout still — animating
  the real thing would shove the year label on every placement, and the board's content is under
  two ResizeObservers. The inner box is absolutely positioned and animates `width`/`height`
  rather than `scale`, because scaling 12×4 to 6×8 is anisotropic and would render the glow as an
  ellipse at exactly the moment the shape is meant to match the marker's.
- **`animate-entrance` moved off the row onto the card slot.** A row-level opacity fade
  composites onto the gutter, so it faded the landing dash up from zero. The row no longer
  arrives as a block: the card slides up, the year pops, the tick grows out of the marker.
- **The rail's reach is a number, not a flag** (2026-09). Each end's extension is a MotionValue
  owned by `useRailExtension`, and the ghost row and the retract stub both just paint it. It
  replaced a per-end "does this still owe its growth" boolean, which could not express the two
  things a drag actually does: leave the board halfway through a growth (the retract had to
  invent a length to start from) or turn back halfway through a retract (the growth restarted
  from nothing, so the rail snapped shut before re-opening). As one number, every rule falls out
  instead of being written: the growth plays on first reach; crossing off an end into a middle
  gap and back drives nothing, so the remounted segment paints at full length and there is no
  replay; the far end still grows on its first visit, because there are two numbers; leaving the
  board springs the showing end to zero — that IS the retract — and silently zeroes any other
  end, re-arming the board; turning back catches the value on its way down. Measured on a real
  drag: 1.00 → 0.40, caught at 0.397, back to 1.00, with no frame at zero.
  - The guard that matters: a retract must never be drawn over a card that has just landed. A
    drop at an end is the board genuinely getting longer, so the hook needs `dragging` as well as
    "over the board" — it retracts only for a drag that is still running. `handleDragEnd` clears
    both in one commit, so a drop arrives as a silent reset.
  - The stub is `h-0` with the segment absolutely positioned out of it, so the board's rows
    reflow on the same frame they always did and only the rail animates. Holding a real row open
    would defer the board's settle to the end of the animation, where it lands on its own and
    reads as a lurch, and would change the content height twice per crossing under the two
    ResizeObservers watching it. Its height comes from `useInsertionMarker`, which already
    measures the ghost row and already holds the value after the gap goes null.
  - `/timeline-lab` could not reach this state at all: it tied `isOverTimeline` to `isDragging`.
    `?over=0` (the "Off the board" chip) unties them, and `?slowmo=` composes with it.
- **The gap a drag is previewing draws no dash at all** (`TimelineTick`'s `variant="none"`, 2026-09).
  It used to draw a faint one, which gave the landing nothing to reveal: the dot flattened into a
  tick that had been sitting there the whole drag, and the board showed the answer's position
  before the card was dropped. Now the only mark at the gap is the travelling marker, and the
  dash's first appearance _is_ the landing. Two things this depends on:
  - **The footprint stays.** `variant="none"` keeps the outer 12×4 box and drops only the painted
    inner one. The gutter is a fixed 96px column that _ends_ in that box, so omitting the element
    would shove the ghost row's `?` 12px right, against the rail, on every gap the drag previews.
    `TimelineTick.test.tsx` pins both halves of that.
  - **There are two ghost render sites**, and a change to one that misses the other is invisible
    until a drag happens to hover a gap that already holds a tombstone: `GhostCard` in
    `Timeline.tsx` (the inserted row) and `TombstoneRow`'s `ghostEvent` branch (the ghost takes
    the tombstone's row instead of inserting one). Both draw `none`. The earlier
    `bg-accent/50`-compiles-to-nothing bug lived in exactly this pair.
- The dev rigs cover the drag but not the drop. `/anim-jig` drives the board with
  `isDragging={false}`, so no marker exists there at all. `/timeline-lab?ghost=…` _does_ fake a
  real drag — `isDragging` + `insertionIndex` straight onto `Timeline`'s props — so the ghost row
  and the marker are both live and it is the right place to check what the gap looks like. Neither
  can commit a placement, so the landing itself still sits out; a null origin is the safe failure.
  `scripts/tick-landing-probe.js` plays a real game instead and samples the geometry per frame;
  stills are useless for the morph, because the screenshot pipeline lags a CPU-throttled page
  badly enough to miss 350ms. They are fine for the drag, which holds still.

Traps this round cost time on:

- **An animation started in the commit that swaps the element drawing it is silently killed.**
  The rail's extension is a length that outlives the elements painting it (`useRailExtension`),
  because taking the card off the board unmounts the ghost row's segment and mounts a card-less
  stub in its place, and the retract has to carry on through that swap. Animating the shared
  MotionValue from the effect that observes the swap does not work: framer creates the controls,
  the value never ticks, and nothing errors — `animation` is never attached and the controls sit
  at `state: "idle"`. Proved by re-issuing the identical call 500ms later and watching it run.
  Every spring there is therefore armed on the next frame, which costs one frame at a length the
  element is already painted at. If an animation ever "starts" and nothing moves, check whether
  the element bound to it mounted or unmounted in that same commit.
- **A spring does not know which of its units you can see.** The morph animated `borderRadius`
  from `9999` to `0` — a big round number, on the reasoning that it paints the same capsule as
  any sufficient radius, which is true at rest. It is not true in flight. A spring carrying a
  value 9999 units is still ~117 units from home at the moment the size has arrived, and on a
  12×4 dash anything above 2 is a _full_ capsule: the tick reached its resting shape at ~200ms,
  stayed a pill until ~345ms, went square for one frame, then rang back into a pill and
  oscillated. A rounded end against the rail's flat edge is a notch of daylight at the join, so
  what it looked like was a small gap opening and filling itself, twice, a beat after the
  landing. `DOT_RADIUS` is `DOT_W / 2` now — the geometry's own units, so the rounding lands with
  the shape and an overshoot clamps at 0 where nothing can see it. Any value animated on a shared
  spring wants a range whose units are the ones on screen.
- **The morph may not overshoot.** The dash's right edge _is_ the board column's seam, so an
  under-damped morph lifts the tick off the rail and puts it back — measured at 0.18px, which is
  half a device pixel on a 3× phone and reads as the join flickering. `tick.morphSpring` is at
  critical damping (`damping >= 2·√(stiffness · mass)`), pinned by a test, and `/anim-jig` can
  still be dragged past it to look. This is the opposite of the rail's growth spring, which is
  deliberately under-damped — that one overshoots into empty space, where a bounce costs nothing.
- **Measure the morph's tail, not just its handoff.** `scripts/tick-landing-probe.js` finds the
  landing dash by "inline size ≠ 12×4", so it stops watching at the exact moment both of these
  bugs happen. Neither showed up in it. What found them was a CDP screencast of a real drop
  (`Page.startScreencast`, ~60fps — note its frames come back at CSS resolution, not the
  context's `deviceScaleFactor`) cropped to the gutter, plus a per-frame read of the landing
  row's own dash including its computed `border-radius`.
- **An animation whose element rests in the loud state is a landmine.** The placement vignette
  (`.vignette-overlay` + `animate-vignette` in Game.tsx) had no `animation-fill-mode` and no
  resting `opacity`, so the moment `vignettePulse` completed the element reverted to the default
  opacity of 1 — a full-strength flash of the whole vignette, brighter than the pulse that had
  just finished. Game.tsx unmounts it on a timeout matched to the animation's duration, so
  whether anyone saw it came down to winning a race by a few milliseconds. It held for a long
  time, then one more per-placement measurement on the board added just enough work to lose the
  race on a phone, and it showed up as a second flash after every placement. `.vignette-overlay`
  now rests at `opacity: 0`. Worth checking for the same shape anywhere else: an animation that
  ends somewhere other than its element's base style, on an element that outlives it.
- **Anything that measures the board will loop forever if you let it.** `buildTimelineRows` was
  called inline on every render, so the rows array had a new identity each time → new measure
  callback → effect → `setState` → render. It is memoised now, which is what keeps
  `useInsertionMarker`'s ResizeObserver from driving that loop. The symptom is React error #185
  and a blank board.
- **Masking the end segments back to the tick was wrong twice over**: it made the line stop dead
  on the first and last card, and it reduced a one-card board to a dot. It also hit a CSS trap
  worth knowing — a one-card board is `first && last`, and two `mask-image` declarations cannot
  both apply, so the top and bottom caps silently fought. Letting each segment fill its row
  removes the masks and answers both.
- **A 320ms spring is quicker than a Playwright screenshot round-trip**, so every frame came
  back settled. `Animation.setPlaybackRate` over CDP did _not_ reach framer-motion's animation
  even though the WebAnimation is visible to `Animation.enable`. What works is `TimelineRail`'s
  `timeScale` prop (`Timeline`'s `railTimeScale`, the lab's `?slowmo=`): scaling a spring's time
  by k is exactly `stiffness/k²` and `damping/k`, so a slowed capture shows the real curve.
  `scripts/timeline-lab-shots.js` also reads the segment's live `scaleY` at each capture, so the
  strip's captions are measured rather than inferred from the wall clock — off the
  `data-rail-extending` marker, not the first `.tl-rail` in the DOM, which is a static row
  whenever the board is growing at its later end and reported a flat ×1.00 for a while.
- **Changing a lab URL param with `page.goto` remounts the tree, so nothing animates.** Use
  `history.pushState` + a synthetic `popstate`; React Router picks it up in place.
- Row decoration keyed off `event.color` is a dead end: those values are image-derived and
  almost all dark brown, so anything painted with them reads as dirt.

Also in this round: `Timeline`'s body was at the `max-lines-per-function` ceiling, so the two
wave memos and the wake-delay memo moved into `useTimelineWaves.ts` and `useWakeDelays.ts`, and
the row renderers were split out. Pure refactors — no behaviour change.

## Onboarding hints (2026-09)

Players said the app did not explain itself: the rules were three lines that omitted the
hand mechanic and the losing condition, shown once per mode _after_ the game had started,
and afterwards reachable only from the in-game menu. Research (Nielsen Norman on onboarding
tutorials and mobile coach marks; game FTUE guidance) says up-front walkthroughs get skipped
and do not improve performance, while single-line contextual hints tied to the moment of
need, dismissible and re-findable, do. The fix is that shape; there is no guided tutorial.

- **One storage object, `when-hints-seen`** (`playerStorage.ts`: `hasSeenHint` /
  `markHintSeen` / `resetHintsSeen`, keys `drag`, `wrong`, `correct`, `closeEnough`, `tapCard`,
  `stats`, `swap`, `dailyTab`, `archiveTab`, `customTab`, `statsTab`, `timelineTab`,
  `reviewEye`). Switch-based
  accessors, because the `security/detect-object-injection` rule forbids indexing by a
  variable key. Note `stats` (the in-game counter hint), `statsTab` (the home tab's strip) and
  `NavKey`'s `stats` (the nav dot) are three different things that share a word; don't
  de-duplicate them. **`timelineTab` reads the key it replaced**
  (`when-timeline-intro-seen === '1'`) so an upgrade does not re-show it; that legacy key is
  read-only now and the fallback is tested. (`when-modes-played` gated the old per-mode rules
  popup and is no longer read: the popup is gone.)
- **"Reset Hints" in the burger menu** calls `resetHintsSeen()`, for QA and for a player who
  wants the explanations back. A plain row like every other action: it closes the drawer and
  says nothing else — no confirm and no confirmation text, because nothing is lost.
  `resetHintsSeen` also **dispatches
  a `when-hints-reset` event** (`subscribeHintsReset`): the menu is reachable mid-game via
  `TopBar`, but `useOnboardingHints` reads storage once per mount, so without the broadcast a
  reset during a game would silently do nothing until the next one.
- **The How-to-Play modal is never shown unasked.** It is `HowToPlayModal` on `ui/Modal`
  (`reveal` layer so it clears the menu drawer), opened from the menu's "How to Play", which
  is now always present, and from nowhere else. Three things were tried and cut: opening it
  automatically on the first game (an essay nobody read; the in-game strips that follow teach
  the same loop at the moment each part matters); a permanent "How to play" link under the
  Daily Play button (cost the hero image 48px for every player forever); and a "The tabs"
  section inside it (not how to play, and said elsewhere). It is the rules only, and
  `GameRules` lives there, not in `Menu.tsx`.
- **Copy lives in one const map** (`utils/hintCopy.ts`), consumed by the strips. One line
  each, no em dashes.
- **In-game hints are a state machine in `useOnboardingHints`**, not in `Game.tsx`, which sits
  on ESLint's `complexity` ceiling (an error rule). Game mounts `HintStrip` unconditionally
  and drives it with props. At most one strip is on screen.
- **The ladder is settle-driven: one hint per placement.** Every time a placement settles
  (`isAnimating` goes false with an outcome pending) the highest-priority unseen, eligible
  rung of `SETTLE_PRIORITY` is shown, **replacing** whatever is up: `wrong` → `correct` →
  `tapCard` → `stats` → `swap`. So each hint gets a player action of its own and nothing
  stacks, and a first game teaches the whole loop in four or five moves. The idle drag nudge
  (`DRAG_NUDGE_MS` after play starts) is the only timer-driven hint left; `drag` is marked on
  the first drag whether or not the strip ever showed. `swap` still needs a hand worth cycling
  and either a miss or four placements, so a perfect run reaches it. An outcome that lands on
  the game-ending placement is discarded unmarked and returns next game.
- **The 2026-09 shape this replaced never fired.** `swap` hung off a `swapEligible` boolean
  feeding a 1.5 s `SWAP_COOLDOWN_MS` timer, and the effect's cleanup cancelled and restarted
  that timer every time the boolean flipped — which it did on every drag frame and animation
  transition, so the quiet gap essentially never arrived; the 4 s outcome strip then blocked
  it as well. Playwright passed only because the script paused between moves. **Do not gate a
  hint on a timer fed by a churning boolean.** Only two `setTimeout`s remain: the idle nudge's
  and the hide timer inside `show()`. Three hazards are load-bearing and commented in the
  hook: the pending outcome is consumed _before_ any state write and decisions read `seenRef`,
  or the re-entrant re-render would walk the whole ladder on one placement; and the swap
  hint's "they swapped it" check compares against a baseline taken when the hint was shown,
  because `useWhenGame` swaps in the newly drawn card in the very same commit that ends the
  animation.
- **The floating strip lives inside the timeline area at z-[35]**, above the z-30 "Later"
  fade and below the z-40 bottom bar, so it never covers the hand card and tracks the bar's
  height. Not a `fixed bottom-20` toast: that lands on the card. The positioned wrapper is a
  plain div because framer writes `transform` inline, which would override a Tailwind
  translate.
- **Tab hints gate on `active`, never on mount** (`useTabHint`): the pager pre-mounts every
  panel at idle, so a mount-time check would fire for tabs never opened. All five tabs have
  one. The Daily strip is a nudge to press Play ("your first daily game"), shown only to a
  player with no daily behind them, and **takes the leaderboard's slot while it shows** rather
  than sitting under the heading: the hero card is the page's `flex-1` element, so anything added under the
  heading shrinks the image, and the leaderboard is the least relevant thing to a new player. They also wait
  `TAB_HINT_MOUNT_DELAY_MS` (350 ms) for the scroll-snap to settle, since mounting mid-gesture
  is the class of change that used to stall the iOS swipe. Custom was inline in `ModeSelect`
  and had no `active` prop; it is now `panels/CustomPanel.tsx` like the other three tabs.
  The old `TimelineIntroModal` is gone; its copy is the Timeline tab's strip.
- **The nudge animations** are `animate-hint-lift` (card bob, for `drag`) and one shared
  `animate-hint-glow` (a gentle swell plus brightness) with four homes, in `index.css`: the
  swap button, which is also filled gold; the Daily Play button while the start-screen strip
  is up; the top hand card's wrapper for `tapCard`; and the bottom-left counter for `stats`.
  The counter also takes `bg-border` while it glows — it is transparent otherwise, and the
  animation is transform and filter only, so without a surface to swell there is nothing to
  see. The pager's one-time swipe nudge (`when:modeSwipeHintSeen`) was deleted in 2026-09:
  it never showed, and it was the only hint stored outside `when-hints-seen`.
  Transform and filter only, never opacity (a fading button reads as disabled): a box-shadow
  ring was tried first and was invisible on a phone, and a bigger swell-and-fade was tried
  next and read as garish. Under Reduce Motion the bob is off and the glow falls back to a
  motion-free brightness blink, so the strip still points at something.
- **`animate-hint-halo` is the deliberate exception to that, and the box-shadow verdict does not
  carry to it** (2026-09). `hintGlow`'s `brightness(1.12)` lifts a near-white `bg-surface`
  button by almost nothing, which is exactly what the Daily eye is, so the nudge did not land on
  a real phone. The ring that failed was hint-scale; this app's gold glows that _do_ read are far
  heavier (`successGlowGolden` at `0 0 30px 15px`, the two-layer `.tl-rail-tip`). The halo is
  three box-shadow layers restated in every keyframe, because box-shadow interpolates layer for
  layer: a ring that expands to 9px and fades (the only thing that moves, restarting at spread 0
  where the button hides it, so the loop has no snap), a steady bloom so the control is gold
  between pulses, and a steady inset hairline reading as a gold border.
  **The bloom is capped at the 12px `p-3` gutter between the eye and `DailyDeckPreview`'s
  `overflow-hidden` edge** — measured at 13px of clearance — so it is saturated rather than wide;
  anything larger is sliced off on the right and reads as a rendering bug. The inset layer is a
  shadow rather than `border-color` because the button carries Tailwind's `border-border` and
  both would land in `@layer utilities` with source order deciding; a shadow does not compete.
  Under Reduce Motion it holds still but stays gold. Gold is `color-mix` on `--color-accent`,
  never a literal, so dark mode adapts — which is the whole reason there is no literal gold rgba
  anywhere in the repo.
- **The Daily strip waits `DRAG_NUDGE_MS` of inactivity**, like the in-game drag hint, via
  `useTabHint`'s `delayMs`: a player who taps Play straight away never sees it. The other
  tabs keep the short swipe-settle delay.
- **`reviewEye` is the one hint keyed to a control appearing, not to a first visit** (2026-09):
  it names the Daily card's eye, which the tab only grows once today's game is done. It needed
  nothing new in `useTabHint` — `active` is a boolean, so "on the Daily tab **and** the eye is
  on it" says itself — and it keeps the default swipe-settle delay rather than the Daily
  nudge's idle one, because the player has just walked back from their game. It shares the
  Daily strip's slot with `dailyTab`; the two cannot both apply (the first-play nudge wants no
  daily behind the player, this one wants today's board) but `useDailyTabHints` picks between
  them explicitly rather than trusting that. **Using the eye marks the hint seen**, so a player
  who taps before the strip appears is not told about it afterwards — the same rule `drag`
  follows, and it is wrapped inside the hook's `openReview` so a call site cannot forget it.
  The eye wears `animate-hint-halo` rather than the shared glow, which was not visible on it;
  see the halo bullet above for why that is the one place a box-shadow ring is allowed back.
  The copy deliberately does not name the icon ("Tap to view your completed timeline.") — the
  halo is what points.
- **The two Daily strips live in `useDailyTabHints`, not `ModeSelect`**, which hit ESLint's
  `complexity` ceiling (an error rule) the moment the second one was added inline. Same reason
  the in-game ladder is a hook rather than part of `Game`. `DailyPanel`'s `hint` prop therefore
  carries a `key`, and the panel looks the copy up from it instead of hardcoding `dailyTab`.
- **The Custom nav icon is sliders, not a cog.** A cog read as app Settings. It now matches
  the My Timeline filter button's icon; the aria-labels differ.

## Custom settings screen

**Double-tap to isolate a filter pill** (Categories, Difficulty and Eras alike). With 20
categories, isolating one used to mean tapping off 19.

- **Single tap is instant — no debounce.** The first implementation used a 250 ms timeout to
  disambiguate and felt "sticky/slow", and the double-click raced React re-renders.
- **Double-tap is detected by timestamp and applied to the _pre-tap_ state**, stored on the
  first tap. A double-tap's two toggles net to a no-op on that pill, so acting on the stored
  `before` array makes the result deterministic regardless of render timing.
- **No `onDoubleClick`** — unreliable on touch; this is a mobile-first app.
- **400 ms window.** Matches OS norms (Windows 500 ms, macOS ~400–500, WebKit touch 350) and
  sits above WebKit's threshold, while staying under 500 ms so two deliberate rapid toggles
  aren't misread. Since single tap is instant, a wider window costs no input lag.
- Accepted trade-off: a brief flicker during a double-tap as the first toggle shows before
  isolate lands.

**Settings persist across refresh** as a JSON object under `when-custom-settings`, written on
every change (not only on Play) so tweaks the player never played are still remembered. **The
seed is deliberately not persisted** — a refresh restores your filters but still deals a
different deck.

**Section headers show `n/N` selected**, or the literal `All` when everything is on, in
`text-text-muted`. Gated behind a `showCounts` prop because `FilterControls` has a second
consumer (the in-game `FilterPopup`), which has its own footer count and was left alone.

## Dev-loop trap: the service worker used to serve stale code on localhost

A session spent real time on a bug where custom settings "didn't persist" — DevTools showed
the value being written to localStorage, but a refresh showed defaults. **The persistence code
was correct from the first commit.** The repo's customised `serviceWorkerRegistration.ts` was
registering on localhost and serving cache-first, so refreshes ran a cached older bundle while
HMR pushed new code live.

Registration is now gated to production in `src/index.tsx` (`NODE_ENV === 'production'`) and
actively unregisters in development. If you ever see edits apparently not taking effect in a
dev server, check this before debugging the feature.

## Conventions — one is live, one has drifted

- **Shadows and spacing.** `shadow-sm` throughout (not `shadow-md`/`lg`/`xl`), `p-4` on modals
  for 8-point-grid alignment. Still broadly held.
- **The "14px typographic floor" is aspirational, not enforced.** A 2026-02 pass replaced every
  `text-xs` and `text-[9px]`-style size with `text-sm` and set the `ui-*` Tailwind sizes to
  14px. It has since drifted — there are **~50 `text-xs` uses in `src/` today**. Treat it as a
  preference, not a rule, and don't assume a small size is a bug.

## Historical: the December 2024 simplification audit

A `SIMPLIFICATION-FINDINGS.md` (since removed; in git history) catalogued ~675 lines of dead
code. It was **actioned** — the five
files it named (`useElasticScroll`, `Header`, `TurnBanner`, `GameOver`,
`Timeline/GhostCard`) are all gone, and its list of unused Tailwind animations no longer
matches the config. Do not use it as a current inventory.

Its "what not to change" conclusions still read sensibly and were respected: don't break up
`Game.tsx` (large but cohesive), don't add Redux or Context for an app this size, and don't
extract animation timing constants into a new file for minimal gain. (The last one was
eventually done anyway — see `src/components/Timeline/animationTuning.ts`, which earns its
keep because the `/anim-jig` harness tunes against it.)
