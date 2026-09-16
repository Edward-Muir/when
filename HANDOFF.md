# Handoff — event detail

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                      |
| ---------- | -------------------------------------------------------------------- |
| Branch     | `claude/event-detail-phase-3-l2wq2w`                                 |
| PR         | none, deliberately                                                   |
| Production | nothing — see **The release option** below, which is a live decision |

**Phases 1 and 2 are done.** Phase 1 built the mechanism and the UI. Phase 2 settled the voice:
`docs/event-detail/writing-spec.md`, `.claude/skills/write-event-detail/SKILL.md`, a real length
band enforced in `scripts/events/detail-spec.js`, and the corpus's **first ten written entries**.

**Phase 3 is under way: 3,423 of 5,460 are written**, 63% of the corpus. See
[Where Phase 3 got to](#where-phase-3-got-to) before picking it up — the operational lessons there
are worth more than the plan they replaced.

**Branch off _this_ branch, never off main** — the feature does not exist on main.

## What exists

A placed card's detail popup shows two paragraphs about the event in place of its short
description — no control, no toggle. Everything between the title and the "Report an issue" row is
one scroll region, image included, at a constant height, so every detail card is the same size.
A ✕ in the header closes it. The description is what shows wherever the prose is unavailable: a
card still in hand (the spoiler gate), an event with no prose written, a shard that would not load,
and the correct/wrong reveals. The Daily hero carries a watermarked (i) on its image that opens the
same popup; its event is the deck's starting card, placed face-up with its year on turn 1, so the
read gives nothing away. The prose is a lazily-fetched sidecar under `public/events/detail/`,
sharded to mirror the 19 manifest files; it is never inlined into the event JSON.

**3,423 of 5,460 events carry real prose, and the placeholder corpus is gone.** The rest fall back
to their short description, which is the designed behaviour and not a bug. The branch's preview
therefore shows no lorem to anyone.
`detail-placeholder.js` can refill it if a future session wants the layout exercised at scale
again; both it and `--revert` preserve written prose.

The design decisions are in **[docs/event-detail/index.md](docs/event-detail/index.md)**. The voice
rules are in **[docs/event-detail/writing-spec.md](docs/event-detail/writing-spec.md)** and, in
working form for someone about to write a batch,
**[.claude/skills/write-event-detail/SKILL.md](.claude/skills/write-event-detail/SKILL.md)**.

## Seeing it in 60 seconds

```bash
npm ci                 # deps are not pre-populated; without this `npm run typecheck`
                       # silently resolves a global tsc and looks like it passed
BROWSER=none npm start
```

Fastest: tap the **(i)** watermarked into the Daily hero image on `/`. Otherwise open `/timeline`
and tap a placed card, or play a game from the Custom tab and tap a card once it is on the
timeline — the prose is what the card opens on.

To see _written_ prose rather than placeholder, the ten calibration slugs are listed at the end of
the writing spec; `battle-megiddo`, `boston-massacre` and `krakatoa-eruption` are the easiest to
reach from a Custom game.

Driving it with Playwright: [docs/driving-the-app-with-playwright.md](docs/driving-the-app-with-playwright.md).
Three things worth knowing here:

- Reach a timeline card by its **title** (`getByRole('button', { name: /<friendly_name>/i })`).
  `[data-timeline-year]` is the year label _beside_ the card; clicking it opens nothing, which
  reads as a broken feature rather than a bad selector.
- The scroll region is `[data-testid="detail-scroll"]`, and the card is `[data-testid="modal-card"]`.
- `executablePath: '/opt/pw-browsers/chromium'` is the whole path — it is a symlink to the binary
  itself, not a browsers directory, so do not append `chrome-linux/chrome` to it. The Playwright
  doc says so; this is a note for whoever skims it. **WebKit can be installed** in a fresh
  container, which that doc does not mention: `PLAYWRIGHT_BROWSERS_PATH=<dir> npx playwright install webkit`,
  then `npx playwright install-deps webkit` (needs root, takes a few minutes). Useful for engine
  differences in general — and useless for the one below: Linux WebKit renders both the broken and
  the fixed version of the scroll region correctly.

## Don't break these

- **The prose must stay unreachable before a card is placed.** The gate is `showsProseFor`:
  `type === 'description' && showYear && has_detail`. `showYear` is already false exactly when the
  card is still in hand, and this is the reason the prose may state years freely where
  `description` may not. Pinned by `src/components/GamePopup.test.tsx`. This is the one that
  actually matters.
- **Wherever the prose is unavailable, the description shows** — no prose written, or a shard that
  would not load. A card is never contentless, and that is what lets this ship against a partly
  written corpus.
- **Bulk edits go through `scripts/events/detail-apply.js` from a map file, never by editing a
  shard directly.** Sub-agents write `slug -> {paragraphs}` maps into
  `untracked_data/event-detail/`; one deterministic apply pass validates the whole merged map
  before writing anything, and refuses the run on a single bad entry. Agents editing a shared
  600 KB array corrupt it — this repo has already paid for that lesson once.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** It is
  deliberately not part of `npm test`, which would otherwise be red for the whole writing phase.
  It now reads 3423/5460.
- **The prose is researched, not recalled.** Draft, then check with one or two searches, then cut
  what the results do not support. This replaced a rule that said "write only what you would stake
  without a link", which produced a factual error in one of the first ten entries and untraceable
  claims in most. Nothing is stored: no sources, no citations, no enforcement. It is a check, not a
  bibliography.
- **Never pass `wikipedia_url` to a writer, and do not add it to the worklist chunk.** It is a
  byproduct of the difficulty pageview scripts and it is unreliable: `battle-megiddo` is the 1457
  BCE battle and links the 1918 one.
- **The length band is settled and enforced**: exactly 2 paragraphs, 220-450 chars each, 480-830
  total.
  `detail-spec.js` also enforces voice now — no em dashes, no second person, no question marks, no
  puffery lexicon, and no 7-word run shared with the event's own `description`. Do not loosen a ban
  to get a batch through; fix the prose. Each pattern carries its measured precedent count in a
  comment.
- **Do not add the detail text to `CLUE_FIELDS`** in `scripts/events/date-clues.js`. That rule
  guards text shown _before_ placement; this text is not.
- **`detail-placeholder.js` preserves written prose in both directions** — a plain run and
  `--revert` both leave anything not flagged `placeholder: true` alone. That is new in Phase 2 and
  it matters now that real entries exist: before, `--revert` (which the docs recommend before
  syncing with main) would have deleted them.
- **The detail scroll region carries `overflow` and nothing else.** No mask, no filter, no
  `backdrop-*`, no `transform` — anything that promotes it to its own compositing layer has already
  broken it on iOS while looking perfect on every browser available here. Decoration goes on a
  sibling drawn over it. **Scroll it on a device before believing it.**
- **No `bg-*/NN` opacity modifiers on the CSS-variable colour tokens** — Tailwind drops the whole
  rule and the element gets no colour at all. Use `opacity-60`. (`CLAUDE.md` → Styling.)
- **`CI=true npm run build`**, not a plain build, and run tests through `npm` only (the `TZ` pin).

## Where Phase 3 got to

Complete shards: `people` 298, `candidates` 53, `clothing` 54, `migration` 54, `communication` 56,
`law` 67, `food` 69, `money` 71, `earth-life` 72, `medicine` 75, `games-sport` 79, `disasters` 209,
`sports` 324, `themes` 353, **`infrastructure` 408, `conflict` 555, `cultural` 625**.
Untouched: **`diplomatic` 998, `exploration` 1,040** — 2,037 to go.

A partial shard is fine. `--chunks` regenerates worklists containing only unwritten events, so
resuming needs no special handling.

## The search budget is the binding constraint — read this first

`WebSearch` is capped per session at 200 calls
(`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`). It is **not** a rolling window: a new session
starts fresh at 200. A 20-event unit costs 20 to 40 searches, so **one session runs about six to
eight units before every writer silently loses its ability to check anything.**

This is the highest-stakes operational fact on the branch, because the failure is invisible from
the output. Writers that cannot search keep producing confident, well-formed, spec-passing prose.
Measured this session:

| Entries | Checked as written | Error rate found on re-check |
| ------- | ------------------ | ---------------------------- |
| ~540    | yes                | near zero                    |
| ~82     | no                 | **16%**                      |

The 82 unchecked entries produced 13 corrections, including two clean fabrications (Ulugh Beg
teaching classes at the Registan madrasa; elephants hauling stone for Bibi Khanym, attributed to
Clavijo, whose account describes no such thing), one inverted causal claim (Gondar's architecture
credited to Jesuit influence, when Fasilides expelled the Jesuits and burned their books), and
opening words asserted for MTV that it never broadcast.

**What to do about it:**

- **Budget the session.** At 20 events per unit, plan for roughly 120 to 160 events of
  search-checked writing per session, then stop. Or split units smaller (14 or so) and get more
  units from the same budget.
- **Make writers report it.** Every prompt should ask which entries they could not check. The good
  ones volunteer this; that report is what makes recovery possible.
- **`WebFetch` is not capped** and is the fallback. Writers can verify by fetching
  `https://en.wikipedia.org/wiki/<Article_Title>` directly and asking a specific question in the
  prompt. It is slower and needs the article title guessed, but it works, and all four recovery
  passes this session ran on it after the search budget was gone.
- **Re-check, do not rewrite.** A verification pass over unchecked entries is much cheaper than
  writing them again, and it is what found all 13 errors.

**What actually drives quality, measured across fourteen shards:**

- **State the length band in the batch prompt, every time.** Not in the agent definition, which
  does not reach the writers: 21% failures with no instruction, 54% with it only in the definition,
  0-9% with it in the prompt. This is the single highest-leverage line.
- **Say that the two length bounds interact, and give a target well under the ceiling.** "Each
  paragraph 220-450, total 480-830" reads to a writer as two independent rules, and 450 plus 450 is 900. One `conflict` writer produced 26 failures in a single 120-entry round on exactly that
  reading, having judged "roughly 350 to 450 each" to be safe. Telling writers to **aim at about
  700 total, roughly 350 a paragraph** rather than at the ceiling dropped the rate back to 5-8%,
  because an entry at 700 survives a miscount and one at 820 does not.
- **Warn that a raw newline makes the file silently absent from the merge**, not rejected. Writers
  told this catch their own; `cultural` had four self-caught newlines and one that reached the
  verify step.
- **Name the shard's own trap in the prompt.** One line, and it works. Telling `sports` writers not
  to open every entry with "X won Y in YEAR" took the hook monoculture from 80% on `people` to 3%.
  Traps found so far: myth-prone origin stories (`sports`, `games-sport`), the register carve-out
  for mass casualties (`disasters`), thin-record events where a plausible mechanism is pure
  invention (`themes`), superlatives that need an end date and a successor (`infrastructure`),
  contested deep-time dates (`earth-life`), priority disputes (`medicine`), the atrocity carve-out
  plus attributed casualty figures (`conflict`), appraising the work instead of reporting it
  (`cultural`).
- **Name the trap without inviting prose about the data.** Telling `infrastructure` writers to treat
  a round year as approximate produced an entry explaining that "the catalogue's year is better read
  as a placeholder" — true, and a fourth-wall break at a reader who only ever sees a card. Every
  prompt since carries: never refer to the game, the card, the catalogue, the data or the year field.
- **Repair agents have no shell and count characters by hand, badly.** One returned 833 as though it
  were inside 830; another replaced a restatement with a 936-character entry. Give them a target of
  ~750 rather than "under 830" so a miscount still lands inside, and state the exact overage per
  entry. For a handful of small trims it is faster and more reliable to do them directly with an
  exact count than to spend a whole round.
- **Hedging costs characters.** When a shard needs it, say "keep the hedge and cut a fact to pay
  for it", or the band pushes the hedge out. `earth-life` cost a repair round learning this.
- **Write one file per event**, `e-<slug>.json`, and demand single-line JSON. A worker restart
  destroyed six agents' unwritten work early on; per-event writes cap the loss at one entry. Raw
  newlines inside paragraph strings recur in most shards and make files silently absent from the
  merge rather than rejected, so check parseability separately from the spec.
- **Verify against the worklist, not the agent's report.** Self-reported counts have been wrong in
  both directions.
- **Spec collisions to expect** (work around them, do not loosen the ban): `served as` in
  biography, `stood as` for records, **`functioned as`, which fails the same copula pattern**,
  `load-bearing` in architecture, `robust` in _Paranthropus robustus_, `Fosters` for Norman
  Foster's firm, **the second-person ban catching song and film titles that contain the word "you"**
  (When You Wish Upon a Star, Love to Love You Baby, MTV's on-air line), and **the card-art ban
  catching `depicted`** used about a painting rather than about the card.
- **A work whose full title sits in the event's own `description` will trip the restatement check
  if the prose names it verbatim.** Shorten or rephrase the title (`al-jazari-mechanical-art`,
  `lucan-pharsalia`, `rio-earth-summit` all failed this way, and the run is often not in the
  opening sentence, so read the whole paragraph against the description).

**Catalogue errors found while writing, none fixed except the first three.** `year` was corrected
for `crispr-human-therapy` (2020 to 2019), `chickens-domesticated` (-6000 to -1500, the 2022 PNAS
re-dating) and `battle-of-mu-ta` (628 to 629; the battle is 1 Jumada al-Awwal 8 AH, September 629,
and 628 has no support). Note that changing one year re-scores its neighbours through
`difficultyScore` and moved a `deckBuilder` test bound on the first two; that test documents its own
re-baselining convention. The Mu'ta change moved nothing — the full suite stayed at 759 passing.

Writers flagged roughly three false positives per real error, so **verify every flag before
touching a year**. Left for the maintainer, all player-visible: eight `medicine` descriptions
(Behring credited alone for work with Kitasato, Simpson for chloroform John Snow gave, Landsteiner
dated 1907 not 1901, liver and lung transplants framed as successes when both patients died within
weeks), `first-thomas-cup-1949` says Malaysia when Malaysia did not exist until 1963,
`owens-six-records-ann-arbor-1935` says five records where the record supports four,
`lahaina-fire` says 97 dead against the DNA-corrected 102, `australia-bushfires` says one billion
animals against a later estimate near three billion, `code-of-lipit-ishtar` calls a Sumerian code
Akkadian, and `gold-rush-currency-clipper` is a slug that has nothing to do with its own content.

**Added by the infrastructure, conflict and cultural shards**, all player-visible and all left
alone:

- `ottoman-siege-galata` contradicts itself on one card: `friendly_name` reads "Ottoman Siege of
  Galata" while its own `description` correctly describes Murad II besieging **Constantinople** in 1422. The description is right; the name is wrong.
- `battle-of-wei-qiao` names and describes as a battle what the record has as the **Mayi ambush** of
  133 BCE, a deception called off before any fighting.
- `university-paris-founding` says the university "received formal papal recognition" in 1200. The
  1200 event was **Philip II Augustus's royal charter**; papal recognition came in 1215 with Robert
  de Courcon's statutes.
- `songhai-scholars` (dated 1510) names **Ahmad Baba**, who lived 1556 to 1627.

Slug-only mislabels, not player-visible, the `gold-rush-currency-clipper` class:
`tuvalu-mausoleum-built` is the Gur-e-Amir in Samarkand; `songhai-djinguereber-mosque` is a
Mali-empire event under Mansa Musa; `siege-of-damascus-636` is correctly stored at 634;
`wang-xifeng-calligraphy` is Wang Xizhi. All four have correct `friendly_name` and `description`.

**`god-emperor-golden-throne` is Warhammer 40,000 lore dated to year 30000**, `very-hard`, sitting
in an otherwise historical catalogue. Almost certainly a deliberate easter egg, so the record was
left alone; its prose reports the fiction plainly rather than carrying a disclaimer about the data.

Category oddities noticed and not re-tagged, since the taxonomy came out of the June 2026
re-clustering: `gunpowder-europe` in `agriculture`; `dresden-bombing` and `east-german-uprising` in
`revolution`; `zoroaster-teaches`, `buddha-enlightenment` and `black-lives-matter-founded` in
`commerce`.

## Phase 3 — the original plan

Write the other 5,450, per the plan in
[docs/event-detail/index.md](docs/event-detail/index.md#phase-3--writing-5460-entries). In short:

1. **Read `writing-spec.md` and the ten calibration entries first.** The gold set transmits tone
   better than the rules do; the rules are what catch it when it slips.
2. `node scripts/events/detail-report.js --chunks` for the worklist, smallest shard first
   (`candidates` 53 → `migration` 54 → … → `exploration` 1,040).
3. Use the **`event-detail-writer`** sub-agent (`.claude/agents/event-detail-writer.md`):
   `model: sonnet`, `effort: low`, with the `write-event-detail` skill preloaded so the batch
   prompt does not restate the spec. It writes map files into `untracked_data/event-detail/`; one
   `detail-apply.js` pass writes the catalogue.
4. Per-batch gate: `npm run typecheck`, `CI=true npm test -- --watchAll=false`,
   `CI=true npm run build`.
5. **Read a random 5 per batch cold.** Drift is the failure mode, not corruption. Sample
   specifically for the two things calibration showed converge: every entry landing at three
   paragraphs, and every hook being the same kind.

Two findings from Phase 2's calibration worth carrying in:

- **A three-paragraph allowance produces three-paragraph entries.** The band was first set at 2-3
  paragraphs and 1,250 characters; all ten calibration entries and all four sub-agent entries came
  back at three, near the top. It is now exactly two at roughly two thirds the length. Expect to
  draft three and cut one, and expect that cut to improve the entry.
- **Attribution beats the band.** Hedging a contested figure costs characters a bare number does
  not. When they collide, a paragraph goes and the attribution stays.

## The release option

The description fallback changed what is possible here, and this is the only place it is written
down. **A partly written corpus is now safe to ship**: events with prose show it, events without
read exactly as they did before this feature existed. The "hold everything until all 5,460 are
written" decision from 2026-09-12 is therefore a choice now, not a constraint.

What blocks doing it today is the committed placeholder — 5,450 events still carry `PLACEHOLDER: `
text, so shipping as-is puts lorem in front of most players. Releasing early means first running
`node scripts/events/detail-placeholder.js --revert`, after which only the ten written events carry
`has_detail` and `detail-report.js` stops being a merge gate and becomes a progress meter. Since
Phase 2 that revert is safe for written prose: it drops placeholder entries and their flags only.

The cost, and the reason this is the maintainer's call rather than a step in a plan: reverting the
placeholder makes the branch's preview deploy show prose on ten cards and nothing on the rest,
which is close to the state that made a previous session commit the placeholder in the first place.

## Numbers to check against

Measured in Chromium on this branch, with the detail popup open on the Daily hero:

| Width  | Card    | Scroll region | A 579-char entry renders | Region scrollHeight |
| ------ | ------- | ------------- | ------------------------ | ------------------- |
| 320px  | 272x606 | 476px         | 455px of prose           | 875px               |
| 402px  | 340x606 | 476px         | 341px of prose           | 761px               |
| 1440px | 400x606 | 476px         | 296px of prose           | 716px               |

The card is **identical before and after the shard loads and after scrolling to the end** — all
three widths re-measured at the same box after scrolling the region to its bottom. (A card whose
title wraps to two lines is 628 rather than 606 at 320px; that is the title, not the prose.)

Scaling those: the 480-830 character band is roughly 283-489px of prose at 402px wide and 377-652px
at 320px. The image is _inside_ the scroll region, so even a 480-character entry at 1440px still
comes to about 665px against a 476px region — it always overflows, which is what lets the region be
a constant height without leaving dead space.

5,460 events, 3,423 written, 2,037 to go. Full suite is **759 tests across 64 suites**.

Corpus numbers worth not re-deriving (catalogue size, gzip ratios, shard sizes, where Phase 3
should start) are in the session notes, not here.

## Kick-off prompt for the next session

> Continue **Phase 3** of the event-detail work on the `when` repo. 3,423 of 5,460 entries are
> written; carry on through the remaining 2,037.
>
> You are on `claude/event-detail-phase-3-l2wq2w` — **not** main, the feature only exists on this
> branch line. Commit and push each shard as it completes. Do not open a PR.
>
> Run `npm ci` first: without it `npm run typecheck` resolves a global `tsc` and prints something
> that looks exactly like a pass. Then read `HANDOFF.md`, especially **The search budget is the
> binding constraint** and **Where Phase 3 got to**, which carry the operational lessons from
> seventeen shards and are worth more than any plan.
>
> **The spec and the UI are done and out of scope.** Never loosen a ban in
> `scripts/events/detail-spec.js` to get an entry through; fix the prose. Known collisions to work
> around rather than relax: `served as`, `stood as` and `functioned as` in biography and
> institution writing, `load-bearing` in architecture, `robust` in _Paranthropus robustus_,
> `Fosters` for Norman Foster's firm, the second-person ban catching song and film titles that
> contain "you", and the card-art ban catching `depicted` used about a painting.
>
> Resume with `node scripts/events/detail-report.js --chunks` (delete the worklist directory first,
> it does not clear itself). `infrastructure`, `conflict` and `cultural` are complete. What is left
> is **`diplomatic` 998** and **`exploration` 1,040**. Split each shard into units of ~20 and run 5
> or 6 `event-detail-writer` sub-agents at a time.
>
> **Budget the session around the search cap.** `WebSearch` is capped at 200 calls per session
> (`CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`), not a rolling window, and a 20-event unit costs 20
> to 40. That is roughly six to eight units before every writer silently loses the ability to check
> anything and starts producing confident, spec-passing, unverified prose. Measured last session:
> entries checked as written came back near-zero on re-check; the ~82 written after the budget ran
> out came back at **16%**, including two clean fabrications and one inverted causal claim. So:
> plan for about 120 to 160 search-checked entries per session and stop, or use smaller units;
> require every writer to report which entries it could not check; and recover with a verification
> pass over those entries using **`WebFetch`, which is not capped** (fetch
> `https://en.wikipedia.org/wiki/<Article_Title>` and ask a specific question). Re-checking is much
> cheaper than rewriting.
>
> The batch prompt is what determines quality. Every prompt must carry:
>
> 1. **The length band, and that its two bounds interact**: exactly 2 paragraphs, 220-450 chars
>    each, 480-830 total — and say explicitly that 450 plus 450 is 900, so two legal paragraphs can
>    still break the total. **Tell writers to aim at ~700, not the ceiling.** One writer produced 26
>    failures in a single 120-entry round by reading "roughly 350-450 each" as safe. The agent
>    definition does not reach the writers.
> 2. **One file per event** at `/home/user/when/untracked_data/event-detail/e-<slug>.json`, written
>    the moment each entry is finished, as a **single line** of JSON with no line breaks and no
>    internal double quotes. Say that a raw newline makes the file **silently absent from the merge
>    rather than rejected**, so they should check what they wrote — writers told this catch their own.
> 3. **That research is not optional**, with the precedent: a writer that skipped it asserted
>    opening words for MTV that it never broadcast. Draft, then check, then cut what the results do
>    not support.
> 4. **That shard's own trap**, in one line, plus a bar on referring to the game, the card, the
>    catalogue or the year field. Read a few slugs first and name the trap yourself. For
>    `diplomatic`, expect treaty entries collapsing into "signed at X, did Y" and round-year dynasty
>    and reign cards that invite an invented founding moment; for `exploration`, expect contested
>    priority and inventor claims ("the first to…"), which is the shard's defining risk.
>
> Per shard: verify every worklist slug landed (agent self-reported counts have been wrong in both
> directions), check parseability separately from the spec (an unparseable file is silently absent
> from the merge, not rejected), repair failures with sub-agents in one round — giving them the
> exact overage per entry and a target of ~750 rather than "under 830", because they count by hand
> and have got it wrong in both directions — then `detail-apply.js`, `npm run typecheck`,
> `CI=true npm test -- --watchAll=false`, `CI=true npm run build`, commit, push.
>
> Writers will flag `year` and `description` errors in the catalogue. **Check every flag before
> acting on it** — roughly three in four do not survive verification. Changing a `year` re-scores
> its neighbours through `difficultyScore` and can move a `deckBuilder` test bound. Leave
> `description` errors alone and record them in the commit; they are player-visible and the
> maintainer's call.
