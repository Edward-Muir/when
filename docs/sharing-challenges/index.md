# Sharing & Challenges

Two things live here: the **share payload** (what a result looks like when a player posts
it) and the **challenge code** (settings + seed packed into a token so a recipient plays
the identical game). Challenge-code work is original to 2026-03-01, format since rewritten.

## The share payload

`src/utils/share.ts` builds the message; `src/utils/shareImage.ts` renders a 1080x1350
card that travels with it as a `File`. `/share-preview` (unlinked, local dev only) renders
both side by side and can fire a real share sheet.

### The frame is 4:5 because WhatsApp crops

This shipped at 1080x1920 and WhatsApp **center-cropped it in chat**, showing roughly a
1:1.41 slice — about 200px gone from the top and the bottom, which is exactly where the
wordmark and the URL sat. Losing the URL is the serious half: the files-only share tier
(below) drops the message text entirely, so the burned-in URL is the only thing telling a
viewer where to play. Instagram DMs showed the full 9:16 fine; WhatsApp was the one that
mangled it.

1080x1350 sits inside that threshold and is also the native max-portrait size for an
Instagram feed post. The cost is that a Story shows it centred with bars rather than
full-bleed — accepted, because chat is where most sharing happens.
`shareImage.test.ts` pins the ratio at <= 1.41.

### Type is sized for a chat bubble, not a phone screen

The binding constraint is **width**, not height: a bubble is ~400 CSS px wide, so the
1080px canvas renders at ~0.37x and a 34px label lands at ~12px. Every size in the
renderer is the intended on-screen size divided by 0.37, which is why they look
oversized in a full-resolution render. `/share-preview` shows the card at 400px for
exactly this reason — judge it there.

The same arithmetic governs the art: its apparent size is purely `CARD_SIZE / WIDTH`
times the bubble width, so shortening the canvas does nothing for it. The only lever is
making the card wider relative to 1080, and the vertical budget caps that around 640.
Two remaining levers if it ever needs to be bigger: crop the art to a landscape rounded
rect (~83% of width, but discards ~30% of each square source), or move to a full-bleed
poster layout with the text over a scrim.

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

Art is fetched through the existing **`detail`** rung (`getImageUrl(url, 'detail')`), not a
new transform string. `detail` rather than `thumbnail` because the hero is drawn at 560px on
a 1080px canvas: the 400px thumbnail gets upscaled and looks visibly soft, while 768
downscales cleanly.

Reusing an existing rung is the load-bearing part. A bespoke size for this surface would
mint a third rung — roughly 13,000 transformations across the catalogue, about half a
month's free-plan allowance — see
[cloudinary-cost-controls.md](../cloudinary-cost-controls.md). As it stands the marginal
cost is at worst one derived asset per day, since the daily seed card is the same for
every player and is often already minted from someone tapping it in-game.

The one deviation is `crossOrigin = 'anonymous'`, which is mandatory (an untagged image
taints the canvas and `toBlob()` throws) and costs at most one extra fetch of an
already-derived asset.

### Decisions in force on the message

- **The brand keeps its question mark.** "When?", matching the home-screen H1, the
  manifest, the page title and the OG tags. The share text was the one place that dropped
  it. `BRAND` in `share.ts` is the single source; the story card's wordmark matches.
- **No emoji grid.** Removed 2026-08. Unlike Wordle's 2D narrative, ours was a 1D run of
  greens with at most `handSize` reds, restating the number on the line below it and
  growing _longer_ the better you played. `generateEmojiGrid()` still exists — the daily
  result stores it and the leaderboard renders it.
- **No mode label on a non-daily game.** Naming a mode implies a choice of rule-sets the
  UI does not offer; everything that is not the Daily is a Custom game. The old "Marathon"
  label is gone from both the text and the card (the card simply omits its eyebrow).
  Guarded by a test. See the CLAUDE.md naming note.
- **No best-streak line.** Dropped 2026-08 as noise — the timeline length is the score.
  `bestStreak` is still tracked in game state and on the stored daily result.
- **The card is single-line everywhere.** Layout is fixed baselines, so a second line
  anywhere would push into whatever sits below. `fittedCenteredText` shrinks to fit
  instead; the 35-char `MAX_FRIENDLY_NAME_LENGTH` cap is what makes that safe (the
  longest real names settle at ~50px against a 42px floor). The old two-line
  `wrappedCenteredText` is gone — do not reintroduce wrapping without moving to a flow
  layout.
- **The unit sits beside the number, not under it.** `drawScoreWithUnit` measures the
  numeral and the word, sums them and centres the pair — centring the numeral alone and
  hanging the label off it puts the group visibly off-centre. They share a baseline, which
  also means the old-style descender on `3 4 5 7 9` lands _beside_ the word rather than
  on top of it. The rank gets its own muted line below.
- **The unit is "events" on both card types.** Not "events placed": the daily's number
  counts the whole timeline _including_ the pre-placed seed card, so a placement count
  would be one too many there, while a custom game's number really is one. One word is
  true of both and matches the share text's "Timeline of N". See `scoreUnit` in
  `share.ts`.
- **The URL is full-strength ink; the stat line above it is muted.** At equal weight the
  two read as a single block. The URL is the line that has to survive being read off a
  phone screen.
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

### Instagram: a tappable link is not available (2026-08)

Investigated and closed, so it does not get re-opened. The ask was "tap the shared image,
land on the site":

- **There is no mechanism for it in an Instagram DM.** A photo in a DM is a photo; nothing
  in the format attaches a destination URL to it. Nothing we can send changes that. The
  same is true of a WhatsApp image, which is why the link rides in the message text there.
- **Instagram discards developer-supplied text by policy** — an explicit stance that users
  should post their own words, not an app's. So the message never arrives alongside an
  Instagram share regardless of payload. This is also why our tier-2 files-only fallback
  exists at all.
- The only place the tap-to-open effect exists is an **Instagram Story link sticker**, and
  only the sticker itself is tappable, not the image. Pre-filling one needs the native
  scheme above and would cover iOS-app users only.

Decision: leave the printed URL on the card. It is short, set in full-strength ink, and
nothing on offer justified its cost.

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
