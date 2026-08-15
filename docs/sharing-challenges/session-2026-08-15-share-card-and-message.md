# Session 2026-08-15 — the share card and the message that carries it

Started from "someone suggested improving the share to Instagram feature", and ended with a
rendered image attached to every share, a much shorter message, and a firm answer on what
Instagram will and will not let us do. The durable decisions are folded into
[index.md](index.md); this is the narrative — what was tried, what the evidence changed,
and the traps that cost time.

## Where it started

Sharing was `navigator.share({ title, text })` and nothing else. The consequence nobody had
noticed: **Instagram never appeared in the share sheet at all**, because it does not accept
text-only payloads. "Share to Instagram" meant copy-pasting by hand. The message was five
lines with four emoji and a red/green grid.

## The grid was weak for a structural reason

Worth recording because "add a Wordle grid" is a tempting suggestion. Wordle's grid is a 2D
narrative — six rows narrowing toward the answer, a small story. Ours was one dimension: a
run of greens with at most `handSize` reds, and the line directly beneath it already stated
the same number. It carried nothing the score did not, and it got **longer and noisier the
better you played**. Removed. `generateEmojiGrid()` survives because the leaderboard still
renders it.

## Screenshots beat renders, twice

Both real defects were invisible in a full-resolution render and obvious the moment a real
screenshot arrived.

**Round 1 — the frame.** The card shipped at 1080x1920. A WhatsApp screenshot showed it
center-cropped to roughly a 1:1.41 slice: ~200px gone from the top and bottom, taking the
wordmark and the URL. The URL is the serious loss — tier 2 of the share ladder drops the
message text, so the burned-in URL is the only thing telling a viewer where to play. Fixed
by moving to 4:5 (1080x1350), pinned by a test.

**Round 2 — the type.** Sizes had been judged against the 1080px render, where 34px looks
generous. But a chat bubble is ~400 CSS px wide, so the canvas draws at **~0.37x** and 34px
lands at ~12px. The constraint is _width_, and it applies to the art too: apparent art size
is `CARD_SIZE / WIDTH` times bubble width, so shortening the canvas does nothing for it.
`/share-preview` now renders at 400px so this cannot be misjudged again.

The general lesson: **this surface cannot be reviewed at its native resolution.** Build the
review tool at the size the artefact actually ships at.

## Playfair Display sets old-style figures

`3 4 5 7 9` drop well below the baseline; `1` and `2` do not. A stacked label under the
score looked fine against `11` and collided with `23`. Caught only because the preview
harness could cycle presets. The final layout sets the unit _beside_ the numeral on a
shared baseline, which puts the descender next to the word rather than on top of it — the
collision is now structurally impossible rather than merely spaced around.

## Cloudinary: reuse a rung, and pick the right one

The card was first drawn with the `thumbnail` (400px) rung on cost-control instinct. Wrong
call: the hero is drawn at 640px on a 1080px canvas, so 400 was being _upscaled_ and looked
soft. `detail` (768px) downscales cleanly and is **also an existing rung**, so it mints no
new transform string — the thing that actually matters for cost. Marginal cost is at worst
one derived asset per day, since the daily seed card is the same for every player.

`crossOrigin = 'anonymous'` is mandatory here (an untagged image taints the canvas and
`toBlob()` throws) and is a different HTTP cache key from the game's plain `<img>` tags.
That is one extra fetch of an already-derived asset — bandwidth, never a transformation.

## Instagram: what is actually possible

Investigated properly after "can the receiver tap the image and go to the website?". The
answer is no, and it is worth not rediscovering:

- **Nothing in an Instagram DM attaches a destination URL to a photo.** A photo is a photo.
  Same in WhatsApp, which is why the link rides in the message text there.
- **Instagram discards developer-supplied text by policy** — a deliberate stance that users
  should post their own words. This is _why_ the files-only fallback tier exists.
- The only tap-to-open mechanism is a **Story link sticker**, and only the sticker is
  tappable. Pre-filling one needs `instagram-stories://`, a Meta App ID and a custom
  Capacitor plugin, and would cover iOS-app users only.

Decision: leave the printed URL. Considered and rejected: a QR code (a recipient reading
this on their phone cannot scan a code on that same phone) and copying the link to the
clipboard on share.

## Rejected along the way

- **Showing the cards the player placed.** Maximum draw, but it leaks the composition of
  that day's puzzle to everyone who sees the post. The hero is the **seed card** — already
  on the timeline at kickoff and already shown on the home screen as the daily preview, so
  it spoils nothing.
- **A 9:16 card with content pulled into a safe band.** Keeps Stories full-bleed, but
  WhatsApp still crops the edges, so everything moves inward and the type gets _smaller_ —
  the opposite of the goal.
- **A full-bleed poster layout** (art edge-to-edge, text over a scrim). Would make the art
  ~2.7x larger. Not taken this time; still the best lever if the art ever needs to be
  bigger, along with cropping the art to a landscape rounded rect.
- **Naming the non-daily mode.** "Marathon" implied a choice of rule-sets the UI does not
  offer. Everything that is not the Daily is a Custom game; the card says so by saying
  nothing.

## Two things the tooling taught

- `/share-preview` (unlinked, local dev only) paid for itself immediately — it caught the
  Playfair collision and both type-scale problems. It has no `vercel.json` rewrite, so it
  404s on a deployment; that matches the other maintainer tools.
- Driving it with Playwright needs **both** `--ssl-version-max=tls1.2` and
  `proxy.bypass: 'localhost,127.0.0.1'`. Without the TLS flag the Cloudinary fetch fails
  silently and you review the no-art fallback thinking it is the real card — the only tell
  is a suspiciously small file size.
