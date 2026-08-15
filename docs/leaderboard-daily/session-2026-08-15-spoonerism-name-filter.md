# Session — Block Spoonerised Slurs in Display Names

**Date:** 2026-08-15
**Branch:** `claude/name-filter-letter-swaps-yk7kux`
**Plan file:** `~/.claude/plans/in-a-previous-session-immutable-castle.md`

Direct sequel to [2026-08-10 — Display Name Filter](session-2026-08-10-display-name-filter.md).
Read that one first; this session only adds to what it built.

## Overview

`Numb Digger` reached #1 on the daily board. It is a spoonerism: swap the leading consonants of
the two words and it reads as a racial slur.

The 2026-08-10 filter did not touch it, and no amount of tuning would have. Its whole design
operates on characters — and **every character in "Numb Digger" is already innocent**. The
wordplay lives a level above, in how two correctly-spelled words recombine.

Two evasions were reported. Both were real, and only one was the one that mattered:

1. **Onset swaps** — the live one, above.
2. **Letter-for-letter swaps** — `nlgger`, `niqqer`, `fvck`. Confirmed to pass, but not what was
   actually being used.

Scope was set with the user: **racial slurs only.** Not juvenile or sexual wordplay. An earlier
draft of this work carried an 18-name troll list covering `moe lester`, `mike hunt` and friends;
the user cut it to the one name that smuggles a slur.

## Why `obscenity` was never going to catch this

Worth recording precisely, because "add it to the word list" is the wrong instinct here and the
next person will have it.

`englishRecommendedTransformers` normalises exactly two ways:

- `resolveConfusablesTransformer` maps **non-ASCII lookalikes down to ASCII**. It never maps one
  ASCII letter to a different ASCII letter.
- `resolveLeetSpeakTransformer` is a **ten-entry table of symbols/digits → letters**: `@4`→a,
  `(`→c, `3`→e, `6`→g, `1|!`→i, `/`→l, `0`→o, `$5`→s, `7`→t, `2`→z.

So `n1gger` is caught (`1`→i) and `nlgger` is not — lowercase L is a letter, not a symbol. That
is the letter-swap gap. And neither transformer models word-level recombination at all, which is
the spoonerism gap. Neither is a missing dataset entry; both are outside what the matcher can
express.

## Approach

Two checks added to `api/leaderboard/nameFilter.ts`, ahead of the existing layers. Both routes
already funnel through `safeDisplayName`, so **nothing in `submit.ts` changed** and the new
checks apply retroactively to Redis on the next fetch — the same read-path property the previous
session built.

### `foldName()` — a canonical skeleton

```
NFKD → toLowerCase → strip combining marks → strip all non-alphanumerics
     → digits to letters → ph→f, x→ks → [lyj]→i, v→u, z→s, q→g, c→k → collapse runs
```

Step order is load-bearing and commented as such: `2`→z before z→s, `x`→ks before the letter
classes so k and s are already canonical, run-collapse last because every earlier step can create
new adjacent duplicates. `ck`→k is deliberately absent — `c`→k plus the run-collapse already
produces it.

This is what makes the letter-swap coverage free rather than a list of variants: `NumbDigger`,
`Numb-Digger`, `Numb D1gger`, `Numb Diqqer` and `Numb Diggerrr` all fold to `numbdiger`.

Note it **destroys** `kkk` (→ `k`) and `1488` (→ `iab`), exactly as `collapseDuplicatesTransformer`
does. `LITERAL_HATE_TERMS` still runs on its own digits-preserved string; don't route it through
the fold.

### Check A — exact blocklist

`TROLL_NAMES = ['numb digger']`, matched as **whole names** against the fold, never as substrings.

Whole-name matching is the entire safety property. A substring list would need short terms like
`coon`, and `Clever Condor` folds to `kieverkondor`, which contains `kon`.

### Check B — the `-igger` carrier family

A blocklist of one name is bypassed by typing `Nice Digger` tomorrow, so check B catches onset
swaps that spell `nigger`/`nigga` — and nothing else.

Tokens are folded **before** onsets are taken. Digits are not vowels, so the onset of a raw
`d1gger` is `d1g` and the swap silently misses; folding first turns it into `diger`. A trailing
`s` is tolerated, so `Numb Diggers` is caught too.

`CARRIER_EXEMPTIONS` is the whole exemption list, and it is short because **`tiger` turns out to
be the only innocent word in the app's entire vocabulary carrying the `-iger` rime** — 31 hits
across the client dictionary and one in the bot list. That one is `Noble Tiger`, which the app
generates itself, so without the exemption `safeDisplayName` could hand out a replacement name
that is itself blocked.

## The measurements

These are the reasoning, not decoration. Anyone widening the term lists should re-run
`nameFilterCorpus.test.ts` and expect it to argue back.

Corpora: 426,710 `unique-names-generator` `adjectives × animals` pairs (the client prefill),
the full 1,015 `botGeneration` cross product (replacement names), 10,600 event
`name`/`friendly_name` strings (a large body of ordinary historical English, the register a
plausible player name sits in).

| Configuration                                          | Blocked names the app can generate                                                                       |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Shipped:** checks A + B as above                     | **0** on all three corpora                                                                               |
| Onset swaps vs **every racial slur**                   | 739 — `Calm Loon`→"Lalm Coon", `Casual Pike`→"Pasual Kike", `Golden Fox`→"Folden Gook"                   |
| Those slurs matched as **substrings** not whole tokens | 10,566 — `Clever Condor` again                                                                           |
| Adding general profanity (`fuck`)                      | `Fancy Duck` and 61 others — `duck` is in the client's animals dictionary and 62 adjectives start with f |

The last row is why this is scoped to slurs rather than "profanity" generally: the mechanism
cannot tell a deliberate spoonerism from an accidental one, so the target list has to be words
where an invented match is almost certainly intentional.

## Two things found on the way

Both predate this session; both were surfaced by writing the corpus test.

**`booby` was a live false positive.** It is a bird in the client's own animals dictionary, so all
1,202 adjectives paired with it — "Able Booby", "Golden Booby" — were being offered to the player
in the input box and then silently renamed on submit. Now in `ALLOWED_WORDS`.

**The shadowban leaked.** Silent swapping worked on write, but `[date].ts` masked the player's own
entry too (both the top-N map and the `playerEntry` branch), so a filtered player loaded the board,
saw their row renamed, and knew. That is the feedback loop the 2026-08-10 session explicitly set
out to deny them. A device now sees its own name unchanged while everyone else sees the swap;
`deviceId` is compared against the entry's own, so the only name it can unmask is the caller's.
Safe to vary the body per device because `Cache-Control` is already `no-store`.

## Verification

- `CI=true npm test` — **332 tests pass**, 23/23 suites (88 in the two name-filter files).
  Use `npm test`, **not** `npx react-scripts test`: the script pins `TZ=America/Los_Angeles` and
  the `puzzleDate` / `dailyConfig` / `dailyReminder` suites assert real US DST transitions, so
  running the binary directly fails 5 tests that are not broken.
- `npm run lint` — 0 errors, back to the 3 pre-existing warnings.
- `npm run typecheck` and `npm run typecheck:api` — both clean.
- **Against live data:** fetched the 19 real names on the 2026-08-15 board and ran every one
  through `safeDisplayName()`. **Exactly one changed** — `Numb Digger` → `Emerald Otter`. Zero
  false positives on the real board.
- `nameFilterCorpus.test.ts` (new) enforces the table above rather than documenting it. It pins
  the dictionary sizes too, so a dependency bump that reshapes them fails loudly instead of
  silently shrinking the corpus the assertions claim to cover.

## Deployment note

Same as last time: **shipping is the migration.** The read path filters, so the live board is
clean on the next fetch with no Redis surgery. Adding a name to `TROLL_NAMES` later cleans
history the same way.

## Follow-ups / open questions

- **Truncation can manufacture profanity.** `MAX_DISPLAY_NAME_LENGTH` cuts "Straightforward
  Cockroach" to "Straightforward Cock" and "Administrative Cuckoo" to "Administrative Cucko".
  The filter blocking those 8 prefill pairs is **correct** — the displayed string really is
  profane — so they are listed explicitly in the corpus test as expected. The fix, if wanted,
  belongs in `normalizeDisplayName` (truncate on a word boundary), not in the filter; it would
  change what long names display as, so it was left alone.
- `"ni gger"` — a short chunk beside a long one — is **still open**. The 2026-08-10 doc listed
  it and this session did not close it; `foldName` only whole-name-matches against `TROLL_NAMES`,
  so a slur spelled across a space still needs `collapseSpacedLetters`, which requires two or
  more short chunks in a row.
- A spoonerism outside the `-igger` family needs a line in `TROLL_NAMES`. That is the intended
  maintenance loop, and the corpus test will tell you if the addition costs a false positive.
- `NiceDigger` with no separator passes check B — one token, nothing to swap. The blocklist
  catches the no-separator form of names already on it, but not new ones.
- `Numb Tigger` passes: `tigger` folds onto the `tiger` exemption. That exemption is load-bearing
  and this is its price.
- If the add-a-name loop starts costing real time, the follow-up worth building is a
  report-a-name flow. `api/card-reports/` already has the entire shape — public POST with
  hashed-IP rate limiting, plus a `REPORTS_ADMIN_KEY`-gated read page.
