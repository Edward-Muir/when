# Top bar removal: findings, options and a recommendation

**Status:** a review, nothing built. It was made on the labelled-tab-bar branch (PR #135) by
reading the source and driving the real app at v1.39.0. It waits on the choices listed under
[Decisions that are yours](#decisions-that-are-yours).

The sketches (phone frames at 402x874 and 375x667, light and dark, today beside each proposal)
are published at <https://claude.ai/artifact/JXzsqwCtNXm9tcZSCs74Qe>. The page is private to its owner; a session can read it with
the Artifact tool. The proposals on it are the running app restyled in the browser, so the
sizes are real; no app code was changed to make them.

## The finding in one paragraph

Removing the top bar gives back **56px of board** and **68px of Daily hero** at both sizes, and
every option gives back the same amount: the options differ only in where the bar's contents
go. Nothing in the bar is used often enough to earn a permanent row. The menu's rows are
set-once or rare, Home is used at most once a game and the end-of-game card already holds it,
and Restart is rarer still. The work is mostly in what `TopBar` owns besides the bar.

## Measured

Browser, top inset 0. The bar is 61px tall (56px plus its border; a game pads by 56px, so the
bar overlaps the board by 5px). Home pads by 80px, which leaves a 19px gap under the bar.

| Viewport | What             | Today | No top bar | Gain          |
| -------- | ---------------- | ----- | ---------- | ------------- |
| 402x874  | Board, playing   | 634   | 690        | +56px (+8.8%) |
| 402x874  | Board, game over | 698   | 754        | +56px         |
| 402x874  | Daily hero image | 398   | 466        | +68px (+17%)  |
| 375x667  | Board, playing   | 427   | 483        | +56px (+13%)  |
| 375x667  | Board, game over | 491   | 547        | +56px         |
| 375x667  | Daily hero image | 191   | 259        | +68px (+36%)  |

- The "no top bar" column was measured, not derived: the bar was hidden and the padding dropped
  in the running page, then the boxes were read again. Home keeps 12px above the heading.
- A board row is 88px, so the board gains about two thirds of a row: 4.9 rows become 5.5 at
  375x667.
- In the apps the status-bar inset (about 59px on a Dynamic Island phone) stays. The bar is
  about 115px there today and becomes the 59px inset alone, so the gain is the same 56 and 68.
- The hand bar's free space, which decides where a control can go: the counter is 88px tall
  with 48px above and below it, so nothing 44px fits in its column without moving it. Above
  Swap there is 70px, and the strip right of the hand card is 126px wide at 402 and 99px at 375.
- On the board, the year labels fill x 8 to 84 and the cards end at x 347, so the right gutter
  is 55px at 402 and 28px at 375.

## Inventory

`TopBar.tsx` owns four pieces of state besides the bar: the menu's open flag, the restart
confirm, the update popup and the menu's "Copied" toast. Frequencies are estimates from how each
item works; no analytics were read.

| Item                                                     | Where today                   | State owned by                                            | Used                                         |
| -------------------------------------------------------- | ----------------------------- | --------------------------------------------------------- | -------------------------------------------- |
| Menu button                                              | Home, game                    | `TopBar` (`isMenuOpen`)                                   | Rare; it is the only route to all rows below |
| Profile: name and avatar picker                          | Menu row                      | `Menu` (`showProfile`), `AvatarPickerModal`               | Once, then when a portrait is earned         |
| Profile "new" dot                                        | On the Profile row            | `Menu`, read on render from `when-portraits-seen`         | Invisible until the menu is opened           |
| Light or dark mode                                       | Menu row                      | `useTheme` (`when-theme`)                                 | Once                                         |
| Daily reminder (apps only)                               | Menu row                      | `useDailyReminder` (`when-daily-reminder`)                | Once; the only opt-out and denial recovery   |
| Share App                                                | Menu row                      | `Menu`; toast in `TopBar`                                 | Rare                                         |
| Download the App (iOS web)                               | Menu row                      | `usePWAInstall`                                           | Once                                         |
| Add to Home Screen                                       | Menu row                      | `usePWAInstall`, `Menu` (`showInstallModal`)              | Once                                         |
| How to Play                                              | Menu row                      | `Menu` (`showRulesModal`), `HowToPlayModal`               | Once, by new players; also wanted mid-game   |
| Reset Hints                                              | Menu row                      | `resetHintsSeen` broadcasts `when-hints-reset`            | Almost never; testers use it mid-game        |
| What's New, Help & FAQ, Send Feedback, Privacy, Terms    | Menu rows                     | Routes and a `mailto:`                                    | Rare                                         |
| Version                                                  | Menu footer                   | `APP_VERSION`, links to `/changelog`                      | Rare                                         |
| "Copied" toast (Share App)                               | Above the tab bar or hand bar | `TopBar` (`showToast`)                                    | With Share App                               |
| Update popup                                             | Any screen with a bar         | `TopBar` (`useVersionCheck`, `updateDismissed`)           | Each release. Nothing else calls the hook    |
| "When?" title, doubles as Home                           | Game                          | `TopBar`; `leave.requestHome` from `Game`                 | Rare: a second, unlabelled Home              |
| Theme pill                                               | Game (Daily, Archive)         | `Game` (`getThemeNameForConfig`)                          | Glanced at; also on the Daily card and intro |
| Home                                                     | Game                          | `useLeaveGame` (`leaveAction`, confirm state)             | At most once a game, mostly at game over     |
| Restart (Custom and Archive games)                       | Game                          | `Game` (`midGameRestart`)                                 | Rare                                         |
| Restart confirm                                          | Game                          | `TopBar` (`isRestartConfirmOpen`)                         | With Restart                                 |
| Leave confirm                                            | Game                          | `useLeaveGame`, rendered by `Game`                        | Unaffected: it never lived in the bar        |
| Tab path helpers (`pathForNav`, `navForPath`, `NavDest`) | Exported from `TopBar.tsx`    | Imported by `App`, `homeTabs`, `pages/Home`, `ModeSelect` | Must move before the file goes               |

## The options

Each covers Home and the game. All three hide the bar on both screens and give the pixels in
the table above.

### A. Portrait on Home, one menu button in the hand bar (recommended)

- **Home.** One 44px button showing the player's own portrait, pinned top right over the pager
  beside each tab's heading. It opens the drawer as it is today. The portrait carries the
  Profile "new" dot, which is invisible today until the menu is open.
- **Game.** One 44px menu button in the hand bar's top-right corner, 18px above Swap. It opens a
  game menu on `ui/Modal`: the theme name, Home, Restart in a Custom or Archive game, How to
  Play, and Settings (the drawer). Home goes through `leave.requestHome` as now.
- **Theme name.** Off the playing screen; it heads the game menu and stays on the intro popup
  and the Daily card.
- **Pager, tab bar, paths.** Untouched. Five tabs, 64px at 320.
- **Drag.** The hand bar is `bottom-bar-zone`, where a drop returns the card to the hand, so the
  button is not on a placement target.
- **Costs.** Home becomes two taps mid-game (system Back is still one). On the Timeline tab the
  heading wraps to two lines at 375 with Filter and the portrait beside it, which costs that tab
  48px unless the heading becomes "Timeline". Settings are not reachable from the game-over
  board without going Home.
- **Build.** Small to medium. A game-menu modal and a hook for its state (`Game.tsx` is on the
  complexity ceiling), the Home button, and the common work below.
- **Decisions touched.** None undone. "The menu button carries no dot" changes, because the
  button is now the portrait.

### B. Settings fold into Stats, the counter opens the game menu

- **Home.** No drawer. The Stats tab gains the portrait beside its heading (one tap to the
  picker) and a "Settings and help" section at its foot holding the other ten rows and the
  version.
- **Game.** Nothing new on screen. The counter's existing popup grows into the game menu: the
  three stats, then Home, Restart and How to Play.
- **Pager, tab bar, paths.** Untouched, though Stats gets longer and may want the label "You".
- **Costs.** Mid-game the only visible way out is an unlabelled counter, and iOS has no system
  Back; the `stats` hint shows once. Settings sit under the year grid, the scores and the badges,
  so How to Play is a long scroll for a new player. Dark mode and Reset Hints are unreachable
  mid-game.
- **Build.** Medium to large. `Menu.tsx` is dissolved into a section, `StatsPanel` and
  `StatsPopup` are reworked, and the Share App toast needs a new owner.
- **Decisions touched.** It removes the drawer, so "the Menu drawer registers with the back
  stack" has nothing left to register. It moves How to Play off the screen where "a new player
  looks for the rules". It best honours "nothing in the burger menu gets found" for Profile and
  worst for everything else.

### C. "More" on the tab bar, a floating button on the board

- **Home.** A sixth entry, "More", at the end of the tab bar. It is not a page; it opens the
  drawer.
- **Game.** A 44px floating button in the board's top-left corner, opening the same game menu
  as A.
- **Pager, tab bar, paths.** The pager and paths are untouched, but the bar's entries drop to
  67px at 402, 62px at 375 and 53px at 320, against the recorded 64px at 320 ("Timeline" is
  45px of label). "More" cannot go in `TABS` without breaking its index maps, so it is a
  hand-added sixth button, and the one entry on the bar that is not a place.
- **Drag.** The button sits inside the drop zone and over the year labels (x 8 to 84): scrolled
  to the top it covers the earliest year. It would have to hide during a drag. The right gutter
  is too narrow for it at 375 (28px).
- **Build.** Small on Home, medium in the game (z-order against the "Earlier" fade, the hint
  strip and the marker's clip box).
- **Decisions touched.** It breaks "nothing may sit where a card is dropped" unless hidden while
  dragging, the 64px tab at 320, and the idea that every tab is a place the highlight follows.

## What breaks, whichever option

- **Safe area.** `pt-topbar` (`Game.tsx`, `TimelineLab.tsx`) and `pt-topbar-wide`
  (`ModeSelect.tsx`) go; each root pads by the inset alone. The shells run edge to edge, and
  with the bar gone nothing opaque covers the status bar, so the padded strip must be painted
  in `bg-bg`. `pt-topbar-fixed` stays: `InfoPageLayout` has its own bar. The rule in
  [mobile-ios](../mobile-ios/index.md) needs rewriting.
- **State that lived in `TopBar`.** `useVersionCheck` and `UpdatePopup` must move to `App`, or
  the update popup silently stops appearing. The restart confirm, the "Copied" toast and the
  path helpers need new homes.
- **Game-over bottom bar.** Unchanged, but it and the closing card become the only exits at
  game over. It is empty while a popup or step is up, as now.
- **Onboarding hints.** None points at a top-bar control and none is placed against the bar. In
  B the `stats` hint's wording changes. Reset Hints stays reachable mid-game in A and C only.
- **Toasts.** All are bottom-anchored; none moves.
- **Playwright runbook.** `[aria-label="Open menu"]` and the in-game `[aria-label="Go home"]`
  (two matches, `.last()`) change; "the pill beside the logo in game" goes; the drag recipe's
  floors of 140 and 148 assume the bar and become 84 and 92.
- **Scripts.** `generate-store-screenshots.js` selects nothing in the bar, but every store shot
  changes and needs regenerating. `timeline-lab-shots.js` clips assume the bar.
- **Route pages.** Only `TimelineLab` renders `TopBar`. The static pages do not.
- **Tests and comments.** `TopBar.test.tsx` is rewritten. `MAX_THEME_NAME_LENGTH` is justified
  by the pill. Comments in `TimelineMarker`, `useInsertionMarker`, `RestartConfirmModal` and
  others name the bar.
- **Desktop.** The bar is the only thing on the site that responds to hover, and the tab order
  starts with it. The duplicate "Go home" (finding D1) goes away.
- **Docs.** [ui-redesign](../ui-redesign/index.md), [mobile-ios](../mobile-ios/index.md),
  [architecture-reference](../architecture-reference.md), the runbook and CLAUDE.md all describe
  the bar.

## Recommendation

**A.** The pixels are the same in all three, so the choice is risk and cost. A is the only one
that undoes no recorded decision: the tab bar stays at five, nothing sits on the board, and the
drawer and its back-stack registration are untouched. It keeps a visible way out of a game on
iOS, where there is no system Back. It also makes Profile easier to find than it is today,
which is the one menu item worth finding.

## Decisions that are yours

1. Which option: A, B or C.
2. In a game, is Home one tap (its own button beside the menu button) or two (inside the game
   menu)? Two buttons side by side need 96px: they fit at 402 (126px) but at 375 the strip is
   99px and the fanned hand reaches into it.
3. Does the theme name need to stay on the playing screen, for example as a caption beside
   "Earlier", or is the game menu, the intro popup and the Daily card enough?
4. The Timeline tab's heading at 375: rename it "Timeline", let it wrap, or shrink it.
5. On Home, the portrait or a plain menu icon as the button.
6. In the apps, a solid `bg-bg` strip behind the status bar (recommended) or content running
   under it.
7. Whether desktop (1024px and up) keeps a top bar. The desktop digest asks for changes to be
   gated behind `lg:`.
8. Whether `TimelineLab` follows the game, and whether the static pages keep their own bar
   (recommended: yes to both).
9. Whether settings should be reachable from the game-over board, or Home first is fine.

## How it was tested

- `BROWSER=none npm start`, driven with Playwright at 402x874 and 375x667 in light and dark,
  with one frame at 320x568 for the six-entry tab bar. Card art was loading.
- The leaderboard and theme calendar were read from production. Every POST was answered
  locally; nothing was written to production.
- Not checked: the hand bar at 320px, a real device's inset, and 1280x800.
