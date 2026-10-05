# UI & Layout

Home-screen pager, gameplay layout, and the Custom settings screen.

## Gameplay layout

Full-width vertical stack:

```
TopBar  (fixed, safe-area aware — see ../mobile-ios/index.md for pt-topbar*)
Timeline (flex-1) — spine 96px from the board column's left edge, cards aligned to it
Bottom bar (120px mobile / 140px desktop, pb-safe) — hand count + active card stack
```

- **Cards have two shapes.** Landscape on the timeline (240×80 mobile, 280×96 desktop, image
  left 40% / title right 60%); portrait in the hand (144×176 / 160×192).
- The bottom bar's drop zone id is **`bottom-bar-zone`** — the Playwright selectors depend
  on it.
- Cards are fixed-width and aligned to the spine, not stretched.
- **The board column is `96px gutter + 12px gap + 280px card = 388px`, and at ≥1024px it is
  centred rather than pinned left**. The arithmetic, the alignment invariant and the
  reason it is done with percentage padding rather than `max-width`/`mx-auto` all live in one
  place: the `BOARD COLUMN` comment in `src/index.css`. Read it before changing the gutter, the
  gap or the card width — all three feed the same `--board-*` vars, and getting it wrong
  detaches the accent rail from every row's tick. The same three classes (`board-center`,
  `board-center-item`, `board-rail`) do the job in `Timeline`, `Game`'s bottom bar,
  `GameStartTransition` and `ArchivePanel`.

## Home is a five-tab pager

`Daily · Archive · Custom · Stats · My Timeline`, driven by **both** swipe and the TopBar
buttons. One navigation model: the buttons scroll the same pager the swipe does, rather than
`navigate()`ing to separate full-page routes.

- **The order lives in one place**: the `TABS` array in `ModeSelect.tsx`. Labels, indicator
  colours, the index↔key maps and the idle pre-mount set are all derived from it, and the
  `ModePager` children must be rendered in that order. Don't add a hand-maintained mirror of
  the list.
- **Archive** (`panels/ArchivePanel.tsx`) is the past curated decks, laid out on the game's own
  timeline by the date each ran — see [../curated-themes/](../curated-themes/index.md#replaying-past-decks-the-archive-tab).
  Like every tab it has a path (`/archive`) that opens the home screen on it (see below).
- **Achievements are a section of the Stats tab, not a page or a menu link** — nothing in the
  burger menu gets found. They sit at the very bottom of Stats (`stats/AchievementsSection.tsx`,
  after the collection meter): an "Achievements" header with the live count, the unlocked badges
  newest first, and a "Show all 60" expander for the locked ones. **The locked grid mounts only
  while expanded, and badge art is prefetched only for the unlocked badges until then** — an
  always-mounted 60-card grid stalls the swipe on iOS (below). `/achievements` redirects to
  `/stats` (`pages/Home.tsx`) and keeps its `vercel.json` rewrite so old links land.
- **My Timeline is the fifth tab**, with its own path (`/timeline`) and top-bar button
  (Hourglass, "View my timeline"), not a menu link, for the same reason.
- **The one-time "new" dots sit on the buttons they belong to**: Stats (re-armed on every
  badge unlock by `useGameStatsRecorder`, cleared on visiting the tab) and Timeline. The menu
  button carries none. The state is `hasSeenNav` / `markNavSeen` / `markNavUnseen` in
  `playerStorage.ts`.
- **Six buttons fit a 320px phone at `gap-2` / `p-2`**: 6 × 38px (20px icon + 16px padding +
  2px border) + 5 × 8px gaps + 16px container padding = 284px. Seven need 6px gaps, so don't
  add a seventh without re-measuring.

- **Every tab has a path, and the path opens the home screen on that tab**:
  `/`, `/archive`, `/custom`, `/stats`, `/timeline` are one route (`/:tab?` → `pages/Home.tsx` →
  `App initialTab` → `ModeSelect` → `ModePager initialIndex`), and `ModeSelect` replaces the
  path as the player swipes so a refresh or a shared link comes back to the same tab. The
  tab↔path map is `pathForNav` / `navForPath` in `TopBar.tsx`. There are no standalone tab
  pages; the panel components in `src/components/panels/` are mounted by the pager. **The top
  bar shows the same five nav buttons on every non-game page.**
- **`TopBar` takes an optional `onNavClick`**: when provided the buttons scroll the pager,
  when absent they navigate to the tab's path. The in-game bar
  (`Game.tsx`) deliberately shows Home and Menu only.
- **Heavy tabs lazy-mount** (on first visit or at idle, whichever is first): Stats and
  Timeline. Idle pre-mount rather than mount-on-swipe because mounting mid-swipe stalls the
  iOS scroll-snap gesture. `TimelinePanel` additionally holds its (unvirtualised) timeline back
  until the tab has been shown once, and `StatsPanel`'s badge art waits for `active` too.
- A vertically-scrolling panel nests inside the horizontal pager with **no gesture conflict**.
  Don't re-litigate it.
- Custom's active nav colour is `accent-secondary` (teal) to match that screen; every other
  tab, Archive included, is `accent` (gold).
- The indicator shows only the active tab's label, with all labels stacked in one grid cell
  (inactive ones `invisible`) so its width never shifts as you navigate.

## The Daily's eye: reopening today's finished board

Once the daily is played, an eye sits beside **Challenge a Friend** on the hero card and reopens
the board the player built, so the cards can be turned over and read. The long-form prose is what
makes this worth having: without it, a finished board is a score.

- **It rehydrates the real game screen rather than rendering a review of its own.** `App` already
  routes `phase === 'gameOver'` to `Game`, `Timeline` already takes `failedPlacements` and draws
  the tombstones, and `GameOverControls` is already the daily's Share + Home bar. So the work is
  restoring the state (`utils/dailyBoard.ts` → `useWhenGame`'s `enterReview`), not building a
  screen. A bespoke overlay would be a second timeline surface to keep in step with the
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
  already uses, with no cleanup pass and no timer. Slugs missing from the catalogue are
  skipped on restore, and a board with nothing left resolves to null, which is what the eye's
  visibility is gated on: `ModeSelect` restores up front so the button is never a no-op.
- **The prose gate needs no new insertion point.** `shouldShowYearInPopup` (`Game.tsx`) tests
  membership of `timeline` / `failedPlacements`, which a restored board satisfies by
  construction — and legitimately, since every card on it was placed. See
  [../event-detail/](../event-detail/index.md) for why that gate is load-bearing.
- **A one-shot strip names it the first time it is on screen** (`reviewEye`), since the eye is
  an unlabelled icon. See the hints section above for how it is gated and why it shares the
  Daily strip's slot.
- `useSaveDailyResult` is its own hook file because `useWhenGame.ts` is on the `max-lines`
  ceiling, the same squeeze `Game.tsx` is under for `complexity`.

## Timeline progression: the rail

A plain board looks identical at 5 cards and at 30, so a long timeline is a bigger number rather
than a better-looking thing; the rail is the answer. It lives in `Timeline.tsx`, so it is on the
Daily, Archive, Custom and My Timeline alike. `/timeline-lab` is a dev-only harness (no
`vercel.json` rewrite, no in-app link) that mounts the _real_ `Timeline` with a seeded board:
`?n= &ghost=earlier|later &over=0 &slowmo= &row= &theme= &bare=1`. There is no second
implementation.

**The era-palette family is rejected.** An eight-colour era wash, era chapter headings, an era
spine, a history coverage bar, a colour-coded rail and rail beads were all built on real data
and shot at 5 / 14 / 30 cards, and the verdict is that they are _an example of what not to do_
and must not be the basis of anything. Do not rebuild them. The standing rule:
**a new mark on the board is allowed only if it is typographic and monochrome — a hairline, a
figure set in Playfair. Never colour coding, never a badge or a bar.**

**A tinted background is rejected too.** A warm → cool gradient behind the board's scroll
content, two tones a few percent either side of `--color-bg` with a fixed-length crossfade
centred on the board (so the progression is in how much of the sweep a board uncovers), works as
designed, and the clean board still looks better. **Do not build it.** What remains:

- `src/utils/yearScale.ts` — the year → 0..1 log-of-time-before-now scale. /timeline-lab uses it
  to spread its sample draw across history.
- The board's edge fade is a 48px `from-bg` gradient scrim top and bottom with the
  "↑ Earlier" / "Later ↓" labels on it. A flat `--color-bg` scrim works only because the page is
  untinted: a tint would force a mask over the board's own content plus a `text-shadow` halo on
  the labels.
- The scroller carries `data-board-scroller` as `scripts/tick-landing-probe.js`'s handle on the
  scrolling element, since `board-center` is also on the hand bar and on ArchivePanel.

The board has the rail, and the two lit things that ride it:

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
is invisible almost exactly where it matters: the dragged card is centred on the pointer, and
the pointer sits on the insertion boundary, which is where the marker is — so the overlay
(`z-index: 999`) covers it for most of a drag, and the "Earlier"/"Later" scrims cover it
near the board's top and bottom as well. It would read only at the _ends_, where the rail's
growth extends a whole row beyond the card. Rendering it to `body` at `z-index: 1001` in viewport
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

The moment that carries the idea is the **extension preview**: while a drag hovers past either
end, the ghost row gets a rail segment that springs out of the existing line — `scaleY` from
the anchored edge, never a fade — with a glowing tip that settles. The spring is deliberately
under-damped (ζ ≈ 0.6, peak ×1.10 at ~225ms, settled ~450ms); a critically damped version
arrives in ~150ms and nothing registers as having happened. The rail does **not** draw its own
tip — the travelling marker is parked there when the gap is an end, so there is one
glowing thing and one code path.

### The landing: the dot becomes the tick

At the end of a drag the marker **turns into the tick** on the row the card lands as. The two
are neighbours: the board column invariant puts the dash
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
- **`animate-entrance` is on the card slot, not the row.** A row-level opacity fade
  composites onto the gutter, so it would fade the landing dash up from zero. The row does not
  arrive as a block: the card slides up, the year pops, the tick grows out of the marker.
- **The rail's reach is a number, not a flag.** Each end's extension is a MotionValue
  owned by `useRailExtension`, and the ghost row and the retract stub both just paint it. A
  per-end "does this still owe its growth" boolean cannot express the two things a drag
  actually does: leave the board halfway through a growth (the retract would have to invent a
  length to start from) or turn back halfway through a retract (the growth would restart from
  nothing, so the rail snaps shut before re-opening). As one number, every rule falls out
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
  - In `/timeline-lab`, `?over=0` (the "Off the board" chip) unties `isOverTimeline` from
    `isDragging` so the lab can reach this state, and `?slowmo=` composes with it.
- **The gap a drag is previewing draws no dash at all** (`TimelineTick`'s `variant="none"`).
  A faint one would give the landing nothing to reveal: the dot would flatten into a tick that
  had been sitting there the whole drag, and the board would show the answer's position before
  the card is dropped. The only mark at the gap is the travelling marker, and the dash's first
  appearance _is_ the landing. Two things this depends on:
  - **The footprint stays.** `variant="none"` keeps the outer 12×4 box and drops only the painted
    inner one. The gutter is a fixed 96px column that _ends_ in that box, so omitting the element
    would shove the ghost row's `?` 12px right, against the rail, on every gap the drag previews.
    `TimelineTick.test.tsx` pins both halves of that.
  - **There are two ghost render sites**, and a change to one that misses the other is invisible
    until a drag happens to hover a gap that already holds a tombstone: `GhostCard` in
    `Timeline.tsx` (the inserted row) and `TombstoneRow`'s `ghostEvent` branch (the ghost takes
    the tombstone's row instead of inserting one). Both draw `none`.
- The dev rigs cover the drag but not the drop. `/anim-jig` drives the board with
  `isDragging={false}`, so no marker exists there at all. `/timeline-lab?ghost=…` _does_ fake a
  real drag — `isDragging` + `insertionIndex` straight onto `Timeline`'s props — so the ghost row
  and the marker are both live and it is the right place to check what the gap looks like. Neither
  can commit a placement, so the landing itself still sits out; a null origin is the safe failure.
  `scripts/tick-landing-probe.js` plays a real game instead and samples the geometry per frame;
  stills are useless for the morph, because the screenshot pipeline lags a CPU-throttled page
  badly enough to miss 350ms. They are fine for the drag, which holds still.

Traps that cost time:

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
- **A spring does not know which of its units you can see.** Animating `borderRadius` from
  `9999` to `0` paints the same capsule as any sufficient radius at rest, but not in flight: a
  spring carrying a value 9999 units is still ~117 units from home at the moment the size has
  arrived, and on a 12×4 dash anything above 2 is a _full_ capsule. The tick reaches its resting
  shape, stays a pill, goes square for a frame, then rings back into a pill — a notch of
  daylight at the join with the rail's flat edge, opening and filling itself a beat after the
  landing. `DOT_RADIUS` is `DOT_W / 2` — the geometry's own units, so the rounding lands with
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
  bugs happen. What finds them is a CDP screencast of a real drop
  (`Page.startScreencast`, ~60fps — note its frames come back at CSS resolution, not the
  context's `deviceScaleFactor`) cropped to the gutter, plus a per-frame read of the landing
  row's own dash including its computed `border-radius`.
- **An animation whose element rests in the loud state is a landmine.** The placement vignette
  (`.vignette-overlay` + `animate-vignette` in Game.tsx) rests at `opacity: 0`. Without a
  resting `opacity` or an `animation-fill-mode`, the element reverts to opacity 1 the moment
  `vignettePulse` completes — a full-strength flash, brighter than the pulse — and whether
  anyone sees it is a race against Game.tsx's unmount timeout, which any extra per-placement
  work on a phone loses. Check for the same shape anywhere else: an animation that ends
  somewhere other than its element's base style, on an element that outlives it.
- **Anything that measures the board will loop forever if you let it.** Calling
  `buildTimelineRows` inline on every render gives the rows array a new identity each time → new
  measure callback → effect → `setState` → render. It is memoised, which is what keeps
  `useInsertionMarker`'s ResizeObserver from driving that loop. The symptom is React error #185
  and a blank board.
- **Don't mask the end segments back to the tick**: it makes the line stop dead on the first
  and last card, and reduces a one-card board to a dot. It also hits a CSS trap worth knowing —
  a one-card board is `first && last`, and two `mask-image` declarations cannot both apply, so
  the top and bottom caps silently fight. Letting each segment fill its row needs no masks.
- **A 320ms spring is quicker than a Playwright screenshot round-trip**, so every frame came
  back settled. `Animation.setPlaybackRate` over CDP did _not_ reach framer-motion's animation
  even though the WebAnimation is visible to `Animation.enable`. What works is `TimelineRail`'s
  `timeScale` prop (`Timeline`'s `railTimeScale`, the lab's `?slowmo=`): scaling a spring's time
  by k is exactly `stiffness/k²` and `damping/k`, so a slowed capture shows the real curve.
  `scripts/timeline-lab-shots.js` also reads the segment's live `scaleY` at each capture, so the
  strip's captions are measured rather than inferred from the wall clock — off the
  `data-rail-extending` marker, not the first `.tl-rail` in the DOM, which is a static row
  (a flat ×1.00) whenever the board is growing at its later end.
- **Changing a lab URL param with `page.goto` remounts the tree, so nothing animates.** Use
  `history.pushState` + a synthetic `popstate`; React Router picks it up in place.
- Row decoration keyed off `event.color` is a dead end: those values are image-derived and
  almost all dark brown, so anything painted with them reads as dirt.

`Timeline`'s body is at the `max-lines-per-function` ceiling, which is why the two wave memos
and the wake-delay memo live in `Timeline/useTimelineWaves.ts` and `Timeline/useWakeDelays.ts`,
and the row renderers are split out.

## Onboarding hints

The app teaches itself through single-line contextual hints tied to the moment of need,
dismissible and re-findable; there is no guided tutorial. Research (Nielsen Norman on onboarding
tutorials and mobile coach marks; game FTUE guidance) says up-front walkthroughs get skipped
and do not improve performance, while hints of this shape do.

- **One storage object, `when-hints-seen`** (`playerStorage.ts`: `hasSeenHint` /
  `markHintSeen` / `resetHintsSeen`, keys `drag`, `wrong`, `correct`, `closeEnough`, `tapCard`,
  `stats`, `swap`, `dailyTab`, `archiveTab`, `customTab`, `statsTab`, `timelineTab`,
  `reviewEye`). Switch-based
  accessors, because the `security/detect-object-injection` rule forbids indexing by a
  variable key. Note `stats` (the in-game counter hint), `statsTab` (the home tab's strip) and
  `NavKey`'s `stats` (the nav dot) are three different things that share a word; don't
  de-duplicate them. **`timelineTab` also counts as seen when `when-timeline-intro-seen` is
  `'1'`**, so an upgrade does not re-show it; that key is read-only and the fallback is tested.
- **"Reset Hints" in the burger menu** calls `resetHintsSeen()`, for QA and for a player who
  wants the explanations back. A plain row like every other action: it closes the drawer and
  says nothing else — no confirm and no confirmation text, because nothing is lost.
  `resetHintsSeen` also **dispatches
  a `when-hints-reset` event** (`subscribeHintsReset`): the menu is reachable mid-game via
  `TopBar`, but `useOnboardingHints` reads storage once per mount, so without the broadcast a
  reset during a game would silently do nothing until the next one.
  **`useTabHint` has to listen to that broadcast too.** Its effect reads storage only when its
  deps change. `active` is one of those deps, so the strips on tabs you are not standing on
  re-arm by themselves the moment you navigate to them, and **the only strip that would stay
  away is the one on the tab the player is already on when they open the menu** — in practice
  the Daily tab and its eye hint. It bumps a nonce in the dep list and re-arms in place.
  `useTabHint.test.ts` pins it.
- **An explicit reset waives the Daily nudge's lifetime gate.** `wantsFirstDailyNudge`
  gates on `gamesPlayed.daily === 0` so an upgrade never tells a regular "your first" — but a
  reset is not an upgrade, it is the player asking to be shown the explanations again.
  `useDailyTabHints` latches the broadcast for the
  session and waives the counter. `todayResult` still gates it either way: with today's game
  done the hero card carries Share and the eye, so the strip would point at a Play button that
  is not there.
- **How to Play is menu-only and never shown unasked.** It is `HowToPlayModal` on `ui/Modal`
  (`reveal` layer so it clears the menu drawer), opened from the menu's always-present "How to
  Play" and from nowhere else. Auto-opened rules aren't read; the hint strips teach the loop at
  the moment each part matters. Don't add a permanent "How to play" link under the Daily Play
  button (it costs the hero image 48px for every player) or a "The tabs" section inside the
  modal (not how to play, and said elsewhere). It is the rules only, and `GameRules` lives
  there, not in `Menu.tsx`.
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
  (`DRAG_NUDGE_MS` after play starts) is the only timer-driven hint; `drag` is marked on
  the first drag whether or not the strip ever showed. `swap` needs a hand worth cycling
  and either a miss or four placements, so a perfect run reaches it. An outcome that lands on
  the game-ending placement is discarded unmarked and returns next game.
- **Do not gate a hint on a timer fed by a churning boolean.** An eligibility boolean flips on
  every drag frame and animation transition, so an effect that restarts a quiet-gap timer on
  each flip never fires — and a Playwright script that pauses between moves hides it. Only two
  `setTimeout`s exist: the idle nudge's
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
  is the class of change that stalls the iOS swipe. Custom is `panels/CustomPanel.tsx` like the
  other four tabs, so every strip has an `active` prop to gate on.
- **The nudge animations** are `animate-hint-lift` (card bob, for `drag`) and one shared
  `animate-hint-glow` (a gentle swell plus brightness) with four homes, in `index.css`: the
  swap button, which is also filled gold; the Daily Play button while the start-screen strip
  is up; the top hand card's wrapper for `tapCard`; and the bottom-left counter for `stats`.
  The counter also takes `bg-border` while it glows — it is transparent otherwise, and the
  animation is transform and filter only, so without a surface to swell there is nothing to
  see. Every hint is stored in `when-hints-seen`; don't add one outside it.
  Transform and filter only, never opacity (a fading button reads as disabled): a hint-scale
  box-shadow ring is invisible on a phone, and a bigger swell-and-fade reads as garish. Under Reduce Motion the bob is off and the glow falls back to a
  motion-free brightness blink, so the strip still points at something.
- **`animate-hint-halo` is the deliberate exception to that, and the box-shadow verdict does not
  carry to it.** `hintGlow`'s `brightness(1.12)` lifts a near-white `bg-surface` button by almost
  nothing, which is exactly what the Daily eye is, so the shared glow does not land on a real
  phone. A hint-scale ring fails; this app's gold glows that _do_ read are far heavier (`successGlowGolden` at `0 0 30px 15px`, the two-layer `.tl-rail-tip`). The halo is
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
- **`reviewEye` is the one hint keyed to a control appearing, not to a first visit**:
  it names the Daily card's eye, which the tab only grows once today's game is done. It needs
  nothing new in `useTabHint` — `active` is a boolean, so "on the Daily tab **and** the eye is
  on it" says itself — and it keeps the default swipe-settle delay rather than the Daily
  nudge's idle one, because the player has just walked back from their game. It shares the
  Daily strip's slot with `dailyTab`; the two cannot both apply (the first-play nudge wants no
  daily behind the player, this one wants today's board) but `useDailyTabHints` picks between
  them explicitly rather than trusting that. **Using the eye marks the hint seen**, so a player
  who taps before the strip appears is not told about it afterwards — the same rule `drag`
  follows, and it is wrapped inside the hook's `openReview` so a call site cannot forget it.
  The eye wears `animate-hint-halo` rather than the shared glow, which is not visible on it;
  see the halo bullet above for why that is the one place a box-shadow ring is allowed back.
  The copy deliberately does not name the icon ("Tap to view your completed timeline.") — the
  halo is what points.
- **The two Daily strips live in `useDailyTabHints`, not `ModeSelect`**, which is at ESLint's
  `complexity` ceiling (an error rule) and cannot take them inline. Same reason
  the in-game ladder is a hook rather than part of `Game`. `DailyPanel`'s `hint` prop therefore
  carries a `key`, and the panel looks the copy up from it instead of hardcoding `dailyTab`.
- **The Custom nav icon is sliders, not a cog.** A cog reads as app Settings. It matches
  the My Timeline filter button's icon; the aria-labels differ.

## Custom settings screen

**Select all and Clear on every filter group.** A new player cannot pick a single category
without them: the double-tap below is undiscoverable, and a bare `All` / `n/N` header looks like
a control but is a label. Following the usual multi-select patterns (Material filter chips, NN/g
on checkboxes and hidden gestures), the page keeps its include-list model (everything on by
default) and adds the convention that goes with it:

- **`FilterGroupHeader.tsx`, shared by every group, the Timeline popup and each region in the
  country picker.** The count sits beside the label (`CATEGORIES · 2/21`) and **Select all** /
  **Clear** sit on the right, each disabled when it would change nothing. They are verbs on
  purpose: a button labelled `All` reads as a status. "Science only" is Clear, then Science;
  "everything but Sports" is one tap.
- **Ticked chips, not solid ones (`FilterPill.tsx`).** Selected is a light blue tint
  (`.bg-pill-on`) with a teal border and a leading tick; partial is a lighter tint with a dash;
  off is the white outline with a red cross. Solid `bg-accent-secondary` is the Play button's
  colour, so a page of solid selected chips reads as buttons, and with every chip on there is
  nothing to compare against to tell what "filled" means. Every chip has `aria-pressed`.
- **Nothing moves when you tap.** Every state carries an icon in the same slot with the same
  padding, so a chip never changes width and its label never shifts. Dropping the icon when off
  and padding the gap keeps the width but jumps the label sideways on every tap, which reads as
  too jumpy; hence the red cross. A width change would also reflow the 21 wrapped categories and land a double-tap's
  second tap on a different chip. The padding is tight so the four difficulty chips share one
  row on a 375px phone, measured in Inter.
- **An empty group is a normal step, not an error.** Its prompt ("Pick at least one category") is
  muted and sits on a line that is always reserved under the chips (blank otherwise), so it
  appearing never pushes the groups below down; that line carries most of the gap between
  groups. Play stays disabled, and the group is **neither saved nor shareable**: settings are not
  written while a group is empty (an empty group fails `normalizeCustomSettings`, which would
  reset every saved setting on the next load), and the share input is left empty with Share
  disabled, because a code can't encode an empty group.
- **The double-tap stays**, undocumented, as a shortcut for those who find it.

**Double-tap to isolate a filter pill** (Difficulty, Categories, Eras and Regions alike, and the
countries of a region in the country picker; `usePillTap.ts`). A second double-tap on the lone
pill restores all. Without it, isolating one of 21 categories means tapping off 20.

- **Single tap is instant — no debounce.** A disambiguation timeout (250 ms) feels
  "sticky/slow", and a double-click handler races React re-renders.
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

**The `n/N` / `All` counts are gated behind a `showCounts` prop** because `FilterControls` has
a second consumer (the Timeline tab's `FilterPopup`), which has its own footer count; Select all
and Clear show in both.

## Dev-loop trap: the service worker on localhost

Service-worker registration is gated to production in `src/index.tsx` (`NODE_ENV ===
'production'`) and actively unregisters in development. A cache-first worker on localhost serves
a cached older bundle on refresh while HMR pushes new code live, so a correct change (persisted
settings, say) looks broken after a reload. If edits apparently don't take effect in a dev
server, check this before debugging the feature.

## Conventions

- **Shadows and spacing.** `shadow-sm` throughout (not `shadow-md`/`lg`/`xl`), `p-4` on modals
  for 8-point-grid alignment.
- **The "14px typographic floor" is a preference, not a rule.** The small `ui-*` Tailwind
  sizes are 14px, but `text-xs` is in common use across `src/`, so don't assume a small size is a bug.
- **What not to change:** don't break up `Game.tsx` (large but cohesive) and don't add Redux or
  Context for an app this size. Animation timing constants live in
  `src/components/Timeline/animationTuning.ts`, which the `/anim-jig` harness tunes against.
