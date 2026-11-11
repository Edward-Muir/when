# Navigation and feel review: findings and the chosen work

**Status:** a review of everything outside the drag-and-place loop, made by driving the real
app at v1.39.0. Six pieces of work were chosen from it, and all six are built. Items 1 to 3 live
in [ui-redesign](../ui-redesign/index.md#leaving-a-game); item 4, the end of a game, lives in
[sharing-challenges](../sharing-challenges/index.md#the-share-is-the-last-step-of-the-end-of-game-sequence)
and [stats-achievements](../stats-achievements/index.md), less the two parts listed under
"Raised, not chosen"; item 5, the labelled tab bar, lives in
[ui-redesign](../ui-redesign/index.md#home-is-a-five-tab-pager); item 6, Custom on one screen
(Quick decks, folded filter rows, Share beside Play), lives in
[ui-redesign](../ui-redesign/index.md#custom-settings-screen), less the country-search fix,
which was dropped. Three of the bugs it raised were fixed afterwards: the Stats calendar that
blocked the pager swipe and the counts that disagreed (both in
[stats-achievements](../stats-achievements/index.md#stats-page)), and a reload during a Custom
game losing it, which now resumes it
([ui-redesign](../ui-redesign/index.md#leaving-a-game)). This file now holds how the review was
run and the findings that were raised but not chosen, written so a fresh session can pick any of
them up cold.

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

## Raised, not chosen

No decision was made against these; they were simply not picked, with one exception.

Decided against: in the country picker, searching for Italy and tapping it removes Italy,
because everything starts selected. Making that tap pick the country alone was proposed with
item 6 and turned down. The single tap stays a toggle.

Bugs:

- The art for "Four Colour Theorem Proved" has a white mat baked into the image.
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
