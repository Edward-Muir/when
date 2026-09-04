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

## Onboarding hints (2026-09)

Players said the app did not explain itself: the rules were three lines that omitted the
hand mechanic and the losing condition, shown once per mode _after_ the game had started,
and afterwards reachable only from the in-game menu. Research (Nielsen Norman on onboarding
tutorials and mobile coach marks; game FTUE guidance) says up-front walkthroughs get skipped
and do not improve performance, while single-line contextual hints tied to the moment of
need, dismissible and re-findable, do. The fix is that shape; there is no guided tutorial.

- **One storage object, `when-hints-seen`** (`playerStorage.ts`: `hasSeenHint` /
  `markHintSeen` / `resetHintsSeen`, keys `drag`, `wrong`, `correct`, `swap`, `dailyTab`,
  `archiveTab`, `customTab`, `statsTab`, `timelineTab`). Switch-based accessors, because the
  `security/detect-object-injection` rule forbids indexing by a variable key. **`timelineTab`
  reads the key it replaced** (`when-timeline-intro-seen === '1'`) so an upgrade does not
  re-show it; that legacy key is read-only now and the fallback is tested. (`when-modes-played`
  gated the old per-mode rules popup and is no longer read: the popup is gone.)
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
  and drives it with props. At most one strip is on screen; the order is idle drag nudge
  (`DRAG_NUDGE_MS` after play starts) → first-wrong / first-correct strips once the placement animation settles → the swap-button hint, which is
  the advanced one and waits until `drag` and `correct` are seen and either `wrong` is seen or
  four cards are placed (so a perfect run still gets it), plus a quiet gap. `drag` is marked
  on the first drag whether or not the strip ever showed, so a player who never idles skips it
  and the swap gate still opens. An outcome that lands on the game-ending placement is
  discarded unmarked and returns next game.
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
- **The card bob and the swap-button pulse** are `animate-hint-lift` / `animate-hint-pulse`
  in `index.css`, in the reduced-motion block, with `color-mix()` for the ring because
  `ring-accent/60` emits nothing (the opacity-modifier trap).
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
