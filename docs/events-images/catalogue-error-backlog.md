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
5,205 un-ranged events**: 644 now carry a window, 4,807 are recorded in
`scripts/events/year-range-decided.json` as moments with a reason each, and 9 are genuinely
unresolved (below). What the readers found that a window cannot fix is recorded here.

### Nine cards left unresolved, deliberately

Each had a year move proposed and rejected. None is a "moment" verdict, so none is in the
decided ledger and the report script still counts them.

- `lapita-pottery-trade`, `poverty-point-earthworks` — both stored years are on the "checked and
  judged defensible as stored" list above. A writer re-proposing one is a false positive.
- `bantu-expansion-africa`, `bantu-expansion`, `silk-road-trade` — each was proposed at the start
  of the whole phenomenon, but the cards' own descriptions say "carrying iron-working",
  "completed centuries of migration" and "Flourishes". The card's claim is not the founding.
- `gupta-golden-age`, `nok-civilization-nigeria`, `tiwanaku-monumental-center`,
  `swahili-stone-architecture` — each reviewed twice against sources that put the window's start
  more than fifty years apart (Nok by 600 years). Where two sourced readings disagree that far
  the record is not settled enough to move an anchor that moves daily decks.

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

### Rejected for want of a source, not on the merits

The session's WebSearch budget is a single pool shared by every agent in it, and this sweep
drained it partway through the cultural shard. Until the writers switched to WebFetch, a run of
genuinely period-shaped cards was rejected because nothing could be checked. These are not
moment verdicts and deserve a re-run: `king-david-rules`, `trojan-war`,
`kingdom-kush-flourishes`, `chola-dynasty-expansion`, `timbuktu-learning-center`,
`peter-great-modernizes`, `akhenaten-religious-revolution`, `picasso-blue-period`,
`abstract-expressionism`, `moche-civilization`, `chavin-culture`, `fremont-culture`,
`nazca-pottery`, `goguryeo-tomb-murals`, `tang-poetry-golden-age`, `umayyad-mosaic-art`,
`islamic-calligraphy`, `adena-culture`, `kushana-buddhism`, `zagwe-rock-churches`,
`haida-totem-poles`, `bharatanatyam-tradition`, `mycenaean-warrior-art`, `igbo-ukwu-bronzes`,
`yoruba-ife-kingdom`, `mississippian-culture`, `champa-hindu-culture`, `mixtec-codices`,
`goryeo-celadon-pottery`, `bukhara-samanid-scholars`, `troubadour-tradition`,
`baroque-period-peak`, `tokugawa-edo-period-culture`, `ukiyo-e-art-development`,
`safavid-textile-arts`, `safavid-miniature-painting`, `kathak-classical-dance`,
`kuba-royal-masks`.

Writers with budget also flagged these as plausible but unbounded on one pass:
`gin-craze-london`, `vietnamese-nam-vu`, `oyo-empire-expansion`, `kilwa-sultanate`,
`mali-decline`, `genoese-trade-network`, `pax-mongolica-trade`, `mutapa-empire`,
`petra-nabataean-trade`, `kuba-kingdom`, `dutch-naval-dominance`, `hoysala-dynasty`,
`goryeo-dynasty`, `novgorod-republic`.

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
