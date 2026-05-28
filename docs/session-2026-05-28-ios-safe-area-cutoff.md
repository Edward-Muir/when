# Session Summary — iOS Safe-Area Cutoff & Stuck-Zoom Fix

**Date:** 2026-05-28
**Branch:** main
**Status:** Implemented & verified locally (typecheck / lint / build pass). Not yet committed or deployed.

## Overview

The iOS Capacitor app was cutting off the top of the page — the large "When?"
title on the home screen and the "Custom" title on the second pager page were
hidden behind the top bar. The web app on mobile Safari rendered everything
correctly. Separately, the native app could get "zoomed in" with no way to zoom
back out.

Both issues were diagnosed and fixed. The fix keeps the edge-to-edge immersive
look (the iOS status bar continues to overlay the webview) and corrects the
underlying layout bug, plus locks zoom on the native platform only.

## Root Cause

### Cutoff

The fixed `TopBar` (`src/components/TopBar.tsx:57`) correctly grows with the
device safe area via `pt-safe` (`env(safe-area-inset-top)`), so its real height
is `safe-area-inset + ~56px`. But every full-screen container cleared that bar
with a **hardcoded** pixel offset that ignored the inset:

- **Mobile Safari:** Safari's own URL bar occupies the notch/Dynamic-Island
  area, so inside the web viewport `env(safe-area-inset-top) ≈ 0`. The bar is
  ~56px and the hardcoded offsets cleared it — everything visible. ✅
- **Native app:** `capacitor.config.ts` sets `StatusBar.overlaysWebView: true`,
  so the WKWebView extends edge-to-edge under the Dynamic Island and
  `env(safe-area-inset-top) ≈ 59px`. The bar becomes ~115px tall, but content
  padding stayed at 56–80px, so the opaque z-50 `TopBar` covered the title. ❌

### Stuck zoom

The viewport meta (`public/index.html:6`) had no zoom constraints. WKWebView
honors pinch/double-tap zoom and offers no chrome to reset it, so users got
stuck. (Mobile Safari ignores these constraints for accessibility, which is why
the web was unaffected.)

## Key Decisions

- **Keep edge-to-edge look** (overlay stays on) instead of the simpler
  `StatusBar.overlaysWebView: false` one-liner. Confirmed with user. The status
  bar is the iOS system strip (clock/battery), not a game element — neither
  option removed any game UI; the choice was purely cosmetic (immersive vs. a
  solid top band).
- **Make content offsets safe-area-aware** via reusable Tailwind padding
  utilities computed as `calc(env(safe-area-inset-top) + <base>)`. On web
  `env()` = 0, so the layout stays pixel-identical; only native gains the inset.
- **Preserve each distinct base value** (56 / 80 / 60px) rather than normalizing,
  to guarantee zero web visual change.
- **Lock zoom on native only** (gated by `Capacitor.isNativePlatform()`), so the
  web keeps pinch-to-zoom for accessibility.

## Files Modified

| File                                                 | Change                                                                                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwind.config.js`                                 | Added 3 padding utilities under `theme.extend.padding`: `topbar` = `calc(env(safe-area-inset-top) + 3.5rem)`, `topbar-wide` = `calc(env(safe-area-inset-top) + 5rem)`, `topbar-fixed` = `calc(env(safe-area-inset-top) + 60px)`. |
| `src/components/Game.tsx` (line ~238)                | `pt-14` → `pt-topbar`                                                                                                                                                                                                            |
| `src/components/ModeSelect.tsx` (line ~254)          | `pt-20` → `pt-topbar-wide` (the reported home screen)                                                                                                                                                                            |
| `src/components/ViewTimeline.tsx` (line ~69)         | `pt-[60px]` → `pt-topbar-fixed`                                                                                                                                                                                                  |
| `src/pages/InfoPageLayout.tsx` (line ~28)            | `pt-[60px]` → `pt-topbar-fixed`                                                                                                                                                                                                  |
| `src/App.tsx` (after the Capacitor lifecycle effect) | Added a native-only `useEffect` that rewrites the viewport `<meta>` to include `maximum-scale=1.0, user-scalable=no`.                                                                                                            |

> `ModeSelect.tsx:43` (loading state) was intentionally left unchanged — it
> already uses `pt-safe` and is centered, so it is not affected.

## Verification Done

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run build` — compiled successfully (CSS bundle shrank slightly)
- Confirmed the 3 new rules emitted into the built CSS:
  - `padding-top:calc(env(safe-area-inset-top) + 3.5rem)`
  - `padding-top:calc(env(safe-area-inset-top) + 5rem)`
  - `padding-top:calc(env(safe-area-inset-top) + 60px)`

## Critical Deployment Nuance

`capacitor.config.ts` has `server.url: 'https://play-when.com'`. **The native
app is a WKWebView pointing at the live site, not bundled assets.** Therefore:

- These web changes appear in the installed app **only after the web build is
  deployed** to play-when.com (Vercel).
- No `capacitor.config` change and no `npx cap sync` / `cap copy` is needed
  (the overlay setting was not changed).
- `Capacitor.isNativePlatform()` still returns `true` in the app on the remote
  URL (Capacitor injects its native bridge), so the native-only zoom lock works
  in-app and is correctly skipped on regular Safari.

## Next Steps / Unfinished Work

1. **Commit** the changes (not yet committed — user was asked).
2. **Deploy** to a Vercel preview or production to test on a real
   Dynamic-Island device / simulator. Confirm:
   - Full "When?" and "Custom" titles are visible (no clipping).
   - Game, View Timeline, and info pages clear the bar correctly.
   - Pinch / double-tap zoom no longer zooms the app.
3. Optional faster local native test: temporarily point `server.url` at a local
   dev server (`http://<mac-ip>:3000`, `cleartext: true`), `npx cap copy ios`,
   run on the simulator, then revert the config.
4. Web regression spot-check on desktop + mobile Safari that Home, an active
   game, View Timeline, and an info page look pixel-identical to before, and
   that pinch-zoom still works on web.

## Reusable Pattern Introduced

`pt-topbar` / `pt-topbar-wide` / `pt-topbar-fixed` are now available as
safe-area-aware "clear the fixed TopBar" offsets. Any future full-screen
container that sits below the fixed `TopBar` should use one of these instead of
a hardcoded `pt-*` value.
