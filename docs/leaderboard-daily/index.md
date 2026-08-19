# Leaderboard & Daily Mode

The daily puzzle, its global leaderboard, bot population, and display-name filtering.

Endpoints, Redis keys and env vars are in [../architecture-reference.md](../architecture-reference.md).
Storage is **Upstash Redis** (`@upstash/redis`, `UPSTASH_REDIS_REST_*`) — an early write-up
described `@vercel/kv` and `KV_REST_API_*`; that was migrated away from and none of it is
current.

## The puzzle day is the player's LOCAL calendar date (2026-08-12)

**`src/utils/puzzleDate.ts` is the single source of truth.** Its header comment explains the
rule; this is the decision behind it.

Every boundary used to be UTC (`new Date().toISOString().split('T')[0]`), so a new puzzle
appeared at 5pm in Los Angeles and 10am in Sydney. Two live bugs:

- **Double increment** — an LA player playing at 4pm and 6pm was, in UTC, playing two
  different days: two puzzles two hours apart, and the streak incremented twice in one evening.
- **Silent loss** — an "after dinner" player drifted across the boundary and lost a streak on
  a day they hadn't missed.

**This reversed a deliberate earlier decision.** The 2026-06-01 session chose UTC on purpose,
reasoning that local rollover would desync players across timezones. That concern is real and
was **accepted rather than avoided**: a `leaderboard:YYYY-MM-DD` now fills over **~50
wall-clock hours** (opening when UTC+14 starts the date, closing when UTC-12 finishes it), so
a rank shown early in a player's local day is provisional and drifts as the rest of the world
plays. The trade was taken because a daily habit belongs to the person, not to Greenwich.
**Do not "fix" this back to UTC without re-reading this.**

Consequences worth knowing:

- **`msUntilNextLocalMidnight` is built by local-calendar construction, deliberately not
  `DAY_MS - (now % DAY_MS)`.** DST days are 23 and 25 hours, so the modulo is wrong twice a year
  even after correcting for the offset.
- **Tests pin `TZ=America/Los_Angeles`** in the `test` script. Don't remove it.
- **The submission window is `utcToday ± 1`, not an exact match** (`lib/leaderboard/dateWindow.ts`),
  because one date string is in play for ~50 hours.
- **`SUBMISSION_DEDUPE_TTL_SECONDS` is 72h and shared** by `submit.ts` and `botGeneration.ts`.
  Both were previously on a 25-hour TTL commented "for timezone edge cases" — which no longer
  covers a 50-hour window, so the dedupe key would have expired while the date was still
  submittable. One constant so they cannot drift apart again. It is duplicated rather than
  imported from `src/` because `api/tsconfig.json` is a separate project.
- **No localStorage migration was done.** On upgrade, east-of-UTC players skipped a day (one
  broken streak) and west-of-UTC players could be re-offered one puzzle. A one-day artifact was
  judged cheaper than permanent migration code.
- `App.tsx`'s frozen `introDate` feeds `buildDailyDeck` to build the intro animation's
  **spoiler guard** — leaving that one on UTC would have silently stopped the guard excluding
  today's deck.

## `useToday` — day rollover while the app is open

`ModeSelect` and `NextDailyCountdown` both need "today" to change under them. WKWebView
preserves React state across background/foreground indefinitely, so without this the app shows
yesterday's theme, preview and leaderboard the next morning. It is a **lifecycle** problem, not
a caching one — the service worker is already network-first for `/api/*`.

Three complementary triggers, all funnelling into one functional-setter update that dedupes
no-op transitions: `appResume` (dispatched by `App.tsx` via `@capacitor/app`),
`document.visibilitychange` (web tab refocus), and a timer to just past next local midnight.

**The midnight timer re-arms after firing.** It was originally one-shot, so an app left
foregrounded across two nights stopped rolling over — a live bug on iOS, where the WebView
keeps state alive for days.

## Curated themes changed two assumptions here (2026-08-18)

**Short emoji grids are now routine.** `submit.ts` accepts `redCount <= DAILY_HAND_SIZE` rather
than an equality, on the grounds that exhausting the pool early was theoretical (~100
placements against a realistic best of ~30). A curated theme is a couple of dozen cards, so
every player who gets through one submits a short grid. **Do not tighten that check to an
equality** — it would reject every cleared run.

**Bots are clamped to the day's ceiling.** They sample Poisson(6) with no idea how many cards
exist, so on a curated theme they could out-score every human. `botGeneration.ts` reads the
theme's size from `themes:calendar`. That is NOT a return to the theme-validation mistake
below: what broke there was a _duplicate_ of `ALL_CATEGORIES` plus the RNG, re-deriving the
theme and drifting out of step. Reading a count from the one authoritative record has nothing
to drift against, and it fails open.

Scores also bunch at the ceiling on a clearable theme, since equal correct counts genuinely tie
and Redis orders them by member string. Nothing breaks, but "#1 globally" means less on those
days. See [curated-themes/](../curated-themes/index.md).

## Scoring and validation

Score is `correctCount * 100`. **Mistakes are not part of it and must not be added back.**

The daily deals a hand of 5 and a wrong placement discards the card without drawing a
replacement, so the game ends exactly when the hand empties — which means **every completed
daily has the same mistake count**. The score used to subtract it, documented here as a
tie-break; it never was one, it just shifted every score by the same constant. A session
believed that line, put a mistakes column on the leaderboard, and shipped a number that reads
`5✗` on every row. Mistakes say nothing about how a player did in this game.

Equal correct counts therefore genuinely tie, and Redis orders them by the JSON member string.
A real tie-break would have to be a new term, such as submission time.

Server-side validation on submit: date inside the window; `correctCount >= 0` with no upper
bound; 🟩 count equals `correctCount`; 🟥 count is 0–`DAILY_HAND_SIZE`;
`totalAttempts == correctCount + mistakeCount`; and the `submission:{date}:{deviceId}` key doesn't
already exist.

**The theme is not validated, and must not be again (2026-08-16).** `submit.ts` used to hold its
own copy of `ALL_CATEGORIES`, the seeded RNG and `getDailyTheme` — each under a comment saying it
"must match the frontend" — so it could compare the submitted theme against a locally computed one.
Adding `sports` to `src/types/index.ts` left that copy one entry short, and since the theme is
`ALL_CATEGORIES[floor(random() * ALL_CATEGORIES.length)]`, a different length picks a different
category from the same seed: 2026-08-16 was **Medicine** in the app and **Art** on the server, and
85 of the next 365 dates rejected every submission with `Invalid theme`. It shipped silently
because the ~half of days themed "Everything" agree whatever the list length.

The check was never load-bearing anyway: the theme is a value the client supplies about a puzzle
the client generated, so it only ever compared the caller's code against this file's. A comment
cannot hold two copies of a list in sync; deleting the second copy can. Categories now live in
exactly one place, `src/types/index.ts`, and the API does not know them. The client also stopped
sending `theme` — old cached clients still do, and the field is ignored.

The 🟥 bound is a range rather than an equality only because a correct placement redraws just
`if (newCard)` — exhausting the day's themed pool would shrink the hand with no mistake and end
the game early. That takes ~100 correct placements against a realistic best of ~30, so it is
theoretical; the range exists because wrongly rejecting a legitimate run is worse than
accepting a short one.

Device identity is a SHA-256 of browser signals plus a random UUID persisted in localStorage
(`when-device-id`). Clearing localStorage mints a new one — accepted, since there are no prizes
and it only needs to stop casual double-submits.

## The whole board is browsable (2026-08-15)

The modal rendered `entries.slice(0, 5)`; it now renders everything the server returns. It stays
the centred pop-out card at every width — a full-screen sheet on phones was tried and reverted.

**Serving ~45 rows is cheaper than serving 5 was.** `[date].ts` already read the entire sorted
set on every request — the client always sends a `deviceId`, and locating it meant a
`ZRANGE 0 -1` — then discarded it after a `findIndex`. The limited `ZRANGE` and the `ZCARD`
beside it were both redundant with that read. One `ZRANGE` now serves rows, total and rank:
**three Upstash commands down to one**, on an endpoint every open client polls at 15s.

- Limits are `DEFAULT_LIMIT`/`MAX_LIMIT` in `limits.ts`, and the response carries `truncated`
  so `totalPlayers` (a true count, bots included) can never silently disagree with the rendered
  count again. Returning everything stays right to roughly 250–300 entries; past that say so
  via `truncated` before reaching for windowing, and **never** add `s-maxage`/ISR to make a
  bigger payload cheaper — the body varies per device, see the filtering section below.
- **`emojiGrid` and `totalAttempts` are stored but not sent.** Neither was ever rendered; both
  shipped on every poll. Check for a consumer before restoring either.
- The sticky player row **must have an opaque background** or the list shows through as it
  scrolls under, which is why `bg-accent/20` had to be fixed rather than tolerated as a
  cosmetic no-op — it renders solid accent. `.bg-player-row` mixes accent into
  `--color-surface`. Its `z-10` is equally load-bearing: `divide-y` borders draw over it
  otherwise.
- **The card carried `onClick={onClose}` alongside the backdrop's**, so tapping any row
  dismissed the board — harmless at five rows, fatal once it scrolls. `Leaderboard.test.tsx`
  pins it, and is the repo's first React Testing Library test.
- **The card keeps a real height cap (`max-h-[min(75vh,520px)]`). Don't remove it.** Making it
  fill the backdrop's padded box — to get an even gap on all four sides — shipped broken and had
  to be hot-fixed. `p-4` is 16px, but on iOS the webview runs under the status bar
  (`overlaysWebView: true`, see [../mobile-ios/index.md](../mobile-ios/index.md)), so the card's
  top edge sat under the clock and camera and the list ran off the bottom of the screen. A short
  centred card clears the inset by virtue of being centred, without having to know the inset.
- **A headless browser cannot catch that.** `env(safe-area-inset-*)` is 0 in Chromium, so the
  overlap was invisible in a Playwright pass at 390×844 that otherwise measured a perfect
  16/16/16/16 frame. Height and full-bleed changes here need a real device or the installed PWA.
  Related: an even margin on all four sides and a card shorter than the viewport are mutually
  exclusive on a phone — if both are asked for, say so rather than picking one.
- Beware sizing this against the old five-row modal. A `max-h` was always present, but at five
  rows the card was content-sized (~350–440px) and never reached it. Check heights against a
  full board.
- The list's `min-h` is capped against the viewport (`min(320px,30vh)`) rather than a flat pixel
  floor, so it can never demand more than the card has — on a landscape phone the card is only
  ~292px and `overflow-hidden` would silently eat the bottom of the list.
- Truncation is disclosed in the **player-count bar** ("Showing 100 of 900 players today"), not
  a footer. There was briefly a footer line about ranks drifting through the day; it was cut as
  noise. If the ~50-hour fill window ever needs explaining again, it belongs somewhere a player
  isn't reading on every single open.

## Bots

The board is seeded with 7–13 bots so it doesn't look empty. Generated **lazily on the first
fetch for a date**, deterministically from the date string (mulberry32), behind a Redis `SETNX`
lock so concurrent requests can't double-generate. Correct counts are Poisson(6) clamped 0–20.
Names are "Adjective Animal" from the same lists the name filter reuses.

Bots also roll a mistake count, which is **inert** — nothing ranks or renders it. While the
score still subtracted mistakes, this was a live unfairness: a bot rolling few mistakes beat a
human on the same correct count, because a human's is always the full hand. Bots are scored by
the same expression as `submit.ts` now; keep it that way.

**Bot _creation_ is gated to the submission window.** `[date].ts` still serves any well-formed
date so historical boards stay readable, but previously any client could mint bot sets and lock
keys for arbitrary dates (`9999-12-31`) just by asking. That hole predated the local-date work.

Bots need no timezone redesign — keying on the date string plus the lock means whoever fetches
first mints the set and everyone else reads back identical entries. Only the timing shifts.

## Display-name filtering (2026-08-10)

A player submitted a racial slur as their leaderboard name. It appeared in three places and the
field had effectively no validation.

**Filtered server-side in two places: on write _and_ on read.** Read-time masking is the part
that matters and is easy to mistake for redundancy — it is what fixes entries **already stored**.
The sorted set's member is the JSON entry itself, so renaming one would mean a `ZREM` of the
exact old blob plus a re-`ZADD`. Masking on read avoids that, is reversible, and makes any later
word-list addition apply retroactively on the next fetch. Ranking is unaffected (it comes from
the sorted-set index). This is also why **no admin endpoint was needed** — adding a word and
redeploying _is_ the escape hatch.

Other decisions:

- **A blocked name is silently swapped, not rejected**; the submission still returns 200.
  Telling someone their name was blocked hands them a feedback loop to probe the filter with,
  and does nothing about names already stored.
- **The replacement is deterministic**, seeded on `` `name-${deviceId}` `` (prefixed so it can't
  collide with `bot-${date}-${i}`). Not a nicety: the board polls every 15s, so a name that
  re-rolled per request would visibly flicker, and write and read must agree.
- **`obscenity`** was chosen over `bad-words`, `leo-profanity`, `@2toad/profanity` and `cuss`
  because it resists obfuscation _algorithmically_ — its transformers resolve confusables,
  leetspeak and repeated characters before matching — rather than enumerating leet spellings.
  It is in `dependencies` (Vercel only installs those for functions) and never reaches the
  client bundle.

Two traps, both found by testing, both of which would have shipped silently broken:

1. **`kkk` and `1488` cannot be obscenity patterns.** `collapseDuplicatesTransformer` rewrites
   repeated characters _before_ matching, so `kkk` arrives as `k` and `1488` as `148`. A `|kkk|`
   pattern **compiles fine and then never fires** — no error, it just never matches. They are
   matched literally instead, with a test that fails if someone moves them into the dataset.
2. **The shipped dataset false-positives on history names** — `dick` is unbounded so it eats
   _Dickinson_; `|ass` eats _Assyria_; `|fag` eats _Fagan_; plus _Penistone_ and _Retardant_.
   This is a history game, so players plausibly pick those. They are allowlisted by **blanking
   the word out of the string before matching, not by skipping the check** — so "Dickinson"
   passes but "Dickinson Fuck" still doesn't.

Spaced-out bypasses (`N I G`, `ni gg er`) are closed by `collapseSpacedLetters()`, which joins
runs of chunks that are **three characters or fewer**. Upstream's `skipNonAlphabeticTransformer`
does this unconditionally and is deliberately excluded from their recommended set because it
false-positives across word boundaries. Squashing regardless of chunk length would also close
`"ni gger"` but invents matches nobody typed (_"Alan Iggarson"_ contains one) — hence the cap.
The collapsed variant is tested _in addition to_ the raw name, so it can only add detections.

Validated against live data: all 35 real names on the 2026-08-10 board were run through the
filter and **exactly one changed** — the slur. Zero false positives.

### The word-level layer (2026-08-15)

`Numb Digger` reached #1 on the daily board. Swap the leading consonants and it reads as a
slur. **No amount of tuning the above would have caught it** — every character in it is
already innocent; the wordplay lives a level up, in how two correctly-spelled words recombine.

**"Add it to the word list" is the wrong instinct, and the next person will have it.**
`obscenity`'s recommended transformers normalise exactly two ways: confusables map non-ASCII
lookalikes **down to** ASCII and never one ASCII letter to another, and leetspeak is a
**ten-entry table** of symbols/digits (`@4`→a, `3`→e, `1|!`→i, `0`→o, `$5`→s, `7`→t…). So
`n1gger` is caught and `nlgger` is not — lowercase L is a letter, not a symbol. Neither
transformer models word-level recombination at all. Both gaps are outside what the matcher can
express, not missing dataset entries.

Two checks run ahead of the existing layers, both inside `safeDisplayName`, so nothing in
`submit.ts` changed and they apply retroactively on the next read.

**`foldName()` — a canonical skeleton.** NFKD → lowercase → strip marks → strip
non-alphanumerics → digits to letters → `ph`→f, `x`→ks → `[lyj]`→i, `v`→u, `z`→s, `q`→g,
`c`→k → collapse runs. This is what makes letter-swap coverage free rather than a list of
variants: `NumbDigger`, `Numb-Digger`, `Numb D1gger`, `Numb Diqqer` and `Numb Diggerrr` all
fold to `numbdiger`.

- **Step order is load-bearing.** `2`→z before z→s; `x`→ks before the letter classes so k and s
  are already canonical; run-collapse last, because every earlier step can create new adjacent
  duplicates. `ck`→k is deliberately absent — `c`→k plus run-collapse already produces it.
- **The fold destroys `kkk` (→`k`) and `1488` (→`iab`)**, exactly as `collapseDuplicatesTransformer`
  does. `LITERAL_HATE_TERMS` must keep running on its own digits-preserved string — never route
  it through the fold.

**Check A — an exact blocklist** (`TROLL_NAMES`), matched as **whole names** against the fold,
never as substrings. Whole-name matching _is_ the safety property: a substring list would need
short terms like `coon`, and `Clever Condor` folds to `kieverkondor`, which contains `kon`.

**Check B — the `-igger` carrier family**, because a blocklist of one name is bypassed by typing
`Nice Digger` tomorrow. It catches onset swaps spelling `nigger`/`nigga` and nothing else.

- **Tokens are folded _before_ onsets are taken.** Digits are not vowels, so the onset of a raw
  `d1gger` is `d1g` and the swap silently misses; folding first makes it `diger`.
- `CARRIER_EXEMPTIONS` is short because **`tiger` is the only innocent word in the app's own
  generated vocabulary carrying the `-iger` rime** (31 hits in the client dictionary, one in the
  bot list). That one is `Noble Tiger` — a name the app generates itself, so without the
  exemption `safeDisplayName` could hand out a replacement that is itself blocked. `niger`,
  `nigeria`, `nigerian` and `tigris` are exempt for the same reason they are in `ALLOWED_WORDS`:
  this is a history game.

**Why this is scoped to racial slurs and not profanity generally.** The mechanism cannot tell a
deliberate spoonerism from an accidental one, so the target list has to be words where an
invented match is almost certainly intentional. Measured against 426,710 client-prefill pairs,
the full 1,015-name bot cross product, and 10,600 event strings:

| Configuration                      | Names the app itself generates that get blocked                         |
| ---------------------------------- | ----------------------------------------------------------------------- |
| **Shipped** (checks A + B)         | **0** across all three corpora                                          |
| Onset swaps vs _every_ racial slur | 739 — `Calm Loon`, `Casual Pike`, `Golden Fox`                          |
| Those slurs matched as substrings  | 10,566 — `Clever Condor` again                                          |
| Adding general profanity (`fuck`)  | 62 — `duck` is in the animals dictionary and 62 adjectives start with f |

`nameFilterCorpus.test.ts` **enforces that table rather than documenting it**, and pins the
dictionary sizes so a dependency bump that reshapes them fails loudly. Re-run it before widening
any term list; it will argue back.

Two pre-existing bugs surfaced by writing that test:

- **`booby` was a live false positive** — a bird in the client's animals dictionary, so all 1,202
  adjective pairings were being offered in the input box and then silently renamed on submit.
  Now allowlisted.
- **The shadowban leaked.** `[date].ts` masked the filtered player's _own_ entry too, so they
  loaded the board, saw their row renamed, and knew — the exact feedback loop the silent swap
  exists to deny. A device now sees its own name unchanged; `deviceId` is compared against the
  entry's own, so the only name it can unmask is the caller's. Safe to vary the body per device
  because `Cache-Control` is already `no-store`.

**Known gaps, all deliberate:** `"ni gger"` (one short chunk beside a long one) is still open —
`collapseSpacedLetters` needs two or more short chunks in a row. `NiceDigger` with no separator
passes check B, since one token has nothing to swap. `Numb Tigger` passes: it folds onto the
`tiger` exemption, which is the price of that exemption. Truncation can manufacture profanity
(`Straightforward Cockroach` → `Straightforward Cock`); blocking those is _correct_ since the
displayed string really is profane, and the fix — truncating on a word boundary — belongs in
`normalizeDisplayName`, not the filter.

A new spoonerism outside the `-igger` family needs a line in `TROLL_NAMES`; that is the intended
maintenance loop. If it starts costing real time, build a report-a-name flow —
`api/card-reports/` already has the whole shape (public POST with hashed-IP rate limiting plus a
key-gated read page).

## Loading states

`useLeaderboard` initialises `isLoading: true`, not `false` — the fetch happens in an effect
after first render, so a `false` initial state flashes "No entries yet" before the skeleton.
Skeleton rows must match the loaded row structure and line-height (`h-5` for `text-sm`) or the
list shifts when data arrives.

The original skeleton bars were invisible because they used `bg-border/50` — the
opacity-modifier no-op described in [../gameplay-feel/index.md](../gameplay-feel/index.md) and
CLAUDE.md. This folder is where that trap was first hit, in February; it was rediscovered
independently in July, and a **third** time in August at the player-row highlight.

**The skeleton's row count is the layout-shift control.** The card is sized by its content up
to `max-h`, so a 5-row skeleton gave a short card that snapped taller the moment a full board
arrived. It renders 8 now, and the scroll region carries a `min-h` so skeleton, error, empty
and short-board states settle at the same height.
