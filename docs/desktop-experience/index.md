# Desktop / laptop experience — audit and fix list

**Status:** A1, A2 and A3 are fixed — the board is centred at ≥1024px. Everything else here is
an open finding, written so it can be picked up cold. Fixed items are marked ✅ in place.

The game is excellent on a phone and weak on a laptop. The findings come from driving the real
app in a 1440×900 Chromium window (plus 900×700 and 1920×1080), playing the daily and a custom
game to game over, and reading the layout back out of the DOM. Every claim was measured in the
running app, not inferred from source.

---

## The one root cause

**The player-facing app has almost no breakpoint above `sm:` (640px).**

- `tailwind.config.js` defines no custom `screens`, so the defaults apply: `sm` 640, `md` 768,
  `lg` 1024, `xl` 1280.
- There is **not a single `md:`/`lg:` utility in any player-facing component** (the few in
  `src/` are in unlinked maintainer pages). The one `min-width` media query in `index.css` is
  the `@media (min-width: 1024px)` block that centres the board (A1).

So a 1440px laptop, a 1920px monitor and a 640px tablet get the same layout apart from that
centring. The design's natural width is roughly 600–900px (at 900×700 the game looks fine);
above that, nothing adapts and the shortfall shows up as many separate-looking symptoms. Almost
every open finding in sections A and C is that one fact wearing a different hat.

**Measured:** the play column is 388px wide — 27% of a 1440px window. Centred, the other 73% is
still empty background.

### Guardrails for whoever fixes this

Mobile is the primary platform and the iOS and Android shells load the live site, so a desktop
regression on phones ships instantly to the app-store builds. Therefore:

- Gate every change behind a **new `lg:` (1024px)** step. Do not change the base or `sm:`
  classes. Anything ≤1023px must render pixel-identically to the current mobile layout.
- Verify at **375 / 402 / 640 / 1024 / 1440 / 1920** before pushing.
- `docs/driving-the-app-with-playwright.md` is the runbook; the drag recipe there works
  unmodified at desktop viewports.

---

## A. Gameplay — the worst of it

### A1. ✅ FIXED — the board is centred at ≥1024px

The timeline column, the year gutter, the hand and the counters form one 388px column. At
≥1024px it is centred rather than pinned to the left edge, where it read as broken; card size is
unchanged. See the `BOARD COLUMN` comment in `src/index.css` for the mechanism and the alignment
invariant. Three things that comment explains and that are easy to get wrong:

- **It is `padding-left` on the scroller, NOT `max-width` + `mx-auto` on the rows.** The
  scroller is the node carrying `useDroppable` (`timeline-zone`), and a `max-width` there
  shrinks the drop zone — dropping in the empty space beside the board would stop working.
  Padding is inside the border box, so the measured rect stays full-width.
- **No `max()`/`min()`/`clamp()` in a var that is later used inside `calc()`.** postcss-preset-env
  inlines the vars into a static fallback, so `calc(var(--board-inset) + var(--board-gutter))`
  becomes `calc(max(...) + 6rem)`, which cssnano's postcss-calc cannot parse. It fails the
  production build — and only there: `tsc`, ESLint, the tests and the dev server stay green, and
  a plain `npm run build` prints it as a warning and still writes a build folder. **Verify with
  `CI=true npm run build`** (Vercel sets `CI=true`), and read the whole output — the warnings
  block sits above the success banner.
- **Percentage padding, so the basis is the containing block, not the scroller's content box.**
  `.timeline-scroll-vertical` styles `::-webkit-scrollbar`, which opts Chromium out of overlay
  scrollbars, so the scrollbar eats 8px. Centring _inside_ the scroller would sit the board 4px
  off the rail — and because `Timeline.tsx` swaps to `overflow-hidden` while dragging, the board
  would jump 4px at every drag start.

**A1(b) A real desktop layout — open, the ambitious version.** Wider cards (`lg:w-[420px]` and a
wider gutter), hand promoted from a bottom strip to a side rail so the drag is short and
horizontal, counters and streak given their own panel. This is the version that makes the space
earn its keep, and the one that also fixes A4. Card widening is deliberately not part of the
centring: text-clamping, image crop and the 35-char name cap are all tuned at 280px.

### A2. ✅ FIXED (by A1) — labels and controls centre on the board

The `↑ Earlier` / `Later ↓` labels, the onboarding hint pill, the game-over Restart / Home /
Share bar and every popup are centred on the viewport. Because the board's centre is the
viewport's centre by construction, they are board-centred with **zero edits to any of these
elements**. Do not "fix" them individually — pinning a label to the board column would break
the relationship mobile has, where the label sits at the centre of the (clipped) column rather
than over the card.

### A3. ✅ FIXED (by A1) — the game-start scrim sits over the cards

`GameStartTransition.tsx` paints `.scrim-band` — a full-width horizontal band of
`backdrop-blur-xl` + wash, masked to fade above and below, with the "Loading events from across
time…" title centred inside it. The transition's card column is centred with the same two
classes as `Timeline.tsx`, so band, cards and title coincide at any width; a left-pinned column
would put the blur on the cards at the left and the title over empty background. **Leave the
band itself full-width**: it is masked on the vertical axis only, by design, and giving it the
board's width would hand it the visible left/right edge the design exists to avoid.

### A4. The drag is long and held

On a 900px-tall laptop the hand sits ~700px below the top of the timeline, so every placement is
a long press-and-hold drag. It works (the pointer-based recipe in the Playwright doc drives it
fine), but it's the single most fatiguing thing about playing on a laptop, and it's ~30 drags a
game.

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
the item. But `Game.tsx` registers only `JsonCvPointerSensor` and `JsonCvTouchSensor`
(`src/utils/dndSensors.ts`) — **there is no `KeyboardSensor`**. Focusing the hand card and
pressing Space / ArrowDown / ArrowDown / Enter places nothing; the timeline length does not
change.

So the app announces a keyboard affordance it does not implement. Fix: either add
`KeyboardSensor` with a coordinate-getter that steps the insertion index card-by-card (the
insertion model is already index-based, in `useDragAndDrop`), or implement A4's click-to-place
and make Enter/Space drive it, and override `screenReaderInstructions` to match whatever you
ship.

### A6. The hand card is the _last_ tab stop, behind every placed card

Tab order in game: wordmark "Go home" → nav "Go home" → "Open menu" → every timeline card in
order → … → hand card. At a 27-card timeline that is 30 tab presses to reach the only control
that does anything. Fix: give the hand card a low positive tab position in the DOM order or move
the bottom bar ahead of the scroll region, once A5 makes it worth reaching.

---

## B. Interaction feedback — desktop's primary channel is dead

### B1. 23 player-facing `hover:` rules compile to nothing ★ high impact, cheap fix

This is the repo's documented Tailwind opacity-modifier trap (`CLAUDE.md` → Styling) landing
squarely on the one platform where hover is how a UI says "I'm a control".

**Verified in the built stylesheet**, not inferred: `.hover\:bg-accent\/90`, `.hover\:bg-border\/50`,
`.bg-accent\/20`, `.text-text-muted\/70` and `.bg-border\/30` are **absent from the stylesheet
entirely**. Measured `getComputedStyle` before/after hover:

| Control                                        | Hover result                                         |
| ---------------------------------------------- | ---------------------------------------------------- |
| **Play Daily Challenge** (the primary CTA)     | **no change at all**                                 |
| Difficulty chips (Easy/Medium/Hard/Expert)     | no change                                            |
| All 21 category chips                          | no change                                            |
| **Play · N events**                            | no change                                            |
| Pager dots                                     | no change                                            |
| Game-over Restart / Home / Share               | no change                                            |
| Menu rows, counters button, TodaysLongest rows | no change                                            |
| TopBar nav + menu buttons                      | ✅ changes — they use `hover:bg-border`, no modifier |

The TopBar is the only thing on the site that responds to a mouse.

The 23 player-facing offenders (there are 6 more in unlinked maintainer pages). Line numbers
drift; regenerate with
`grep -rEn "hover:(bg|border|text)-(bg|surface|text|text-muted|border|accent|accent-secondary|success|error)/[0-9]+" src --include=*.tsx`.

```
src/components/CustomGameSettings.tsx   hover:bg-border/70 (x2), hover:bg-accent-secondary/90, hover:bg-accent/20
src/components/DailyCta.tsx             hover:bg-accent/90
src/components/DailyReminderPrompt.tsx  hover:bg-border/50
src/components/FilterPopup.tsx          hover:bg-accent/90
src/components/Game.tsx                 hover:bg-border/80, hover:bg-accent/90
src/components/GameOverControls.tsx     hover:bg-accent-secondary/90, hover:bg-accent/90, hover:bg-border/50
src/components/HowToPlayModal.tsx       hover:bg-accent/90
src/components/LeaderboardSubmit.tsx    hover:bg-accent/90
src/components/Menu.tsx                 hover:bg-border/50 (x2)
src/components/PlayerInfo.tsx           hover:bg-border/50
src/components/ReportIssueButton.tsx    hover:bg-surface/40
src/components/ShareStepPopup.tsx       hover:bg-accent-secondary/90
src/components/TodaysLongest.tsx        hover:bg-surface/60
src/components/UpdatePopup.tsx          hover:bg-border/50, hover:bg-accent/90
src/pages/Support.tsx                   hover:bg-accent/90
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

`ModePager.tsx` renders all five panels side by side in a scroll-snap track; none get
`inert` or `aria-hidden`.

From the Daily tab, a few Tab presses land on the "Easy" difficulty chip two pages off-screen.
The keyboard user is then trapped in the Custom tab's dozens of invisible controls, and the
browser's scroll-into-view fights the snap track.

Fix: `inert` (with an `aria-hidden` fallback) on every panel except `activeIndex`. Small, safe,
independent of everything else here.

### C2. Horizontal trackpad scroll silently changes tab _and_ rewrites the URL

A single `wheel(deltaX: 400)` anywhere on the page navigated `/` → `/custom`. On a
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

`max-w-sm` (24rem = 384px) on every panel (`src/components/panels/*Panel.tsx`). Panels that
would genuinely use the width don't get it:

- **Custom**: the 21 category chips, the Regions chips and the Countries row stack into a long
  scroll; two or three columns at `lg:` would fit far more on one screen.
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

- **D1. Two "Go home" buttons in game, same `aria-label`.** In `TopBar.tsx`, the "When?"
  wordmark and the nav icon both announce as "Go home", and
  they do different things: the wordmark calls `onHomeClick` directly, the icon goes through
  `handleNav`. Give the wordmark `aria-label="When? — back to home"` or drop its button role.
- **D2. Touch-only copy.** The game-over popup says "**Tap** to continue"; the Timeline tab hint
  says "**Tap** the sliders to filter it"; `HowToPlayModal` and `hintCopy.ts` are written for
  fingers throughout. Neutral wording ("Continue", "Use the sliders…") covers both.
- **D3. The in-game counter cluster is tight.** `Game.tsx` gives it a `w-24` (96px) box; at a
  27-card timeline with a 26 streak, "📏 27 ⚡ 26" fills it to ~86px. Three digits on both will
  overflow. Widen at `lg:`.
- **D4. `user-select: auto` on the drag handle** (`DraggableCard.tsx` — `touch-action: none` is
  set, `user-select` is not; `.touch-manipulation`, which does set it, is only on the
  _timeline_ cards). A double-click-then-drag on a laptop can start a text selection over the
  card title. Not reproduced in a single-click drag; hardening, not a live bug.
- **D5. The card-detail popup overlaps the "Later ↓" label** at 1440×900 — the popup bottom
  lands at y≈743, the label at y≈741. Cosmetic and open. The overlap is _vertical_, and both
  elements are horizontally centred, so centring the board moves neither.

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
- Resizing mid-game doesn't break or crash anything — it just re-lays-out the same column.

---

## Suggested sequencing for the fix session

Three PRs, roughly in value-per-risk order. The first is cheap; the last two are design work.

1. **Cheap correctness, no layout risk** — B1 (dead hovers), B3 (focus ring), C1 (`inert`
   panels), C2 (wheel guard), D1 (aria), D2 (copy). Nothing here is width-conditional, so
   mobile is untouched by construction. This alone makes the site feel like it responds to a
   mouse.
2. **Home pager at width** — C3, C4, C5. Per-panel `lg:` grids and a desktop tab bar.
3. **Play properly on a laptop** — A1(b) side-rail hand, A4 click-to-place, A5 `KeyboardSensor`,
   A6 tab order, D3, D4. This is the design pass; treat click-to-place and the keyboard sensor
   as one feature, since they share the "arm a card, choose a gap" model.

## Reproducing this audit

The findings came from `docs/driving-the-app-with-playwright.md` with the viewport changed
to `{ width: 1440, height: 900 }` and `deviceScaleFactor: 1`. The useful additions were:
reading `getComputedStyle` before and after `locator.hover()` to catch B1; walking `Tab` and
logging `document.activeElement`'s `getBoundingClientRect()` to catch C1 and A6; and iterating
`document.styleSheets` looking for a selector by name to prove B1's classes are absent rather
than merely overridden.
