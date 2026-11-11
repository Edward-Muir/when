# Navigation and feel review: findings and the chosen work

**Status:** a review of everything outside the drag-and-place loop, made by driving the real
app at v1.39.0. Six pieces of work were chosen from it. Items 1 to 3 are built and live in
[ui-redesign](../ui-redesign/index.md#leaving-a-game); item 4, the end of a game, is built and
lives in [sharing-challenges](../sharing-challenges/index.md#the-share-is-the-last-step-of-the-end-of-game-sequence)
and [stats-achievements](../stats-achievements/index.md), less the two parts listed under
"Raised, not chosen"; the country-search fix in item 6 was dropped. This file holds
what was seen, what was chosen, the spec for each piece, and the findings that were raised but
not chosen. Written so a fresh session can pick any item up cold.

The sketches (phone frames, today beside the proposal) are published at
<https://claude.ai/artifact/A3L9L8v4h2oEvwkVAimJpT>. The page is private to its owner; a
session can read it with the Artifact tool. Sketch numbers below are the ones on that page.

## How it was tested

- `BROWSER=none npm start`, driven with Playwright at 402x874, then dark mode, 375x667 and
  1280x800, as a first-time player and as a returning one. Card art was loading.
- The leaderboard and the theme calendar were read from production. Every submit was answered
  locally, so nothing was written to production.
- Timings come from the dev server, so only the fixed timers are meaningful.
- Not tested: a real phone, the iOS and Android shells, haptics.

## What works, and should survive any change here

- A swipe lands on the next tab as the finger lifts, every tab has a path, and Home from an
  Archive or Custom game returns to the tab the player left.
- A half-played Daily reopens in under a second with no start transition.
- The game-over gallery flight, the one-hint-per-placement ladder, dark mode and the 375x667
  layout all hold up.

## The chosen work

### 5. Labelled tabs within reach (sketch 3)

**Seen.** Home's five places are six unlabelled icons, 38x44 each, in the top corner. The only
label is at the bottom, beside dots 10px wide. A fresh install shows a "new" dot on Archive,
Stats and Timeline before anything has happened. On My Timeline two identical sliders icons
sit 50px apart, the Custom tab and the filter, under a hint that says "tap the sliders".

**Build.** A tab bar where the dots row is: five tabs from the `TABS` array, each an icon and
a word, 64px tall plus the bottom safe-area inset. A tab is 80px wide at 402 and 64px at 320.
The active tab takes the accent (teal for Custom, as now) and a 3px marker. It is the same
pager: the tabs scroll it, the swipe still works, every path stays. The top bar on Home keeps
Menu only. "New" dots ride on the tabs and are armed by events, so a fresh install shows none.
The in-game bar does not change.

**Constraints.** `TABS` stays the single source of order and labels. The bar sits outside the
pager so nothing mounts during a swipe. Keep the existing `aria-label`s on the tabs, because
the Playwright runbook selects by them. Use the safe-area utilities, never a pixel offset.
When built, update the "Six buttons fit a 320px phone" passage in
[ui-redesign](../ui-redesign/index.md) and the selectors in
[driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md).

**Cost to know about.** On the web the height is a wash (the dots row takes about 74px, the
bar 64). In the iOS app the home-indicator inset is added under the bar.

### 6. Custom on one screen (sketch 4)

**Seen.** On 375x667 the filter list is 1,342px tall inside a 366px window, or 242px while the
first-visit hint is up. Custom greets a returning player with a form every time.

**Build.**

- **Quick decks above the filters**, a 2x2 grid of 64px tiles: the last deck played (hidden
  until there is one), Everything, and two presets. A tile shows one painting, a name and the
  live count, and a tap starts the game. At review time: Everything 6,423, Ancient 920,
  World Wars 478, Easy only 1,244.
- **Each filter group folds to one 44px row** stating its setting: "All 4", a single name,
  "3 of 21", "All but Italy". A setting that differs from the default is teal. A tap opens the
  group in place with the same chips, Select all and Clear as now.
- **Share** becomes one button beside Play that opens the link field.

**Constraints.** `FilterControls` is shared with My Timeline's filter popup, so folding is a
prop only Custom turns on. Chips must not change width, the double-tap isolate stays, and an
empty group stays a normal step (Play disabled, not saved, not shareable). A preset is a
settings object, so the challenge-code encoding is untouched. Each preset's painting is one
fixed event at the thumbnail size, never a random draw from the catalogue
([cloudinary-cost-controls.md](../cloudinary-cost-controls.md)). `when-custom-settings` holds
the last settings edited, not the last played, so "last deck" needs its own key.

**Cost to know about.** Changing two groups takes one more tap each than today.

## Raised, not chosen

No decision was made against these; they were simply not picked, with one exception.

Decided against: in the country picker, searching for Italy and tapping it removes Italy,
because everything starts selected. Making that tap pick the country alone was proposed with
item 6 and turned down. The single tap stays a toggle.

Bugs:

- The Stats calendar blocks the pager swipe even when it has nothing to scroll (measured at
  308px of content in 308px). It carries `overflow-x: auto` and `overscroll-x-contain`
  unconditionally.
- Counts disagree in small ways: Stats shows "Longest timeline 15" beside "Best daily score 14"
  for one game, and Custom says "6423 events" where Stats says "6,426".
- The art for "Four Colour Theorem Proved" has a white mat baked into the image.
- A reload during a Custom game loses it, for the same reason Back does.
- Opening the portrait picker from the game-over submit form marks the game's new portraits as
  seen before the achievements step has shown them, so the Profile dot and the "New" tags never
  appear. Left out of item 4 when the rest of it was built.

Proposals:

- **Wear a new portrait from the achievements screen** (left out of item 4): under the badges,
  "N new portraits · tap one to wear it", 48px tiles, the chosen one ringed, with the line
  "Wearing X from tomorrow's leaderboard". Today a new portrait is reached by Menu, Profile,
  then a scroll past 62 animals.

- **Home after the Daily is played (sketch 2):** the card states score, place and the current
  daily run, and a Keep playing list offers the most recent missed day and the last deck. The
  current run is derived from `playedDates` and shown nowhere in the app.
- Put the curated theme intro inside the loading band, so the 3 s wait carries it and the
  popup after it goes.
- Restart skips the start transition (measured at 3.5 s from Restart to a touchable card).
- Archive: days before install say nothing in place of "Missed", and the list opens on
  yesterday, not on the two locked rows.
- A way to reach Achievements when the Stats dot is lit; they sit at the foot of a 1,936px
  page.
- Name the deck in a Custom game's top bar, as the Daily does with its theme pill.
- More personal: an entry point for the multiplayer engine (two turns were played through a
  2-player code and it works), a card from the player's own timeline resurfaced on Home each
  day, a deck built from the player's own misses, tomorrow's theme on the closing card, and a
  Monday recap of the week.

## Reproducing this review

[driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md) is the runbook.
What this review added to it:

- **Card art on localhost.** Give Chromium the egress proxy with a bypass for localhost
  (`proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }`) plus
  `--ssl-version-max=tls1.2`, and abort only the analytics hosts. Cloudinary and Google Fonts
  then load.
- **A real leaderboard without `vercel dev`.** Route `**/api/**`: fulfil GETs for
  `/api/themes` and `/api/leaderboard/<date>` from production with `route.fetch`, and answer
  every POST locally. Never forward a POST.
- **A returning player.** `chromium.launchPersistentContext` on a profile directory keeps
  `localStorage` between scripts.
- **Swipes.** A context with `hasTouch: true` and CDP `Input.dispatchTouchEvent`
  (touchStart, a dozen touchMoves, touchEnd). The path updates as the gesture ends.
- **A multiplayer code.** `tsx` can import `src/utils/challengeCode.ts`: decode a code from
  the Custom tab, set `playerCount`, encode it again.
- **Traps.** A hint strip takes the leaderboard teaser's slot on the Daily tab, so a selector
  for the teaser times out while one is up. Once My Timeline's filter popup has mounted, two
  "Clear Categories" buttons exist.
