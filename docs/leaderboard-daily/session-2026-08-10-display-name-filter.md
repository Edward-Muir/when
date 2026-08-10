# Session — Filter Abusive Leaderboard Display Names

**Date:** 2026-08-10
**Branch:** `claude/leaderboard-name-filter-udw5xb`
**Plan file:** `~/.claude/plans/it-looks-like-the-golden-lantern.md`

## Overview

A player submitted a racial slur as their daily-leaderboard display name. It was visible to
everyone in three places — the Daily Leaderboard modal, the inline "Longest Timelines" list
on the Daily tab, and the post-game preview.

The name field had effectively no validation. `api/leaderboard/submit.ts` trimmed it, capped
it at 20 characters, stripped `<`/`>`, and stored it verbatim.

Two problems to solve, not one:

1. Stop new abusive names being stored.
2. Make names **already in Redis** display as something harmless — without a data migration,
   and while surviving the obfuscated variants an offender reaches for once a plain word
   stops working.

Decisions taken with the user before implementing:

- **Strictness:** slurs + strong profanity. Mild/juvenile names ("Farto") are fine and stay.
- **Submit UX:** a blocked name is **silently swapped**, not rejected. The submission still
  returns 200. Telling someone their name was blocked hands them a feedback loop to probe
  the filter with, and does nothing for names already stored.
- **No admin endpoint.** Because filtering runs on read (below), adding a word to the list
  and redeploying cleans historical entries too — that _is_ the escape hatch.

## Approach

Filter **server-side only, in two places**:

- **On write** (`submit.ts`), so the raw text never reaches Redis.
- **On read** (`[date].ts`), so entries already stored are masked on the way out.

Read-time masking is what fixes an entry that is already live. The leaderboard is a Redis
sorted set whose **member is the JSON entry itself**, so renaming a stored entry would mean
a `ZREM` of the exact old JSON blob plus a re-`ZADD`. Masking on read avoids that entirely,
is trivially reversible, and means any later addition to the word lists applies retroactively
to history on the next fetch. Ranking is unaffected — it comes from the sorted-set index, not
from the name.

Nothing changed on the client and the bundle is untouched (verified against the built
`main.js`): the name the client generates with `unique-names-generator` also goes through the
server filter on submit, so an unlucky generated pair is covered without shipping a word list
to the browser.

## Package choice — `obscenity`

Added `obscenity@^0.4.6` to **`dependencies`** (Vercel only installs `dependencies` for
functions). Evaluated against `bad-words`, `leo-profanity`, `@2toad/profanity` and `cuss`.

It is the only one of the group that resists obfuscation **algorithmically** rather than by
enumerating leet spellings as extra list entries. Its `englishRecommendedTransformers`
resolve unicode confusables, leetspeak and repeated characters _before_ matching, so `n1g`,
`niiig` and homoglyph spellings all land on the same pattern. It also ships 66 whitelisted
terms for the Scunthorpe problem, has zero runtime dependencies, is dual CJS/ESM with a
`main` field (so it resolves under both `api/tsconfig.json`'s CommonJS and CRA's Jest), and
carries bundled types.

Its English dataset covers slurs _and_ strong profanity, matching the chosen strictness, and
includes a word-bounded `|nig|` pattern — so the name that prompted this work was caught out
of the box. Nothing in the dataset touches "Farto".

Bundle size is irrelevant here because it never reaches the client.

## Files Modified

### `api/leaderboard/nameFilter.ts` (new)

No default export, so Vercel treats it as a shared lib rather than a route — the same
arrangement as `api/card-reports/reportSchema.ts` and `api/leaderboard/botGeneration.ts`.

- `MAX_DISPLAY_NAME_LENGTH` — 20, matching the client input's `maxLength`.
- `normalizeDisplayName()` — trims, strips `<`/`>`, **strips zero-width, bidi and control
  characters**, collapses whitespace, caps length. The invisible-character strip matters on
  its own: a zero-width space inside a word splits it for any matcher.
- `isNameAllowed()` — the matcher checks, described below.
- `safeDisplayName(raw, deviceId)` — the single function both routes call. Normalize → if
  empty or blocked, return a generated name → otherwise return the name.

The `RegExpMatcher` is a **module-level singleton**. Constructing one compiles every pattern,
and `[date]` runs it over up to 100 entries per fetch, so it is built once per cold start.

Three things sit alongside the dataset:

- **`addSupplementalTerms()`** — a short list of slurs and hate references the shipped dataset
  lacks. Deliberately short: every term added is a false-positive risk. Anything that could
  appear inside an ordinary word is word-bounded with `|pipes|`, so `|coon|` leaves raccoon,
  cocoon and tycoon alone and `|paki|` leaves Pakistan alone.
- **`LITERAL_HATE_TERMS`** — `kkk` and `1488`, matched with a plain regex. See the gotcha
  below; they cannot be expressed as obscenity patterns at all.
- **`ALLOWED_WORDS`** — innocent words the shipped dataset flags. **Blanked out of the string
  before matching rather than skipping the check**, so they neutralise only themselves:
  "Dickinson" passes, "Dickinson Fuck" still does not.

### `api/leaderboard/botGeneration.ts`

Added `generateNameFromSeed(seed)`, a thin export wrapping the existing private
`generateBotName(seededRandom(stringToSeed(seed)))`. Bot generation itself is unchanged — this
reuses the mulberry32 seeding and the `ADJECTIVES`/`ANIMALS` lists that were already there
rather than adding a second name generator.

The replacement name is seeded on `` `name-${deviceId}` `` — prefixed so it cannot collide
with the `bot-${date}-${i}` seeds. Determinism is a requirement, not a nicety: the leaderboard
polls every 15s, so a name that re-rolled per request would visibly flicker, and the write and
read paths have to agree on what a given player is called. The result reads as an ordinary
"Platinum Raven", indistinguishable from a real generated name — which is what makes a silent
swap work.

### `api/leaderboard/submit.ts`

Deleted the local `sanitizeDisplayName()`; the entry now uses
`safeDisplayName(body.displayName, body.deviceId)`. Still returns 200 on a blocked name.

Note this also changes the empty-name fallback: previously `'Anonymous'`, now a generated name.

### `api/leaderboard/[date].ts`

Runs `safeDisplayName(entry.displayName, entry.deviceId)` in both places a
`PublicLeaderboardEntry` is built — the `leaderboard.map` and the `playerEntry` branch.

### `src/utils/nameFilter.test.ts` (new)

52 tests. Lives in `src/` because CRA's Jest only roots there — the same arrangement as
`src/utils/adminAuth.test.ts`, which imports `../../api/card-reports/reportSchema`.

## Two gotchas worth remembering

Both were found by testing, and both would have shipped silently broken.

### 1. `kkk` and `1488` cannot be obscenity patterns

`collapseDuplicatesTransformer` rewrites runs of a repeated character before matching, so
`kkk` reaches the matcher as `k` and `1488` as `148`. A `|kkk|` pattern **compiles fine and
then never fires** — there is no error, it just silently never matches.

They are matched literally instead, against the name with separators removed. There is a
comment in the source saying not to move them into the pattern dataset, and a test that fails
if someone does.

### 2. The shipped dataset false-positives on history names

Running plausible player names through the matcher flagged real ones. `dick` is unbounded so
it eats **Dickinson**; `|ass` eats **Assyria**/**Assyrian**; `|fag` eats **Fagan**/**Fagin**;
plus **Penistone** and **Retardant**. This is a history game, so those are names players
plausibly pick. All are allowlisted via `ALLOWED_WORDS`.

`Montenegro`, `Cumberland`, `Cockburn`, `Scunthorpe` and `Hancock` were already safe —
obscenity's own whitelist covers them.

## Closing the spaced-out bypass

Obscenity's recommended transformers do not catch `N I G` or `ni gg er`. Upstream ships
`skipNonAlphabeticTransformer` for exactly this but **deliberately excludes it from the
recommended set** because it false-positives across ordinary word boundaries (their issues #23
and #46).

`collapseSpacedLetters()` handles it narrowly instead: split on non-alphanumerics, then join
runs of two or more chunks that are **three characters or fewer**. `"Motionless N I G"` is also
tested as `"Motionless NIG"`, `"n.i.g.g.e.r"` as `"nigger"`, `"ni gg er"` as `"nigger"` — while
`"Class Action"`, `"Rio Negro"`, `"Alan Iggarson"` and `"J R R Tolkien"` are left alone.

Squashing the whole string regardless of chunk length would also close `"ni gger"`, but it
invents matches nobody typed — `"Alan Iggarson"` squashes to a string containing `nigga` — so
the length cap is the trade. The collapsed variant is tested **in addition to** the untouched
name, so this can only ever add detections, never remove them.

Implemented as a single linear pass rather than a regex, because the obvious regex
(`(?:[a-z](?:[^a-z0-9]+|$)){3,}`) has a nested quantifier and trips
`security/detect-unsafe-regex`.

## Verification

- `CI=true npx react-scripts test` — 221 tests pass (52 new).
- `npm run lint` — 0 errors; back to the 3 pre-existing warnings.
- `npm run typecheck` and `npm run typecheck:api` — both clean. The latter is what proves
  `obscenity` resolves under the API's CommonJS config.
- `npm run build` — succeeds; `obscenity` confirmed **absent** from `build/static/js/main.js`.
- **Against live data:** fetched the 35 real names on the 2026-08-10 board from
  `https://www.play-when.com/api/leaderboard/2026-08-10` and ran every one through
  `safeDisplayName()`. **Exactly one changed** — the slur. Zero false positives on the real
  board; "Farto", "UWU", "It's a me.", "Xenophobic Partridge" and the rest all pass untouched.
- Adversarial batch: 20 obfuscation attempts, all blocked, all resolving to the same
  deterministic replacement for a given device.

## Deployment note

**Shipping is the migration.** No Redis surgery, no backfill script — the live board is clean
on the next fetch, because the read path filters.

## Follow-ups / open questions

- `Rio Negro` is blocked, from the shipped dataset's `|negro` pattern rather than anything
  added here. Blocking standalone "Negro" as a display name seemed right; if the river name
  should survive, it is a one-line `ALLOWED_WORDS` addition.
- `"ni gger"` (a short chunk next to a long one) still passes, by the deliberate trade above.
- A filter is a heuristic, never a verdict. The read-time design is the mitigation: when
  something gets through, add the pattern and redeploy — history cleans itself.
- Names are not deduplicated, and there is still no way for a player to change a name after
  submitting. Both pre-date this work.
