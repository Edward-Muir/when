# Mobile & iOS

Capacitor iOS wrapper, safe-area handling, and daily reminder notifications.

## The one fact everything else follows from

**The native app is a WKWebView pointing at the live site.** `capacitor.config.ts` sets
`server.url: 'https://play-when.com'` — it does not bundle web assets. So:

- Web changes reach installed apps as soon as Vercel deploys. No `cap sync`, no rebuild, no
  App Store review.
- Only native-shell changes need a submission: icons, splash screen, **and adding a
  plugin**. Users must update from the App Store before plugin-dependent features light up.
- `Capacitor.isNativePlatform()` still returns `true` on the remote URL — the bridge is
  injected — so native-only branches work in-app and are correctly skipped on Safari.
- **Your JS will run inside old app binaries that lack newer plugins.** Anything touching a
  plugin must feature-gate (see `isDailyReminderSupported()`), or a stale shell throws.

Bundle id `com.playwhen.app`; `ios/` is committed, `ios/App/App/public/` is gitignored.
Scripts: `npm run cap:sync`, `cap:open:ios`. (`cap:open:android` exists but there is no
`android/` directory — Android was never added.)

## Safe-area offsets — use the utilities, not pixels

`TopBar` grows with the device inset via `pt-safe`, so its real height is
`env(safe-area-inset-top) + ~56px`. Full-screen containers used to clear it with hardcoded
pixel offsets, which worked on mobile Safari and clipped badly in the native app:

- **Safari:** its own URL bar occupies the notch area, so inside the viewport
  `env(safe-area-inset-top) ≈ 0`. A hardcoded 56px cleared the bar.
- **Native:** `StatusBar.overlaysWebView: true` extends the webview under the Dynamic
  Island, so the inset is ≈59px and the bar becomes ~115px tall. Content at 56–80px sat
  underneath the opaque `z-50` TopBar — the "When?" and "Custom" titles were invisible.

Fixed 2026-05-28 with three Tailwind utilities computed as
`calc(env(safe-area-inset-top) + <base>)`: **`pt-topbar`** (3.5rem), **`pt-topbar-wide`**
(5rem), **`pt-topbar-fixed`** (60px). On web `env()` is 0, so the layout is pixel-identical.
Three distinct base values were preserved rather than normalized, to guarantee that.

**Any new full-screen container below the fixed TopBar should use one of these, never a
hardcoded `pt-*`.** Edge-to-edge was kept deliberately over the simpler
`overlaysWebView: false` — the choice was cosmetic (immersive vs. a solid top band).

Zoom is locked **native-only** (`maximum-scale=1.0, user-scalable=no`, applied from
`App.tsx` behind `isNativePlatform()`). WKWebView honours pinch-zoom but offers no chrome to
reset it, so users got stuck zoomed in. Web keeps pinch-zoom for accessibility — and Safari
ignores the constraint anyway.

## Daily reminders (8 AM local)

Local notifications via `@capacitor/local-notifications`, iOS app only. **Not push** — the
daily theme is deterministic from the date (`dailyTheme.ts`), so future copy is
pre-computed on-device. No APNs keys, entitlements, subscription store or cron sender.

- **Rolling 14-day window.** `resyncDailyReminders()` cancels IDs 9000–9013 (9099 is the dev
  test shot) and re-schedules the next 14 local 8 AMs with per-day themed copy. Today's slot
  is dropped once `hasPlayedToday()`. Idempotent; runs on launch, `appResume` and
  `gameOver`. A user who stops opening the app stops being nagged after 14 days —
  intentional.
- **iOS shows the permission dialog exactly once, ever, and a denial is permanent**
  (Settings-app only). Hence: never prompted at launch — resync only schedules if already
  granted; a priming card in the daily game-over popup fires the real dialog, with "Not now"
  costing nothing and re-offering after 7 days, max 3 times; intent defaults to **on**
  (`when-daily-reminder` != `'0'`), and the burger-menu row is both the opt-out and the
  recovery path after a denial.
- **Tap deep-links to `/daily`**, which auto-starts and bounces home if already played.
  Cold-start taps are retained by the plugin and delivered once the listener registers.
- Copy is derived with `getLocalDateString(fireAt)`. (An earlier version of this doc said the
  puzzle date came from UTC via `toISOString()`; it does not, and `puzzleDate.ts` explains at
  length why that would be wrong.)

Harness: `/reminder-preview` (unlinked, and unreachable in production — no `vercel.json`
rewrite). Shows the 14-day copy table and priming card on web; on a native build also
permission state, a 10-second test fire, resync, and a pending-schedule dump. Unit tests in
`src/utils/dailyReminder.test.ts`. The simulator delivers local notifications; no Info.plist
or entitlement changes were needed.

## Icons, splash, store art

**The icon is a painting, not vector art.** Four rounds of hand-drawn SVG concepts were
rejected (a "?", hourglass/slot/clock, a symbol-builder, a wall of 25 flat marks); the one
that stuck is a Gemini oil painting of a brass hourglass, made the same way as the card art.
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
- **Splash:** the `LaunchScreen.storyboard` referenced an image named `Splash` that was never
  in the asset catalogue, so launch was a blank white screen. It is now the painting feathered
  into its own corner colour, `#030c1d`, which is also the storyboard background, so no white
  flash either way. The image is 2732 square and aspect-filled, so only the middle ~1260px
  shows on a phone; keep the subject small.
- **Both ship only in a new App Store build.** The web favicons ship on deploy.
- **Store screenshots:** `node scripts/generate-store-screenshots.js` (needs
  `npm install --no-save playwright`) captures the live site at 440x956 DPR 3, which is exactly
  the 6.9" size (1320x2868), and frames each shot with a headline. It plays a Custom game, never
  the Daily, and never submits a score. Leaderboard nicknames are swapped for stand-in names
  before capture: a public listing must not show real players' names. Output:
  `assets/app-store/screenshots/`; `--compose` re-frames the saved raw captures without
  touching the site.

## Things that needed no work

Routing, dark mode, `navigator.share`, safe-area env vars, the service worker, localStorage,
and the PWA install button (auto-hidden — the WebView reports standalone) all work
unmodified in the WebView. Haptics use the native Taptic Engine with a Web Vibration
fallback.
