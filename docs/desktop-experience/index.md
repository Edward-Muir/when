# Desktop / laptop experience — audit and fix list

**Status: A1, A2 and A3 are FIXED (2026-09, "centre the game board at desktop widths").
Everything else in this document is still findings only**, kept so a future session can pick
the work up cold. Fixed items are marked ✅ in place, with what actually shipped.

The game is excellent on a phone and a mess on a laptop. This is an audit of _why_, done by
driving the real app in a 1440×900 Chromium window (plus 900×700 and 1920×1080), playing the
daily to a 27-card timeline and a custom game to game over, and reading the layout back out of
the DOM. Every claim below was measured in the running app, not inferred from source.

---

## The one root cause

**The player-facing app has no breakpoint above `sm:` (640px).**

- `tailwind.config.js` defines no custom `screens`, so the defaults apply: `sm` 640, `md` 768,
  `lg` 1024, `xl` 1280.
- Across all of `src/`, `lg:` appears **once** and `md:` **twice** — and all three are in
  unlinked maintainer pages (`CardsPreview`, `AnimJig`). There is **not a single `md:`/`lg:`
  utility in any player-facing component**, and no `min-width` media query in `index.css`.
  _(As of the A1 fix there is now exactly one: the `@media (min-width: 1024px)` block that
  centres the board. Everything else below still holds.)_

So a 1440px laptop, a 1920px monitor and a 640px tablet all get **byte-identical layout**. The
design's natural width is roughly 600–900px (at 900×700 the game actually looks fine); above
that, nothing adapts and the shortfall shows up as ~15 separate-looking symptoms. Almost every
finding in section A and C below is that one fact wearing a different hat.

**Measured:** at 1440×900 the play column ends at **x = 388px — 27% of the window**. The other
73% is empty background.

### Guardrails for whoever fixes this

Mobile is the primary platform and the iOS Capacitor shell loads the live site, so a desktop
regression on phones ships instantly to the App Store build. Therefore:

- Gate every change behind a **new `lg:` (1024px)** step. Do not change the base or `sm:`
  classes. Anything ≤1023px must render pixel-identically to today.
- Verify at **375 / 402 / 640 / 1024 / 1440 / 1920** before pushing.
- `docs/driving-the-app-with-playwright.md` is the runbook; the drag recipe there works
  unmodified at desktop viewports (this audit used it).

---

## A. Gameplay — the worst of it

### A1. ✅ FIXED — the board was pinned to the left edge and used a quarter of the window

The timeline column, the year gutter, the hand and the counters all sit in `0–388px`. On a
1920 monitor it's 20%. It doesn't read as "a mobile game on a big screen", it reads as broken.

Where:

- `src/components/Game.tsx:345` — root is `h-dvh flex flex-col` with no `max-w` and no
  `mx-auto`.
- `src/components/Timeline/Timeline.tsx:400` — the accent rail is `absolute left-24`, pinned to
  the container's left edge.
- `src/components/Timeline/Timeline.tsx:413` — rows are `flex flex-col items-start w-full`.
- `src/components/Timeline/TimelineEvent.tsx:295` and `src/components/Card.tsx:47` — the
  landscape card is hard-capped at `sm:w-[280px] sm:h-[96px]`, with nothing above `sm:`.

**(a) Centre the existing column — shipped.** The board is centred at ≥1024px; card size is
unchanged. See the `BOARD COLUMN` comment in `src/index.css` for the mechanism and the
alignment invariant. Two things that comment explains and that are easy to get wrong:

- **It is `padding-left` on the scroller, NOT `max-width` + `mx-auto` on the rows.** An earlier
  draft of this doc prescribed `lg:mx-auto lg:max-w-[560px]` on a shell around the timeline;
  **that would have been a bug.** The scroller is the node carrying `useDroppable`
  (`timeline-zone`), and a `max-width` there shrinks the drop zone — dropping in the empty space
  beside the board would stop working. Padding is inside the border box, so the measured rect
  stays full-width.
- **Percentage padding, so the basis is the containing block, not the scroller's content box.**
  `.timeline-scroll-vertical` styles `::-webkit-scrollbar`, which opts Chromium out of overlay
  scrollbars, so the scrollbar eats 8px. Centring _inside_ the scroller would sit the board 4px
  off the rail — and because `Timeline.tsx` swaps to `overflow-hidden` while dragging, the board
  would jump 4px at every drag start.

**(b) A real desktop layout — still open, the ambitious version.** Wider cards (`lg:w-[420px]`
and a wider gutter), hand promoted from a bottom strip to a side rail so the drag is short and
horizontal, counters and streak given their own panel. This is the version that makes the space
earn its keep, and the one that also fixes A4. Card widening was deliberately excluded from (a):
text-clamping, image crop and the 35-char name cap were all tuned at 280px.

### A2. ✅ FIXED (by A1) — fixed labels and controls were centred on the viewport, not the board

Because the board is left and the chrome is centre, several elements float in dead space
350–560px away from the thing they describe:

| Element                                                      | Where                                               | At 1440                            |
| ------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------- |
| `↑ Earlier`                                                  | `Timeline.tsx:394` (`left-0 right-0 text-center`)   | x≈720, board ends at 388           |
| `Later ↓`                                                    | `Timeline.tsx:473`                                  | same                               |
| Onboarding hint pill                                         | `HintStrip.tsx:40` (`inset-x-0 ... justify-center`) | centred over empty background      |
| Game-over Restart / Home / Share                             | `GameOverControls.tsx:40` (`justify-center`)        | centred under an empty half-screen |
| Every popup (`GamePopup`, `StatsPopup`, `Menu`, card detail) | `w-[85vw] max-w-[340px]` centred                    | opens 400px right of the board     |

Fixed by A1 with **zero edits to any of these elements**, and that is the point: because the
board's centre is now the viewport's centre by construction, everything already centred at
`W/2` became board-centred for free. Do not "fix" these individually — pinning a label to the
board column would break the relationship mobile has, where the label sits at the centre of the
(clipped) column rather than over the card.

### A3. ✅ FIXED (by A1) — the game-start scrim read as a rendering glitch

`GameStartTransition.tsx:120-133` paints `.scrim-band` — a full-width horizontal band of
`backdrop-blur-xl` + wash, masked to fade above and below, with the "Loading events from across
time…" title centred inside it. On a phone the band and the title coincide. On a laptop the
band's blur lands on the **cards at the left**, while the title sits over **empty background at
the centre**. What you see is a blurred stripe across a sharp deck of cards, with unrelated text
floating beside it.

This was not a bug in `.scrim-band` — the band was doing exactly what its comment in
`src/index.css` documents. It was A1 again, and it was fixed by centring the transition's card
column (`GameStartTransition.tsx`, same two classes as `Timeline.tsx`). **The band itself was
correctly left alone**: it is masked on the vertical axis only, so it is a full-width horizontal
band by design; giving it the board's width would hand it the visible left/right edge the design
exists to avoid.

### A4. The drag is long, held, and hugs the left edge

On a 900px-tall laptop the hand sits ~700px below the top of the timeline, so every placement is
a long press-and-hold drag with the pointer pinned to the far left of a wide screen. It works
(the pointer-based recipe in the Playwright doc drives it fine), but it's the single most
fatiguing thing about playing on a laptop, and it's ~30 drags a game.

Fixes, either or both:

- **Click-to-place** as a desktop-only alternative: click the hand card to arm it, click a gap
  to drop. Cheap, no drag physics, and it also gives A5 most of what it needs.
- A1(b)'s side-rail hand, which makes the drag short and horizontal.

### A5. There is no way to play with a keyboard, and the ARIA says there is

`useDraggable` puts these on the hand card (verified in the live DOM):

```
role="button"  tabindex="0"  aria-roledescription="draggable"  aria-describedby="DndDescribedBy-0"
```

dnd-kit's default description behind that id tells a screen-reader user to press space to lift
the item. But `Game.tsx:220-228` registers only `JsonCvPointerSensor` and `JsonCvTouchSensor`
(`src/utils/dndSensors.ts`) — **there is no `KeyboardSensor`**. Verified: focusing the hand card
and pressing Space / ArrowDown / ArrowDown / Enter places nothing; the timeline length does not
change.

So the app announces a keyboard affordance it does not implement. Fix: either add
`KeyboardSensor` with a coordinate-getter that steps the insertion index card-by-card (the
insertion model is already index-based, in `useDragAndDrop`), or implement A4's click-to-place
and make Enter/Space drive it, and override `screenReaderInstructions` to match whatever you
ship.

### A6. The hand card is the _last_ tab stop, behind every placed card

Tab order in game (measured at 6 placed cards): wordmark "Go home" → nav "Go home" → "Open menu"
→ every timeline card in order → … → hand card. At a 27-card timeline that is 30 tab presses to
reach the only control that does anything. Fix: give the hand card a low positive tab position
in the DOM order or move the bottom bar ahead of the scroll region, once A5 makes it worth
reaching.

---

## B. Interaction feedback — desktop's primary channel is dead

### B1. 24 player-facing `hover:` rules compile to nothing ★ high impact, cheap fix

This is the repo's documented Tailwind opacity-modifier trap (`CLAUDE.md` → Styling) landing
squarely on the one platform where hover is how a UI says "I'm a control".

**Verified in the running app**, not inferred: `.hover\:bg-accent\/90`, `.hover\:bg-border\/50`,
`.bg-accent\/20`, `.text-text-muted\/70` and `.bg-border\/30` are **absent from the stylesheet
entirely**. Measured `getComputedStyle` before/after hover:

| Control                                        | Hover result                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| **Play Daily Challenge** (the primary CTA)     | **no change at all**                                 |
| Difficulty chips (Easy/Medium/Hard/Expert)     | no change                                            |
| All 20 category chips                          | no change                                            |
| **Play · N events**                            | no change                                            |
| Pager dots                                     | no change                                            |
| Game-over Restart / Home / Share               | no change                                            |
| Menu rows, counters button, TodaysLongest rows | no change                                            |
| TopBar nav + menu buttons                      | ✅ changes — they use `hover:bg-border`, no modifier |

The TopBar is the only thing on the site that responds to a mouse.

The 24 player-facing offenders (there are 5 more in unlinked maintainer pages):

```
src/components/CustomGameSettings.tsx:154  hover:bg-border/70
src/components/CustomGameSettings.tsx:161  hover:bg-border/70
src/components/CustomGameSettings.tsx:177  hover:bg-accent-secondary/90
src/components/CustomGameSettings.tsx:248  hover:bg-accent/20
src/components/DailyCta.tsx:31             hover:bg-accent/90
src/components/DailyReminderPrompt.tsx:72  hover:bg-border/50
src/components/FilterControls.tsx:34       hover:border-accent-secondary/50
src/components/FilterPopup.tsx:76          hover:bg-accent/90
src/components/Game.tsx:60                 hover:bg-border/80
src/components/Game.tsx:66                 hover:bg-accent/90
src/components/GameOverControls.tsx:45     hover:bg-accent-secondary/90
src/components/GameOverControls.tsx:59     hover:bg-accent/90
src/components/GameOverControls.tsx:69     hover:bg-border/50
src/components/HowToPlayModal.tsx:123      hover:bg-accent/90
src/components/LeaderboardSubmit.tsx:94    hover:bg-accent/90
src/components/Menu.tsx:116                hover:bg-border/50
src/components/Menu.tsx:156                hover:bg-border/50
src/components/PlayerInfo.tsx:216          hover:bg-border/50
src/components/ReportIssueButton.tsx:79    hover:bg-surface/40
src/components/ShareStepPopup.tsx:86       hover:bg-accent-secondary/90
src/components/TodaysLongest.tsx:56        hover:bg-surface/60
src/components/UpdatePopup.tsx:48          hover:bg-border/50
src/components/UpdatePopup.tsx:54          hover:bg-accent/90
src/pages/Support.tsx:20                   hover:bg-accent/90
```

Fix, per the precedent already in `src/index.css` (`.bg-player-row`, `.scrim-band`): add a small
set of `color-mix()` hover utilities — e.g. `.hover-accent-90`, `.hover-surface-tint` — and
replace the dead classes with them. Do **not** just delete the modifiers (`hover:bg-accent`
is a no-op, the element is already `bg-accent`). Wrap them in `@media (hover: hover)` so a
touch device doesn't get a sticky hover state after a tap.

Verify with the recipe in `CLAUDE.md`: build, then
`grep -o '\.hover-accent-90{[^}]*}' build/static/css/*.css`.

### B2. Press feedback is `active:scale-95` only — a touch idiom

Combined with B1, a laptop user gets **zero** feedback until the mouse button is already down.
Every control feels inert. Fixing B1 fixes most of this; consider also a `lg:` cursor/elevation
treatment on the cards.

### B3. Focus rings are the browser default

Measured: `outline: auto 1px rgb(16,16,16)` on every button, `box-shadow: none`. There is no
`focus-visible:` utility anywhere in `src/`. A 1px near-black ring is thin on light mode and
effectively invisible in dark mode. Fix: one `:focus-visible` rule in `index.css` using
`--color-accent` with a 2px offset ring.

---

## C. The home pager at desktop widths

### C1. Off-screen pager panels stay in the tab order ★ real bug, cheap fix

`ModePager.tsx:97-104` renders all five panels side by side in a scroll-snap track; none get
`inert` or `aria-hidden`. Measured focusable counts per panel: **2 / 0 / 38 / 137 / 1**.

Verified: from the Daily tab, eight Tab presses land on the "Easy" difficulty chip at
**x = 3437** — two pages off-screen. The keyboard user is then trapped in 137 invisible controls,
and the browser's scroll-into-view fights the snap track.

Fix: `inert` (with an `aria-hidden` fallback) on every panel except `activeIndex`. Small, safe,
independent of everything else here.

### C2. Horizontal trackpad scroll silently changes tab _and_ rewrites the URL

Verified: a single `wheel(deltaX: 400)` anywhere on the page navigated `/` → `/custom`. On a
Mac trackpad, horizontal deltas leak out of ordinary two-finger vertical scrolling constantly,
so the app changes tabs while you're reading. Fix: at `lg:`, either lock the track
(`overflow-x-hidden` + drive it only from `scrollToPage`) or debounce/threshold the
`onScroll` → `onIndexChange` → history write.

### C3. The swipe metaphor has no desktop affordance

Panels are `w-full`, so the "sliver of the neighbour peeks" affordance the component's own
doc-comment describes never happens above phone widths — there's nothing to indicate the pages
are side by side. The in-page control is the dot row, which is a phone idiom and (per B1) has no
hover. The TopBar tabs do work and are the real desktop navigation, so the dots are largely
redundant there. Fix: at `lg:`, hide the dots or render the five tabs as a labelled tab bar.

### C4. Every panel's content is a 384px column in a 1440px window

`max-w-sm` (24rem = 384px) on `ModeSelect.tsx:433`, `StatsPanel.tsx:100`,
`ArchivePanel.tsx:79`, `CustomPanel.tsx:21`, `TimelinePanel.tsx:98`. Panels that would
genuinely use the width don't get it:

- **Custom**: 20 category chips wrap to 8 rows; two or three columns at `lg:` would fit on one
  screen.
- **Stats**: the four stat tiles wrap their labels ("Longest / timeline") inside a 2-col grid
  while 1000px sits empty; the "Your Year" heatmap is squeezed.
- **Archive / Timeline**: single-column lists that want a grid.
- **Daily**: the hero card is a 360×570 portrait, so on a 900px-tall laptop the Play button is
  near the fold with nothing else on screen.

Fix: `lg:max-w-3xl` (or per-panel) plus `lg:grid-cols-*` on the chip and tile grids.

### C5. Empty states span the full window while everything else is 384px

On `/archive` and `/timeline`, the empty-state body text runs edge-to-edge across 1440px ("A
curated daily appears here the day after it runs — come back and beat your score."), directly
under a 384px hint pill. It's the one place the width _is_ used, and it's used wrongly. Fix:
constrain to the same column.

---

## D. Smaller things

- **D1. Two "Go home" buttons in game, same `aria-label`.** `TopBar.tsx:195` (the "When?"
  wordmark, x≈16) and `TopBar.tsx:238` (the nav icon, x≈1348) both announce as "Go home", and
  they do different things: the wordmark calls `onHomeClick` directly, the icon goes through
  `handleNav`. Give the wordmark `aria-label="When? — back to home"` or drop its button role.
- **D2. Touch-only copy.** The game-over popup says "**Tap** to continue"; the Timeline tab hint
  says "**Tap** the sliders to filter it"; `HowToPlayModal` and `hintCopy.ts` are written for
  fingers throughout. Neutral wording ("Continue", "Use the sliders…") covers both.
- **D3. The in-game counter cluster is tight.** `Game.tsx:410` gives it a `w-24` (96px) box; at a
  27-card timeline with a 26 streak, "📏 27 ⚡ 26" fills it to ~86px. Three digits on both will
  overflow. Widen at `lg:`.
- **D4. `user-select: auto` on the drag handle** (`DraggableCard.tsx:41-51` — `touch-action:
none` is set, `user-select` is not; `.touch-manipulation`, which does set it, is only on the
  _timeline_ cards). A double-click-then-drag on a laptop can start a text selection over the
  card title. Not reproduced in a single-click drag; hardening, not a live bug.
- **D5. The card-detail popup overlaps the "Later ↓" label** at 1440×900 — the popup bottom
  lands at y≈743, the label at y≈741. Cosmetic, and **still open**: an earlier draft of this doc
  claimed A1(a) would move both, but it doesn't. The overlap is _vertical_, and both elements
  were already horizontally centred — centring the board changed neither's `y`.

---

## What is already fine on desktop

Worth knowing so the fix session doesn't go looking:

- Mouse-wheel scrolling of the timeline works, including over the empty right-hand area (the
  scroll container is full-width).
- Cursors are correct: `grab` on the hand card, `pointer` on timeline cards and buttons.
- `Escape` closes popups.
- Drag-and-drop itself is reliable at desktop viewports — the pointer sensor path is the one
  Playwright drives, and the collision model (`pointerWithin`) is resolution-independent.
- No text selection during an ordinary drag.
- The Menu drawer (a right-hand sheet) reads fine at desktop width.
- No horizontal page overflow at any width tested (`scrollWidth === clientWidth` at 900, 1440
  and 1920).
- Resizing mid-game doesn't break or crash anything — it just re-lays-out to the same
  left-pinned column.

---

## Suggested sequencing for the fix session

Four PRs, roughly in value-per-risk order. The first is a day's work and removes most of the
"mess" impression; the last two are design work.

0. ~~**Centre the board** — A1(a), carrying A2 and A3.~~ ✅ **Done.** 5 files, 9 lines, the
   first desktop breakpoint in the app proper. Not D5, which survives (above).
1. **Cheap correctness, no layout risk** — B1 (dead hovers), B3 (focus ring), C1 (`inert`
   panels), C2 (wheel guard), D1 (aria), D2 (copy). Nothing here is width-conditional, so
   mobile is untouched by construction. This alone makes the site feel like it responds to a
   mouse.
2. **Home pager at width** — C3, C4, C5. Per-panel `lg:` grids and a desktop tab bar.
3. **Play properly on a laptop** — A1(b) side-rail hand, A4 click-to-place, A5 `KeyboardSensor`,
   A6 tab order, D3, D4. This is the design pass; treat click-to-place and the keyboard sensor
   as one feature, since they share the "arm a card, choose a gap" model.

## Reproducing this audit

Everything above came from `docs/driving-the-app-with-playwright.md` with the viewport changed
to `{ width: 1440, height: 900 }` and `deviceScaleFactor: 1`. The useful additions were:
reading `getComputedStyle` before and after `locator.hover()` to catch B1; walking `Tab` and
logging `document.activeElement`'s `getBoundingClientRect()` to catch C1 and A6; and iterating
`document.styleSheets` looking for a selector by name to prove B1's classes are absent rather
than merely overridden.
