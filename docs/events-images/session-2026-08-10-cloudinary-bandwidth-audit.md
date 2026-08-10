# Session Summary — Cloudinary Bandwidth & Transformation Audit

**Date:** 2026-08-10
**Branch:** `claude/cloudinary-bandwidth-audit-qdbez8`
**Status:** ✅ Complete — typecheck, lint, and all 169 tests pass. Console lockdown still outstanding (see [Cloudinary Cost Controls](../cloudinary-cost-controls.md)).

## Overview

Traffic jumped on 9–10 Aug. Cloudinary usage jumped far harder: bandwidth from
~50 MB/day to **1.2 GB/day**, transformations from ~30/day to **930/day**. On the
free plan (25 credits per rolling 30 days) that burn rate projects to ~69
credits/month, and Cloudinary's documented behaviour on a fixed plan is to warn,
then **disable the account** — which would take every card image in the game down.

The suspicion was a bad actor. It wasn't, or at least didn't need to be: real
players roughly **4×**'d while bandwidth went **24×**. The gap was per-session
cost, measured at ~10 MB on a first visit.

Net result: a real `/daily` session went from **114 requests / 6.51 MB** to
**32 requests / 0.93 MB**, with _better_ image resolution on every surface.

## Root causes

Confirmed against the live account and, later, against the console's Top
Transformations report.

### 1. The `detail` variant had no width cap — 93% of all bandwidth

`VARIANT_TRANSFORM.detail` was `c_fill,dpr_auto,f_auto,g_auto,q_auto:good`.
**`c_fill` with no `w_`/`h_` is a no-op**, so Cloudinary delivered the full
original. Source assets are 1024×1024 (some 2048×2048) — measured **191 KB** and
**818 KB** for a single card — into a popup that renders at 340 CSS px.

The console report was unambiguous: this variant was **27% of requests but 93% of
bandwidth**, averaging **272 KB per delivery**.

### 2. Eager `detail` warming on every rendered card

`Card.tsx` and `TimelineEvent.tsx` each called
`useImagePreload(getImageUrl(event.image_url, 'detail'))` on render, so the
full-size image was fetched for every card on screen whether or not its popup was
ever opened — roughly 12–24 uncapped fetches per game.

### 3. The achievements panel warmed 60 thumbnails on every home-screen visit

`ModeSelect`'s `useIdlePremount` mounts all five pager panels at idle (a real fix
for an iOS scroll-snap stall), and `AchievementsPanel` warmed all 60 badge images
on mount. Every visitor paid for a tab most never open.

### 4. `TimelinePanel` could burst a returning player's whole collection

`Timeline` is not virtualised, so the panel renders every collected event as an
`<img>`. Pre-mounted, it sits only one to three panel-widths off-screen — inside
Chrome's distance-based `loading="lazy"` threshold.

## What `dpr_auto` did and didn't do

Worth recording, because the first read of this was **wrong**.

The initial diagnosis was that `dpr_auto` inflated thumbnails to 75–81 KB on
DPR-3 phones (measured — that part is real) and fanned each image out into ~6
derived assets per format.

The console report disproved the impact: thumbnails averaged **7.6 KB**, meaning
`dpr_auto` was resolving to **1× for essentially all real traffic** — Cloudinary
only receives a DPR client hint after an `Accept-CH` round trip that mostly never
happened for `<img>` requests. So it was neither inflating bytes nor fanning out
derivatives in practice.

It was still right to remove, for two reasons that survive:

- It is a **latent multiplier** — any change that got client hints flowing would
  have multiplied bytes by up to 9× (area scales with DPR²) with no code change.
- **`dpr_auto` resolves before strict matching**, so it makes Strict
  Transformations impractical: you would need a separate allow-list entry per DPR
  value.

The transformation count is better explained by organic reach into a 5,291-image
catalogue × 3 formats (`f_auto` resolves to **jxl / webp / jpg** on this account)
× 2 rungs.

## The rung ladder

`src/utils/cloudinaryImage.ts` remains the single source of truth — the transform
segment baked into `public/events/*.json` is always stripped and replaced.

| Variant     | Before                                           | After                                          | Avg bytes       |
| ----------- | ------------------------------------------------ | ---------------------------------------------- | --------------- |
| `thumbnail` | `c_fill,dpr_auto,f_auto,g_auto,q_auto:eco,w_220` | `c_fill,f_auto,g_auto,h_400,q_auto:good,w_400` | 7.6 KB → ~24 KB |
| `detail`    | `c_fill,dpr_auto,f_auto,g_auto,q_auto:good`      | `c_fill,f_auto,g_auto,h_768,q_auto:good,w_768` | 272 KB → ~79 KB |

Note the thumbnail got **larger**. That is deliberate: at an effective 220 px the
old rung was under-serving every retina device. `w_400` is ~2.2× the largest card
slot (180×243). Thumbnails are only ~7% of bandwidth, so the quality is nearly
free.

Design decisions worth keeping:

- **Both rungs are square**, matching the square sources. An intermediate revision
  box-cropped `detail` to the popup aspect (`w_512,h_578`) — that was a
  regression: the same URL is rendered `object-contain` by `/image-qc` and inside
  a circle by `AchievementCard`, so a popup-shaped server-side crop silently
  changed those surfaces. CSS does the cropping; the server does not.
- **Parameters are alphabetically ordered** to match Cloudinary's canonical form,
  so the string in the console's transformation list is exactly the string to
  allow-list under Strict Transformations.
- **`f_auto` and `g_auto` stay in the delivery URL** — both resolve per-request at
  the CDN edge and are inert inside named transformations.
- **Sized generously on purpose.** Because detail is now tap-only, the whole
  catalogue's popup art costs ~200 MB/month against a 25 GB allowance. `w_768` is
  ~2.26× the 340×384 box — past what any phone can resolve, so nothing visible was
  lost by dropping the 1024/2048 px original.

## Fetch-volume changes

- **Removed the eager per-card `detail` warm** from `Card.tsx` and
  `TimelineEvent.tsx`, plus the now-dead `preloadDetailImages` prop chain
  (`Timeline`, `TimelinePanel`, `AnimJig`) and the unused `useImagePreload` hook.
  `GamePopup` instead paints the already-cached thumbnail as a `backgroundImage`
  behind the detail `<img>`, reusing the placeholder trick from
  `AchievementCard.tsx`. The thumbnail is always warm — the player just tapped
  that card — so the popup still feels instant.
- **`AchievementsPanel` takes an `active` prop**, mirroring `TimelinePanel`'s
  existing one. The idle pre-mount is kept (it fixes the iOS stall); only the
  image warm is gated. Defaults to `true` so the standalone `/achievements` route
  is unchanged.
- **`TimelinePanel` latches `hasBeenActive`** and renders an empty div until the
  tab has been shown once, so the collection never loads off-screen.
- **`ImageQc`** look-ahead cut from 5 to 2 and moved to `'low'` priority; it was
  the only bulk warm in the codebase at default priority, over a queue that is the
  entire catalogue.

> This partly supersedes
> [2026-06-28 — Image Preload Unification](session-2026-06-28-image-preload-unification.md),
> which described the per-render detail warm in `Card.tsx` / `TimelineEvent.tsx`
> as "correct colocation". The three-layer architecture and the phase-based
> `useImagePrefetch` orchestrator are unchanged and still correct; only the
> per-card detail warming is gone.

## Service worker

Two genuine bugs in `public/service-worker.js`:

1. **Card art was never cached.** `<img>` requests are `no-cors`, so responses are
   opaque and `networkResponse.ok` is `false` — `cacheFirst` skipped `cache.put`
   every time.
2. **`cacheFirst`'s catch returned `/index.html` as the body of any failed
   request.** For an image that means an HTML document handed to an `<img>`, which
   fails to decode, fires `onError`, and permanently swaps in the category-icon
   fallback. Now scoped to `request.destination === 'document'`.

Cloudinary requests now route to a dedicated `imageCacheFirst` that **re-issues
the request in CORS mode** inside the worker (Cloudinary sends
`Access-Control-Allow-Origin: *`). This matters: opaque responses are padded to
several MB each in storage-quota accounting, so caching them would blow the origin
quota and evict everything. CORS responses are charged at true size and carry a
real status code. No `crossOrigin` attribute is needed on the `<img>` tags —
avoiding a cache-key change and a one-time double-fetch.

⚠️ **`IMAGE_CACHE` is deliberately unversioned.** `activate` deletes every cache it
does not recognise, and `scripts/inject-version.js` rewrites the versioned names
on each release. Versioning the image cache would wipe every cached card image on
every deploy — several times a week under auto-release-on-merge. A comment in
`inject-version.js` records this.

Bounded to 400 entries, trimmed in insertion order behind a single in-flight
promise.

## What was investigated and deliberately _not_ changed

**`/events/*.json` caching.** The plan called for a long `Cache-Control` in
`vercel.json` (which has no `headers` block at all) on the belief that 3.0 MB of
event JSON re-downloads every load. Measured against production, it does not:
Vercel already serves `public, max-age=0, must-revalidate` with an ETag, and a
conditional GET returns **304 with 0 bytes**.

Adding a long `max-age` would also be actively harmful — the daily deck is seeded
from the catalogue, so clients disagreeing about it would produce different daily
decks and break the shared leaderboard. Current config is correct.

## Files modified

| File                                                                                    | Change                                                                                  |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/utils/cloudinaryImage.ts`                                                          | The rung ladder — the core fix                                                          |
| `src/utils/cloudinaryImage.test.ts`                                                     | New expectations + regression guards: no `dpr_`, every variant bounded by `w_`          |
| `src/utils/preloadImage.test.ts`                                                        | Updated variant assertions                                                              |
| `src/components/Card.tsx`, `Timeline/TimelineEvent.tsx`                                 | Eager detail warm removed                                                               |
| `src/components/Timeline/Timeline.tsx`, `panels/TimelinePanel.tsx`, `pages/AnimJig.tsx` | Dead `preloadDetailImages` prop chain removed; timeline render gated on `hasBeenActive` |
| `src/components/GamePopup.tsx`                                                          | Blur-up placeholder; fixed 384 px box replacing stale-metadata maths                    |
| `src/components/panels/AchievementsPanel.tsx`, `ModeSelect.tsx`                         | 60-thumb warm gated on `active`                                                         |
| `src/components/AchievementCard.tsx`                                                    | Stale "uncapped detail" comment corrected                                               |
| `src/pages/ImageQc.tsx`                                                                 | Look-ahead 5 → 2, `'low'` priority                                                      |
| `src/hooks/useImagePreload.ts`                                                          | **Deleted** — no longer used                                                            |
| `public/service-worker.js`                                                              | Image cache + CORS re-issue + `/index.html`-as-image fix                                |
| `public/robots.txt`                                                                     | Disallow `/image-qc`, `/card-reports`                                                   |
| `scripts/inject-version.js`                                                             | Warning against versioning `IMAGE_CACHE`                                                |
| `scripts/cloudinary-usage.js`                                                           | **New** — `npm run cloudinary:usage`                                                    |
| `docs/cloudinary-cost-controls.md`                                                      | **New** — rung rules + console runbook                                                  |

## Stale `image_width` / `image_height`

5,293 of 5,300 events claim **330×440** — leftover Wikipedia thumbnail dimensions.
The real sources are square. `GamePopup.getImageHeight()` divided by that ratio,
got 453, and clamped to `IMAGE_MAX_HEIGHT = 384`, so it was **already** a constant
384 px for every playable event.

Replaced with an explicit constant — pixel-identical to what shipped. Note that
_backfilling_ the true dimensions would have been the wrong move: it would compute
340 px and shrink the hero by 44 px, a visual regression delivered as a "data fix".
The fields remain in `types/index.ts` but now have no reader.

## Verification

Measured by driving the real app with Playwright (see
[Driving the App](../driving-the-app-with-playwright.md)), same harness on both
sides — the `before` column is `59177c4` (v1.6.0).

| Scenario            | Before            | After                |
| ------------------- | ----------------- | -------------------- |
| Home screen, idle   | 80 req / 0.84 MB  | **21 req / 0.47 MB** |
| `/daily` auto-start | 114 req / 6.51 MB | **32 req / 0.93 MB** |

Also asserted: zero requests containing `dpr_`, zero requests without a `w_`, and
**DPR 1 and DPR 3 now request byte-identical URLs** — the derivative fan-out is
structurally gone.

One caveat on the baseline: Chromium did not send DPR client hints cross-origin in
the harness, so `dpr_auto` resolved at 1× there. That matches real-world traffic
(7.6 KB average thumbnail), so the comparison is fair rather than flattering.

Projected 30-day bandwidth at the observed traffic: **~0.41 GB**, against a 25 GB
allowance.

## Still outstanding

Console work, documented in [Cloudinary Cost Controls](../cloudinary-cost-controls.md):

1. **Allowed fetch domains → `play-when.com`.** `/image/fetch/` is open right now —
   anyone can pipe an arbitrary remote URL through the account and bill it for the
   fetch, transformation _and_ storage. Free, zero-risk, do it first.
2. **Strict Transformations**, after ~48 h of the new URLs being live. This is the
   only hard cap on transformation abuse — delivery URLs are not rate-limited.
   Allow-list **six** entries (two rungs × jxl/webp/jpg) _before_ enabling it, or
   the site goes down.
3. **Allowed strict referral domains** — `play-when.com`, `*.vercel.app`,
   `localhost`. The iOS app is safe: `capacitor.config.ts` points the WKWebView at
   `https://play-when.com`, so it sends a normal referer.
4. Purge the orphaned `dpr_auto`-era derived assets once the new URLs are verified.
