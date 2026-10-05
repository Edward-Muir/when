# Sharing & Challenges

Two things live here: the **share payload** (what a result looks like when a player posts
it) and the **challenge code** (settings + seed packed into a token so a recipient plays
the identical game).

## The share payload

`src/utils/share.ts` builds the message; `src/utils/shareImage.ts` renders a 1080x1350
card that travels with it as a `File`. `/share-preview` (unlinked, local dev only) renders
both side by side and can fire a real share sheet.

### The frame is 4:5 because WhatsApp crops

WhatsApp **center-crops a tall image in chat** to roughly a 1:1.41 slice, so a 1080x1920 card
loses about 200px from the top and the bottom, exactly where the wordmark and the URL sit.
Losing the URL is the serious half: the files-only share tier (below) drops the message text
entirely, so the burned-in URL is the only thing telling a viewer where to play. Instagram DMs
show a full 9:16; WhatsApp is the one that mangles it.

1080x1350 sits inside that threshold and is also the native max-portrait size for an
Instagram feed post. The cost is that a Story shows it centred with bars rather than
full-bleed — accepted, because chat is where most sharing happens.
`shareImage.test.ts` pins the ratio at <= 1.41. A 9:16 card with the content pulled into a
safe band does not help: WhatsApp still crops the edges, so everything moves inward and the
type gets _smaller_.

### Type is sized for a chat bubble, not a phone screen

The binding constraint is **width**, not height: a bubble is ~400 CSS px wide, so the
1080px canvas renders at ~0.37x and a 34px label lands at ~12px. Every size in the
renderer is the intended on-screen size divided by 0.37, which is why they look
oversized in a full-resolution render. This surface cannot be reviewed at its native
resolution: `/share-preview` shows the card at 400px for exactly this reason — judge it
there.

The same arithmetic governs the art: its apparent size is purely `CARD_SIZE / WIDTH`
times the bubble width, so shortening the canvas does nothing for it. The only lever is
making the card wider relative to 1080, and the vertical budget caps that (`CARD_SIZE` is
680). Two remaining levers if it ever needs to be bigger: crop the art to a landscape rounded
rect (~83% of width, but discards ~30% of each square source), or move to a full-bleed
poster layout with the text over a scrim (~2.7x larger art).

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
new transform string. `detail` rather than `thumbnail` because the hero is drawn at 680px on
a 1080px canvas: the 400px thumbnail gets upscaled and looks visibly soft, while 768
downscales cleanly. 768 is also the ceiling on `CARD_SIZE` — past it the art upscales and
the temptation to mint a bespoke rung returns.

Reusing an existing rung is the load-bearing part. A bespoke size for this surface would
mint a third rung — roughly 13,000 transformations across the catalogue, about half a
month's free-plan allowance — see
[cloudinary-cost-controls.md](../cloudinary-cost-controls.md). As it stands the marginal
cost is at worst one derived asset per day, since the daily seed card is the same for
every player and is often already minted from someone tapping it in-game.

The one deviation is `crossOrigin = 'anonymous'`, which is mandatory (an untagged image
taints the canvas and `toBlob()` throws) and is a different HTTP cache key from the game's
plain `<img>` tags, so it costs at most one extra fetch of an already-derived asset —
bandwidth, never a transformation.

### The image is the receipt; the caption is not a second copy of it

**The caption repeats nothing the card shows.** With date, score, rank and URL in both, the
message is two voices saying the same thing, neither addressed to the person reading it. They
split the job:

- **The card** carries the puzzle identity, the score, the rank and the URL.
- **The caption** carries identity, one line addressed to the reader, and the link. No stats.

`generateDailyShareText` and `generateShareText` therefore return a `ShareMessage` with two
forms rather than a single string. `withCard` is the stats-free caption; `textOnly` keeps
the stat line, because `shareContent`'s tier-3 and clipboard paths ship no image and a
stats-free caption there would send a bare invite with the player's result missing. The
choice is made **per tier inside `shareContent`**, not once up front — tier 3 is reached
both when there was never a file and when both file payloads failed, so deciding once from
`canShareFiles` silently drops the stats in the second case.

### The caption asks a question — and why the Wordle argument does not apply

**Wordle's share has no call to action at all** — `Wordle 1,234 4/6` plus the grid, no URL,
no verb, nothing aimed at the recipient. It reads as a _receipt_ rather than a _claim_, and
it spreads because a recipient who cannot decode it has to ask what it is. That is genuinely
why it works for Wordle.

**It does not transfer.** Wordle can afford to withhold because a recipient who cannot decode
the grid still recognises the brand. "When?" has no such recognition — a message that neither
explains itself nor asks for anything just gets scrolled past. So:

- Where a result exists, the caption asks: **`Can you make a longer timeline?`** (`SCORE_CTA`).
- Where none does — the app invite, the pre-game challenge link, and multiplayer, where the
  result belongs to whoever won — it describes: **`Make the longest timeline.`**
  (`DESCRIPTOR`). Tests pin which surfaces get which.

Both name the mechanic rather than an abstract "score", so the whole message shares one
vocabulary with the `Timeline of N` stat line and with the How to Play modal (menu), which
says _Build the longest timeline!_ The question is one fixed line, never score-adaptive or
exhorting: `your turn` and `can you beat 5?` read as cringe.

The genuinely transferable piece of Wordle is **withholding** — see the seed-year note
below — not the absence of a CTA. Its `4/6` denominator does not transfer either: a run ends
when the hand empties, so wrong placements nearly always equal the hand size and a `5/8`
would be arithmetic rather than information. The only scaling stat available is the rank.

### No em dashes

A standing instruction. Every separator in a share string is the middle dot `·` the app and
the card already use (`DAILY #49 · EVERYTHING`, `When? · 2 players`) — `SEP` in `share.ts`.
A test asserts no share string contains `—`, because "applied once" and "enforced" are
different things.

### Decisions in force on the message

- **The brand keeps its question mark.** "When?", matching the home-screen H1, the
  manifest, the page title and the OG tags. `BRAND` in `share.ts` is the single source; the
  story card's wordmark matches.
- **The puzzle is identified by number, not date.** `Daily #49`, from
  `getDailyPuzzleNumber` in `puzzleDate.ts` (epoch `2026-06-28` = #1, immutable — moving it
  renumbers every puzzle retroactively). A shared image is a forwardable object, so a date
  goes stale overnight and duplicates the timestamp the chat app already stamps on the
  bubble. Same reasoning as `Connections #768`. It delegates to `dayDiff`, which reads both
  operands as UTC midnight — hand-rolled local-date arithmetic breaks on the two DST days a
  year. Pre-epoch and junk dates return `null` and fall back to a numberless label rather
  than printing `#NaN`. DST cases in its tests must sit after the epoch (the spring-forward
  case is the 2027 transition), or `getDailyPuzzleNumber` correctly returns `null` and the
  test fails on its own bug.
- **The shared card omits the seed card's year.** With it the whole share is legible —
  score, rank, event, year, link — so a recipient can read it all and has no reason to ask
  about any of it. Withholding one fact is the only lever this card has on Wordle's actual
  mechanism. **The in-game seed card still shows its year**; only this render omits it. A
  gold `?` in its place is rejected: it draws attention to the absence and reads as a UI
  element rather than a withheld fact.
- **No emoji grid.** Unlike Wordle's 2D narrative, ours would be a 1D run of greens with at
  most `handSize` reds, restating the number on the line below it and growing _longer_ the
  better you played. `generateEmojiGrid()` exists because the daily result stores the grid
  and the leaderboard submission is validated against it.
- **No mode label on a non-daily game.** Naming a mode implies a choice of rule-sets the
  UI does not offer; everything that is not the Daily is a Custom game or an Archive replay,
  and the card omits its eyebrow. Guarded by a test. See CLAUDE.md on game modes.
- **One number, no best-streak line.** The daily share's number is the timeline length,
  `correctCount + 1` (the seed card included, matching the on-screen timeline); a Custom
  share's number is `correctCount`. The game-over popup and the leaderboard report events
  placed (`correctCount`). `bestStreak` is still tracked in game state and on the stored
  daily result.
- **A challenge link states what it does.** `Same cards, same order.` is a fact about the
  link, and it rides on both message forms. It is `generateChallengeInviteText` in
  `share.ts`, not an inline literal.
- **A game-over share carries the rank.** `shareResults` takes it as an option, so the
  game-over share agrees with the popup's "#22 globally" and with the home screen's share:
  the popup passes the rank up from `LeaderboardSubmit` via `onRankResolved`, and the bottom
  bar reads it from the stored daily result.
- **The card is single-line everywhere.** Layout is fixed baselines, so a second line
  anywhere would push into whatever sits below. `fittedCenteredText` shrinks to fit
  instead; the 35-char `MAX_FRIENDLY_NAME_LENGTH` cap is what makes that safe (the
  longest real names settle at ~50px against a 42px floor). Do not introduce wrapping
  without moving to a flow layout.
- **The unit sits beside the number, not under it.** `drawScoreWithUnit` measures the
  numeral and the word, sums them and centres the pair — centring the numeral alone and
  hanging the label off it puts the group visibly off-centre. They share a baseline, so
  Playfair Display's old-style descenders on `3 4 5 7 9` land _beside_ the word rather than
  on top of it; a stacked label collides with `23` while looking fine against `11`. The rank
  gets its own muted line below.
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

### The share is the last step of the end-of-game sequence

`src/hooks/useEndOfGameSequence.ts` owns the screens shown after the game-over popup:

```
gameOver      score · submit · rank        (GamePopup — not in the queue, see below)
   ↓
milestones    if any
   ↓
achievements  if any
   ↓
share         ShareStepPopup — result, Share, reminder + next-daily countdown
```

**The share step is unconditional**, which is the point: milestones and achievements only
appear when there are any, so an "append to the last screen" scheme would make the finale
different game to game. It ends the run every time.

Two placements that don't work:

- **Share only in `GameOverControls`** (the bottom bar) while the result is in `GamePopup` —
  two layers, so the reading order dead-ends on "Come back tomorrow" beside a detached button
  competing with the leaderboard submit and unable to carry the rank.
- **Share inside the game-over popup** — that popup is the _first_ screen, so the share goes
  out before the player sees what they unlocked.

Constraints holding the current shape together:

- **`GamePopup` stays out of the queue.** Its dismissal is locked while a daily submission is
  pending and possible (`gameOverDismiss`), so the daily cannot pass it without submitting;
  folding it in would mean re-implementing that gate. The flow is unified from that popup
  _onward_.
- **The rank is lifted to `Game`.** `LeaderboardSubmit` → `onRankResolved` → `GamePopup` →
  `Game` → `ShareStepPopup`, because the share step is not a sibling of the leaderboard.
- **The bottom-bar Share hides for the whole sequence**, not just while the popup is open —
  `isBottomBarShareVisible(pendingPopup, endStep)`. It is the post-sequence fallback only;
  showing both puts two identical Share buttons on screen at once.
- **No story-card preview on the share step.** It would mean a `renderShareCard` canvas pass
  on every game over instead of only when someone taps Share.

**Trap, and the reason the sequence exists rather than more hand-wiring:** `MilestonePopup` and
`AchievementUnlock` must not call `onDismiss()` from inside a `setIndex` updater. Updaters must
be pure — StrictMode double-invokes them — so `onDismiss` fires twice, and with dismissal
advancing a queue the next step (the share step) is popped without ever rendering. Any future
step must keep side effects out of updaters.

### Reviewing the card

This surface has to be looked at, not reasoned about: both of its real layout defects were
invisible in a full-resolution render and obvious in a phone screenshot. `/share-preview`
has no `vercel.json` rewrite, so it 404s on a deployment, like the other maintainer tools.
Screenshotting it with Playwright needs **both** `--ssl-version-max=tls1.2` and
`proxy.bypass: 'localhost,127.0.0.1'`, and must not abort Cloudinary requests (the runbook's
boilerplate does): without the art the page silently renders the no-art fallback, a
plausible card that is not the real one. The tell is file size, ~200 KB with art and far
smaller without. See [../driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md).

### Not done yet

The OG tags in `public/index.html` are static, so a `/daily` result and a
`/challenge/<code>` invite both preview identically. A per-route OG image (Vercel edge +
Satori) is the obvious next win. Constraints if picked up: ~1200x630, **under 600 KB**,
JPG/PNG/WebP only, and WhatsApp caches previews for days with no refresh mechanism, so
iterating needs a cache-busting query param.

**Be clear about what it buys, though.** WhatsApp renders **no link preview at all** for a
URL sitting in an image caption — which is the shape of every share that carries the card,
i.e. the common case. The URL stays tappable, but `og-image.png` never appears there. A
per-route OG image only helps the text-only tier, pasted links, and non-chat surfaces. It
is not a fix for how a shared result looks in WhatsApp.

A one-tap "Add to Story" needs the native `instagram-stories://share` scheme plus the
`com.instagram.sharedSticker.backgroundImage` pasteboard key and a Meta App ID. That is
reachable from the Capacitor shell only — the web cannot do it.

### Instagram: a tappable link is not available

Closed; do not re-open. The ask is "tap the shared image, land on the site":

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
nothing on offer justifies its cost. Also rejected: a QR code (a recipient reading on their
phone cannot scan a code on that same phone) and copying the link to the clipboard on share.

## The challenge code

**`src/utils/challengeCode.ts` is the source of truth for the wire format.** Its header
comment carries the bit layout. Read it before touching the encoding.

A code is **6 base words** (72 bits from a single 4096-entry `WORDLIST`, 12 bits each:
reserved bit, hand size, player count, difficulties, eras, a **fixed 32-bit** category mask and
a 21-bit seed), then an **optional 7th word** for regions, then optional **country words**.

Two properties of the base layout are load-bearing:

- **The category mask is fixed-width at 32 bits**, though `ALL_CATEGORIES` has 21. The fixed
  width is what lets the taxonomy grow without invalidating existing links. Do not shrink it
  to fit.
- **Bit 0 is reserved: written as 0 and ignored on decode** (codes in circulation set it).
  It cannot be reclaimed: the format is positional, so shifting it would misdecode _every_
  existing link.

### The optional 7th word: regions

The 6 base words have no spare bits, so the region mask is a 7th word (bits 72-83), in
`ALL_REGIONS` order (`src/data/regions.json`).

- **It is written only when the regions are narrowed or a country is picked.** An all-regions
  game encodes to 6 words, so a code's length tells you whether it filters by region.
- **A 6-word code decodes as all regions**, and must keep doing so: 6-word codes without a
  region filter are in circulation.
- **A 7th word with no region set, or a bit past the last region, is rejected** as a code this
  app did not write, the same way an empty category mask is.
- **The region order is positional**, like everything else here. Adding a region means
  appending it, which the taxonomy test's "Global is last" rule would force you to rethink
  first. `challengeCode.test.ts` pins the order so a reorder fails loudly.

### Words 8 onward: countries

Country words follow the regions word. There are two formats, told apart by the **regions
word's spare 12th bit** (`COUNTRY_FORMAT_BIT`; 11 regions use bits 0-10). The encoder writes
only the pair format; the pick format is decoded for codes in circulation.

**The pair format (bit set), from the select-all picker.** The state is excluded
(region, country) pairs, so a word names a pair:

- **Value** `iso + 676 * side`, where `iso` is the country's ISO 3166-1 alpha-2 code packed as
  `(first letter) * 26 + (second letter)` with A = 0 (0-675), and `side` is the region's index
  in the country's `spans` (always 0 for a one-region country; Russia under North & Central
  Asia is `RU + 676`). Adding `EXCLUDE_FLAG` (2048) marks the pair as switched off; without it
  the pair is listed as on.
- **Each narrowed region is written in whichever form is shorter**, all its words in one form. An
  include form lists the region's countries still on, and the decoder excludes the rest of the
  region's taxonomy countries. So "only the UK" is one include word, "Europe without the UK" one
  exclude word, and neither ever needs 51. A region with everything off stays in exclude form,
  since zero include words would read as the whole region.
- **Rejected:** an unknown value or side, a repeated pair, a pair outside the decoded regions, one
  region mixing include and exclude words, or the format bit with no country words.

**The pick format (bit clear).** One word per _picked_ country, the packed ISO code alone. A
pick narrows every region it belongs to; the picks go through `legacyPicksToExclusions` into
the same pool. A transcontinental pick reaches only the sides whose regions are selected; see
[../regions/](../regions/index.md#the-country-picker).

Both formats share these rules:

- **The regions word is always written when a country word is**, even with all 11 regions
  selected, because country words must start at word 8.
- **Words are sorted by value**, so one selection always makes one token.
- **Codes without country words are 6 or 7 words**, unaffected by the country formats.
- **The decoder packs only the first 7 words.** Packing the country words too would push their
  bits into the regions mask and fail its range check.
- **A build that predates a format rejects its codes.** Accepted over dropping countries from
  links, which would break "others play the exact same game".

### Decisions in force

- **`WORDLIST` order is immutable.** Reordering or removing a word changes what every
  existing token decodes to. Append only, and only in multiples that keep the length a power
  of two.
- **Player count travels with the challenge**, rather than being forced to single-player, so
  a recipient can play multiplayer if they have people around. No menu builds a code with
  `playerCount > 1`, but decoding one starts a multiplayer game (see CLAUDE.md).
- **Restart re-rolls the seed** rather than replaying the identical game.
- **BigInt via `BigInt()` calls, not `12n` literals.** The 72-bit value exceeds JS's 53-bit
  safe-integer range, but the TS target is below ES2020 so literals won't parse.
- **Event-set drift is accepted.** Adding or removing events can make an old token produce a
  different game — same tradeoff the daily makes.

### The Custom tab's code field

The share code on the Custom tab (`CustomGameSettings.tsx`) is a two-way field: it shows the
code for the current filters, and a pasted code decodes back into the controls.

- **A `useRef` flag guards the two-way sync.** Applying a decoded code updates the settings,
  which recomputes the code via `useMemo`, which would sync back and overwrite what the user
  typed. `applyingCodeRef` skips the sync for one cycle. Removing it reintroduces the loop.
- Invalid codes show a red border rather than being silently ignored — a deliberate choice,
  since silently keeping the old settings is confusing.
