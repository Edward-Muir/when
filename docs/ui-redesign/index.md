# UI & Layout

Home-screen pager, gameplay layout, and the Custom settings screen.

Most of this folder's history is superseded UI narrative — several sessions describe a
`SettingsPopup` that no longer exists, and a Marathon/Casual mode picker that was removed
along with the `freeplay` mode. What survives is below.

## Gameplay layout

Full-width vertical stack, not the original 40/60 horizontal split:

```
TopBar  (fixed, safe-area aware — see ../mobile-ios/index.md for pt-topbar*)
Timeline (flex-1) — spine at 20% from the left, landscape cards aligned to it
Bottom bar (120px mobile / 140px desktop, pb-safe) — hand count + active card stack
```

- **Cards have two shapes.** Landscape on the timeline (240×80 mobile, 280×96 desktop, image
  left 40% / title right 60%); portrait in the hand (144×176 / 160×192).
- The bottom bar's drop zone id is **`bottom-bar-zone`** (renamed from `hand-zone`) — the
  Playwright/puppeteer selectors depend on it.
- Cards are fixed-width and aligned to the spine, not stretched.

## Home is a six-tab pager (2026-06-28, Archive added 2026-09)

`Daily · Archive · Custom · Stats · Achievements · Timeline`, driven by **both** swipe and the
TopBar buttons. It replaced two competing navigation models (a two-page pager plus TopBar
buttons that `navigate()`d to separate full-page routes).

- **The order lives in one place**: the `TABS` array in `ModeSelect.tsx`. Labels, indicator
  colours, the index↔key maps and the idle pre-mount set are all derived from it, and the
  `ModePager` children must be rendered in that order. It used to be four hand-maintained
  mirrors of the same list; inserting Archive at index 1 is what collapsed them.
- **Archive** (`panels/ArchivePanel.tsx`) is the past curated decks, laid out on the game's own
  timeline by the date each ran — see [../curated-themes/](../curated-themes/index.md#replaying-past-decks-the-archive-tab).
  Like Custom it has no standalone route, so its TopBar button only renders in pager mode.
- **Seven TopBar buttons fit a 320px phone only at 6px gaps**: the nav row is `gap-1.5 sm:gap-2`
  and the bar `px-1.5 sm:px-2` (7 × 38px + 6 × 6px + 12px = 302px). The in-game bar has fewer
  buttons and is unaffected. `TopBar` sits at ESLint's complexity ceiling; the "new" dots go
  through a helper rather than inline `&&`s for that reason.

- **The standalone routes were kept** for deep-linking. Page bodies were extracted into
  content-only panel components (`src/components/panels/`) shared by both the routes and the
  pager, so there is no duplicated content.
- **`TopBar` stays backward-compatible** via an optional `onNavClick`: when provided the
  buttons scroll the pager, when absent they route as before. That is why Game and the route
  pages were unaffected.
- **Heavy tabs lazy-mount** on first visit, so the home load doesn't eagerly build the
  achievements grid and the full collection timeline.
- A vertically-scrolling panel nests inside the horizontal pager with **no gesture conflict** —
  this was an upfront concern that turned out to be unfounded. Don't re-litigate it.
- Custom's active nav colour is `accent-secondary` (teal) to match that screen; every other
  tab, Archive included, is `accent` (gold).
- The indicator shows only the active tab's label, with all labels stacked in one grid cell
  (inactive ones `invisible`) so its width never shifts as you navigate.

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
