# Cloudinary cost controls

How card images are delivered, what multiplies their cost, and the console settings that keep
it capped. The rules in §1 are enforced in code and tests; the **console steps in §4 are
manual**, so check the console for their state rather than assuming it.

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
  `images touched × rungs × formats (~2–3)`. Across the full catalogue (~5,800 images), each
  rung is roughly 15,000 transformations — over half a month's free-plan allowance.
- **Never sample the catalogue uniformly at random for a decorative surface.** Any screen
  that shows arbitrary events — the game-start intro animation, and any future "random card"
  surface — must draw from a **date-seeded bounded pool**, so its ceiling is the pool rather
  than the whole catalogue. Distinct images touched is then
  `POOL_SIZE × rungs × formats`, which is flat and **independent of traffic**. At
  `INTRO_POOL_SIZE = 60` per week that's ~783 transformations/month against a 25,000/month
  allowance; unbounded, the same screen projects to ~35,000/month. See
  `src/utils/introEvents.ts`, guarded by `src/utils/introEvents.test.ts`.

### The service-worker image cache

Cloudinary requests route to a dedicated `imageCacheFirst` handler in
`public/service-worker.js`, separate from the generic `cacheFirst`. Three things about it are
load-bearing and easy to undo:

- **It re-issues the request in CORS mode inside the worker.** `<img>` requests are `no-cors`,
  so their responses are opaque — `response.ok` is `false`, so a handler that caches the
  `<img>`'s own response silently never caches a single card image. Opaque responses are also **padded to several MB
  each** in storage-quota accounting, so caching them as-is would blow the origin quota and
  evict everything. Cloudinary sends `Access-Control-Allow-Origin: *`, so the re-issued request
  is charged at true size and carries a real status code. No `crossOrigin` attribute is needed
  on the `<img>` tags, which avoids a cache-key change and a one-time double-fetch.
- **`IMAGE_CACHE` is deliberately unversioned.** `activate` deletes every cache it does not
  recognise, and `scripts/inject-version.js` rewrites the versioned names on each release.
  Versioning this one would wipe every cached card image on every deploy — several times a week
  under auto-release-on-merge. A comment in `inject-version.js` records this.
- It is bounded to **400 entries**, trimmed in insertion order behind a single in-flight promise.

**`cacheFirst`'s offline fallback (`/index.html`) is scoped to
`request.destination === 'document'`.** Returned for a failed image, it hands an HTML document
to an `<img>`, which fails to decode, fires `onError`, and permanently swaps in the
category-icon fallback.

## 2. What multiplies the cost

Per-session cost is the multiplier, not traffic. Together these take a session from ~1 MB of
images to ~10 MB and drive bandwidth and transformations up at once:

1. **A rung with no width cap** ships the full 1024/2048px original (191–818 KB per card) into
   a 340px popup.
2. **`dpr_auto`** makes a thumbnail cost 75–81 KB on a DPR-3 phone versus 9.5 KB at DPR 1, and
   fans each image out to ~18 derivatives per variant (≈6 DPRs × ~3 formats). Transformations
   are billed **when a derived asset is created**, so that fan-out — not delivery volume —
   drives the transformation count.
3. **Warming art on a pre-mounted panel.** The pager pre-mounts every panel at idle, so warming
   all 60 badge thumbnails there charges every home-screen visitor ~4.4 MB for a tab most never
   open. Badge art is warmed only for unlocked badges, once the Stats tab is on screen.
4. **Eagerly warming every rendered card's `detail` image**, opened or not. `Card.tsx` doesn't.
5. **Uniform random sampling for a decorative screen.** The game-start intro shows 20 events on
   every entry to `modeSelect` — once per game, and again on every Restart. Drawn from the
   whole catalogue, its transformation ceiling is the whole catalogue, growing linearly with
   traffic; drawn from the weekly `INTRO_POOL_SIZE` pool, it is flat. See the rule in §1.

## 3. Billing model, in short

One fungible credit pool. **1 credit = 1 GB bandwidth _or_ 1,000 transformations _or_
1 GB storage.** The free plan is **25 credits on a rolling 30-day window**.

Transformations count **on derived-asset creation**, not per delivery — repeat hits on an
identical URL are free. This is why a fixed rung ladder matters so much more than raw
traffic, and why an abuser hammering one URL costs bandwidth but not transformations.

There is **no self-service spend cap**. On a fixed plan Cloudinary warns at ~90% and 100%,
then **disables the account** — which takes every card image in the game down. Hence §5.

## 4. Console lockdown (manual)

All under **Settings → Security** at `console.cloudinary.com` unless noted.

### Free, zero risk

- **Allowed fetch domains** → set to `play-when.com`. The app never uses `/image/fetch/`,
  but left open, anyone can pipe an arbitrary remote URL through the account and
  bill it for the fetch, the transformation _and_ the storage.
- **Settings → Upload** → delete any unsigned upload presets.
- **Restricted media types** → optionally restrict `video` and `raw` (both unused). Leave
  `image` unrestricted; restricting it forces signed URLs everywhere.
- **Settings → Account** → confirm the usage-alert email is one you actually read.

### Strict Transformations — sequencing matters

This is the control that hard-caps the transformation line: with it on, an attacker can
only ever request the derived assets you already generate, so URL-parameter fuzzing stops
working. **Enabling it before allow-listing takes the site down**, so:

1. Make sure the current rung ladder has been live ~48h, so real traffic has generated both
   strings.
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

**The native apps are safe.** `capacitor.config.ts` sets `server.url = 'https://play-when.com'`,
so the WebView loads the real site and sends a normal `play-when.com` referer. Switching to
bundled assets would make the referer `capacitor://localhost` (iOS) and break image delivery in
the production apps only — a miserable bug to track down. Also: never add
`<meta name="referrer" content="no-referrer">`.

### Orphaned derived assets

Derived assets for a transformation string the app does not request (a `dpr_auto` one, say)
can be purged: Console → Transformations → select the string → Delete derived assets. This
does not refund transformations already counted, but it reclaims storage credits.

## 5. Monitoring

```bash
npm run cloudinary:usage           # report; exits 1 above 75% of any quota
npm run cloudinary:usage -- --json # machine-readable
```

Needs `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` (Console → Settings → API Keys) in
`.env`. Read-only. Cloudinary's own alerts fire at ~90%, which at a bad burn rate is far too
late.

Watch **derived assets** alongside transformations: if transformations grow without a
proportional rise in derived assets, someone is minting-and-discarding parameter
permutations — the classic abuse signature.

## 6. Telling organic traffic from an abuser

Console → **Home → Delivery Reports**:

- **Top Assets** — a few assets dominating means scripted hammering or a hotlink.
  ⚠️ **The converse does not mean organic play.** Every surface that touches arbitrary events
  is bounded or seeded (§1), so a broad flat spread across hundreds of thumbnails is a
  **regression signal** — something has reintroduced uniform random sampling over the
  catalogue. Check `INTRO_POOL_SIZE` and its test first.
- **Top Transformations** — entries with no transformation name are raw originals; many
  near-identical widths (`w_300`, `w_301`, …) means URL fuzzing.
- **Top Browsers / Countries** — a single UA or country carrying a spike is the tell.
- **Bandwidth ÷ requests** — the fastest single check. If average bytes per delivery sits
  near your largest asset, someone is pulling detail variants directly.

A _sustained_ rise in transformations per day is real users reaching into new corners of the
catalogue; a scraper produces a huge one-shot spike and then a flat line.
