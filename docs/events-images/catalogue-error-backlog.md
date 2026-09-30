# Catalogue error backlog

Event records whose own `year`, `friendly_name` or `description` the sources do not support,
found while writing the long-form detail prose for all 5,460 events (Phase 3, 2026-09).

**Why this file exists.** The writers read a source for every entry, so they read 5,460 event
records against the record more closely than anything else ever has. What they found was reported
in ~35 commit messages and in a branch-scoped `HANDOFF.md` that was deleted when the event-detail
branch merged. This file is where that survives. It is a backlog, not a change log: almost nothing
here had been acted on until the 2026-09-18 evidence-window pass, which cleared the whole
"Wrong year" section and most of "Imprecise year" and added a section of its own.

**The `commit` citations below** point at the unsquashed history on
`claude/event-detail-phase-3-cont-r2jjui`, which is kept for exactly that reason — this work was
squash-merged, so those short shas are not reachable from `main`.

**Read this before acting on any row.** Three things, in order of how much time they save:

1. **`description` and `friendly_name` are shown _before_ a card is placed.** They may not state a
   date, and `src/utils/eventDateClues.test.ts` enforces that. `friendly_name` is capped at 35
   chars (`src/utils/eventNameLength.test.ts`). Any edit here is player-visible and has to clear
   both. See [index.md](index.md) before bulk-editing event text.
2. **Changing a `year` re-scores its neighbours** through `src/utils/difficultyScore.ts`, which
   feeds `src/utils/deckBuilder.ts`. That has moved a bound in `src/utils/deckBuilder.test.ts`
   before. The bounds there are headroom over a measured number, not quality cliffs, so a bound may
   be re-baselined — but re-measure, do not just widen.
3. **A round year for a diffuse process is not an error.** The puzzle needs one placeable year and
   a process spread over millennia has no single right one. Those rows are collected separately
   below and are judgement calls, not fixes.

The prose itself never depends on any of this: writers were told to describe the thing without
pinning a year they could not support, so the entries read correctly against the record even where
the card does not.

## Already applied

**143 years have now been corrected.** Three during Phase 3 as the prose was written; eight in the
2026-09-17 verification pass; two when date ranges were first added; and **130 in the 2026-09-18
evidence-window pass**, when the rule changed from "extend a range forward from the stored year"
to "the stored year _is_ the window's start, so move it". Each was checked against a source.

The 130 are not listed individually — see the commit `fix(events): move 130 years to the start of
their evidence window` and the `reason` on each entry. 108 moved earlier and 22 later, which is
the expected shape: a round number usually understates the earliest evidence.

**Deck impact, measured rather than assumed both times.** Cross-boundary daily repeats read **7**
after the first two corrections and **6** after the 130, against the bound of 12 in
`deckBuilder.test.ts` — down from the 11 that bound was set for. It went _down_ both times, which
is worth knowing because the intuition runs the other way: correcting round-number guesses
slightly de-clusters the catalogue and the ramp's spacing kernel works better on it.

| Slug                                  | Change                              | Evidence                                                                                                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `crispr-human-therapy`                | 2020 → **2019**                     | Victoria Gray's exa-cel infusion, 2 July 2019 (`746fb01`)                                                                                                                                                                                                                      |
| `chickens-domesticated`               | -6000 → **-1500**                   | Peters et al. 2022 (PNAS) re-dated the proposed earliest finds; earliest unambiguous domestic remains at Ban Non Wat, c. 1650-1250 BCE (`a7d4628`)                                                                                                                             |
| `battle-of-mu-ta`                     | 628 → **629**                       | 1 Jumada al-Awwal 8 AH = September 629; 628 has no support (`e092492`)                                                                                                                                                                                                         |
| `blueprint`                           | 1840 → **1842**                     | The card names Herschel's cyanotype process; Herschel announced it in 1842. (Commercial use for technical drawings is 1872, but the card describes the process, not its adoption)                                                                                              |
| `ramjet-engine`                       | 1907 → **1913**                     | The card names René Lorin proposing the design. Lorin designed it in 1913 and was granted FR290356 the same year; 1907 has no support                                                                                                                                          |
| `social-media`                        | 1996 → **1997**                     | The card says SixDegrees.com _launched_. The site started in 1997; May 1996 is the founding of MacroView, the company that built it                                                                                                                                            |
| `double-entry-bookkeeping`            | 1200 → **1300**                     | The earliest extant full double-entry records are Amatino Manucci's Farolfi ledger of 1299-1300. 1200 predates any evidence by a century                                                                                                                                       |
| `clausius-entropy`                    | 1850 → **1865**                     | The `friendly_name` is "Clausius Defines Entropy". Clausius named and gave the first mathematical form of entropy in 1865; 1850 is his first second-law paper, which is the other half of the description                                                                      |
| `university-paris-founding`           | 1200 → **1215**                     | The card says "received formal papal recognition". 1200 is Philip II Augustus's **royal** diploma; the first formal papal act is Robert de Courçon's 1215 statutes as Apostolic legate                                                                                         |
| `xicalanco-trade-port`                | 1000 → **1500**                     | The description has the port linking Maya and **Aztec** networks, which Wikipedia confirms was its role. The Aztec Empire dates from 1428, so 1000 is impossible for the thing described; 1500 sits inside the documented Late Postclassic period, before the Spanish conquest |
| `zanzibar-clove-cultivation`          | 1818 → **1840**                     | The description credits **the Sultan**. Cloves reached Zanzibar c. 1818 via the merchant Saleh bin Haramil; Seyyid Said moved his capital to Stone Town in 1840 and developed the clove plantation economy from there                                                          |
| `marquesas-settlement-east-polynesia` | 300 → **800** (+ `year_end` 1300)   | Sinoto's Ha'atuatua dates are rejected as old-wood and marine-shell samples, so nothing supports 300. Allen (2004) argues an 8th-10th century arrival, the earliest position still defended; Wilmshurst et al. (2011) put the remaining East Polynesian islands at 1190-1290   |
| `chatham-islands-settlement`          | 1000 → **1400** (+ `year_end` 1500) | The voyage came from mainland New Zealand, itself not settled until c. 1280, so 1000 is impossible for it. A waka excavated on the north coast dates to 1440-1470; the earliest radiocarbon-dated cultural remains are c. 1500                                                 |

## Wrong year: resolved, and why the section existed at all

**This section is empty apart from one row, and the reason is worth keeping.** Every entry here was
stuck on the same thing: the card was wrong, but no single replacement year was defensible. Four
were annotated _"Nothing to move it to"_. That was never a research failure — it was the data model
demanding a point where the record gives a window.

The 2026-09-18 evidence-window pass cleared all of them:

| Slug                               | Was   | Now        | What the window is                                                               |
| ---------------------------------- | ----- | ---------- | -------------------------------------------------------------------------------- |
| `songhai-scholars`                 | 1510  | 1493-1591  | Askia Muhammad's accession and 1496-97 hajj, to Tondibi                          |
| `painting-canvas`                  | 1300  | 1410-1600  | Both defensible answers at once: the Malouel Madonna, and Venetian normalisation |
| `compound-air-compressor`          | 1829  | 1829-1871  | Sommeiller's Mont Cenis plant to the tunnel's completion                         |
| `solid-state-lidar`                | 2010  | 2010-2019  | No single year marks it; the 2010s are the window                                |
| `inca-quipu-standardized`          | 1460  | 1438-1533  | Pachacuti's accession to the conquest                                            |
| `deccan-sultanates`                | 1500  | 1490-1518  | The Bahmani breakup: three declarations in 1490, Bidar 1492, Golconda 1518       |
| `selective-breeding-animals`       | 1700  | 1760-1795  | Bakewell inheriting Dishley to his death                                         |
| `hydrochloric-acid-production`     | 1700  | 1648-1791  | Glauber's method to Leblanc's industrial by-product                              |
| `long-distance-travel-improvement` | 1700  | 1750-1800  | The turnpike-era journey-time evidence                                           |
| `winnowing-tray-fan`               | -2000 | -2000 to 9 | Ancient trays through to the Han rotary fan                                      |

**The lesson, for the next time a row looks unfixable:** check whether the obstacle is the evidence
or the schema. "No single year is right" is a description of a window, not a dead end.

One row survives, and not because of its date:

| Slug                       | Stored | The record                                                                                   | Why it was not changed                                               |
| -------------------------- | ------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `zhouyuan-sogdian-outpost` | 700    | Unsupported entirely: Zhouyuan is a Western Zhou Bronze Age site, not a Tang-era Sogdian one | A mislabelled slug, not a fixable date — see **Slug-only mislabels** |

### Checked in the verification pass and dismissed

Flags that did **not** survive. Recorded with their evidence so nobody re-opens them; roughly three
in four writer flags land here, which is why every one is checked before anything moves.

| Slug                         | Stored | Why it stands                                                                                                                                                                                                                                      |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capsule-endoscopy`          | 1999   | The flag said nothing happens at 1999. Paul Swain swallowed the first wireless capsule endoscope in **October 1999** — the flag missed it by reading a summary that dates the first swallow to 1997                                                |
| `defibrillator`              | 1939   | The flag said no device exists at that year. Gurvich and Yunyev reported successful capacitor-discharge defibrillation in animals in **1939**                                                                                                      |
| `soga-kingdom`               | 1400   | The flag proposed 1906, the British-installed central ruler. The card says "the Busoga **kingdoms** emerged", plural, and those chiefdoms emerged through the 16th century — so 1906 is wrong for what the card describes and 1400 is merely early |
| `bayer-process`              | 1887   | 1887 is Bayer's precipitation discovery in Saint Petersburg, a real milestone; 1888 is the completed process. Both are cited                                                                                                                       |
| `veterinary-school`          | 1762   | The Lyon school's founding is "variously given as 1761, 1762 or 1764". 1762 is one of the cited variants                                                                                                                                           |
| `float-glass-process`        | 1952   | Development runs 1953-57 and profitable sales from 1960, but 1952 is the conventional date for Pilkington's conception of the process                                                                                                              |
| `robotic-exoskeleton`        | 1960   | Hardiman is dated only to "the 1960s", so 1960 is not contradicted. (Separately, Kelley's 1917 steam device undercuts the description's "first" — that is a description problem)                                                                   |
| `handgun-first-use`          | 1364   | 1364 at Perugia is the standard cited date for the earliest recorded handguns. The error is the description calling it a _battle_; it was an order for firearms                                                                                    |
| `library-system`             | 1848   | The description says the Boston Public Library was **established**, which is 1848 by statute. The 1854 reading-room opening is a different event                                                                                                   |
| `gupta-empire`               | 320    | 320 CE is the Gupta era epoch and the conventional founding date. The c. 240 figure belongs to the dynasty's namesake, not the empire                                                                                                              |
| `sikh-empire-ranjit-singh`   | 1799   | The description's first clause is "captured Lahore", which is 1799. The 1801 coronation is its second                                                                                                                                              |
| `pre-revolution-debt-crisis` | 1786   | The description says the crisis _forced_ Louis XVI to convene the Assembly of Notables. That decision is 1786; the meeting itself is February 1787                                                                                                 |

## Imprecise year: a round date outside its evidence window

**Judgement calls, not errors.** Each is a round year standing in for a process, a reign or a
floruit the record places elsewhere. Changing them is optional and in several cases there is no
better single year to move to. Listed so nobody re-derives them.

**Nearly all of these now carry an evidence window** (2026-09-18). 255 events have one, seeded
largely from this section. See [index.md](index.md#year--year_end-the-evidence-window).

Two of the three obstacles recorded here a day earlier turned out to be self-inflicted, and both
are gone:

- **"The window starts before the stored year."** `blast-furnace-invented` (now -400 to 100),
  `benin-kingdom-founded` (1200-1320), `tonga-empire` (1200-1500) and `brunei-sultanate-expansion`
  (1485-1578) were all filed as unfixable because a range only extended forwards. It does not: the
  stored year is the window's _start_ and moves with the evidence.
- **"The window is too wide to be honest."** `boats` (-1040000 to -50000) and
  `spear-thrower-atlatl` were held back by a span ceiling that no longer exists. A window of
  850,000 years is the correct answer when the uncertainty really is 850,000 years.

The one genuine obstacle stands: **a point with an error bar is not a window.** A ratified
chronostratigraphic boundary (`jurassic-period-begins`, and anything else whose stored value is
unrounded like -201400000) carries a published age, and the Chicxulub impact, Toba and Storegga are
near-instantaneous. Those stayed points deliberately. `lucy-australopithecus-lived` and
`end-permian-mass-extinction` do carry windows, but so narrow relative to their magnitude that the
label collapses back to a single value, which is the honest rendering.

**Deep time** (`2b5c48c`, `2e9f546`): `boats` -900000 (earliest datable seafaring is the Sahul
crossing, c. 50,000 BP) · `hide-and-leather-clothing-shelter` -400000 · `pigments` -400000 (ochre
processing from c. -300000) · `beads-string-thread` -135000 (Blombos shell beads 70-100 ka) ·
`mines-hematite-ochre` -47000 (Ngwenya 41-43 ka) · `spear-thrower-atlatl` -42000 (confirmed
artefacts c. -18000) · `rope-and-cords` -32000 (evidence c. -27000) · `star-chart` -21000 (the
astronomical reading is a contested proposal) · `bow-and-arrow-invented` -10000 (evidence near
80,000 BP).

**Technology and agriculture** (`c2d111d`, `2e9f546`): `compass-invention-china` 1040 (Shen Kuo's
navigational account is 1088) · `goryeo-printing-woodblocks` 950 (first Tripitaka Koreana finished 1087) · `water-power-industrial` 900 (fulling c. 1080, forge hammers c. 1200, sawmills c. 1300) ·
`heavy-plow-adoption` 1000 (main European spread late 8th to early 9th century) ·
`horse-plough-agriculture` and `horse-collar-technology` both 800 (padded collar clearly attested
in Europe only after c. 1000) · `african-agricultural-innovation-millet` -3000 (domestication
c. 2500-2000 BCE) · `trebuchet-invented` 1120 (first description 1187) · `domestication-horses`
-4000 (genetic origin now later) · `scissors-invented` -1500 (no source support) ·
`blast-furnace-invented` 100 (furnaces from at least the 1st century BC) ·
`open-field-system-abandonment` (enclosure ran piecemeal for centuries) · `song-triple-harvest` ·
`andean-llama-domestication` 1200 (domestication 4,000-5,000 years earlier).

**Settlement and migration** (`c2d111d`, `2e9f546`): `marquesas-settlement-east-polynesia` 300
(revised to the 11th-13th century) · `chatham-islands-settlement` 1000 (probably 15th century) ·
`polynesian-settlement` 1000 (staged, not simultaneous) · `lucayan-archipelago` 700 (migration
500-800 CE) · `viking-america` 1000 (dendrochronological 1021) · `maori-land-use-customary` 1200
(settlement now dated 1250-1350).

**African, Asian and American polities** (`27f6be5`, `0ace74e`, `e1bd4cc`, `aa9961b`):
`mayapan-league-cities` 1220 (founding 1007) · `benin-kingdom-founded` 1300 (Oba monarchy from
c. 1180-1200) · `mapungubwe-gold-trade` 1075 (floruit c. 1220-1300) · `zimbabwe-trading-network`
1220 (the imported ceramics are 14th-15th century) · `khwarezm-caravanserai-network` 1100 (the
infrastructure is 13th century) · `pagan-kingdom` 1113 (peak 1174-1211) · `hospital-of-st-lawrence`
1204 (founding 1201) · `luba-empire` 1500 (expansion documented 1700-1860) ·
`lunda-empire-formation` 1550 (founding near 1665) · `tonga-empire` 1700 (the record's peak is
1200-1500) · `brunei-sultanate-expansion` 1580 (peak under Bolkiah 1485-1524) · `hawaiian-kingdoms`
and `tswana-kingdoms` both 1600 (no 1600 event attested for either) · `mycenaean-civilization`
-1600 (emergence near 1750 BCE) · `futures-market` 1730 (milestones 1697 and 1773) ·
`dahomey-kingdom-founded` 1625 (Houegbadja from c. 1645) · `kuba-kingdom-raffia-currency` 1600
(c. 1625) · `akbar-administrative-reforms` 1574 (c. 1580) · `famine-cycles-break` 1700 (potato
staple only after 1750) · `somali-adal-sultanate` 1300 (1415) · `oyo-confederacy-structure` 1450
(structure dated after 1535) · `barid-shahi-dynasty` 1487 (1492) · `sulu-sultanate` 1405 (contested
1405 or 1457) · `swahili-kilwa-sultanate` 1300 called an apex the record puts in the 15th century.

**Checked and judged defensible as stored** — do not re-open these (`aa9961b`, `545580d`,
`e092492`, `a29b670`, `5e33234`, `0243f2b`, `f049c97`, `329130e`, `6e04b48`, `746fb01`):
`first-coins` -600 · `chichen-itza-founded` 600 · `rustamid-tahert-kingdom` 776 ·
`paper-money-china` 810 · `chola-empire-expansion` 880 · `chinese-paper-money` 960 · `kyivan-rus`
862 · `ghana-empire-founded` 700 · `bukhara-city` 700 · `chola-administrative-system` 1030 ·
`opera-emerges-florence` 1597 (Florentine calendar began 25 March) · `aksumite-christianity` 330 ·
`epic-gilgamesh-written` -1300 · `seljuk-tilework` 1150 · `racine-theatre` ·
`haiku-poetry-tradition` · `sikh-mughal-conflicts` 1705 · `madura-sultanate-fall` 1378 (record too
thin to establish a replacement) · `salt-monopoly-china` -119 · `fall-of-israel-northern-kingdom`
-722 · `first-orphanage` 330 · `aksumite-coinage` 270 · `lapita-pottery-trade` -1000 ·
`roman-census` -560 · `escalator-invented` 1891 (no single replacement year is right) ·
`electric-hearing-aid` 1898 · `electrocardiogram-invented` 1903 · `submarine-first-practical` 1864 ·
`arc-lamp` 1809 · `germ-theory` 1880 · `kamakura-shogunate-establishment` 1185 ·
`poverty-point-earthworks` -1500 · `insulin-pump-developed` 1976 · `bone-eyed-needle` -28000 ·
`butterfly-separate-stroke-1953` (stored year is already 1952; only the slug says 1953) ·
`charlemagne-king-franks` 768 (right for the coronation; "sole king" is the wrong part).

## Raised by the evidence-window pass (2026-09-18), not yet acted on

Reading ~290 records against sources to build their windows turned up problems a window cannot
fix. Recorded here rather than acted on, in the same spirit as the rest of this file.

### Prose that contradicts its own card

The long-form detail prose was written before the years were corrected, so several entries now
disagree with the record they sit on. A player reads the prose _after_ placing, so this is visible.

- **`heavy-plow-adoption`** — its prose opens "spread across Europe mainly in the late eighth and
  early ninth centuries" against a card anchored at 1000-1300. The card is right: Andersen, Jensen
  and Skovsgaard use 1000 as the breakthrough and study 900-1300. The late-8th-century figure
  describes the plough's _first appearance_, which is the sibling card. The sentence should say
  "breakthrough c. 1000".
- **`futures-market`** — the prose has Dojima licensed in 1697 and sanctioned in 1773. It is the
  other way round: 1697 was the merchants' own informal market, 1730 the shogunal licence.
- **`first-cyanobacteria`** — the prose rests on 2.7 Ga hopane biomarkers, which have since been
  challenged as drilling contamination. The card's window now runs to the ~2.15 Ga microfossils.
- **`first-multicellular-life`** — the prose's "1.2 billion year old" Bangiomorpha is the pre-2018
  date; the Re-Os age is 1.047 Ga.
- **`arthropods-colonize-land`** — the prose leans on Pneumodesmus newmani as the 425 Ma oldest
  land animal. It was re-dated by U-Pb zircon to 413.7 ± 4.4 Ma, so that "oldest" claim is stale.

### Cards whose name or slug does not describe their content

- **`andean-llama-domestication`** is not about domestication. Its title ("Andean Llama Herding
  System Peak"), description and prose all describe the Inca-era herding and caravan system, which
  is why its window is 1200-1532. Actual camelid domestication is 4,000-5,000 years earlier. The
  slug is the misnomer, not the date.
- **`horse-plough-agriculture`** is titled "Heavy Plow Invented" but its entire prose is about the
  horse collar, and it duplicates `horse-collar-technology` — both now 800-1200 and 477-1200. One
  of the pair is probably redundant.

### Dates still unsupported

- **`compound-air-compressor`** — no corroboration was found for the stored 1829 patent at all. The
  window 1829-1871 rests on the verified Mont Cenis end (Sommeiller's compressors approved 1857,
  tunnel complete 1871). The start may be fictitious.
- **`bullroarer`** — stored -22000 looks too old; the oldest cited examples are Ukrainian Upper
  Palaeolithic pieces around 18,000 BCE. No defensible upper bound was established, so it was left
  alone rather than given an invented one.
- **`yellowstone-supervolcano`** — the Lava Creek Tuff has been re-dated (~640 vs ~631 ka) and the
  redating could not be verified. Left as a point.

### The BP/BCE conflation, which is systemic

Many prehistoric cards use "years ago" directly as a BCE value — `toba-supereruption` at -74000 for
an eruption 74,000 years _ago_, `spear-thrower-atlatl` at -42000 for Mungo Man at 42,000 BP. Others
are properly converted (Lascaux, pottery, Monte Verde). The offset is ~2,000 years, which is noise
at Palaeolithic scale and real at Holocene scale: **`woolly-mammoth-extinction` was stored at -4000
for a Wrangel Island population that ends ~4,000 years _ago_, i.e. c. 2000 BCE** — a 2,000-year
error, now corrected to a -3700..-1950 window.

Window researchers were told to follow whichever convention each card already used, so the
inconsistency is preserved rather than half-fixed. Fixing it properly means auditing every
pre-Holocene card, and the payoff is small above ~20,000 years ago. Worth doing for the
Holocene-adjacent ones if anyone touches that era again.

## Raised by the catalogue-wide sweep (2026-09-19)

The 2026-09-18 pass worked the shards a heuristic flagged. This one reviewed **every one of the
5,205 un-ranged events**: 644 carried a window, 4,807 were recorded in
`scripts/events/year-range-decided.json` as moments with a reason each, and 9 were left
unresolved. A re-run the following day closed the last of it, so **every event in the manifest
now has a verdict**: 675 with a window, 4,785 in the ledger, nothing remaining. What the readers
found that a window cannot fix is recorded here.

### The nine unresolved cards, resolved (2026-09-19)

All nine now carry a verdict, so the report script counts none of them. Three took a window and
six are rejections whose reasoning is in the ledger rather than only here.

**Windows, with the anchor deliberately left alone.** `lapita-pottery-trade` -1000..-500 and
`poverty-point-earthworks` -1500..-1200 are both on the "checked and judged defensible as stored"
list above, so a reviewer re-proposing a year move was a false positive both times. What the
earlier passes were reaching for was a window, not a different point, and the schema now
expresses it. `bantu-expansion-africa` is -400..500 with its `year` moved, on which see below.

**Rejections, and what makes each one final.** `gupta-golden-age`, `nok-civilization-nigeria`,
`tiwanaku-monumental-center` and `swahili-stone-architecture` were each reviewed a third time and
the disagreement held: sourced readings of the start sit more than fifty years apart (Gupta:
the 320 empire founding against Samudragupta's c. 335 and Chandragupta II's 375; Nok still spans
600 years). `silk-road-trade` and `bantu-expansion` have no dateable referent for their own claim
— "Flourishes" at 1100 and "completed centuries of migration" at 1000 are not events any source
places there.

**One verdict was overturned in review.** `gupta-golden-age` came back from a reader with `year`
moved to 335 and a window to 455, on the argument that the spread "resolves" to Samudragupta's
accession. It does not, and that reader's own reason named the 320/335/375 spread while claiming
to settle it. This is precisely the case the fifty-year rule exists for, and the anchor is the
field that moves daily decks. The lesson is narrow and worth keeping: **a third sourced reading
that picks one of the two earlier readings has not settled anything.** It has made it three.

**`bantu-expansion-africa` is the one where the earlier objection was itself the answer.** It was
stuck because every proposed move went to the start of the whole expansion, c. 4000 BC, which the
card's "carrying iron-working" claim does not support. But the iron has its own date: definitive
archaeological evidence of Bantu iron use from c. 400 BC, running to the Limpopo by AD 500. The
window is the card's claim, and it is -400..500. The reader who worked it kept the stored 100 as
the start and sourced only the end, which is the forward-only mistake in miniature; it was
rewritten on review.

### Records the sources do not support

- `female-ruler-sargon` ("Enmersi of Kish", -2295) claims to be recorded on the Sumerian King
  List. No ruler of that name or any close variant appears on it. Needs a factual review.
- `rozwi-stone-fortifications`: the Rozwi are documented as having rarely built in stone and as
  having occupied existing ruins, which contradicts the card's premise.
- `damascus-steel-pattern` says pattern welding was "developed in Persia". Pattern welding is
  attested in Europe by c. 1100 BCE; wootz originated in India and Sri Lanka and reached Persia
  by trade. Neither tradition is Persian in origin.
- `kowoj-maya-settlement` stored at 1000, but the Kowoj appear as a distinct group only after the
  Mayapan collapse (post-1441).
- `moldboard-plow-improvements` (1400) sits in a documented gap: general adoption was 8th-9th
  century, the major design improvements 18th.
- `enclosure-movement` stored 1500 matches no sourced phase of English enclosure.
- `petra-treasury-carved` stored -100; sources place Al-Khazneh in the late 1st c. BCE to
  early-mid 1st c. CE, commonly tied to Aretas IV.
- `legalist-philosophy-qi`: Legalism is attested in Qin, not Qi.
- `dahomey-rise-power` (1718): the description credits Agaja's predecessors, who reigned entirely
  before the stored year.
- `sikh-movement-begins` (1499) describes Guru Nanak's birth; his birth is 1469, and 1499 is the
  start of his mission.
- `kabuki-women-actors` conflates the 1629 ban on women with the 1652 ban on wakashu actors.

### Title and description disagree about scope

`global-financial-crisis` (titled for the crisis, described as the Lehman collapse),
`cambodian-genocide` ("Khmer Rouge Takes Power" against a genocide description),
`polish-soviet-war` (titled for the war, described as the Battle of Warsaw),
`inca-tupac-amaru` (slugged for Tupac Amaru, describing Pachacuti's Titicaca conquest),
`second-french-empire` and `directory-period` (period titles, founding descriptions).

### Duplicate and near-duplicate clusters

`timbuktu-university-development` / `timbuktu-university` / `songhai-university-timbuktu` ·
`maya-classical-period` / `mayan-classic-period` / `maya-cities-peak` ·
`heian-aesthetic-culture` / `heian-period-cultural-peak` / `heian-women-literature` ·
`bantu-expansion` / `bantu-expansion-africa` / `iron-smelting-bantu-expansion` ·
`kilwa-khilafa-sultanate` / `kilwa-sultanate` / `kilwa-gold-monopoly` ·
`polynesian-navigation-technology` / `polynesian-double-canoe-design` / `polynesian-star-compass` ·
`colosseum-architecture-ancient` / `vespasian-colosseum-begun` ·
`dome-construction-mastery` / `florence-cathedral-dome` / `brunelleschi-dome` ·
`gothic-cathedral-construction` / `chartres-cathedral-construction` ·
`nan-madol-city-construction` / `nan-madol-basalt-engineering` ·
`three-field-rotation` / `crop-rotation-system` · `water-mill` / `water-mill-europe` ·
`nalanda-university` / `nalanda-university-science` ·
`mayan-astronomical-calculations` / `mayan-astronomy` · `heavy-plow` / `heavy-plow-adoption` ·
`terrace-farming-andes` / `inca-terrace-agriculture` ·
`enclosure-movement` / `enclosure-movement-begins` · `kushana-empire` / `kushan-empire` ·
`wari-empire-expansion` / `wari-empire` · `samarkand-library-school` / `samarkand-cultural-center` ·
`benin-edo-kingdom` / `benin-bronze-casting-peak` · `majapahit-administrative-system` /
`majapahit-expansion` · `kalidasa-drama` / `kalidasa-shakuntala` ·
`cahokia-moundbuilder` / `mississippian-cahokia-settlement`.

### Categories that look wrong

`blood-bank-established` under `commerce`; `first-european-paper-mill` under `agriculture`;
`eurotunnel-boring` under `media` beside two `architecture` siblings; `wilhelm-gustloff` and
`munich-massacre` under `revolution`.

### A schema limit, not an error

A span inside one calendar year cannot be written, because `year_end` is an integer year and
must exceed `year`. So the 1974 Bengal famine (Mar-Dec), the 1518 dancing plague (Jul-Sep), the
1931 China floods (Jun-Oct), the 2003 European heat wave, Deepwater Horizon, Fukushima, the
siege of Masada, the 1886 world chess championship and the 1871 Paris Commune all stay points
correctly. Worth knowing before someone "fixes" them.

### Rejected for want of a source: re-run, and cleared (2026-09-19)

The sweep's WebSearch budget ran out partway through the cultural shard and a run of genuinely
period-shaped cards was rejected because nothing could be checked. **All of them have now been
re-reviewed against sources and the section is closed.**

Of 58 cards, **28 took a window and 30 were re-rejected on the merits.** A rate that high is not
a slipped bar: this cohort was pre-selected as period-shaped, so it is the one batch where a
normal two-or-three-in-forty result would have meant something was wrong.

Three corrections to the list this section used to carry, all worth knowing before trusting a
slug in this file:

- **Four of its 52 slugs did not exist.** `nazca-pottery` is `nazca-pottery-style`,
  `goguryeo-tomb-murals` is `goguryeo-murals-tombs`, `umayyad-mosaic-art` is
  `umayyad-mosaics-art`, `islamic-calligraphy` is `islamic-calligraphy-tradition`. A slug written
  from memory into a prose list is not checked by anything.
- **`moche-civilization` was already done**, carrying a 300-600 window before the re-run started.
- **Seven were missing from the list**, found by grepping the ledger for the wording its own
  notes used ("not sourced this pass", "no verification available this session") rather than
  trusting the prose: `anglo-saxon-manuscript-art`, `copan-ruler-18-rabbit`,
  `irish-monastery-art`, `japanese-calligraphy-art`, `java-temple-sculpture`,
  `moche-civilization-peru`, `phoenician-alphabet`. **The ledger is the index, not this file.**

Deliberately **not** re-opened: the ~300 other ledger notes reading "no sourced bounds". They
look similar and are not the same thing — an ongoing practice or a generic invention description
with no sourceable ends is a correct Test D rejection, and re-opening them would re-litigate the
sweep rather than repair it.

### Raised by the re-run (2026-09-19)

Reading these 67 records against sources turned up more that a window cannot fix.

**Stored years that are stand-ins with nothing behind them**, found while rejecting the card:
`baroque-period-peak` (1600), `champa-hindu-culture` (1100), `anglo-saxon-manuscript-art` (700),
`goryeo-dynasty`, `haida-totem-poles`, `kuba-royal-masks`. Each is a "peak" or "tradition" card
whose year no source supports and whose ends no source fixes, so the rejection is right and the
year is still wrong.

**Records the sources contradict:**

- `kingdom-kush-flourishes` is stored -1500, which belongs to the **Kerma** culture. The Kingdom
  of Kush proper is conventionally c. 780 BCE to 350 CE, and Kushite independence is c. 1070 BCE.
  The card's year and its named subject are about different polities.
- `king-david-rules` asserts a united monarchy ruled from Jerusalem that the record presents as
  disputed in both date and extent.
- `poverty-point-earthworks` understates its own subject: sourced construction begins c. 1800
  BCE against a stored -1500. Left alone only because the anchor was ruled out of scope.
- `yoruba-ife-kingdom` was stored at 1100, a full century before any sourced sculpture. Fixed
  here by the move to 1200, but the stored value was wrong independently of any window.

**Title, slug or category against content:**

- `chavin-culture` is titled "Chavin Culture Peak" and its description covers the culture's whole
  pan-Andean influence. No source identifies a distinct peak, so the window is the culture's full
  -900..-250. The title is the part that is wrong.
- `hoysala-dynasty` is slugged and filed (`diplomatic.json`) as a dynasty while its
  `friendly_name`, description and category are all temple architecture.
- `nazca-pottery-style` is categorised `architecture` and is entirely about pottery.
- `vietnamese-nam-vu` looks like a typo for Nam tien.
- `goryeo-dynasty` is titled "Goryeo Dynasty Peak", which names no datable event at all.

**More near-duplicate clusters**, to add to the list below: `moche-civilization` (300-600) /
`moche-civilization-peru` (100-800), the second being the culture and the first its peak, which
is coherent but leaves two cards for one subject · `goryeo-dynasty` / `goryeo-celadon-pottery`,
both resting on celadon · `kuba-kingdom` / `kuba-royal-masks` · `tokugawa-edo-period-culture`
(1603-1868) / `ukiyo-e-art-development` (1670-1868), sharing an end date and most of a span.

**A good rejection worth recording as calibration:** `igbo-ukwu-bronzes` was re-rejected because
its 9th-century radiocarbon date is a point with an error bar, not a span of activity. That is
Test C doing its job on a card whose earlier rejection note had said only that the dating was
"disputed".

## Raised by the second curated-theme bank (2026-09-24)

Reconciling 22 blind theme spines against the catalogue meant reading existing cards against a
second, independent list of dates. None of these was acted on (the reconcile agents were told
never to edit an existing event), except where noted. See
[../curated-themes/index.md](../curated-themes/index.md#bank-2-2026-09).

### Wrong year

- **`rhinoplasty`** (-3000). Its description is the Sushruta Samhita's nose reconstruction,
  which is dated to roughly 600 BCE: the card is about 2,400 years early. It was the Under the
  Knife deck's easiest card and was dropped from it for this reason. `susruta-samhita` and
  `cataract-surgery-ancient` already sit correctly at -600, so the fix may be deprecation
  rather than a re-date.
- **`bengal-famine-company-rule`** (1770). Sources date the famine 1769-1773; 1770 reads as a
  rounded stand-in. A candidate for `year` 1769 + `year_end` 1773 in a pass allowed to move
  years.
- **`oldest-wooden-hunting-spears`** (new this bank). Authored at -337000 and **corrected to
  -200000** before commit, after the 2025 amino-acid re-dating of the Schöningen deposit
  (Science Advances, May 2025).

### Imprecise year on a card authored this bank

- **`walls-of-benin-city-built`** (1400, window to 1460). Earthworks began about 800 and the
  first moats were dug c. 1280-1295; 1400 sits mid-process. A fuller window is ~800-1460.
- **`junk-watertight-bulkheads`** (1000, window to 1279). The technique is Tang (618-907) and
  the Quanzhou ship confirms it c. 1277; 1000 is a stand-in between the two.
- **`great-dam-of-marib`** (-750, window to -500). The window covers the Sabaean stonework only;
  the dam's full history runs from c. 1750 BCE to Himyarite work c. 325 CE.

### Existing cards reused under a slightly different date

Reused as they are, and noted in the theme notes' "catalogue doubts":
`elevator-invented` (1852; Otis's public demonstration is usually 1853-54),
`lilienthal-glider` (1894; first glides 1891), `helicopter-modern` (1939, the VS-300's tethered
hop; free flight 1940), `polynesian-double-canoe-design` (600; the Lapita voyaging canoe is
c. 1500-1000 BCE), `song-sternpost-rudder` (1150; the Han origin is c. 100 CE), `fire-mastery`
(-1790000, against ~790,000 for the earliest accepted controlled fire).

### Two existing cards on one beat

`zhou-dynasty-begins` and `establishment-zhou-dynasty` are the same Muye beat;
`jin-dynasty-reunifies-china` and `sima-yan-jin-unification` are the same 280 CE beat.
`npm run find-duplicates` lists the first pair too.

## Raised by the region sweep (2026-09-30)

The region taggers read all 5,813 untagged cards with their detail prose, and reported 531
problems with the records along the way. Three Sonnet agents triaged them against this file and
the catalogue: 87 were already recorded here and 239 were not errors (a misread, a round year for
a diffuse process, a grammar nit in prose nobody sees). What survived is below. Nothing here has
been acted on.

**How far to trust each table.** "Confirmed" rows were checked by reading the record and its own
prose, and the few that turn on the real world by one web search, cited. Where a card and its
prose disagree, the row says so without deciding which side is right: several cards sit hundreds
of years off their own prose (`canal-lock`, `toe-stirrup`, `loan-deeds`, `breast-wheel-design`),
and either could be the error. The category table is advisory: there is no religion or
education category, so religious and university cards sit in the nearest bucket by design, and
"Categories that look wrong" above already leaves some of these alone.

### Records that contradict themselves, mislabelled slugs, and source-checked errors

| Slug                             | Problem                                                                                                                                                                                                          | Evidence                                                                                                                                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alaric-visigoth-kingdom`        | Title credits Alaric with establishing the kingdom, but the description and prose say he died in 410 and the 418 settlement came later.                                                                          | Title is "Alaric Establishes Visigoth Kingdom" while the prose says "Alaric did not live to see the Visigoths settled".                                                                                     |
| `apollo-11-treaty`               | Slug names Apollo 11 but the card is the Outer Space Treaty of 1967.                                                                                                                                             | Record is "Outer Space Treaty" (1967) and the prose says it predates any landing.                                                                                                                           |
| `aqueduct-pont-garros`           | The player-visible `friendly_name` "Pont Garros Aqueduct" misspells Pont du Gard, which the description and prose spell correctly.                                                                               | `friendly_name` against its own description.                                                                                                                                                                |
| `barid-shahi-dynasty`            | The friendly_name reads "Barid Shahi Dynasty Bijapur" but the dynasty ruled Bidar.                                                                                                                               | The card's own description and prose both say the Bidar Sultanate, and Bijapur was the Adil Shahi state.                                                                                                    |
| `basil-ii-bulgar-victories`      | Friendly name says Serres but the description and prose are the Battle of Kleidion.                                                                                                                              | Title is "Battle of Serres Basil II Victory" while both description and prose say Kleidion, 29 July 1014.                                                                                                   |
| `battle-marathon`                | Prose has a real typo, "a Persian ships heading for the city".                                                                                                                                                   | Prose paragraph two.                                                                                                                                                                                        |
| `brasilia-built`                 | Description says the city was completed in four years, while the prose says about three years rather than the four sometimes claimed.                                                                            | Description against prose paragraph two.                                                                                                                                                                    |
| `breast-wheel-design`            | The card year is 1200 but the prose places breastshot wheels in Roman Gaul by the late second century.                                                                                                           | The prose says wheels built this way appear in Roman Gaul well before the medieval period.                                                                                                                  |
| `budi-utomo-founded`             | Prose says the society was founded in Yogyakarta, but it was founded at the STOVIA medical school in Batavia.                                                                                                    | Source: https://en.wikipedia.org/wiki/Budi_Utomo (CONFIRMED_SOURCE).                                                                                                                                        |
| `canal-lock`                     | The card year is -283 but the prose dates the pound lock it describes to 984 CE.                                                                                                                                 | The prose credits Qiao Weiyue's twin sluice gates of 984 and describes earlier Chinese locks only as flash locks.                                                                                           |
| `cave-paintings`                 | Description names Lascaux but the prose describes El Castillo and says it predates Lascaux by roughly 25,000 years.                                                                                              | Description says "in Lascaux and other caves" while the year window is -51200 to -40800 and the prose is about the El Castillo stencil dated to at least 40,800 years ago.                                  |
| `chainmail-armor`                | Description says the Hellenistic world, but the prose says the oldest mail is Carpathian and credits Celtic smiths.                                                                                              | Description against prose paragraph one.                                                                                                                                                                    |
| `change-4-landing`               | The friendly_name says "Change 4" and the description says "Chinas" (missing apostrophe).                                                                                                                        | The prose spells the probe Chang'e 4, and the corrected name "Chang'e 4 Lands on Far Side of Moon" is exactly 35 characters.                                                                                |
| `charles-bridge-prague`          | Prose garbles the palindrome date as "1357 9, 7 5, 3", where it should read 1357, 9 July, 5:31 a.m.                                                                                                              | Prose paragraph one.                                                                                                                                                                                        |
| `circus-maximus-races`           | Card is titled and described as the chariot races, but the prose says racing predates 329 BCE and the year marks only the first starting gates.                                                                  | Prose opens "Chariots had already been racing ... for centuries by 329 BCE".                                                                                                                                |
| `colossus-lorenz-codebreaker`    | Card year is 1943 but the prose says Colossus began running at Bletchley Park in February 1944.                                                                                                                  | Year against prose paragraph one.                                                                                                                                                                           |
| `compass-invented`               | Description says the first compass was for navigation, but the prose says the Han compass was divinatory and navigation use dates to 1044 to 1117.                                                               | Description against prose paragraphs one and two.                                                                                                                                                           |
| `dart-asteroid-impact`           | The prose has a garbled sentence, "The impact produced 32 minutes", in player-visible text.                                                                                                                      | The sentence is missing its verb and object and should say the orbital period was shortened by 32 minutes, after the 73-second success threshold.                                                           |
| `deccan-sultanates`              | The prose says Golconda came last in 1512 but the card's own year_end and the bahmani-sultanate prose say 1518.                                                                                                  | The card window is 1490 to 1518 and the sibling prose reads "Golconda last in 1518", so the two texts disagree.                                                                                             |
| `dictionary`                     | The description says Sumerian-Akkadian word lists but the prose says the Ebla lists pair Sumerian with Eblaite.                                                                                                  | The prose describes the Ebla tablets of about 2300 BCE as Sumerian and Eblaite lexical lists.                                                                                                               |
| `dom-university-paris`           | Prose says Innocent III issued a papal charter in 1200, contradicting the royal charter of Philip II that `university-paris-founding` gives for the same year.                                                   | This prose says "A papal charter under Pope Innocent the third later in 1200" and the sibling prose says "King Philip II's charter of 1200"; the two cards also cover the same founding.                    |
| `domesday-style-record-keeping`  | Slug names Domesday-style record keeping but the card is Irish monks introducing word spacing.                                                                                                                   | Record is "Word Spacing in Texts" (700) and the prose is about scriptio continua.                                                                                                                           |
| `enamel-development-techniques`  | The description says Mediterranean artisans but the prose is about Limoges in central France.                                                                                                                    | The prose says Limoges had the largest champleve workshops by the twelfth century and stayed the leading centre for two centuries.                                                                          |
| `end-medieval-period-1500`       | The slug names the end of the medieval period but the card is about the volume of printed books.                                                                                                                 | The friendly_name is "Printing Press Revolution Completes" and the description and prose count printed volumes.                                                                                             |
| `first-almanac`                  | `friendly_name` "Almanach des Bergers" disagrees with the description and prose, which both say Kalendrier des Bergers.                                                                                          | `friendly_name` against description and prose.                                                                                                                                                              |
| `first-aqueduct`                 | Slug says first aqueduct but the card is the Aqua Claudia, and the prose states the Aqua Appia of 312 BCE was Rome's first.                                                                                      | Slug against `friendly_name` and prose paragraph two; a slug-only mislabel.                                                                                                                                 |
| `first-illustrated-paper-book`   | Slug names an illustrated paper book but the card is paper reaching the Islamic world.                                                                                                                           | Record is "Paper Reaches the Islamic World" (750) and the prose covers Talas, Samarkand and Baghdad, with no illustrated book.                                                                              |
| `first-jigsaw-puzzle`            | Card year is 1767 but Spilsbury's dissected map of Europe is 1766.                                                                                                                                               | CONFIRMED_SOURCE: its own prose says 1766, and https://www.guinnessworldrecords.com/world-records/688261-first-jigsaw-puzzle gives 1766.                                                                    |
| `first-map-printing`             | The player-visible `friendly_name` "Waldsemuller Map" misspells Waldseemuller, which the description and prose spell correctly.                                                                                  | `friendly_name` against its own description.                                                                                                                                                                |
| `first-maternity-hospital`       | Card year 1739 is right (General Lying-In Hospital, later Queen Charlotte's) but the prose narrates the British Lying-In Hospital of 1749 and Middlesex 1745, so prose and card disagree.                        | CONFIRMED_SOURCE: https://en.wikipedia.org/wiki/Queen_Charlotte%27s_and_Chelsea_Hospital (Manningham's Jermyn Street hospital, 1739) against the prose's 1749.                                              |
| `first-public-library`           | Description says the Library of Alexandria was founded under Ptolemy I, but the prose says most historians place the actual opening under Ptolemy II (slug also says first public library).                      | Description says "founded under Ptolemy I" while the prose says "most historians now place the library's actual opening under his son, Ptolemy II".                                                         |
| `first-treaty`                   | Slug says first treaty but the card is the Treaty of Apamea.                                                                                                                                                     | Record is "Treaty of Apamea" (-188) and the prose is about Antiochus III's terms.                                                                                                                           |
| `fork`                           | The description says Mesopotamian sites but the prose places the oldest forks in Bronze Age China.                                                                                                               | The prose cites bone forks from China dated roughly 2400 to 1900 BCE and never mentions Mesopotamia.                                                                                                        |
| `geodesic-dome`                  | The title and description credit Fuller with inventing the dome in 1948 but the prose says he did not invent it.                                                                                                 | The prose says Walther Bauersfeld built a geodesic planetarium dome at Jena that opened in 1926.                                                                                                            |
| `goguryeo-namgnang-battle`       | Friendly name says Namgnang but the description and prose are the siege of Ansi Fortress in 645.                                                                                                                 | Title is "Battle of Namgnang" while both description and prose say Ansi Fortress and Taizong.                                                                                                               |
| `gondar-castles-construction`    | Card window starts 1645 but the prose says Fasilides founded Gondar and built the first castle around 1636.                                                                                                      | Window 1645-1700 against prose paragraph one.                                                                                                                                                               |
| `great-gold-robbery`             | Description has the train running between London and Paris, but the prose has it running London Bridge to Folkestone for onward shipment.                                                                        | Description against prose paragraph one.                                                                                                                                                                    |
| `guanahani-settlement`           | Slug names Guanahani (Columbus's landfall island) but the card is the Lucayan Taino population across the Bahamas.                                                                                               | Record is "Lucayan Taino Peak" (1300) and the prose covers the whole archipelago and its 40,000 people.                                                                                                     |
| `hanzi-script-standardization`   | The title and description credit the Han (year -206) but the prose says the Qin chancellor Li Si did the standardising.                                                                                          | The prose says the decisive order came from Li Si after unification in 221 BCE and that Han scribes inherited the standard.                                                                                 |
| `horizontal-water-wheel`         | The friendly_name and description say "Horizontal Axis" but the prose describes a flat wheel turning on a vertical shaft.                                                                                        | The prose says the horizontal water wheel lies flat under the millstone with a vertical shaft and no gearing.                                                                                               |
| `inca-conflict-spanish`          | Friendly name is "Inca Civil War" but the event is Pizarro's capture of Atahualpa at Cajamarca, and it repeats the name of `inca-civil-war-dispute`.                                                             | Description and prose are the Cajamarca ambush, while `inca-civil-war-dispute` (1529-1532) is titled "Inca Civil War Huascar Atahualpa".                                                                    |
| `indian-rebellion-famine`        | The slug names the 1857 Indian Rebellion but the card is the Orissa Famine (friendly_name "Orissa Famine", 1866-1868).                                                                                           | Name, description and prose agree on Odisha 1865-66 and none mention 1857.                                                                                                                                  |
| `invention-sail`                 | Description says Egyptians invented sails, but the prose says the earliest sail image is Ubaid, from the Persian Gulf.                                                                                           | Description against prose paragraph one.                                                                                                                                                                    |
| `itaipu-dam`                     | Prose compares the concrete to "five copies of the Itaipu stadium in Rio", which is a garbled version of the Maracana comparison.                                                                                | CONFIRMED_SOURCE: https://turismoitaipu.com.br/en/the-itaipu-plant/curiosities/ (concrete would build 210 Maracana stadiums); no Itaipu stadium exists.                                                     |
| `jefferson-wheel-cipher`         | Description says twenty-six discs but the prose says Jefferson's design used thirty-six wheels.                                                                                                                  | Description against prose paragraph one.                                                                                                                                                                    |
| `kangnido-world-map`             | Description says the sources included Japanese maps, but the prose says they were two Chinese maps with Islamic data and the Japanese copies came later.                                                         | Description against prose paragraphs one and two.                                                                                                                                                           |
| `khmer-baray-hydraulics`         | Card window ends 1066 but the prose dates the West Baray to around 1100.                                                                                                                                         | Window 900-1066 against prose paragraph one.                                                                                                                                                                |
| `kongo-kingdom-structure`        | This is a near-duplicate of kongo-kingdom-founded (the manikongo and provincial governors around 1390 to 1400).                                                                                                  | kongo-kingdom-founded already describes the centralised government, manikongo and provincial governors that this card repeats.                                                                              |
| `llanquihue-battle`              | Friendly name says a battle at Llanquihue but the prose describes the 1655 general Mapuche uprising, naming Llanquihue only in passing.                                                                          | Record is "Battle of Llanquihue" and the prose's only mention is "the lake country around Llanquihue".                                                                                                      |
| `loan-deeds`                     | The card year is -500 but the prose dates the practice to 2000 to 1792 BC.                                                                                                                                       | The prose cites tablets from around 2000 BC and Hammurabi's code of about 1792 to 1750 BC, over a thousand years earlier.                                                                                   |
| `longbow-developed`              | The description says a six-foot yew longbow but the prose says Gerald of Wales described Gwent bows of elm rather than yew.                                                                                      | The prose opens by saying what is written down is a witness to the bow and names the wood as elm.                                                                                                           |
| `madoff-ponzi-scheme-unravels`   | Description says an estimated fifty billion dollars but the prose says about 65 billion.                                                                                                                         | Description against prose paragraph two.                                                                                                                                                                    |
| `mamun-opens-great-pyramid`      | Card year is 832 but the prose puts the breach at around 820 and says 820 is a reconstructed date.                                                                                                               | Year against prose paragraph one and two.                                                                                                                                                                   |
| `maori-iwi-development`          | This is a near-duplicate of maori-iwi-tribal-identity (iwi, hapu and rohe at 1500 against 1400).                                                                                                                 | Both descriptions say iwi formed distinct territories and structures, and both prose texts cover iwi, hapu and rohe.                                                                                        |
| `mesoamerican-ballgame-rise`     | Card year is -1400 but its prose dates the oldest rubber balls at El Manati to around 1600 BCE.                                                                                                                  | Prose paragraph one against the stored year.                                                                                                                                                                |
| `minoan-civilization-peak`       | Prose describes c. 2000 BCE growth and early palaces, never the peak the card window (-1700 to -1450) names.                                                                                                     | Prose opens "Around 2000 BCE, Knossos was already a crowded town" and ends with "the centuries around 2000 BCE".                                                                                            |
| `model-parliament-statutes`      | Slug says model parliament but the card is the First Statute of Westminster of 1275.                                                                                                                             | Slug against `friendly_name`, description and prose; a slug-only mislabel.                                                                                                                                  |
| `model-t-production-begins`      | Card year is 1909 but production began in 1908 (first car 27 September 1908), and the prose itself says August 1908; changing the year re-scores neighbours and needs a re-measured `deckBuilder.test.ts` bound. | Source: https://www.thehenryford.org/artifact/312908 (CONFIRMED_SOURCE).                                                                                                                                    |
| `moldboard-plow-adoption`        | This is a third card on the heavy northern plough beside heavy-plow and heavy-plow-adoption.                                                                                                                     | Its description and the heavy-plow description both say the heavy plough opened northern European clay soils, and both prose texts cite the Roman-era wheeled plough.                                       |
| `mongol-black-death-spread`      | The description states the Caffa catapulting as fact, and the title "Siege of Caffa" implies it.                                                                                                                 | The prose says the only account is one notary's second-hand story and that most historians doubt the corpses did much of the work.                                                                          |
| `mongol-invasion-hungary`        | Near-duplicate of `mongol-invasions-europe`, the same 1241 campaign and the same battle at Mohi.                                                                                                                 | Both records are dated 1241 and both descriptions name Mohi (the other also names Legnica).                                                                                                                 |
| `mughal-aurengzeb-expansion`     | The friendly_name misspells Aurangzeb as "Aurengzeb" (the slug does too, but only the name is player-visible).                                                                                                   | The description and prose on the same card spell it Aurangzeb.                                                                                                                                              |
| `nobel-prizes-first`             | Prose says the first prizes were handed out on 10 December 1900, but the first ceremony was 10 December 1901.                                                                                                    | Source: https://www.nobelprize.org/ceremony/from-the-first-nobel-prize-award-ceremony-1901/ (CONFIRMED_SOURCE).                                                                                             |
| `noodles`                        | The description says the noodles originated in Han Dynasty China and the year is 25 but the prose describes the c. 2000 BCE Lajia millet noodles.                                                                | The prose says the Lajia bowl was buried for roughly 4,000 years and pushes noodles back about two thousand years before any recipe.                                                                        |
| `orient-express-first-run`       | Description says the first journey ran from Paris toward Constantinople, but the prose says it ran only to Vienna and Constantinople came in October.                                                            | Description says "first journey from Paris toward Constantinople" and the prose says "not yet heading to Constantinople at all".                                                                            |
| `paddle-wheel-boat`              | The description says the boat was developed in China and the Roman Empire but the prose says the Roman design was never built.                                                                                   | The prose says the De Rebus Bellicis ox-powered paddle warship survives only as text and illustration, while the built Chinese ships are dated 418 and 552.                                                 |
| `palmares-republic-zumbi`        | The prose has a missing word: "Palmares grew from the 1605 by people who had escaped slavery".                                                                                                                   | The sentence lacks a noun such as "year" or "settlement" after "1605".                                                                                                                                      |
| `patolli-aztec-game`             | Card year is 200 CE but patolli is attested from about 200 BCE, so the sign is wrong (the slug also says Aztec for a pan-Mesoamerican game).                                                                     | CONFIRMED_SOURCE: its own prose says around 200 BCE, and https://en.wikipedia.org/wiki/Patolli dates Teotihuacan play to c. 200 BC.                                                                         |
| `plow-invented`                  | Description says the plow was invented in Mesopotamia, but the prose's earliest evidence is Kalibangan in the Indus Valley and it says the design did not start in one place.                                    | Description against prose paragraph two.                                                                                                                                                                    |
| `protractor`                     | The description presents angle-measuring instruments at -2200 but the prose says no protractor existed then.                                                                                                     | The prose opens "No instrument called a protractor existed in the third millennium BCE" and dates the graduated protractor to Greek and Islamic times.                                                      |
| `republic-florence-banking`      | Prose places the Bardi and Peruzzi near their height in the mid 13th century, but the card window is 1290-1345.                                                                                                  | Last prose sentence says "In the mid 13th century, though, they stood near the height", while its own paragraph has both houses ruined by Edward III's default.                                             |
| `shimazu-sengoku`                | Slug names the Shimazu clan but the card is the Onin War and start of the Sengoku period.                                                                                                                        | Record is "Sengoku Daimyo Wars Begin" (1467) and the prose never mentions the Shimazu.                                                                                                                      |
| `silk-trade-begins`              | Near-duplicate of `silk-road-established`, both being Zhang Qian's missions at year -130.                                                                                                                        | Both records are -130 and both descriptions credit Zhang Qian's missions with opening the Silk Road trade.                                                                                                  |
| `solar-impulse-2-circles-globe`  | Card is a single-year point at 2015 but the description says the flight finished in Abu Dhabi and the prose says that was July 2016, so a 2015 to 2016 window fits.                                              | Prose paragraph two; no `year_end` set.                                                                                                                                                                     |
| `song-blue-white-porcelain`      | The slug names the Song dynasty but the card (1320) is Yuan-era Jingdezhen porcelain.                                                                                                                            | The prose dates the classic style to around 1300 to 1320 and says Tang and earlier examples were not the famous ware.                                                                                       |
| `song-paper-money-system`        | Description says the Southern Song expanded paper money, but the card year 1024 and prose are the Northern Song government notes in Sichuan.                                                                     | Description says "The Southern Song dynasty expanded paper currency" while the prose says "in 1023 the Song government created an office" and notes appeared "the following year".                          |
| `stari-most-mostar`              | Prose has a garbled sentence, "rises 4 metres wide", for the bridge's height and width.                                                                                                                          | Prose paragraph two.                                                                                                                                                                                        |
| `statue-liberty`                 | Prose calls Joseph Pulitzer a Frenchman, but he was Hungarian-born and American.                                                                                                                                 | CONFIRMED_SOURCE: https://www.mentalfloss.com/history/how-joseph-pulitzer-saved-the-statue-of-liberty (born 1847 in Mako, Hungary; New York World publisher).                                               |
| `stiletto-three-piece-suit`      | Slug names a shoe but the card is the three-piece suit.                                                                                                                                                          | Record is "The Three-Piece Suit Debuts" (1666, Charles II) and the prose is entirely about the vest and coat.                                                                                               |
| `stirrup-invented`               | Description and year 322 give a paired stirrup, but the prose dates a single stirrup to about 302 and the earliest paired ones to 415.                                                                           | Year and description against prose paragraphs one and two.                                                                                                                                                  |
| `super-tornado-outbreak`         | The description says 148 tornadoes in 16 hours while the prose says 18 hours.                                                                                                                                    | The two texts on one card give different durations for the same outbreak.                                                                                                                                   |
| `sync-swim-olympic-1984`         | Prose says Canada's Carolyn Waldo won a first gold at Los Angeles, but Waldo took solo silver and Tracie Ruiz won both the solo and the duet with Candy Costie.                                                  | CONFIRMED_SOURCE: https://en.wikipedia.org/wiki/Synchronized_swimming_at_the_1984_Summer_Olympics.                                                                                                          |
| `tang-cosmopolitan-cities`       | Near-duplicate of `tang-luoyang-capital`, both being Chang'an at its eighth-century peak.                                                                                                                        | Both records are Chang'an with a million residents, and both prose entries use the same 108-ward grid and Heian-kyo copy detail (700 and 750).                                                              |
| `tang-luoyang-capital`           | Slug names Luoyang but the card is Chang'an (input lists it twice).                                                                                                                                              | Record is "Chang'an, Tang Capital" (700) and the prose describes Chang'an's 108 wards and modern Xi'an.                                                                                                     |
| `tasman-australia`               | The prose says Tasman sailed on "without landing on either" island, but he had a party land and plant a flag in Tasmania.                                                                                        | Wikipedia's Abel Tasman article records boats entering Blackman Bay on 2 December 1642 and a carpenter planting the Dutch flag on 3 December: https://en.wikipedia.org/wiki/Abel_Tasman (CONFIRMED_SOURCE). |
| `tikal-calakmul-war`             | Prose garbles the defeated Calakmul ruler as "Yik'in Chan K'awiil's rival Yuknoom Yich'aak K'ahk'", but Yik'in Chan K'awiil was Tikal's next king, the victor's son.                                             | Source: https://en.wikipedia.org/wiki/Jasaw_Chan_K%CA%BCawiil_I (CONFIRMED_SOURCE).                                                                                                                         |
| `toe-stirrup`                    | The card year is -500 but the prose dates the toe loop to late in the second century BC.                                                                                                                         | The prose gives its earliest documented instance in India late in the second century BC, about 350 years after the card.                                                                                    |
| `tutankhamun-fossil-coelacanth`  | The slug names Tutankhamun but the card is the 1938 coelacanth catch off South Africa.                                                                                                                           | Name, description and prose all describe Courtenay-Latimer's East London find with no Egyptian element.                                                                                                     |
| `vivaldi-four-seasons`           | Description says it was published in Venice, but the first edition (Op. 8, 1725) was printed in Amsterdam by Le Cene.                                                                                            | Source: https://en.wikipedia.org/wiki/Il_cimento_dell%27armonia_e_dell%27inventione (CONFIRMED_SOURCE).                                                                                                     |
| `westminster-crown-jewels-heist` | Description spells the thief Puddlicott while the prose spells him Pudlicott.                                                                                                                                    | Description against prose paragraph one.                                                                                                                                                                    |
| `wizard-of-oz`                   | Description says it premiered in Hollywood, but the first premiere was 12 August 1939 in Oconomowoc, Wisconsin, ahead of Grauman's Chinese on 15 August.                                                         | Source: https://wpr.org/film/wizard-oz-debuted-week-1939-not-hollywood-oconomowoc (CONFIRMED_SOURCE).                                                                                                       |
| `wokou-raiders-besiege-nanjing`  | Description says Japanese-led pirate bands, while the prose says mostly Chinese smugglers under a Japanese label.                                                                                                | Description against prose paragraph one.                                                                                                                                                                    |
| `womens-suffrage-nz`             | Prose sentence "twelve days after the law allowed enough time to register" is garbled.                                                                                                                           | The prose says women voted "that November, twelve days after the law allowed enough time to register", which reads as nonsense; the election was 28 November 1893.                                          |
| `zwicky-dark-matter`             | Card year is 1937 but the prose says Zwicky measured the Coma cluster in 1933.                                                                                                                                   | Year against prose paragraph one.                                                                                                                                                                           |

### Category misfits

| Slug                             | Current      | Better fit                                                                                                            |
| -------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| `african-union`                  | commerce     | diplomacy                                                                                                             |
| `air-jordan-sneakers`            | media        | commerce                                                                                                              |
| `alcatraz-federal-prison`        | revolution   | law                                                                                                                   |
| `archaic-period-greece`          | nature       | empires (reported twice)                                                                                              |
| `arianism-controversy`           | empires      | figures (no religion category)                                                                                        |
| `astrolabe-navigation`           | media        | invention                                                                                                             |
| `bach-death`                     | revolution   | figures (same for `mozart-dies`, `stalin-dies`, `queen-victoria-dies`)                                                |
| `ballet-de-cour-france`          | commerce     | art                                                                                                                   |
| `baroque-church-architecture`    | empires      | architecture                                                                                                          |
| `beguine-movement`               | agriculture  | figures (no religion category)                                                                                        |
| `belt-road-initiative`           | architecture | diplomacy                                                                                                             |
| `bikini-introduced`              | media        | craft                                                                                                                 |
| `bus-service`                    | media        | invention                                                                                                             |
| `champagne-region-bubbly`        | art          | craft                                                                                                                 |
| `chinese-foot-binding-begins`    | agriculture  | craft (dress and body practice, like the other fashion cards)                                                         |
| `cluny-abbey-founded`            | commerce     | architecture                                                                                                          |
| `diamond-mines`                  | agriculture  | craft                                                                                                                 |
| `distillation-techniques`        | art          | craft                                                                                                                 |
| `dodo-driven-extinct`            | disasters    | nature                                                                                                                |
| `donatist-controversy`           | empires      | figures (no religion category; `arianism-controversy`, `council-of-antioch` and `nestorian-schism` are the same case) |
| `edo-castle-architecture`        | art          | architecture                                                                                                          |
| `fatimid-al-azhar-mosque`        | commerce     | architecture                                                                                                          |
| `ferris-wheel-invented`          | media        | architecture                                                                                                          |
| `field-of-cloth-of-gold`         | warfare      | diplomacy                                                                                                             |
| `first-ascent-mont-blanc`        | migration    | sports                                                                                                                |
| `first-hamburger-served`         | agriculture  | commerce                                                                                                              |
| `first-hospital-byzantine`       | commerce     | medicine                                                                                                              |
| `first-labor-day`                | media        | commerce or law                                                                                                       |
| `first-maternity-hospital`       | commerce     | medicine                                                                                                              |
| `first-miss-america`             | commerce     | media                                                                                                                 |
| `first-nuclear-power-plant`      | media        | invention                                                                                                             |
| `first-public-library`           | commerce     | writing                                                                                                               |
| `first-stock-dividend-voc`       | media        | commerce                                                                                                              |
| `fischer-spassky-world-chess`    | warfare      | sports                                                                                                                |
| `ford-five-dollar-wage`          | media        | commerce                                                                                                              |
| `gastarbeiter-migration`         | trade        | migration                                                                                                             |
| `germanic-migration-period`      | empires      | migration                                                                                                             |
| `glass-lens-grinding`            | agriculture  | invention                                                                                                             |
| `globe-theatre-built`            | commerce     | architecture                                                                                                          |
| `great-leap-forward-famine`      | revolution   | disasters                                                                                                             |
| `guantanamo-bay-opens`           | revolution   | law                                                                                                                   |
| `guillotine-first-used`          | medicine     | law                                                                                                                   |
| `gulf-war`                       | revolution   | warfare                                                                                                               |
| `handloom-frame-loom`            | agriculture  | craft                                                                                                                 |
| `heidelberg-university`          | commerce     | science (all the university-founding cards sit in commerce, so this is a cluster decision)                            |
| `himalayas-rise`                 | empires      | nature                                                                                                                |
| `household-refrigerator-sold`    | media        | invention                                                                                                             |
| `imjin-war-turtle-ship`          | media        | warfare                                                                                                               |
| `india-first-railway`            | media        | architecture                                                                                                          |
| `instant-coffee-introduced`      | media        | invention                                                                                                             |
| `invention-sail`                 | migration    | invention (noticed while checking, not reported)                                                                      |
| `irish-potato-famine`            | revolution   | disasters                                                                                                             |
| `jonestown-massacre`             | revolution   | disasters                                                                                                             |
| `kalidasa-drama`                 | empires      | writing                                                                                                               |
| `khwarezm-al-biruni`             | architecture | science                                                                                                               |
| `khwarezm-center-learning`       | architecture | science                                                                                                               |
| `kongo-portuguese-contact`       | migration    | diplomacy                                                                                                             |
| `lindbergh-baby-kidnapping`      | revolution   | law                                                                                                                   |
| `live-aid`                       | disasters    | media                                                                                                                 |
| `louis-xiv-ballet`               | commerce     | art                                                                                                                   |
| `mahabharata-complete`           | architecture | writing                                                                                                               |
| `ministry-jesus-begins`          | commerce     | figures (no religion category exists)                                                                                 |
| `museum-alexandria-founded`      | commerce     | science                                                                                                               |
| `neanderthals-thrive-europe`     | agriculture  | nature                                                                                                                |
| `nitroglycerin`                  | medicine     | science                                                                                                               |
| `nylon-stockings-debut`          | media        | commerce                                                                                                              |
| `oj-simpson-trial`               | revolution   | law                                                                                                                   |
| `olduvai-tools-found`            | architecture | science                                                                                                               |
| `operation-chopper-vietnam`      | media        | warfare                                                                                                               |
| `ottoman-standing-army`          | commerce     | warfare                                                                                                               |
| `palmares-republic-zumbi`        | architecture | revolution                                                                                                            |
| `plants-colonize-land`           | agriculture  | nature                                                                                                                |
| `port-royal-convent`             | commerce     | figures (no religion category)                                                                                        |
| `pottery-wheel`                  | agriculture  | craft                                                                                                                 |
| `princess-diana-death`           | revolution   | disasters                                                                                                             |
| `prussian-discipline-training`   | commerce     | warfare (same for `military-academy-russia` and `sikh-khalsa-panth`, both commerce)                                   |
| `quaker-founding`                | commerce     | figures (no religion category)                                                                                        |
| `queen-victoria-dies`            | revolution   | figures                                                                                                               |
| `red-army-formed`                | commerce     | warfare                                                                                                               |
| `rite-of-spring`                 | revolution   | art                                                                                                                   |
| `roman-roads`                    | writing      | architecture                                                                                                          |
| `scots-reformation-movement`     | commerce     | revolution                                                                                                            |
| `siege-leningrad-lifted`         | architecture | warfare                                                                                                               |
| `soap-making-improvements`       | agriculture  | craft                                                                                                                 |
| `source-of-nile`                 | architecture | migration (where the other exploration cards sit)                                                                     |
| `spanish-pieces-of-eight`        | writing      | commerce (noticed while checking, not reported)                                                                       |
| `stirrup-development`            | agriculture  | warfare                                                                                                               |
| `submarine-first-practical`      | media        | invention                                                                                                             |
| `thatcher-becomes-pm`            | revolution   | figures (weak)                                                                                                        |
| `tin-extraction`                 | agriculture  | craft                                                                                                                 |
| `trial-of-socrates`              | revolution   | law                                                                                                                   |
| `trinity-nuclear-test`           | media        | warfare or science                                                                                                    |
| `tutankhamun-gold-sandals`       | architecture | craft                                                                                                                 |
| `us-supreme-court-first-session` | commerce     | law                                                                                                                   |
| `vasa-sinking`                   | revolution   | disasters                                                                                                             |
| `vending-machine`                | writing      | invention                                                                                                             |
| `white-ship-sinks`               | revolution   | disasters                                                                                                             |
| `womens-guilds`                  | art          | craft                                                                                                                 |
| `wren-st-pauls-cathedral`        | writing      | architecture                                                                                                          |
| `zeppelin-airship`               | media        | invention                                                                                                             |
| `zinc-production`                | agriculture  | craft                                                                                                                 |

### Raised, not verified

| Slug                                   | Claim                                                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aqua-vitae-distilled`                 | The attribution of aqua vitae to the medical school of Salerno rests on a weak tradition.                                                                                                                 |
| `boy-scouts-founded`                   | Card year 1910 is the incorporation of the Boy Scouts Association, while the prose puts the Brownsea camp in 1907 and Scouting for Boys in 1908, so the year may belong earlier.                          |
| `first-mobile-game`                    | The prose calls Hagenuk a Danish manufacturer and the reporter believes it was German; one search returned sources calling it Danish, which conflicts with the reporter's recollection, so it stays open. |
| `first-twenty20-match-2003`            | The venue of the first Twenty20 match (Rose Bowl versus Hove) is uncertain, though the region is the United Kingdom either way.                                                                           |
| `genghis-khan-stele-archery`           | The prose says the stele was found near the Kherlen river, while other sources place the find near Nerchinsk in Russia.                                                                                   |
| `guggenheim-bilbao`                    | The prose says titanium was cheap after a post-Cold War price collapse, which the reporter thinks is doubtful.                                                                                            |
| `kobe-81-point-game-2006`              | The prose says Chamberlain's 100-point mark predates shot clocks being tracked, which is muddled since the shot clock dates from 1954.                                                                    |
| `laker-nineteen-wickets-1956`          | The prose says Laker's 46 wickets remain an England record against Australia, which is doubtful.                                                                                                          |
| `maurya-ashoka`                        | Card year -250 sits about 13 years from the prose's 237 to 236 BCE date for the major pillar edicts, and that prose date itself looks late against Ashoka's reign.                                        |
| `peron-becomes-worlds-first-president` | The claim that Isabel Peron was the first woman president anywhere is disputed by earlier female heads of state such as Khertek Anchimaa-Toka and Sukhbaataryn Yanjmaa.                                   |
| `sonja-henie-first-olympic-gold`       | The prose sentence that Norwegian judges were not among those swayed is unsupported.                                                                                                                      |
| `transatlantic-slave-trade-begins`     | The card and prose anchor the whole Atlantic trade to Ayllon's 1526 voyage, which may overstate a start that earlier Portuguese and Hispaniola shipments precede.                                         |

## Player-visible `description` and `friendly_name` errors

Not year problems. Every one of these is text a player reads **before** placing the card, so an
edit has to stay date-free and clear `eventDateClues.test.ts`.

**Plainly wrong, name or fact:**

| Slug                                                   | The problem                                                                                                                                                                                            | Source               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| `ottoman-siege-galata`                                 | `friendly_name` says "Ottoman Siege of Galata"; its own `description` correctly describes Murad II besieging **Constantinople** in 1422. The description is right, the name is wrong                   | `e092492`            |
| `female-ruler-sargon`                                  | Names the woman ruling Kish "Enmersi" in both name and description. No source supports it; the figure matching every other detail (innkeeper, third dynasty of Kish, hundred-year reign) is **Kubaba** | `0243f2b`            |
| `boni-kingdom`                                         | Named "Boni Kingdom Southern Philippines". Boni / Po-ni is what Chinese sources called a state in **Borneo**; the name redirects to the history of Brunei. Wrong region in both fields                 | `aa9961b`            |
| `mali-maritime-expansion`                              | Names "Abu Bakr II", a 19th-century mistranslation of Ibn Khaldun; no such ruler                                                                                                                       | `4d56cef`            |
| `cyrillic-alphabet-created`                            | Credits Cyril and Methodius at 863. They devised **Glagolitic**; Cyrillic was built afterwards by their students at Preslav                                                                            | `2e9f546`            |
| `pottery-invented`                                     | Says the earliest ceramics were Japanese. **Xianren Cave** in China is several thousand years older                                                                                                    | `2e9f546`            |
| `battle-of-wei-qiao`                                   | Names and describes as a battle what the record has as the **Mayi ambush** of 133 BCE, a deception called off before any fighting                                                                      | `e092492`            |
| `code-of-lipit-ishtar`                                 | Calls a Sumerian code Akkadian                                                                                                                                                                         | `HANDOFF.md`         |
| `first-thomas-cup-1949`                                | Says Malaysia won; Malaysia did not exist until 1963. It was **Malaya**                                                                                                                                | `6e04b48`            |
| `owens-six-records-ann-arbor-1935`                     | Says five records and a tie; the sourced breakdown is **four** and a tie                                                                                                                               | `6e04b48`            |
| `school-lunch-program`                                 | Credits Sweden with pioneering school lunches in 1894. The record has means-tested meals into the 1930s, national subsidies from 1946, universal entitlement 1973                                      | `e35e0a6`            |
| `swahili-mombasa-rise` **and** `mombasa-coastal-power` | Both have Mombasa "rivaling Kilwa"; it was **part of** the Kilwa Sultanate until 1513. Two cards, same wrong relationship                                                                              | `27f6be5`, `e1bd4cc` |
| `aksumite-decline`                                     | Gives Islamic expansion as the cause; the record has several pressures, some predating Islam                                                                                                           | `aa9961b`            |
| `srivijaya-decline`                                    | Has Majapahit and Malacca succeeding directly; the Melayu kingdom at Jambi came between                                                                                                                | `0ace74e`            |
| `lunda-expansion-network`                              | Names copper, salt and slaves where the record documents tribute and an arms trade                                                                                                                     | `0ace74e`            |
| `lahaina-fire`                                         | Says 97 dead against the DNA-corrected **102**                                                                                                                                                         | `66efc07`            |
| `australia-bushfires`                                  | Says one billion animals against the later WWF-commissioned estimate near **three billion**                                                                                                            | `66efc07`            |
| `lightning-rod`                                        | Says Franklin invented the rod _after_ the kite experiment. He conceived it in 1749; the kite is 1752                                                                                                  | `5e33234`            |
| `lab-grown-burger`                                     | Says Mark Post "publicly tasted" it. He created it at Maastricht; it was cooked by Richard McGeown and tasted by Hanni Rützler and Josh Schonwald                                                      | `2b5c48c`            |
| `pneumatic-tire`                                       | Says Dunlop's tyre was for his son's **bicycle**; it was a tricycle                                                                                                                                    | `a29b670`            |

**Medicine — eight descriptions, one shard** (`ba53bc9`). Priority disputes and tidy origin
stories the record does not carry:

- `diphtheria-antitoxin-developed` credits Behring alone; the 1890 work was joint with Shibasaburo Kitasato.
- `chloroform-eases-childbirth` implies Simpson attended Victoria; it was **John Snow**.
- `blood-groups-transfusion-safe` dates the grouping 1907; Landsteiner grouped blood in **1901**, and 1907 is Ottenberg's first matched transfusion.
- `streptomycin-cures-tb` omits Schatz, who did the isolation and won legal recognition as co-discoverer.
- `pinel-reforms-asylums` has Pinel striking off the chains; the record credits attendant Jean-Baptiste Pussin, with Pinel adopting and publicising it.
- `trotula-women-medicine` has one female author; it is three texts, probably different authors, two likely male.
- `human-genome-completed` — the 2003 sequence still had gaps; a gapless genome came only in 2022.
- `first-liver-transplant` and `first-lung-transplant` are framed as pioneering successes; both patients died within weeks.

**Overstated or conflated, weaker cases** (`08a6d11`, `fa2da19`, `f049c97`, `0243f2b`, `27f6be5`,
`e95d4e3`, `4d56cef`, `bdd6d66`, `1ef3bc2`, `66efc07`, `115698f`):
`edict-milan` ("legalized Christianity"; it granted toleration, Theodosius I made it the state
religion in 380) · `treaty-wedmore` (Wedmore covered baptism and Guthrum's withdrawal; the Danelaw
boundary is the later Treaty of Alfred and Guthrum) · `china-un-seat` (Resolution 2758 concerned
the General Assembly seat; the Security Council seat transferred with it) ·
`visigothic-spain-establishment` (the 418 grant was Aquitaine only; Iberia came later by conquest) ·
`treaty-of-aachen` (frames 812 as one clean recognition; it withheld "emperor of the Romans") ·
`swahili-city-states` (implies significant slave trading at a date the record puts mostly after the
18th century) · `docks` (-2556; the Lothal dock reading is contested, Wadi al-Jarf is older, and the
card's year matches Wadi al-Jarf rather than the Lothal it names) · `copper-pipes` ("water over long
distances"; the Sahure temple pipe at Abusir is a waste pipe — the year is right) ·
`song-color-printing` ("separate woodblocks for each colour" is douban, a Ming technique) ·
`first-greenhouse` ("Italian monks"; the literature has Roman specularia and a 15th-century Korean
heated greenhouse) · `terrace-farming-andes` / `inca-terrace-agriculture` · `first-thermometer`
(credits Galileo) · `sulfuric-acid-production` (credits German alchemists) ·
`glass-composition-improvements` (dates cristallo to 1600) · `tokugawa-rice-standardization`
(credits the Tokugawa) · `turbine-wheel-concept` (places Segner's reaction wheel in France; it was
Göttingen) · `rubber-cultivation-begins` (calls Wickham's seed export smuggled; no Brazilian law
banned it and the theft narrative is largely mythologised) · `pliocene-epoch-begins` (says the
Pliocene is when hominins appeared; Sahelanthropus and Orrorin are late Miocene) ·
`first-birds-archaeopteryx` (implies Archaeopteryx is the first bird) · `recurved-bow-design`
(credits Central Asian nomads; evidence points to Bronze Age Anatolia or Mesopotamia) ·
`domestication-llama-alpaca` (implies one event; different wild ancestors in different ecozones) ·
`virchow-cellular-pathology` (_omnis cellula e cellula_ is Raspail's phrase) · `candle-invented`
(implies an Egyptian origin the object record does not support) · `english-pound-sterling-origin`
("Pound Sterling Standardized" at 1158 overstates; the Tealby reform fixed the standard but the term
predates it) · the contested-toll set in `disasters`, where the description repeats a familiar round
number the prose now separates and attributes: `syria-earthquake-medieval`, `shaanxi-earthquake`,
`banqiao-dam`, `aleppo-earthquake`, `ashgabat-earthquake`.

## Duplicate cards

Same event carried twice or more (`e1bd4cc`, `0ace74e`):

- `medici-banking` / `medici-banking-innovations` — both Giovanni di Bicci founding the bank in Florence, 1397
- `tokugawa-sakoku-isolation` / `sakoku-edicts-isolation`
- `lunda-expansion-network` / `lunda-empire-formation`
- `oyo-empire-expansion` / `yoruba-oyo-confederation`
- `buganda-kingdom` / `buganda-kabaka-succession` / `buganda-kabaka-system`

Removals go to `deprecated.json` rather than being deleted — see [../dedup/index.md](../dedup/index.md).

## Slug-only mislabels

**Not player-visible.** `friendly_name` and `description` are correct in every one; only the slug
describes a different event. The slug is the key in the detail shards, `dailyRecency` and the
curated theme lists, so renaming one is a wider change than it looks (`115698f`).

| Slug                          | Actually                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| `gold-rush-currency-clipper`  | "Comstock Lode Silver Strike", 1859, Nevada silver — the original of this class         |
| `tuvalu-mausoleum-built`      | The Gur-e-Amir in Samarkand                                                             |
| `songhai-djinguereber-mosque` | A Mali-empire event, built under Mansa Musa in 1327; Songhai took Timbuktu only in 1468 |
| `siege-of-damascus-636`       | Correctly stored at 634, the year the city fell                                         |
| `wang-xifeng-calligraphy`     | Wang Xizhi                                                                              |
| `hospital-of-st-lawrence`     | Santo Spirito                                                                           |
| `zhouyuan-sogdian-outpost`    | Unsupported entirely — see the wrong-year table                                         |

## Noted and deliberately left

- **`god-emperor-golden-throne`** is Warhammer 40,000 lore dated to year 30000, `very-hard`, in an
  otherwise historical catalogue. Almost certainly a deliberate easter egg; its prose reports the
  fiction plainly rather than carrying a disclaimer about the data (`545580d`).
- **Category oddities**, weak evidence given the June 2026 re-clustering, and not this work's to
  re-tag: `gunpowder-europe` in `agriculture`; `dresden-bombing` and `east-german-uprising` in
  `revolution`; `zoroaster-teaches`, `buddha-enlightenment`, `black-lives-matter-founded`,
  `israel-founded` and `first-un-general-assembly` in `commerce`; `berlin-airlift` in `revolution`.
