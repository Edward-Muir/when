# Session 2026-08-15 (second) — what the share message is allowed to say

Started from a real WhatsApp screenshot of that morning's daily and the note that the share
"doesn't give any kind of call to action", that the date was unwanted in both the image and
the text, and that the whole thing "feels a bit disjointed". Ended with the caption and the
card carrying different information, the date replaced by a puzzle number, a question in the
caption after one false start in the opposite direction, and the share moved into the
game-over popup where the result is. Durable decisions are in [index.md](index.md); this is
what the reasoning actually was, including the part that got reversed.

## The screenshot diagnosed itself

Laid side by side, every token in the caption was already burned into the image:

| Image                         | Caption                       |
| ----------------------------- | ----------------------------- |
| `DAILY · AUG 15 · EVERYTHING` | `When? · Aug 15 · Everything` |
| `5` `events`                  | `Timeline of 5`               |
| `#22 globally`                | `#22 globally`                |
| `play-when.com/daily`         | `play-when.com/daily`         |

That is the "disjointed" feeling, and it is not really disjointedness — it is redundancy.
Two voices saying the same thing, and neither addressed to the person reading it. The
caption had no job. Giving it one (identity + what the game is + the link) and letting the
card keep the numbers was most of the fix.

> **Reversed the same day — read [index.md](index.md) for what is actually in force.** The
> section below concluded the share should carry no call to action. A screenshot of the
> shipped result overturned it: the caption now asks `Can you make a longer timeline?`, with
> `Make the longest timeline.` on the surfaces where nothing has been played yet. The
> reasoning below is not wrong about _Wordle_ — it is wrong that Wordle transfers. Wordle can
> withhold because a recipient who cannot decode the grid still recognises the brand, and
> "When?" has no such recognition to spend. Left in place because the argument is a tempting
> one and worth seeing refuted rather than absent.

## "Add a CTA" was the wrong instinct, including mine

The first round of suggestions offered was `your turn` / `can you beat 5?` /
score-adaptive phrasing. The response was, correctly, that they are all cringe.

Going back to Wordle to work out _why_ is what unlocked the rest. Wordle's share is:

```
Wordle 1,234 4/6

⬜🟨⬜⬜⬜
...
```

No link. No verb. Nothing aimed at the reader. It is a **receipt, not a claim** — it never
says "I did well", it shows the attempt and lets you judge. And its actual engine is that a
non-player _cannot decode it_ and has to ask.

So there is no such thing as a Wordle-register CTA. Wordle's answer to "what should the
call to action be" is _don't have one_. What was missing from our share was never a CTA; it
was that nothing told a recipient what the game **is**. `put history in order.` — already
sitting in `shareApp()` as the invite line — does that in one flat clause, and a test now
pins both that it is present everywhere and that no exhortation ever creeps back in.

## The one transferable piece of the grid is withholding

An earlier session correctly rejected copying the emoji grid (ours is 1D, restates the
score, and grows _longer_ the better you play). But that rejection also lost the mechanism.
The grid's power is not the squares, it is that the message is legible-but-uninterpretable.

Our share was fully interpretable — score, rank, event name, year, URL — so it closed the
loop and left nothing to ask about. **Dropping the seed card's year** is the one lever that
reproduces the property at zero copy cost: a painting captioned _Expulsion of Jews from
Spain_ with a score of 11 says it is about history and that someone scored something, but
not what the game asks of you. The in-game card is untouched.

Ruled out: rendering the year as a gold `?`. Suggested, but it draws attention to the
absence and reads as a UI element rather than a withheld fact.

## Two things checked rather than assumed

**WhatsApp shows no link preview under an image caption.** Worth stating because the
standing "per-route OG image" item looks like the fix for a bad-looking WhatsApp share and
is not. On the path the screenshot came from, the OG image is never fetched at all. It
remains worth doing for pasted links and the text-only tier — the item stayed in "Not done
yet" with that caveat attached.

**The score cannot get a Wordle-style denominator.** `4/6` self-scales, which is why Wordle
needs no words to prop it up; `5 events` does not. But a run ends when the hand empties, so
wrong placements always equal hand size and a `5/8` would be arithmetic rather than
information — structurally the same reason the emoji grid failed. The only genuinely
scaling stat available is rank-out-of-total, and `#N globally` was kept as-is this round.

## The regression the split creates, and where it is handled

Taking stats out of the caption is only safe while the image travels. `shareContent`'s
tier 3 and the clipboard fallback ship no file, and there a stats-free caption is a bare
invite with the result missing.

Hence `ShareMessage { withCard, textOnly }` instead of one string. The subtlety worth
keeping: the choice is made **per tier inside `shareContent`**, not once up front, because
tier 3 is reached both when there was never a file _and_ when both file payloads failed.
Deciding once from `canShareFiles` looks equivalent and silently drops the stats in the
second case.

## Layout: the year line was the vertical budget

Removing it freed ~54px, and the standing complaint in `index.md` was that the hero art is
too small with `CARD_SIZE / WIDTH` as the only lever and the vertical budget as the cap.
Spent it there: `CARD_SIZE` 640 → 680, caption baseline 946 → 986.

That happens to be _safer_ than what it replaced. Name-baseline-to-score clearance goes
from the year line's ~9px to ~32px, and `fittedCenteredText` shrinks long names, which
shrinks their descenders — so long names are the easy case here, not the risky one. The
768px `detail` rung still downscales at 680, so no new Cloudinary rung.

## Traps re-confirmed

- **Run tests through `npm`.** `npx jest` drops the `TZ=America/Los_Angeles` pin and fails
  5 unrelated tests across 3 suites.
- **DST dates in new tests must sit after the puzzle epoch.** The first draft reused the
  `dayDiff` suite's March 2026 transition dates, which are before `2026-06-28`, so
  `getDailyPuzzleNumber` correctly returned `null` and the test failed on its own bug. The
  spring-forward case has to be the 2027 transition.
- **Do not abort Cloudinary when screenshotting `/share-preview`.** The Playwright runbook's
  boilerplate blocks it, which silently renders the no-art fallback — a plausible-looking
  card that is not the real one. The tell is file size: ~200 KB with art, far smaller
  without. Keep `--ssl-version-max=tls1.2` and `proxy.bypass: 'localhost,127.0.0.1'`.
- **The "How to Play" modal renders a beat _after_ the daily starts.** Checking for it once
  immediately after navigation finds nothing, and it then silently blocks every drag — the
  driver looks like it is playing and places no cards. Poll for the "Got it" button instead.
- **The daily game-over popup cannot be escaped without submitting.** Verified rather than
  assumed, and it decided a design question: no close control, an inert backdrop until
  submission, and a `z-50` backdrop that intercepts the bottom bar, so Playwright cannot click
  Home at all. That is what makes it safe to gate the in-popup share on having submitted.

## The share at game over

Playing the daily through to game over — which is the only way this was going to be noticed —
showed the share was an afterthought in the wrong layer, competing with the leaderboard
submit, labelled with a different verb, and structurally unable to carry the rank the popup
was displaying two lines above it. The fix and the constraints are in
[index.md](index.md#where-the-share-sits-at-game-over).

One thing worth recording about the process: the first attempt at "move it into the popup"
kept the bottom-bar button too, which put two identical teal Share buttons on screen at once.
The screenshot made that obvious in a way the diff did not — same lesson as the previous
session, which is that this surface has to be looked at, not reasoned about.
