# Cloudinary cost controls

How card images are delivered, why usage blew up in August 2026, and the console settings
that keep it capped. Code-side changes are already shipped; the **console steps in §4 are
manual** and still need doing.

## 1. How images are delivered

Every playable event carries an `image_url` baked into `public/events/*.json`, pointing at
the `dscb8inz1` Cloudinary account. The baked transform segment is **always stripped and
replaced at runtime** by `getImageUrl()` in `src/utils/cloudinaryImage.ts`, which is the
single source of truth for delivery URLs. Two rungs:

| Variant     | Transform                                      | Typical bytes |
| ----------- | ---------------------------------------------- | ------------- |
| `thumbnail` | `c_fill,f_auto,g_auto,h_400,q_auto:good,w_400` | ~24 KB        |
| `detail`    | `c_fill,f_auto,g_auto,h_768,q_auto:good,w_768` | ~79 KB        |

Both are **square**, matching the source assets (1024×1024, some 2048×2048). Keep them
square: `detail` is rendered `object-contain` by `/image-qc` and inside a circle by
`AchievementCard`, so a popup-shaped server-side crop would silently change those surfaces.

Parameters are ordered **alphabetically** to match Cloudinary's canonical form, so the
string shown in the console's transformation list is exactly the string to allow-list in §4.

### Rules for changing these

- **Never add `dpr_auto`.** It multiplies bytes by device DPR _and_ mints a separate
  derived asset per DPR value. Guarded by a test in `cloudinaryImage.test.ts`.
- **Never leave a rung without `w_`.** `c_fill` with no dimensions is a no-op and delivers
  the full original. Also guarded by a test.
- **Keep `f_auto` and `g_auto` in the delivery URL.** Both resolve per-request at the CDN
  edge and are inert inside named transformations.
- **Don't add a third rung casually.** Cost scales as
  `images touched × rungs × formats (~2–3)`. Across the full 5,291-image catalogue, each
  rung is roughly 13,000 transformations — about half a month's free-plan allowance.

## 2. What went wrong in August 2026

Bandwidth went from ~50 MB/day to 1.2 GB/day and transformations from ~30/day to 930/day,
on roughly 4× the usual traffic. Per-session cost was the multiplier, not traffic:

1. **`detail` had no width cap** — Cloudinary shipped the full 1024/2048px original
   (191–818 KB per card) into a 340px popup.
2. **`dpr_auto`** made a thumbnail cost 75–81 KB on a DPR-3 phone versus 9.5 KB at DPR 1,
   and fanned each image out to ~18 derivatives per variant (≈6 DPRs × ~3 formats).
   Transformations are billed **when a derived asset is created**, so that fan-out — not
   delivery volume — drove the transformation spike.
3. **The achievements panel** warmed all 60 badge thumbnails on a panel the pager
   pre-mounts at idle, so every home-screen visitor paid ~4.4 MB for a tab most never open.
4. **Every rendered card** eagerly warmed its full-size `detail` image, opened or not.

Measured cost fell from ~10 MB to ~1 MB per session.

## 3. Billing model, in short

One fungible credit pool. **1 credit = 1 GB bandwidth _or_ 1,000 transformations _or_
1 GB storage.** The free plan is **25 credits on a rolling 30-day window**.

Transformations count **on derived-asset creation**, not per delivery — repeat hits on an
identical URL are free. This is why a fixed rung ladder matters so much more than raw
traffic, and why an abuser hammering one URL costs bandwidth but not transformations.

There is **no self-service spend cap**. On a fixed plan Cloudinary warns at ~90% and 100%,
then **disables the account** — which takes every card image in the game down. Hence §5.

## 4. Console lockdown (manual — not yet done)

All under **Settings → Security** at `console.cloudinary.com` unless noted.

### Do now — free, zero risk

- **Allowed fetch domains** → set to `play-when.com`. The app never uses `/image/fetch/`,
  but it is open today: anyone can pipe an arbitrary remote URL through the account and
  bill it for the fetch, the transformation _and_ the storage.
- **Settings → Upload** → delete any unsigned upload presets.
- **Restricted media types** → optionally restrict `video` and `raw` (both unused). Leave
  `image` unrestricted; restricting it forces signed URLs everywhere.
- **Settings → Account** → confirm the usage-alert email is one you actually read.

### Strict Transformations — sequencing matters

This is the control that hard-caps the transformation line: with it on, an attacker can
only ever request the derived assets you already generate, so URL-parameter fuzzing stops
working. **Enabling it before allow-listing takes the site down**, so:

1. Ship the current rung ladder and wait ~48h for real traffic to generate both strings.
2. Console → **Transformations** → find each string below → kebab menu → **Allowed for
   strict transformations**:
   - `c_fill,f_auto,g_auto,h_400,q_auto:good,w_400`
   - `c_fill,f_auto,g_auto,h_768,q_auto:good,w_768`

   Each is minted per format, so expect three console entries per rung (jxl / webp / jpg).
   All six need allow-listing.

3. Only then enable **Strict transformations**. Test on a preview deploy first.

Named transformations buy nothing here: `f_auto` cannot live inside one, so you would
allow-list the combined chain either way, and redefining a named transformation
invalidates and re-mints all its derived assets.

### Allowed strict referral domains

Add `play-when.com`, plus `*.vercel.app` for previews and `localhost` for dev. This blunts
casual hotlinking; it is spoofable, so treat it as friction, not security.

**The iOS app is safe.** `capacitor.config.ts` sets `server.url = 'https://play-when.com'`,
so the WKWebView loads the real site and sends a normal `play-when.com` referer. If that
ever changes to bundled assets, the referer becomes `capacitor://localhost` and image
delivery breaks on production iOS only — a miserable bug to track down. Also: never add
`<meta name="referrer" content="no-referrer">`.

### After the new URLs are verified live

Purge the orphaned `dpr_auto`-era derived assets (Console → Transformations → select the
old string → Delete derived assets). This does not refund transformations already counted,
but it reclaims storage credits.

## 5. Monitoring

```bash
npm run cloudinary:usage           # report; exits 1 above 75% of any quota
npm run cloudinary:usage -- --json # machine-readable
```

Needs `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (Console → Settings → API Keys) in
`.env`. Read-only. Cloudinary's own alerts fire at ~90%, which at August's burn rate would
have been far too late.

Watch **derived assets** alongside transformations: if transformations grow without a
proportional rise in derived assets, someone is minting-and-discarding parameter
permutations — the classic abuse signature.

## 6. Telling organic traffic from an abuser

Console → **Home → Delivery Reports**:

- **Top Assets** — a few assets dominating means scripted hammering or a hotlink; a flat
  spread across hundreds means organic play.
- **Top Transformations** — entries with no transformation name are raw originals; many
  near-identical widths (`w_300`, `w_301`, …) means URL fuzzing.
- **Top Browsers / Countries** — a single UA or country carrying a spike is the tell.
- **Bandwidth ÷ requests** — the fastest single check. If average bytes per delivery sits
  near your largest asset, someone is pulling detail variants directly.

For the August 2026 spike the evidence pointed to organic traffic: a _sustained_ ~930
transformations/day is real users reaching into new corners of a 5,291-image catalogue,
whereas a scraper produces a huge one-shot spike and then a flat line.
