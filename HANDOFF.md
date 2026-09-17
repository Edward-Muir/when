# Handoff — event detail

Branch-scoped scaffolding, not a doc. **Delete this file before the branch ever merges.**

## Where things stand

|            |                                                                   |
| ---------- | ----------------------------------------------------------------- |
| Branch     | `claude/event-detail-phase-3-cont-r2jjui`                         |
| PR         | none, deliberately                                                |
| Production | nothing yet, but nothing blocks it any more — see **Shipping it** |

**All three phases are done. The corpus is complete: 5,460 of 5,460 entries written.**
Phase 1 built the mechanism and the UI. Phase 2 settled the voice
(`docs/event-detail/writing-spec.md`, `.claude/skills/write-event-detail/SKILL.md`, the length
band in `scripts/events/detail-spec.js`) and wrote the first ten entries. Phase 3 wrote the other
5,450, finishing 2026-09-17.

`node scripts/events/detail-report.js` **now exits 0.** It was written to exit non-zero while any
event was unwritten, so that zero is the merge gate opening rather than a progress figure. Every
shard reports ✓, every event carries `has_detail`, and no `placeholder` entry survives anywhere.

**What is left is not writing.** It is the maintainer's decisions: shipping (see **Shipping it**),
and the catalogue errors this work surfaced, listed under **Catalogue errors found while writing**.
Those are player-visible and were deliberately not touched.

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

**All 5,460 events carry real prose, and the placeholder corpus is gone.** Nothing falls back any
more: every card in the catalogue has a written entry, `detail-report.js` exits 0, and no shard
contains the string `PLACEHOLDER`. The fallback path described above still exists and is still the
designed behaviour — it covers a shard that fails to load and any event added to the catalogue
from here on, which will have no prose until someone writes it.
`detail-placeholder.js` can refill placeholders if a future session wants the layout exercised at
scale again, and it preserves written prose; **do not run `--revert`** on a complete corpus, and
see "Shipping it" below.

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
  would not load. A card is never contentless. That is what let the feature ship against a partly
  written corpus, and it is what will absorb any event added to the catalogue after this.
- **Bulk edits go through `scripts/events/detail-apply.js` from a map file, never by editing a
  shard directly.** Sub-agents write `slug -> {paragraphs}` maps into
  `untracked_data/event-detail/`; one deterministic apply pass validates the whole merged map
  before writing anything, and refuses the run on a single bad entry. Agents editing a shared
  600 KB array corrupt it — this repo has already paid for that lesson once.
- **`node scripts/events/detail-report.js` exits non-zero while any placeholder remains.** It is
  deliberately not part of `npm test`, which would otherwise be red for the whole writing phase.
  It now reads 4551/5460.
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

Every shard is complete: `candidates` 53, `clothing` 54, `migration` 54, `communication` 56,
`law` 67, `food` 69, `money` 71, `earth-life` 72, `medicine` 75, `games-sport` 79,
`disasters` 209, `people` 298, `sports` 324, `themes` 353, `infrastructure` 408, `conflict` 555,
`cultural` 625, `diplomatic` 998, `exploration` 1,040. Total 5,460.

`exploration` was the last and much the hardest: 909 of its 1,040 entries were written in the
2026-09-17 session, in eleven batches of roughly 84. It holds the deep-time and
first-appearance material, which is where the error rate is highest and where the traps below
were learned.

## The per-batch toolchain lives in `untracked_data/` and dies with the container

`untracked_data/` is gitignored, so **none of this survives a fresh container and all of it has to
be rebuilt.** It is worth rebuilding: it is about 150 lines total and it is what makes a batch
cheap to gate. Four scripts, all rebuilt from scratch at the start of the 2026-09-17 session:

- **`untracked_data/check-batch.js <unit files>`** — the gate. Reports, separately: parseability,
  multi-line files, worklist coverage, the real `entryProblems()` from `detail-spec.js` run with
  the event record so the restatement check fires, and a length histogram. Checking parseability
  apart from the spec matters because an unparseable file is silently absent from a wildcard merge.
- **`untracked_data/hooks.js <unit files>`** — counts distinct two-word openings. **This is the
  only thing that sees drift the spec cannot**, and it earned its place twice this session.
- **`untracked_data/make-units.js <shard> <first> <count>`** — splits the 40-event worklist chunks
  into units of 14, skipping any slug that already has an `e-<slug>.json`, so re-running after a
  partial wave is safe.
- **`untracked_data/make-prompts.js <shard> <unit files>`** — writes one ~10 KB prompt per unit
  from one shared preamble plus `untracked_data/traps/<shard>.md`. Only the unit filename and the
  trap differ between prompts. Generating them beats writing them by hand: the preamble is where
  the band, the WebFetch method, the file shape and the full ban list live, and it must be
  identical every time.

**The map files must be keyed by slug.** `detail-apply.js` does `Object.entries(parsed)`, so a file
has to be `{"<slug>": {"paragraphs": [...]}}`, not a bare `{"paragraphs": [...]}`. A bare file is
rejected loudly rather than silently, but it wastes a round. Say the shape in the prompt.

## What this session learned, on top of the above

- **An anti-drift instruction can become the drift.** Telling `exploration` writers to hedge
  first-appearance dates as estimates produced 14 entries in 84 opening with "The oldest" or "The
  earliest". No ban fires on that; `hooks.js` is what caught it. The trap now names those two
  openers explicitly and the next wave came back at 46 distinct openings in 46. **Run the hook
  count every batch, and when a trap addresses a topic, expect the topic's stock phrasing to
  become the new monoculture.**
- **A famous quotation will trip a ban.** The legacy-closer ban fired on Johnson's Selma speech
  ("turning point") and the second-person ban on Thunberg's "How dare you", in consecutive waves.
  Both are cases where the banned string is the thing the person actually said. **The fix is
  reported speech, never loosening the ban.**
- **Repairing a style failure finds content errors.** Being forced to re-read the Pulse sentence to
  remove a `stood as` surfaced that it claimed the record stood "for five years" until an attack it
  dated to 2017, sixteen months later. The spec cannot see that; a human reading the sentence can.
- **The aim-at-700 line has to be in the launch, not only the prompt file.** Length drift spiked
  twice, both times to 8 failures in 84 with a median near 710. Both times restating "aim at about
  700, cut anything over 780 before filing it" brought it back to a 630-650 median with nothing
  over the ceiling.
- **The unverified-entry report is the single highest-value line in the prompt.** Three recovery
  passes over only what writers volunteered as unchecked found three real errors that read exactly
  like the checked work around them: a fabricated "including Damascus" among Timur's resettled
  craftsmen, an overstated Silk Road extent, and an invented "doubling" of the 1911 maternity
  benefit. Everything else came back confirmed byte-for-byte, which is what keeps the pass cheap.
  **Brief the recovery agent to change only what a source contradicts**, or it restyles good prose
  and you lose the ability to tell a correction from a rewrite.
- **Rate limits, not the search budget, now size the session.** Six writers died mid-unit on an API
  session limit. 46 of 84 entries survived **because of the per-event write rule**, which has now
  paid for itself twice. Salvaging a partial wave is routine: build a unit file of the slugs that
  do have an `e-<slug>.json`, gate it, apply it, commit it. The unwritten slugs regenerate from
  `--chunks` with no special handling.

## The search budget was the binding constraint, and WebFetch removed it

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

**This is solved. Tell writers to verify with `WebFetch` instead.** Measured over 24 writer
units and 336 entries on the diplomatic shard: **one** WebSearch call total, against the 200
budget, with every entry still checked against a fetched source. Nearly every event in this
catalogue has a guessable Wikipedia article, so a writer told to fetch
`https://en.wikipedia.org/wiki/<Article_Title>` and ask its question in the fetch prompt does not
need search at all. Writers fall back to WebSearch only when an article cannot be guessed or the
fetch comes back truncated; the recovery agent spent its 2 calls exactly that way.

So the budget no longer sizes the session. Plan the session around wall-clock and the account's
rate limit instead, and keep the rest of this section for the failure it describes, which is still
real if a writer is left to use search.

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
- **Ask every writer which entries it could not check, and run a recovery pass over the answer.**
  Three writers on the diplomatic shard volunteered that some entries were written from recall: one
  named eight Roman entries it had not fetched a source for, two named a single recalled detail
  each. A re-check of those thirteen found one real error (euro-introduced claimed vending machines
  were recalibrated overnight; conversion was gradual, roughly two thirds inside the first
  fortnight) and confirmed the other twelve. None of the eight looked any different from checked
  work on the page, which is the whole problem. **Re-check, do not rewrite**: brief the recovery
  agent to change only what the source contradicts, or it will restyle good prose and you lose the
  ability to tell a correction from a rewrite.
- **Paste the complete ban list into the prompt, not a summary of it.** The first wave's prompt
  named the bans it remembered and took 4 failures in 84 on patterns it had not named (`meticulous`
  as puffery, `not only X but Y`). The full list, copied from `detail-spec.js`, is about 2.5 KB and
  it is worth the space.
- **Repair the tail by hand.** Spec failures ran 5-11% per wave and were almost all overruns of a
  few characters. Fixing them directly with a measured count took one pass over ten entries;
  a repair round costs an agent each and the handoff already records that repair agents miscount.
- **Spec collisions to expect** (work around them, do not loosen the ban): `served as` in
  biography, `stood as` for records, **`functioned as`, which fails the same copula pattern**,
  `load-bearing` in architecture, `robust` in _Paranthropus robustus_, `Fosters` for Norman
  Foster's firm, **the second-person ban catching song and film titles that contain the word "you"**
  (When You Wish Upon a Star, Love to Love You Baby, MTV's on-air line), and **the card-art ban
  catching `depicted`** used about a painting rather than about the card, and **a famous
  quotation that contains a banned string**, which happened twice in consecutive waves: the
  legacy-closer ban on Johnson's Selma "turning point" and the second-person ban on Thunberg's
  "How dare you". Put the quotation into reported speech.
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

**Added by the diplomatic and exploration shards (2026-09-17).** All player-visible, all left
alone. The clearest wrong facts first:

- `female-ruler-sargon` names the woman who ruled Kish "Enmersi" in both `friendly_name` and
  `description`. No source supports that name; the figure matching every other detail (innkeeper,
  third dynasty of Kish, hundred-year reign) is **Kubaba**.
- `boni-kingdom` is named "Boni Kingdom Southern Philippines". Boni, or Po-ni, is what Chinese
  sources called a state in **Borneo**; the name redirects to the history of Brunei.
- `cyrillic-alphabet-created` credits Cyril and Methodius at 863. They devised **Glagolitic**;
  Cyrillic was built afterwards by their students at Preslav.
- `pottery-invented` says the earliest ceramics were Japanese. **Xianren Cave in China** is several
  thousand years older.
- `soga-kingdom` has Busoga kingdoms emerging around 1400; the record has no centralised Busoga
  kingdom before a British-installed Kyabazinga in **1906**.
- `xicalanco-trade-port` is dated 1000 and its description has the port linking Maya and **Aztec**
  networks. The Aztec Empire dates from 1428.
- `school-lunch-program` credits Sweden with pioneering school lunches in 1894. The record has
  means-tested meals into the 1930s, national subsidies from 1946, a universal entitlement in 1973.
- `swahili-mombasa-rise` **and** `mombasa-coastal-power` both have Mombasa "rivaling Kilwa"; it was
  part of the Kilwa Sultanate until 1513. Two cards, same wrong relationship.
- `zhouyuan-sogdian-outpost` could not be supported at all. Zhouyuan is a Western Zhou Bronze Age
  site, not a Tang-era Sogdian one. Probably the `gold-rush-currency-clipper` class.
- `srivijaya-decline` has Majapahit and Malacca succeeding directly; the Melayu kingdom at Jambi
  came between. `lunda-expansion-network` names copper, salt and slaves where the record documents
  tribute and an arms trade. `dahomey-rise-power` credits "Agaja's predecessors" at 1718, inside
  Agaja's own reign from 1708. `aksumite-decline` gives Islamic expansion as the cause where the
  record has several pressures, some predating Islam.

**Duplicate cards**, same event twice or more: `medici-banking` / `medici-banking-innovations`;
`tokugawa-sakoku-isolation` / `sakoku-edicts-isolation`; `lunda-expansion-network` /
`lunda-empire-formation`; `oyo-empire-expansion` / `yoruba-oyo-confederation`; and three Buganda
cards (`buganda-kingdom`, `buganda-kabaka-succession`, `buganda-kabaka-system`).

**A recurring shape rather than individual errors:** roughly forty cards carry a round year that
sits outside the window its own evidence supports — Mayapan 1220 against a 1007 founding, Benin
1300 against c. 1180, Mapungubwe 1075 against a 1220-1300 floruit, Maori land use 1200 against
settlement dated 1250-1350, Luba 1500 against expansion documented 1700-1860, bow-and-arrow -10000
against evidence near 80,000 years ago, and so on. Writers handled these correctly by describing
the thing without pinning the year. They are listed individually in the commit messages from
2026-09-17. None were changed, and most are judgement calls rather than plain errors.

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

## Shipping it

**Nothing blocks a release any more, and the placeholder problem is gone.** Every one of the
5,460 events carries real prose and a `has_detail` flag; no `placeholder` entry and no
`PLACEHOLDER` string survives in any shard. `detail-placeholder.js --revert` is not needed and
must not be run: there is nothing left to revert, and running it now would only risk the real
prose.

That removes the live decision this section used to describe. The earlier plan was to revert the
lorem so a partly written corpus could ship, accepting that most cards would show no prose. That
trade-off no longer exists, because there is no partly written corpus. Every placed card has two
paragraphs behind it.

So the remaining questions are ordinary release questions, not feature ones:

- `detail-report.js` exits 0, which was the stated merge gate, so the branch is no longer held
  open by the corpus.
- The shards add roughly 4 MB across 19 files, fetched lazily per shard rather than up front, so
  no card waits on prose it does not need. See **Don't break these** before touching the fetch.
- `HANDOFF.md` is branch-scoped scaffolding and should be deleted before the branch merges. Its
  one piece of content worth keeping elsewhere is the catalogue-error list, which is a real
  backlog for the maintainer rather than notes about this work.

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

5,460 events, **5,460 written, none to go**. Full suite is **759 tests across 64 suites**, green
throughout this session; the corpus additions moved no test.

Corpus numbers worth not re-deriving (catalogue size, gzip ratios, shard sizes, where Phase 3
should start) are in the session notes, not here.

## What the final session added to the lessons above

Eleven batches of 84 finished `exploration`. Five things are worth carrying to any future
large-batch writing job in this repo, and the first is the most useful.

**The length problem was arithmetic, not discipline.** Writers cannot count and do not know it.
Audited across two batches, every one of 28 self-reported character estimates was LOW, by 47 to
134 characters, median about 68, which is ten to thirteen per cent. That is exactly why telling
writers to aim at 700 produced a median near 780 and why restating the band more forcefully kept
failing. Two fixes worked:

- **Ask for a per-entry count in the report.** The numbers are unreliable, but having to state one
  pulls the median down. The evidence is accidental and clean: two units killed by a rate limit
  before they reached their report came back at median 787 with an entry at 900, while units that
  had to report landed near 700.
- **Then aim below the target to absorb the bias.** Told to aim at 620, the last batch landed at
  median 621 with two entries over 780, against 772 and 34 two batches earlier. One writer did
  better still by hand-counting a single draft (401 characters) and calibrating the rest against
  it. Measure one, scale the others.

Never treat an estimate as a gate. `check-batch.js` on every entry, every batch.

**Recovery yield tracks the kind of claim, not whether the entry was fetched.** The 16% figure
above is not a constant. Measured this session over entries writers admitted writing from recall:

| Material                                      | Errors found |
| --------------------------------------------- | ------------ |
| Diffuse ancient technology origins            | ~4 in 6      |
| Deep-time palaeontology and period boundaries | 4 in 10      |
| Canonical, dated history of science           | 1 in 11      |

One writer's geology recall matched every fetched date, GSSP location and discoverer name. Spend
recovery on contested, diffuse or nationally loaded claims; a well-documented dated European event
usually survives. This is the single best lever on cost.

**An invented hedge is as much a fabrication as an invented fact.** Told to avoid false single
origins, one entry wrote that the horizontal water wheel's origin was "genuinely unsettled, with
early examples claimed for Roman Anatolia, Norse Scandinavia and Sasanian Iran". No source frames
those three as rivals; the dispute was manufactured to dodge an attribution the sources do make
(M.J.T. Lewis, Greek Byzantium, third century BC). Report a dispute the literature has, naming who
holds which position. Where something genuinely is one person's or one place's work, say so.

**Two more silent-corruption modes, both caught only by parseability.** A raw newline was already
known. An **unescaped double quote** does the same thing: a write killed mid-file left `"mule
shoes"` unescaped and the JSON was invalid from that character on, with the prose otherwise
complete. Tell writers to avoid quotation marks entirely and use reported speech. `check-batch.js`
tests parseability separately from the spec for exactly this reason, and it is the only thing
standing between a truncated write and an entry that vanishes from the merge without a word.

**Spec collisions found on top of the list above**, all fixed in the prose, never by loosening a
ban: `/PLACEHOLDER/i` fires on the ordinary English word and caught seven entries across three
batches, almost all about zero as a position marker, so **the word "placeholder" is unusable**;
the card-art ban catches `pictured` used about a mental image or an old reconstruction, which
happened five times; the question-mark ban catches a puzzle posed as a question; and hedging an
overstatement into "often cited as" trips the vague-attribution ban, so fixing one failure can
create another.

## What is left, and it is not writing

1. **Ship it, or decide not to.** See **Shipping it** above. The corpus no longer holds the branch
   open.
2. **The catalogue errors.** Everything under **Catalogue errors found while writing** is
   player-visible and was deliberately left alone: wrong years, wrong names, descriptions that
   contradict their own cards, duplicate cards, and one card naming a ruler who never existed
   (`mali-maritime-expansion` credits "Abu Bakr II", a nineteenth-century mistranslation of Ibn
   Khaldun). That list is the real backlog and is worth moving somewhere permanent before this
   file is deleted.
3. **Delete this file** when the branch merges, per the note at the top.
