# Leaderboard & Daily Mode

The daily puzzle (the UI calls it the **Daily Challenge**; in code it is the puzzle day,
`puzzleDate.ts`), its global leaderboard, bot population, and display-name filtering.

Endpoints, Redis keys and env vars are in
[../architecture-reference.md](../architecture-reference.md). Storage is **Upstash Redis**
(`@upstash/redis`, `UPSTASH_REDIS_REST_*`).

## The daily's theme

Mondays and Fridays are usually a hand-authored curated theme
([curated-themes/](../curated-themes/index.md)), looked up first, before the seeded RNG is
touched. Every other day `getDailyTheme` (`src/utils/dailyTheme.ts`) draws from the dated menu
epoch in force (`src/data/dailyThemeMenu.json`, written by `scripts/daily-theme-menu.js`):
Everything, a category, a region, a country, or a pairing such as Art in Italy, by the epoch's
weights. Dates before the first epoch use the original frozen generator (Everything about half
the time, otherwise one category). A change to what can be drawn ships as a new epoch dated after
anything already played, because past days are replayed by the recency chain and shown in stored
results.

## The puzzle day is the player's LOCAL calendar date

**`src/utils/puzzleDate.ts` is the single source of truth.** Its header comment explains the
rule; this is the decision behind it.

A UTC boundary puts a new puzzle at 5pm in Los Angeles and 10am in Sydney, with two bugs:

- **Double increment** — an LA player playing at 4pm and 6pm is, in UTC, playing two different
  days: two puzzles two hours apart, and the streak increments twice in one evening.
- **Silent loss** — an "after dinner" player drifts across the boundary and loses a streak on a
  day they didn't miss.

The cost of local dates is **accepted rather than avoided**: a `leaderboard:YYYY-MM-DD` fills
over **~50 wall-clock hours** (opening when UTC+14 starts the date, closing when UTC-12 finishes
it), so a rank shown early in a player's local day is provisional and drifts as the rest of the
world plays. A daily habit belongs to the person, not to Greenwich. **Do not "fix" this to UTC
without re-reading this.**

Consequences worth knowing:

- **`msUntilNextLocalMidnight` is built by local-calendar construction, deliberately not
  `DAY_MS - (now % DAY_MS)`.** DST days are 23 and 25 hours, so the modulo is wrong twice a year
  even after correcting for the offset.
- **Tests pin `TZ=America/Los_Angeles`** in the `test` script. Don't remove it.
- **The submission window is `utcToday ± 1`, not an exact match** (`lib/leaderboard/dateWindow.ts`),
  because one date string is in play for ~50 hours.
- **`SUBMISSION_DEDUPE_TTL_SECONDS` is 72h and shared** by `submit.ts` and `botGeneration.ts`. It
  must outlive the ~50-hour window, or the dedupe key expires while the date is still
  submittable; `dateWindow.test.ts` fails if it doesn't. It lives in `lib/` rather than being
  imported from `src/` because `api/tsconfig.json` is a separate project.
- `App.tsx`'s frozen `introDate` feeds `buildDailyDeck` to build the intro animation's
  **spoiler guard**. It must use the local date too, or the guard silently stops excluding
  today's deck.

## `useToday` — day rollover while the app is open

`ModeSelect` and `NextDailyCountdown` both need "today" to change under them. WKWebView
preserves React state across background/foreground indefinitely, so without this the app shows
yesterday's theme, preview and leaderboard the next morning. It is a **lifecycle** problem, not
a caching one — the service worker is already network-first for `/api/*`.

Three complementary triggers, all funnelling into one functional-setter update that dedupes
no-op transitions: `appResume` (dispatched by `App.tsx` via `@capacitor/app`),
`document.visibilitychange` (web tab refocus), and a timer to just past next local midnight.

**The midnight timer re-arms after firing.** A one-shot timer stops rolling over in an app left
foregrounded across two nights, which iOS does, since the WebView keeps state alive for days.

## An unfinished daily resumes; it is never re-dealt

The deck is seeded from the date, so quitting part-way (closing the app, reloading, the in-game
Home button) and dealing again would hand the **identical deck** to a player who now knows
where the first cards go. The one-submission-per-device key does not stop that; it only stops a
second submission.

`src/utils/dailyProgress.ts` keeps the game in `when-daily-progress` (one date-stamped slot,
slugs only, the `dailyBoard.ts` shape), and the Daily card's button reads "Resume Daily
Challenge" while it exists. Three decisions:

- **A move is saved when the card is dropped, not when its animation settles.** A miss shows
  the card's true slot about a second before the state settles, so saving on settle would let a
  player see the answer, close the app and take the move back. `placeCard` saves
  `settleDailyPlacement`'s up-front copy of the settled state; `useDailyProgress` covers the
  deal and hand cycling. `settleDailyPlacement` mirrors both timer paths in `placeCard`, and a
  change to one belongs in the other. If the final card was dropped, the save says `gameOver`
  and resuming lands on a finished game, so the normal game-over writes run then.
- **Resume lives in `startGame`**, so every door into the daily (the Daily card, `/daily`, a
  reminder tap, in-game Restart) resumes without its own wiring.
- **A changed deck is detected by the cards already seen, not by an app or catalogue
  version.** Draws only ever come off the front, so everything the player has seen is exactly
  the first N cards of the rebuilt deck. If those N still match, the game resumes, and the
  remaining deck is just the rest, so it is never stored. If they don't (a deploy changed the
  catalogue, difficulty index or theme under the game), the save is dropped and the daily is
  dealt fresh. A version stamp would restart games on deploys that change nothing about
  today's deck. The Daily card runs the same check (`canResumeDailyProgress`, against the deck
  it already builds for its preview card) so it never says Resume over a save a tap would throw
  away.

## Curated days: short grids and clamped bots

A correct placement redraws only while the deck has a card (`src/utils/placementLogic.ts`), so
a deck that runs dry shrinks the hand without a mistake and ends the game early. On an
Everything or category day the pool is far larger than any realistic run, but **a curated theme
is a couple of dozen cards, so short emoji grids are routine**: every player who clears one
submits fewer than `DAILY_HAND_SIZE` 🟥. `submit.ts` therefore accepts `redCount <=
DAILY_HAND_SIZE`. **Do not tighten that check to an equality** — it would reject every cleared
run.

**Bots are clamped to the day's ceiling.** They sample Poisson(6) with no idea how many cards
exist, so on a curated theme they could out-score every human. `botGeneration.ts` reads the
theme's size from `themes:calendar` and caps a bot at one below it (the first card seeds the
timeline). That is NOT the theme-validation mistake below: what breaks there is a _duplicate_ of
the theme logic re-deriving the theme and drifting out of step. Reading a count from the one
authoritative record has nothing to drift against, and it fails open to the flat ceiling of 20.

Scores also bunch at the ceiling on a clearable theme, since equal correct counts genuinely tie
and Redis orders them by member string. Nothing breaks, but "#1 globally" means less on those
days.

## Scoring and validation

Score is `correctCount * 100`. **Mistakes are not part of it and must not be added.**

The daily deals a hand of 5 and a wrong placement discards the card without drawing a
replacement, so the game ends when the hand empties — which means **nearly every completed
daily has the same mistake count**, the hand size (a cleared curated theme is the exception,
with fewer). Subtracting mistakes is not a tie-break; it shifts nearly every score by the same
constant, and a mistakes column on the board would read `5✗` on every row. Mistakes say nothing
about how a player did in this game.

Equal correct counts therefore genuinely tie, and Redis orders them by the JSON member string.
A real tie-break would have to be a new term, such as submission time.

Server-side validation on submit: date inside the window; `correctCount >= 0` with no upper
bound; 🟩 count equals `correctCount`; 🟥 count is 0–`DAILY_HAND_SIZE`;
`totalAttempts == correctCount + mistakeCount`; and the `submission:{date}:{deviceId}` key doesn't
already exist. The 🟥 bound is a range for the reason above: wrongly rejecting a legitimate run
is worse than accepting a short one.

**The theme is not validated, and must not be.** The theme is a value the client supplies about
a puzzle the client generated, so comparing it against a server-side computation can never
catch a forged score (a cheat sends a consistent theme); it only checks that two copies of the
theme logic agree. A server copy of `ALL_CATEGORIES` and the seeded RNG drifts silently: the
category list's length is the modulus of the category pick, so one added category re-themes
existing dates from the same seed and rejects every honest submission on the days the copies
disagree, while the Everything days, which agree whatever the list length, hide it. Categories
live in exactly one place, `src/types/index.ts`, and the API does not know them. The client sends
no `theme`; a `theme` field in a body is ignored.

The rule this leaves: when two copies of a value must agree, delete one rather than relying on a
comment or a parity check. Where a copy genuinely must exist (`DAILY_HAND_SIZE` in
`lib/leaderboard/handSize.ts`, `SUBMISSION_DEDUPE_TTL_SECONDS`), keep something that _fails_ on
drift rather than something that _asks_ for care.

Device identity is a SHA-256 of browser signals plus a random UUID persisted in localStorage
(`when-device-id`). Clearing localStorage mints a new one — accepted, since there are no prizes
and it only needs to stop casual double-submits.

## Submitting from the home screen

The game-over popup's submit form is built from live in-memory state and is gone once
dismissed, so a submission that failed there could never be retried from it. Today's score
stays in `when-daily-result`, the dedupe key is written only on a successful submission, and
the ±1 day window still accepts it, so the Daily card offers **Submit Your Score** in the share
slot for as long as the score is unclaimed (`hasUnclaimedScore` in `ModeSelect.tsx`).
`getTodayResult()` returns `null` once the local date rolls over, which bounds that with no
extra expiry logic.

`useDailyLeaderboard` serves both callers, and the home screen depends on three of its options
and behaviours:

- **`boardDate`** keeps the board loading for players who have not played today. Keyed off the
  result alone, they would see a permanently empty board.
- **`poll: false`** on the home screen. The modal polls every 15s while open; an idle home
  screen polling all day would be a permanent background request per user against the function
  and Upstash.
- **`refresh` takes a date**, because `useToday` hands the new one to its callback at rollover.

Traps:

- **Gate the CTA on `!isLoading && !loadError`, not on `submitted` alone.** `submitted` is false
  while the first fetch is in flight, so it alone flashes "Submit Your Score" at players already
  on the board. Specifically **not** on `unavailable`, which folds in `submitError` and would
  retract the button the instant a submission failed, exactly when it is needed.
- **Do not memoize `todayResult` in `ModeSelect`.** It is re-read every render on purpose:
  `updateDailyResultWithLeaderboard` writes the placing into that record after the board
  resolves, and the share reads `leaderboardRank` straight off it. Memoizing on `today` looks
  correct and silently strips the rank from every shared result.
- **`useToday` and the board hook need each other.** `useToday(onTick)` refetches the board on
  every resume; the board hook needs `today` to know which board to read. The cycle is broken
  with a ref assigned during render, safe because `useToday` only ever calls `onTick` from an
  event listener.
- **Fake timers do not flush the fetch.** `fetchLeaderboard` awaits the device fingerprint
  first, so the request goes out on a microtask. A poll test that counts `fetch` calls straight
  after `advanceTimersByTime` compares 0 to 0 and passes whatever the hook does. Flush with
  `await act(async () => { await Promise.resolve(); })` and assert the mount call landed
  _before_ advancing.
- Unit tests confirm the hook, not the wiring. Driving the real app with Playwright against a
  stubbed `/api/leaderboard/**` (the dev server has no Upstash env) is how to check the board
  renders when the daily is unplayed, the CTA flips and reverts, the POST body carries the
  stored grid and no `theme`, and the state survives a reload. Recipe in
  [../driving-the-app-with-playwright.md](../driving-the-app-with-playwright.md). The iOS
  keyboard against the form inside the centred card is unverified; headless Chromium cannot see
  safe-area failures (below).

## The whole board is browsable

The modal renders every row the server returns, as the centred pop-out card at every width,
not a full-screen sheet on phones.

**One `ZRANGE` serves rows, total and rank.** `[date].ts` must read the entire sorted set
anyway to locate the caller's `deviceId` (the client always sends one), so a separate limited
`ZRANGE` and a `ZCARD` would be redundant reads on an endpoint every open board polls at 15s.

- Limits are `DEFAULT_LIMIT`/`MAX_LIMIT` in `limits.ts`, and the response carries `truncated`
  so `totalPlayers` (a true count, bots included) can never silently disagree with the rendered
  count. Returning everything stays right to roughly 250–300 entries; past that say so via
  `truncated` before reaching for windowing, and **never** add `s-maxage`/ISR to make a bigger
  payload cheaper — the body varies per device, see the filtering section below.
- **`emojiGrid` and `totalAttempts` are stored but not sent.** Neither is rendered. Check for a
  consumer before restoring either.
- The sticky player row **must have an opaque background** or the list shows through as it
  scrolls under. `.bg-player-row` mixes accent into `--color-surface`; an opacity modifier on
  the accent token compiles to nothing. Its `z-10` is equally load-bearing: `divide-y` borders
  draw over it otherwise.
- **Only the backdrop closes the board.** An `onClick={onClose}` on the card dismisses the
  board on any row tap, fatal once it scrolls. `Leaderboard.test.tsx` pins it.
- **The card keeps a real height cap (`max-h-[min(75vh,520px)]`). Don't remove it.** Making it
  fill the backdrop's padded box, to get an even gap on all four sides, breaks on iOS: `p-4` is
  16px, but the webview runs under the status bar (`overlaysWebView: true`, see
  [../mobile-ios/index.md](../mobile-ios/index.md)), so the card's top edge sits under the clock
  and camera and the list runs off the bottom of the screen. A short centred card clears the
  inset by virtue of being centred, without having to know the inset.
- **A headless browser cannot catch that.** `env(safe-area-inset-*)` is 0 in Chromium, so the
  overlap is invisible in a Playwright pass at 390×844 that otherwise measures a perfect
  16/16/16/16 frame. Height and full-bleed changes here need a real device or the installed PWA.
  Related: an even margin on all four sides and a card shorter than the viewport are mutually
  exclusive on a phone — if both are asked for, say so rather than picking one.
- Check heights against a full board. A short board is content-sized and never reaches the
  `max-h`.
- The list's `min-h` is capped against the viewport (`min(320px,30vh)`) rather than a flat pixel
  floor, so it can never demand more than the card has — on a landscape phone the card is only
  ~292px and `overflow-hidden` would silently eat the bottom of the list. **While the submit form
  is mounted the floor drops** (`LIST_MIN_HEIGHT_WITH_FORM`): header, count bar, a 320px list
  and the ~120px form overflow the cap, and what falls off the bottom is the submit button. A
  unit test cannot see this; check it in a real browser.
- Truncation is disclosed in the **player-count bar** ("Showing 100 of 900 players today"), not
  a footer. A footer about ranks drifting through the day is noise on every open; if the ~50-hour
  fill window needs explaining, it belongs somewhere a player isn't reading on every open.

## Bots

The board is seeded with 7–13 bots so it doesn't look empty. Generated **lazily on the first
fetch for a date**, deterministically from the date string (mulberry32), behind a Redis `SETNX`
lock so concurrent requests can't double-generate. Correct counts are Poisson(6) clamped to 0–20,
or to the curated day's ceiling (above). Names are "Adjective Animal" from the same lists the
name filter reuses.

Bots also roll a mistake count, which is **inert** — nothing ranks or renders it. Bots are
scored by the same expression as `submit.ts`; keep it that way. A score that counted mistakes
would let a bot rolling few mistakes beat a human on the same correct count, because a human's
is nearly always the full hand.

**Bot _creation_ is gated to the submission window.** `[date].ts` serves any well-formed date so
historical boards stay readable, but without the gate any client could mint bot sets and lock
keys for arbitrary dates (`9999-12-31`) just by asking.

Bots need no timezone handling — keying on the date string plus the lock means whoever fetches
first mints the set and everyone else reads back identical entries. Only the timing shifts.

## Display-name filtering

Leaderboard names are filtered for slurs and profanity.

**Filtered server-side in two places: on write _and_ on read.** Read-time masking is the part
that matters and is easy to mistake for redundancy — it is what fixes entries **already stored**.
The sorted set's member is the JSON entry itself, so renaming one would mean a `ZREM` of the
exact old blob plus a re-`ZADD`. Masking on read avoids that, is reversible, and makes any later
word-list addition apply retroactively on the next fetch. Ranking is unaffected (it comes from
the sorted-set index). This is also why **there is no admin endpoint** — adding a word and
redeploying _is_ the escape hatch.

Other decisions:

- **A blocked name is silently swapped, not rejected**; the submission still returns 200.
  Telling someone their name was blocked hands them a feedback loop to probe the filter with,
  and does nothing about names already stored.
- **A device sees its own name unchanged.** Masking the filtered player's own entry would show
  them their row renamed, the exact feedback loop the silent swap exists to deny. `deviceId` is
  compared against the entry's own, so the only name it can unmask is the caller's. Varying the
  body per device is safe because `Cache-Control` is `no-store`.
- **The replacement is deterministic**, seeded on `` `name-${deviceId}` `` (prefixed so it can't
  collide with `bot-${date}-${i}`). Not a nicety: the board polls every 15s, so a name that
  re-rolled per request would visibly flicker, and write and read must agree.
- **`obscenity`** is the library, over `bad-words`, `leo-profanity`, `@2toad/profanity` and `cuss`,
  because it resists obfuscation _algorithmically_ — its transformers resolve confusables,
  leetspeak and repeated characters before matching — rather than enumerating leet spellings.
  It is in `dependencies` (Vercel only installs those for functions) and never reaches the
  client bundle.

Two traps, both of which fail silently:

1. **`kkk` and `1488` cannot be obscenity patterns.** `collapseDuplicatesTransformer` rewrites
   repeated characters _before_ matching, so `kkk` arrives as `k` and `1488` as `148`. A `|kkk|`
   pattern **compiles fine and then never fires** — no error, it just never matches. They are
   matched literally instead, with a test that fails if someone moves them into the dataset.
2. **The shipped dataset false-positives on history names** — `dick` is unbounded so it eats
   _Dickinson_; `|ass` eats _Assyria_; `|fag` eats _Fagan_; plus _Penistone_ and _Retardant_.
   This is a history game, so players plausibly pick those. They are allowlisted by **blanking
   the word out of the string before matching, not by skipping the check** — so "Dickinson"
   passes but "Dickinson Fuck" still doesn't. `booby` is allowlisted too: it is a bird in the
   client's animals dictionary, so without it every adjective pairing would be offered in the
   input box and then silently renamed on submit.

Spaced-out bypasses (`N I G`, `ni gg er`) are closed by `collapseSpacedLetters()`, which joins
runs of chunks that are **three characters or fewer**. Upstream's `skipNonAlphabeticTransformer`
does this unconditionally and is deliberately excluded from their recommended set because it
false-positives across word boundaries. Squashing regardless of chunk length would also close
`"ni gger"` but invents matches nobody typed (_"Alan Iggarson"_ contains one) — hence the cap.
The collapsed variant is tested _in addition to_ the raw name, so it can only add detections.

### The word-level layer

Spoonerisms such as `Numb Digger` (swap the leading consonants) read as a slur while every
character in them is innocent; the wordplay lives a level up, in how two correctly-spelled
words recombine. **No amount of tuning the layers above catches them.**

**"Add it to the word list" is the wrong instinct.** `obscenity`'s recommended transformers
normalise exactly two ways: confusables map non-ASCII lookalikes **down to** ASCII and never one
ASCII letter to another, and leetspeak is a **ten-entry table** of symbols/digits (`@4`→a, `3`→e,
`1|!`→i, `0`→o, `$5`→s, `7`→t…). So `n1gger` is caught and `nlgger` is not — lowercase L is a
letter, not a symbol. Neither transformer models word-level recombination at all. Both gaps are
outside what the matcher can express, not missing dataset entries.

Two checks run ahead of the existing layers, both inside `safeDisplayName`, so `submit.ts` needs
nothing and they apply retroactively on the next read.

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

**Known gaps, all deliberate:** `"ni gger"` (one short chunk beside a long one) is open —
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

Skeleton bars need a solid token colour: an opacity modifier such as `bg-border/50` compiles to
nothing and leaves them invisible (see [../gameplay-feel/index.md](../gameplay-feel/index.md) and
CLAUDE.md). This trap recurs in this folder; check any new tint in the built CSS.

**The skeleton's row count is the layout-shift control.** The card is sized by its content up
to `max-h`, so a short skeleton gives a short card that snaps taller the moment a full board
arrives. It renders 8, and the scroll region carries a `min-h` so skeleton, error, empty and
short-board states settle at the same height.
