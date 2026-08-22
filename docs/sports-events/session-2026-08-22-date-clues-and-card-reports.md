# 2026-08-22 — Date Clues in Card Text, and the Open Card Reports

The game asks _when_, then printed the answer on the card. This session took the dates out of
every player-visible field, pinned the rule with a test, and cleared the actionable player
reports. Along the way it fixed two duplicate event slugs and one genuinely wrong `year`.

The durable conclusions are folded into [../events-images/index.md](../events-images/index.md)
and [../card-reports/index.md](../card-reports/index.md). This file is the narrative and the
handover.

## The bug

`shouldShowYearInPopup` (`src/components/Game.tsx:97-105`) deliberately hides `event.year` when
the popup shows a card still in the player's hand — the comment says _"that's the puzzle"_.
`GamePopup.tsx:295-303` then renders `event.description` immediately below it, unconditionally,
and `handleActiveCardTap` (`Game.tsx:310`) opens that same popup for the hand card.

So the year was hidden and the prose gave it away: _"at the **1952** Helsinki Olympics"_,
_"**In 1968** tennis entered the Open era"_. `friendly_name` was worse — `Card.tsx:97,142` puts
it on the card face at all times, so _"1955 Le Mans Disaster"_ never even needed a tap.

**100 events, 104 fields.** 84 sports descriptions, 9 sports titles, 11 older non-sport strays.
23.8% of the sports corpus against 0.2% everywhere else — it arrived in one batch
(`cfaafa0`, `81fdd91`, `fd15168`) and the `add-events` skill never said not to.

Players had already noticed: four of the five most recent card reports were `bad-description`,
and three of those were this bug.

## What made the sweep tractable

**A predicate with no false positives.** The naive `\b\d{4}\b` flags "Hagenuk MT-2000",
"3.1416" and "Boeing 747s". The rule in `scripts/events/date-clues.js` uses a lookbehind that
rejects a digit/dot/dash prefix and a lookahead that only rejects a decimal fraction, so a
sentence-final _"in 1949."_ still matches. Verified clean across all 5,631 events, which is what
made a zero-tolerance assert possible — **an allowlist would have been the first thing to rot**.

Getting that lookahead wrong cost a cycle: the first version was `(?!\.\d)` written as `(?![\d.])`,
which silently dropped every year that ended a sentence — 11 real offenders, all reading as clean.
Worth re-deriving from the test cases rather than trusting the pattern by eye.

**Map-then-apply, not a codemod.** `sports.json` is one 186KB array. A blind `s/ in \d{4}//`
produces debris on ~25 of the 84 (_"Count Baldwin III of Hainaut's **1114** peace charter"_,
_"A **1598** court case … by schoolboys around **1550**"_), and parallel hand-edits corrupt the
file. `scripts/events/date-clues-apply.js` follows `shorten-names-apply.js`: rewrites are
authored as `slug -> {description?, friendly_name?}` maps in `untracked_data/`, and one pass
validates _everything_ before writing _anything_ — including re-running the date-clue guard on
its own proposed output, so a rewrite that reintroduces a clue cannot land.

Two properties that kept the diffs honest: every event file round-trips **byte-identically**
under `JSON.stringify(arr, null, 2) + '\n'`, and `.prettierignore` covers `public/events/`, so
the husky `lint-staged` prettier pass is a no-op there. Result: exactly one changed line per edit.

**An event with a clue in both fields must be patched in one map entry**, because the applier
validates the merged object. That is why the nine renames carry their description rewrites with
them rather than splitting across two commits.

## Judgement calls worth keeping

- **Relative durations stay.** _"a 27-year war"_, _"27 years in prison"_, _"800 years of Muslim
  rule"_ — about 86 events. Historical content, not a statement of the answer. The detector
  deliberately does not flag them; don't "fix" them.
- **Slugs keep their years.** `le-mans-disaster-1955` is fine. Slugs are never rendered, curated
  themes pin them, and the collection (`placedEventIds`) is keyed on them.
- **Where text and `year` disagreed, the text lost** — but only after checking. See below.

## The year mismatches: six of seven were fine

Seven descriptions named a year contradicting their own `year` field. The initial call was to
reword all seven on the grounds that `year` feeds the difficulty percentile
(`difficultyScore.ts:102-111`) and perturbing it shifts deterministic daily decks catalogue-wide.
When that constraint was lifted, each was checked against sources — and **six `year` fields were
already right**. In every one the text cited a genuinely different fact:

| card                               | `year`   | what the text's year was                                      |
| ---------------------------------- | -------- | ------------------------------------------------------------- |
| `first-henley-regatta`             | 1839 ✓   | 1851 — Prince Albert's patronage, which made it _Royal_       |
| `nfl-founded-canton-1920`          | 1920 ✓   | 1922 — when APFA was renamed the NFL                          |
| `afl-founded-lamar-hunt-1959`      | 1959 ✓   | 1960 — first season played                                    |
| `rowing-olympic-debut-1900`        | 1900 ✓   | 1896 — the Games where it was cancelled by wind               |
| `gretzky-92-goal-season-1982`      | 1982 ✓   | 1981 — start of the 1981–82 season; record broken 24 Feb 1982 |
| `red-sox-end-86-year-drought-2004` | 2004 ✓   | 1918 — the previous title                                     |
| `butterfly-separate-stroke-1953`   | **1952** | 1952 — and the text was the correct half                      |

FINA split breaststroke in two in **1952**; the 1953 change was a separate rule about breaststroke
pull depth. That card's `year` was wrong and its description was right.

**The lesson is the method, not the count.** A year-vs-text mismatch is not evidence that `year`
is wrong — it is usually evidence that the description wandered onto a neighbouring fact. Check
before editing either.

It also produced a second-order trap: the first rewrite of the butterfly card said _"after the
previous Olympics"_, which is true at 1953 and points at 1948 once the year becomes 1952. **A
description written against a year has to be re-read when that year moves.**

This audit only catches years whose own description contradicts them. A wrong `year` with a
date-free description is invisible to it, and always was.

## Duplicate slugs

`buildEventsByName` (`statsStorage.ts:282-288`) is a last-write-wins `Map`, so a duplicate slug
never errors — it silently makes one of the two events unreachable, and the collection then
renders the _other_ card for it. Two pairs had drifted, and they were different problems:

- **`human-genome-completed`** — the same 2003 event filed twice, with the titles and descriptions
  crossed over ("Sequenced" carried a _mapping_ description, "Mapped" a _sequencing_ one). Merged
  onto the `medicine.json` record; the twin is retired to `deprecated.json` under a distinct slug
  so it cannot re-collide.
- **`first-pharmacopoeia`** — two unrelated events 1,481 years apart. The year-65 Dioscorides card
  became `dioscorides-de-materia-medica`; 1546 Nuremberg kept the original slug, because that is
  where lookups already resolved, so no existing collection changes meaning. This cut against
  `scripts/fetch-wiki-images.js`, which showed the slug was originally minted _for_ the Dioscorides
  card — preserving live behaviour won over provenance.

A third bug fell out of it: both pharmacopoeia cards pointed at the same Cloudinary asset, and it
depicts a Roman herbalist, so the 1546 card was displaying the year-65 card's art. Dropped; it
renders the category-icon fallback (16 other events already do) and **needs art of its own**.

Pinned by `src/utils/eventSlugUniqueness.test.ts`, which covers `deprecated.json` as well as the
manifest.

## Card reports

Read live via `REPORTS_ADMIN_KEY` against `/api/card-reports/list`. Seventeen cards, six already
fixed in `ef4c37a` (#34). Of the rest, three `bad-description` reports were the date-clue bug.
Two needed judgement:

- **`turfan-oasis-city`** (`other`) — _"became a vital Silk Road hub"_ named no datable fact and
  read identically to seven other oasis-hub cards, so year 600 was unplaceable. Now names the
  Gaochang kingdom.
- **`trade-route-risk-reduction`** (`bad-description`) — its description was a restatement of Pax
  Mongolica, which `pax-mongolica-trade` already covers 20 years later, and its title _"Trade
  Route Security Establishes"_ was not a sentence. Retired, as `windmills-grind-grain` was.

The six `wrong-image` reports are **still open** — triage and the reason in
[../card-reports/index.md](../card-reports/index.md). Four are badly wrong (the Inca road card
shows Florence Nightingale; Jackie Robinson shows a cliff honey-hunter), each stored under the
_correct_ `public_id`, so the mis-assignment happened at generation. No Cloudinary credentials in
a sandboxed session, so they cannot be fixed from here.

## Verification that actually proved something

Beyond the suite (500 tests / 39 suites, typecheck, lint, format, build) and
`theme:verify` once a year moved, two checks earned their keep:

- **Both new guards were sabotaged and confirmed to fail.** A test asserting `offenders === []`
  passes just as happily when the detector is broken.
- **The app was driven end-to-end.** Sports-only Custom deck, 23 distinct cards tapped _in hand_:
  no year in any description, no year badge, no date in any title. Two harness traps:
  `button:text-is("Sports")` never matches (the label has whitespace — use an
  `innerText.trim()` comparison inside `page.evaluate`), and because the first attempt guarded
  the click with `if (await b.count())`, all 20 category toggles were **silently skipped** and the
  run reported a clean pass against an unfiltered deck. A filter that no-ops looks exactly like a
  filter that found nothing.

**`npm run find-duplicates` shifts when descriptions change** — it scores same-year plus
similar-description, so deleting _"in 1966"_ from two sibling cards raises their similarity.
Baseline before editing, diff after. Here: exact-name duplicates 2 → 0, same-year/similar-description
steady at 102, and one new fuzzy pair ("Le Mans Disaster" vs "Lake Nyos Disaster", 31 years apart).

## Left open

- Six `wrong-image` reports, blocked on Cloudinary credentials. Two of the four wrong ones already
  have correct prompts in the 654-row un-generated backlog in `all_prompts.csv`; the other two,
  plus the 1546 pharmacopoeia card, need prompts written.
- `butterfly-separate-stroke-1953` keeps a slug naming the wrong year. Never rendered, and renaming
  would drop the card from the collection of anyone who has placed it — but it is a trap for a
  future reader.
- **Nothing runs tests in CI.** `.github/workflows/` holds only `publish-theme.yml` and
  `release.yml`; `.husky/pre-commit` is `npx lint-staged`. Both new guards fire only when a human
  runs `npm test`, which is exactly how the sports batch drifted in the first place.
- A general year-correctness audit of the 374 sports events was not attempted.
