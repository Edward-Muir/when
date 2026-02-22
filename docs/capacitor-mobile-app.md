# Mobile App Setup (Capacitor)

## Overview

The "When?" web app is wrapped as a native iOS (and eventually Android) app using [Capacitor](https://capacitorjs.com/). The native app is a thin shell that loads `https://play-when.com` — so every Vercel deploy automatically updates the app with zero extra steps.

**Tradeoff:** The app requires an internet connection to load. This is acceptable since the leaderboard already needs connectivity.

## What's Been Done

### Packages Installed

- `@capacitor/core` — Capacitor runtime
- `@capacitor/cli` — CLI tools (`cap sync`, `cap open`, etc.)
- `@capacitor/ios` — iOS platform support
- `@capacitor/status-bar` — Native status bar control
- `@capacitor/splash-screen` — Native splash screen

### Configuration

- **`capacitor.config.ts`** — Points `server.url` at `https://play-when.com`, configures splash screen (background `#FAF8F5`) and status bar (overlays web view)
- **`.gitignore`** — Updated to exclude native build artifacts (`ios/App/App/public`, `ios/App/Pods`, etc.)
- **`package.json`** — Added convenience scripts: `cap:sync`, `cap:open:ios`, `cap:open:android`

### iOS Project Scaffolded

- `ios/` directory created with Xcode project
- Capacitor plugins detected: `@capacitor/splash-screen`, `@capacitor/status-bar`
- Web assets synced to native project

### Prerequisites Installed

- CocoaPods (via Homebrew)
- Node.js upgraded to v22 (required by Capacitor v8)

## What You Need To Do

### 1. Apple Developer Account

Sign up at https://developer.apple.com/programs/ ($99/year). You need this to:

- Sign the app for device testing
- Submit to the App Store

### 2. Configure Xcode Signing

```bash
npx cap open ios
```

In Xcode:

1. Click **App** in the project navigator (left sidebar)
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** from the dropdown (your Apple Developer account)
6. The **Bundle Identifier** should be `com.playwhen.app`

### 3. Test on Simulator

1. Select an iPhone simulator from the device picker (top of Xcode)
2. Click the **Run** button (play icon) or press `Cmd+R`
3. The app should launch and load play-when.com
4. Verify: game loads, cards can be dragged, leaderboard works

### 4. Test on a Real Device

1. Connect your iPhone via USB
2. Select it from the device picker in Xcode
3. Run the app — you may need to trust the developer certificate on your phone (Settings > General > VPN & Device Management)

### 5. App Icons

Replace the placeholder icons in Xcode:

1. In Xcode, navigate to **App > Assets.xcassets > AppIcon**
2. You need a **1024x1024** icon (no transparency, no rounded corners — iOS adds those)
3. Drag your icon onto the AppIcon slot
4. Xcode will generate all required sizes automatically

You can use the existing `public/logo512.png` as a starting point, but you'll want a 1024x1024 version for the App Store.

### 6. Splash Screen

The splash screen uses the native iOS launch storyboard. To customize:

1. In Xcode, open **App > App > LaunchScreen.storyboard**
2. Modify the layout/image as desired
3. The background color is already set to `#FAF8F5` via `capacitor.config.ts`

### 7. App Store Submission

When ready to submit:

1. In Xcode: **Product > Archive**
2. In the Organizer window: click **Distribute App**
3. Follow the prompts to upload to App Store Connect

You'll need to prepare in [App Store Connect](https://appstoreconnect.apple.com/):

- App name, subtitle, description
- Screenshots for required device sizes (6.7", 6.5", 5.5" iPhones, optionally iPad)
- Privacy policy URL
- App category: Games > Trivia
- Age rating questionnaire
- Keywords for search

### 8. Android (Future)

When ready to add Android:

```bash
npm install @capacitor/android
npx cap add android
npx cap sync android
npx cap open android   # Opens Android Studio
```

Requires:

- Android Studio installed
- Google Play Developer account ($25 one-time)

## Convenience Commands

```bash
npm run cap:sync          # Sync web build to native projects
npm run cap:open:ios      # Open iOS project in Xcode
npm run cap:open:android  # Open Android project in Android Studio
```

## How Updates Work

| Update type                                              | How to deploy                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Web content (features, bug fixes, new events)            | Deploy to Vercel as usual. The app loads play-when.com, so updates are instant. |
| Native shell changes (icons, splash screen, new plugins) | Rebuild in Xcode, submit to App Store for review. This is rare.                 |

## Key Files

| File                  | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `capacitor.config.ts` | App ID, server URL, plugin configuration                 |
| `ios/`                | Xcode project (committed to git)                         |
| `ios/App/App/public/` | Synced web build (gitignored, regenerated by `cap sync`) |

## Things That Just Work (No Changes Needed)

- **Routing** — BrowserRouter loads play-when.com routes normally
- **Dark mode** — CSS variables respect system preference
- **Share** — `navigator.share` works in Capacitor WebViews
- **Haptics** — Web Vibration API works
- **Safe areas** — `viewport-fit=cover` and `env(safe-area-inset-*)` already in place
- **Service worker** — Caches and serves from play-when.com as normal
- **PWA install button** — Auto-hidden (Capacitor WebView runs in standalone mode)
- **localStorage** — Persists between app launches
