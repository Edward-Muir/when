# Mobile & iOS

The Capacitor iOS and Android shells, safe-area handling, and daily reminder notifications.

## The one fact everything else follows from

**The native apps are a WebView (WKWebView on iOS) pointing at the live site.** `capacitor.config.ts` sets
`server.url: 'https://play-when.com'` — it does not bundle web assets. So:

- Web changes reach installed apps as soon as Vercel deploys. No `cap sync`, no rebuild, no
  store review.
- Only native-shell changes need a submission: icons, splash screen, **and adding a
  plugin**. Users must update from the store before plugin-dependent features light up.
- `Capacitor.isNativePlatform()` returns `true` on the remote URL — the bridge is injected —
  so native-only branches work in-app and are correctly skipped in a browser.
- **Your JS will run inside old app binaries that lack newer plugins.** Anything touching a
  plugin must feature-gate (see `isDailyReminderSupported()`), or a stale shell throws.

Bundle id `com.playwhen.app`; `ios/` and `android/` are committed, `ios/App/App/public/` is
gitignored.
Scripts: `npm run cap:sync`, `cap:open:ios`, `cap:open:android`.

**Android** (`android/`, for Google Play) is the same remote-URL WebView shell.
Icons and pre-Android-12 splash images come from the same painting via
`npm run generate-icons:android`. Release builds are signed with the Play _upload_ key, which
lives outside the repo in `../when-android-signing/` (keystore + `keystore.properties`; see
`android/app/build.gradle`). Bump `versionCode` in `android/app/build.gradle` for every upload.
Build: `cd android && ./gradlew bundleRelease` -> `app/build/outputs/bundle/release/app-release.aab`.

**Don't animate opacity on the `Modal` card.** In the Android app only (not iOS, not Chrome on
the same phone), an opacity fade on the card makes every popup go see-through for a frame or
two about 0.4s after opening: framer-motion runs opacity on the browser's animation engine, and
when that animation finishes it writes the final value and cancels the animation, and the
Android WebView draws a stale frame at that hand-off. The card animates `scale` only, which
framer-motion drives itself, and the backdrop's fade carries the card in and out on every
platform. Not the cause, so don't re-investigate: the tap highlight (Tailwind's preflight
already clears it) and the `active:scale-*` press.

**Testing a branch in the Android app.** The app loads production, and WebView-only bugs don't
reproduce in Chrome, so a preview has to be loaded by a test build of the app:

1. In Vercel, open the branch's preview, then Share → "Anyone with the link" (previews sit
   behind Vercel Authentication; Hobby allows one link at a time). Copy the link.
2. `CAP_SERVER_URL='<link>' npx cap sync android` (see `capacitor.config.ts`), then
   `cd android && ./gradlew assembleDebug` -> `app/build/outputs/apk/debug/app-debug.apk`.
3. The debug build is "When? (test)", id `com.playwhen.app.preview`, so it installs beside the
   Play version. Later pushes to the branch reach it without a rebuild.
4. Run a plain `npx cap sync android` before any release build, so it points at production again.

## UIScene lifecycle (required from the iOS 27 SDK)

From the iOS 27 SDK, UIKit asserts scene adoption at launch (TN3187): a shell with no
`UIApplicationSceneManifest` in `Info.plist` and no scene delegate, built with Xcode 27, dies on
iOS 27 before `AppDelegate` runs — and App Review rejects it — while the same binary launches
normally on iOS 26. **Testing on an iOS 26 device proves nothing here; run on an iOS 27
simulator or device before submitting.**

The shell is on Capacitor 8.5, which adopts UIScene, with its migration applied exactly as its
own template ships it: `SceneDelegate.swift` (builds the window around a
`CAPBridgeViewController` and forwards to `SceneDelegateProxy`), the scene manifest in
`Info.plist`, and `configurationForConnecting` in `AppDelegate`. Don't remove any of the three.
With a manifest present iOS stops calling `AppDelegate`'s `open url:` / `continue
userActivity:`; URL opens and universal links arrive through `SceneDelegateProxy`, which
`@capacitor/app` listens to. Notification taps are unaffected (they go through
`UNUserNotificationCenter`).

The migrator (`npx cap migrate`, or its `migrateToUIScene` step alone) writes the
`project.pbxproj` file reference with `explicitFileType = undefined` and reformats `Info.plist`;
hand-correct both to match Capacitor's template whenever it runs.

## Safe-area offsets — use the utilities, not pixels

`TopBar` grows with the device inset via `pt-safe`, so its real height is
`env(safe-area-inset-top) + ~56px`. A hardcoded pixel offset works in mobile Safari and clips
badly in the native app:

- **Safari:** its own URL bar occupies the notch area, so inside the viewport
  `env(safe-area-inset-top) ≈ 0`. A hardcoded 56px clears the bar.
- **Native:** `StatusBar.overlaysWebView: true` extends the webview under the Dynamic
  Island, so the inset is ≈59px and the bar becomes ~115px tall. Content at 56–80px sits
  underneath the opaque `z-50` TopBar, invisible.

So full-screen containers use three Tailwind utilities computed as
`calc(env(safe-area-inset-top) + <base>)`: **`pt-topbar`** (3.5rem), **`pt-topbar-wide`**
(5rem), **`pt-topbar-fixed`** (60px). On web `env()` is 0, so the layout is pixel-identical to a
plain offset; the three base values are deliberately distinct rather than normalized, to keep
it so.

**Any new full-screen container below the fixed TopBar should use one of these, never a
hardcoded `pt-*`.** Edge-to-edge is deliberate over the simpler `overlaysWebView: false` — the
choice is cosmetic (immersive vs. a solid top band).

Zoom is locked **native-only** (`maximum-scale=1.0, user-scalable=no`, applied from
`App.tsx` behind `isNativePlatform()`). WKWebView honours pinch-zoom but offers no chrome to
reset it, so users get stuck zoomed in. Web keeps pinch-zoom for accessibility — and Safari
ignores the constraint anyway.

## Daily reminders (8 AM local)

Local notifications via `@capacitor/local-notifications`, in the native apps only
(`isDailyReminderSupported()`: native platform and the plugin present). **Not push** — the
schedule is computed on-device. No APNs keys, entitlements, subscription store or cron sender.

- **Rolling 14-day window.** `resyncDailyReminders()` cancels IDs 9000–9013 (9099 is the dev
  test shot) and re-schedules the next 14 local 8 AMs. Today's slot
  is dropped once `hasPlayedToday()`. Idempotent; runs on launch, `appResume` and
  `gameOver`. A user who stops opening the app stops being nagged after 14 days —
  intentional.
- **The copy is generic and never names the theme** (`getReminderCopy`). The OS holds a
  scheduled notification's text as written up to 14 days ahead, so a theme name would go stale
  the moment a curated theme is published for a date already in someone's queue. Naming the
  theme is worth less than being free to schedule one for tomorrow.
- **iOS shows the permission dialog exactly once, ever, and a denial is permanent**
  (Settings-app only). Hence: never prompted at launch — resync only schedules if already
  granted; a priming card (`DailyReminderPrompt`, in the daily's share step,
  `ShareStepPopup.tsx`) fires the real dialog, with "Not now"
  costing nothing and re-offering after 7 days, max 3 times; intent defaults to **on**
  (`when-daily-reminder` != `'0'`), and the burger-menu row is both the opt-out and the
  recovery path after a denial.
- **Tap deep-links to `/daily`**, which auto-starts and bounces home if already played.
  Cold-start taps are retained by the plugin and delivered once the listener registers.
- Dates are local: `getLocalDateString`, never `toISOString()` — `puzzleDate.ts` explains at
  length why UTC would be wrong.

Harness: `/reminder-preview` (unlinked, and unreachable in production — no `vercel.json`
rewrite). Shows the 14-day copy table and priming card on web; on a native build also
permission state, a 10-second test fire, resync, and a pending-schedule dump. Unit tests in
`src/utils/dailyReminder.test.ts`. The simulator delivers local notifications; no Info.plist
or entitlement changes are needed.

## Icons, splash, store art

**The icon is a painting, not vector art** — a Gemini oil painting of a brass hourglass, made
the same way as the card art. Hand-drawn SVG concepts (a "?", hourglass/slot/clock, a
symbol-builder, a wall of flat marks) were all rejected.
The prompts, tuned so one object reads at 60 px, are in
[../app-icon/gemini-icon-prompts.md](../app-icon/gemini-icon-prompts.md). Don't redraw it in SVG.

- **Master:** `assets/icon/icon-master.jpg`, the untouched Gemini output. Everything else is
  derived by `node scripts/generate-icons.js`: the favicons, `logo180/192/512.png`, the iOS
  `AppIcon.appiconset/logo1024.png`, and `Splash.imageset`.
- **The icon is a centred 880px crop of the 1024px master** (`CROP` in the script). A card
  image can breathe; a fingernail-sized icon needs its object bigger. Tighter than 880 pushes
  the hourglass caps into the iOS corner mask. Check any new master at 60, 40 and 29 px.
- **No alpha, anywhere.** App Store Connect rejects an icon with an alpha channel; the script
  flattens every output. One appearance only: a painting already on a near-black ground reads
  fine in dark mode, and iOS derives the tinted look from it.
- **Splash:** `LaunchScreen.storyboard` references the `Splash` image in the asset catalogue
  (without it, launch is a blank white screen): the painting feathered into its own corner
  colour, `#030c1d`, which is also the storyboard background, so no white flash either way. The image is 2732 square and aspect-filled, so only the middle ~1260px
  shows on a phone; keep the subject small.
- **Both ship only in a new App Store build.** The web favicons ship on deploy.
- **Store screenshots:** `node scripts/generate-store-screenshots.js` (needs the Playwright
  driver: `npm install --no-save playwright`, or the global one via
  `NODE_PATH=/opt/node22/lib/node_modules` in a cloud container) captures the live site at 440x956 DPR 3, which is exactly
  the 6.9" size (1320x2868), and frames each shot with a headline. It plays a Custom game, never
  the Daily, and never submits a score. Leaderboard nicknames are swapped for stand-in names
  before capture: a public listing must not show real players' names. Output:
  `assets/app-store/screenshots/`; `--compose` re-frames the saved raw captures without
  touching the site.

## Things that work unmodified in the WebView

Routing, dark mode, `navigator.share`, safe-area env vars, the service worker, localStorage,
and the PWA install button (auto-hidden — the WebView reports standalone) all work
unmodified in the WebView. Haptics use the native Taptic Engine with a Web Vibration
fallback.
