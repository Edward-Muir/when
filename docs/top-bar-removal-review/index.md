# Top bar removal: findings, options and a recommendation

**Status:** resolved and built. Neither round's proposals were taken. The owner chose a
simpler route: the top bar and the burger menu are gone; a game has one Home button over the
board's top right, with Restart in the leave prompt; and the Stats tab became a Settings tab
holding the profile, the settings, the stats and every menu row. How it is built is recorded
in [ui-redesign](../ui-redesign/index.md#home-is-a-five-tab-pager). This file is kept for the
inventory, the measurements, and the options that were turned down and why.

It was made on the labelled-tab-bar branch (PR #135) by reading the source and driving the
real app at v1.39.0. Round one's three options (a portrait button in each heading, settings
folded into Stats, a sixth "More" tab) and round two's three concepts (put your cards down,
one bar, your seat at the table) are both below.

The prototypes are published at <https://claude.ai/artifact/JXzsqwCtNXm9tcZSCs74Qe>: a working
phone frame per concept at 402x874 and 375x667, light and dark, that responds to tap and swipe.
The page is private to its owner; a session can read it with the Artifact tool. The frames are
the running app's own screens with mock controls laid over them, so the sizes are real; no app
code was changed to make them.

## The finding in one paragraph

Removing the top bar gives back **56px of board** and **68px of Daily hero** at both sizes,
whatever replaces it; a full-bleed Daily cover raises the hero's gain to 165px. Nothing in the bar is used often enough to earn a permanent row. The menu's rows are
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

## Where the ideas come from

- **A thing in progress is set down, not quit.** Music and podcast apps shrink what is playing
  into a bar above the tabs, and iOS 26 builds that into the tab bar as a
  [bottom accessory](https://developer.apple.com/design/human-interface-guidelines/tab-bars).
- **The avatar is the menu.** [Google Play](https://androidcentral.com/new-google-play-store-ui-removes-hamburger-menu)
  and [Google Messages](https://sammobile.com/news/google-messages-app-gets-rid-of-android-hamburger-menu)
  dropped the drawer for the profile picture. [Discord's You bar](https://discord.com/blog/you-bar),
  [WhatsApp's profile tab](https://wabetainfo.com/whatsapp-is-widely-rolling-out-a-new-profile-tab-on-ios/)
  and the [NYT Games Me tab](https://thenewyorktimeshelpcenter.helpjuice.com/360052273251-The-New-York-Times-Games-app)
  put settings behind identity.
- **Pause belongs inside the fiction.** Writing on
  [diegetic pause menus](https://www.wayline.io/blog/designing-immersive-pause-menus) argues for
  folding pause into the game's own world, and notes a pause screen can be rich because nobody
  is playing while it is up.
- **Every gesture needs a visible twin.** Pull-down and edge swipes collide with system
  gestures on both platforms
  ([Android](https://medium.com/androiddevelopers/gesture-navigation-immersive-modes-43f2d37a925d),
  [iOS](https://itch.io/t/3016335/how-to-deal-with-ios-gestures-for-browser-games)), so each
  gesture below also has a handle to tap.

## The concepts

All three hide the bar on both screens and give the board its 56px.

### 1. Put your cards down (recommended)

You never quit a game; you put your hand down and it waits until you pick it up.

- **Game.** No bar and no buttons, only a handle on the hand bar. Swipe the hand down, or tap
  the handle, and the game drops away to Home. System Back does the same.
- **Home.** A game in progress is a small hand docked above the tab bar on every tab: the top
  card's art, the theme name, "3 placed, 4 cards left", and Pick up. Restart sits on it for
  Custom and Archive games.
- **The Daily tab becomes a cover.** Art to the top edge, with the wordmark and the player's
  portrait over it. Measured: the hero grows from 398 to 563 at 402x874 and from 191 to 356 at
  375x667, **+165px** at both.
- **Settings.** Behind the portrait, as a sheet. The portrait carries the "new" dot. How to
  Play is there, one set-down away mid-game.
- **Theme name.** On the small hand and the intro popup; off the playing screen.
- **Drag.** The handle is on the hand bar, which is `bottom-bar-zone`: a card dropped there
  already returns to the hand. A swipe on the card itself starts a dnd-kit drag (8px
  activation), so the swipe belongs to the bar around the card and to the handle. Open
  question: a card dragged down off the bottom could also mean "put down".
- **Decisions it changes.** "Custom and Archive games ask before leaving" stops being needed
  for leaving, because nothing is lost: a Daily saves and resumes, and a practice game now
  survives a reload (`when-practice-progress`). The ask moves to starting a second game over
  one in progress. `leaveAction` stays the one rule; its answers change.
- **Build.** Large. The docked hand on Home, the cover, the settings sheet, and Home and the
  game sliding over each other rather than swapping by phase.
- **Variant.** The handle at the top of the game, as an iOS-style sheet grabber carrying the
  theme name. Familiar, but out of thumb reach, and its strip costs 28px of the 56.

### 2. One bar

The bottom bar is the app's only chrome, with two states and one gesture.

- **Game.** Lowering the hand pauses in place. Under it: the theme name, How to Play, Restart,
  "Pick up your cards", and the five tabs themselves, so a player leaves straight to any tab.
- **Home.** The tab bar has the same handle. Raising it grows the bar into a sheet with the
  profile and settings.
- **Pixels.** Board +56, Daily hero +68. Nothing new on either screen but a handle.
- **Risk.** Settings on Home are behind an unlabelled handle. It needs a one-time hint, and it
  runs against "nothing in the burger menu gets found" for a new player looking for the rules.
- **Decisions it changes.** None. Leaving follows today's rule. The menu drawer goes, so its
  back-stack registration moves to the two sheets (on `ui/Modal` or registered the same way).
- **Build.** Medium.

### 3. Your seat at the table

The player's portrait is the one hub everywhere.

- **Game.** The card counter becomes a seat: the portrait with the cards left on it. Tapping it
  opens a pause card with the theme, the game so far, Keep playing, Home, Restart and How to
  Play. It replaces `StatsPopup`.
- **Home.** The Stats tab becomes **You**: portrait and name, records and badges, and a gear
  that opens a settings page. No drawer.
- **Pixels.** Board +56, Daily hero +68.
- **Risk.** The way out of a game is behind the player's own face, which reads as "me" rather
  than "leave", and iOS has no system Back to fall back on.
- **Decisions it changes.** The tab's label and path move from Stats to You (`/stats` would
  need a redirect and a `vercel.json` rewrite for the new path). The `stats` hint is reworded.
  The seat matches the multiplayer the engine already has.
- **Build.** Medium to large.

### Works with any of them

- **The cover Home** takes the hero gain to 165px whichever concept is chosen.
- **An edge-swipe Back for the iOS app.** In Safari the edge swipe is already history-back,
  which the back stack turns into Home. The app shell does not enable it
  (`allowsBackForwardNavigationGestures` is unset), so the iOS app has no system Back. Turning
  it on is one setting, but it needs an app release and old binaries will not have it.

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

**Concept 1, put your cards down.** It is the only one that changes what leaving means, and the
storage already supports it. The gesture is in the thumb zone, on the object the player is
already holding. It gives Home the most. It is also the biggest build; if that matters,
concept 2 gets the same board for much less, at the cost of settings that are harder to find.

## Decisions that are yours

1. Which concept, or which mix. The cover Home and the portrait as the menu fit any of them.
2. In concept 1, does a set-down game ask before a second game starts over it, or can two wait
   at once?
3. Whether dragging a card down off the bottom of the screen should also put the hand down.
4. Whether the theme name must stay on the playing screen. None of the three keeps it there.
5. Whether the iOS app gets an edge-swipe Back, which needs an app release.
6. In the apps, a solid `bg-bg` strip behind the status bar or content running under it. The
   cover wants art under it.
7. Whether desktop (1024px and up) keeps a top bar. The desktop digest asks for changes to be
   gated behind `lg:`.
8. Whether `TimelineLab` follows the game, and whether the static pages keep their own bar
   (recommended: yes to both).

## Round one, rejected

Three ways to relocate the bar's buttons, all giving the same 56px and 68px:

- **A.** A portrait button beside each tab's heading opening the drawer; a menu button in the
  hand bar's corner above Swap. At 375 the "My Timeline" heading wraps beside two buttons.
- **B.** The drawer's rows as a section at the foot of Stats; the counter's popup as the game
  menu. No visible way out of a game.
- **C.** A sixth "More" entry on the tab bar (53px a tab at 320, against the recorded 64); a
  floating button on the board, which sits in the drop zone and over the year labels.

## How it was tested

- `BROWSER=none npm start`, driven with Playwright at 402x874 and 375x667 in light and dark,
  with one frame at 320x568 for the six-entry tab bar. Card art was loading.
- The round-two prototypes were driven by tap and swipe at phone width before publishing.
- The leaderboard and theme calendar were read from production. Every POST was answered
  locally; nothing was written to production.
- Not checked: the hand bar at 320px, a real device's inset, and 1280x800.
