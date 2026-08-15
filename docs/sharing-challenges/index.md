# Sharing & Challenges

Two things live here: the **share payload** (what a result looks like when a player posts
it) and the **challenge code** (settings + seed packed into a token so a recipient plays
the identical game). Challenge-code work is original to 2026-03-01, format since rewritten.

## The share payload

`src/utils/share.ts` builds the message; `src/utils/shareImage.ts` renders a 1080x1920
story card that travels with it as a `File`. `/share-preview` (unlinked, local dev only)
renders both side by side and can fire a real share sheet.

### Why there is an image at all

**Instagram never appears in a share sheet for a text-only payload** — it accepts image
and video only. Attaching a file is the sole route to Instagram from the web, and it makes
WhatsApp and Messages shares far more eye-catching too. `shareContent()` therefore tries
three payloads in order:

1. `{ text, files }` — keeps the tappable link.
2. `{ files }` alone — Instagram, Snapchat and Pinterest are reported to drop out of the
   sheet when `text`/`url` travel alongside `files`. Files-only is the known workaround.
3. `{ title, text }`, then the clipboard.

An `AbortError` is a user cancelling, not a failure — it must **not** fall through to the
next payload, or cancelling once re-opens the sheet.

Because tier 2 can drop the text entirely, **the URL is burned into the image**. It is not
decoration; it is the only thing telling a viewer where to play.

### Only the seed card may be shown

The hero art is the pre-placed seed event — the card already on the timeline at kickoff,
and the same one the home screen shows as the daily preview. It gives nothing away.
**Do not extend this to placed cards**: rendering what a player actually placed leaks the
composition of that day's puzzle to everyone who sees the post.

### Cost

Art is fetched through the existing `thumbnail` rung (`getImageUrl(url, 'thumbnail')`), an
image the player has already been served, so a share costs zero Cloudinary transformations.
A bespoke size for this surface would mint a third rung — see
[cloudinary-cost-controls.md](../cloudinary-cost-controls.md). The one deviation is
`crossOrigin = 'anonymous'`, which is mandatory (an untagged image taints the canvas and
`toBlob()` throws) and costs at most one extra fetch of an already-derived asset.

### Decisions in force on the message

- **No emoji grid.** Removed 2026-08. Unlike Wordle's 2D narrative, ours was a 1D run of
  greens with at most `handSize` reds, restating the number on the line below it and
  growing _longer_ the better you played. `generateEmojiGrid()` still exists — the daily
  result stores it and the leaderboard renders it.
- **One emoji, reserved for `#1 globally`.** Everything else is plain text.
- **Exactly one URL, always last.** WhatsApp and iMessage preview the _first_ URL they
  find, so a second one upstream would silently change which page gets the preview card.
- **Bare domains** (`play-when.com/daily`, no scheme) in the text. Every major target
  linkifies them and they read better in a three-line message.
- **Dates are split, never re-parsed.** `new Date('2026-08-15')` is UTC midnight rendered
  in local time, which prints the previous day west of Greenwich. `formatShareDate()`
  regex-splits the string the puzzle day already got right.

### Not done yet

The OG tags in `public/index.html` are static, so a `/daily` result and a
`/challenge/<code>` invite both preview identically in WhatsApp. A per-route OG image
(Vercel edge + Satori) is the obvious next win. Constraints if picked up: ~1200x630,
**under 600 KB**, JPG/PNG/WebP only, and WhatsApp caches previews for days with no refresh
mechanism, so iterating needs a cache-busting query param.

A one-tap "Add to Story" needs the native `instagram-stories://share` scheme plus the
`com.instagram.sharedSticker.backgroundImage` pasteboard key and a Meta App ID. That is
reachable from the Capacitor shell only — the web cannot do it.

## The challenge code

**`src/utils/challengeCode.ts` is the source of truth for the wire format.** Its header
comment carries the current bit layout. Read it before touching the encoding.

### The format was rewritten — old numbers are wrong

The 2026-03-01 design was **33 bits → 3 words**, using three separate 2048-word lists
(11 bits each), with a 6-bit category mask and an 8-bit seed. None of that is current.

Today it is **72 bits → 6 words** from a single 4096-entry `WORDLIST` (12 bits each), with a
**fixed 32-bit** category mask and a 21-bit seed. If you find a doc, comment or memory
describing 3-word codes or 33 bits, it predates the rewrite.

Two properties of the current layout are load-bearing:

- **The category mask is fixed-width at 32 bits even though only 20 categories exist.** That
  is what let the taxonomy grow from 6 to 20 without invalidating existing links. Do not
  shrink it to fit.
- **Bit 0 is reserved and ignored.** It used to select the removed `freeplay` mode; roughly
  half of all links ever issued set it. Encoding always writes 0, decoding maps either value
  to `suddenDeath`. It cannot be reclaimed: the format is positional, so shifting it would
  misdecode _every_ link ever issued, not just freeplay ones.

### Decisions still in force

- **`WORDLIST` order is immutable.** Reordering or removing a word changes what every
  existing token decodes to. Append only, and only in multiples that keep the length a power
  of two.
- **Player count travels with the challenge**, rather than being forced to single-player, so
  a recipient can play multiplayer if they have people around. (Moot in practice — no UI
  reaches multiplayer; see CLAUDE.md.)
- **Restart re-rolls the seed** rather than replaying the identical game.
- **BigInt via `BigInt()` calls, not `12n` literals.** The 72-bit value exceeds JS's 53-bit
  safe-integer range, but the TS target is below ES2020 so literals won't parse. (The
  original 33-bit version used plain arithmetic; that stopped being safe at 72 bits.)
- **Event-set drift is accepted.** Adding or removing events can make an old token produce a
  different game — same tradeoff the daily makes.

### Superseded UI work

Two 2026-03-01 sessions built the share-code UI inside a `SettingsPopup`: a "Challenge a
Friend" section, then an editable two-way code input that decodes a pasted code back into
the form controls. **`SettingsPopup` no longer exists.** The two-way input survives, moved
into `CustomGameSettings.tsx` on the Custom tab. One implementation note carried over:

- **A `useRef` flag guards the two-way sync.** Applying a decoded code updates the settings,
  which recomputes the code via `useMemo`, which would sync back and overwrite what the user
  typed. `applyingCodeRef` skips the sync for one cycle. Removing it reintroduces the loop.
- Invalid codes show a red border rather than being silently ignored — a deliberate choice,
  since silently keeping the old settings is confusing.
