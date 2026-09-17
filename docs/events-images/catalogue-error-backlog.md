# Catalogue error backlog

Event records whose own `year`, `friendly_name` or `description` the sources do not support,
found while writing the long-form detail prose for all 5,460 events (Phase 3, 2026-09).

**Why this file exists.** The writers read a source for every entry, so they read 5,460 event
records against the record more closely than anything else ever has. What they found was reported
in ~35 commit messages and in a branch-scoped `HANDOFF.md` that is deleted when the event-detail
branch merges. This file is where that survives. It is a backlog, not a change log: almost nothing
here has been acted on.

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

Three years were corrected during Phase 3. They are in the catalogue; nothing else was changed.

| Slug                    | Change            | Evidence                                                                                                                                           |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `crispr-human-therapy`  | 2020 → **2019**   | Victoria Gray's exa-cel infusion, 2 July 2019 (`746fb01`)                                                                                          |
| `chickens-domesticated` | -6000 → **-1500** | Peters et al. 2022 (PNAS) re-dated the proposed earliest finds; earliest unambiguous domestic remains at Ban Non Wat, c. 1650-1250 BCE (`a7d4628`) |
| `battle-of-mu-ta`       | 628 → **629**     | 1 Jumada al-Awwal 8 AH = September 629; 628 has no support (`e092492`)                                                                             |

## Wrong year: the card's own text describes an event the record dates elsewhere

These are the strongest year candidates. In each the `friendly_name` and `description` name a
specific thing, and the record puts that thing at a different date — so the card is not merely
imprecise, it is pointing at the wrong moment.

| Slug                               | Stored | The record                                                                                                                                                    | Source commit |
| ---------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `university-paris-founding`        | 1200   | The card says "received formal papal recognition". 1200 is Philip II Augustus's **royal** charter; papal recognition is 1215, Robert de Courçon's statutes    | `545580d`     |
| `songhai-scholars`                 | 1510   | Names Ahmad Baba, who lived 1556-1627                                                                                                                         | `545580d`     |
| `soga-kingdom`                     | 1400   | No centralised Busoga kingdom before a British-installed Kyabazinga in **1906**                                                                               | `e1bd4cc`     |
| `xicalanco-trade-port`             | 1000   | Description has the port linking Maya and **Aztec** networks; the Aztec Empire dates from 1428                                                                | `aa9961b`     |
| `dahomey-rise-power`               | 1718   | Credits "Agaja's predecessors" — 1718 is inside Agaja's own reign, from 1708                                                                                  | `0ace74e`     |
| `defibrillator`                    | 1939   | No device at that year: Prévost and Batelli 1899 (animal), Kouwenhoven c. 1930 (external), Beck 1947 (first human use)                                        | `acbfcb7`     |
| `social-media`                     | 1996   | SixDegrees.com launched 1997                                                                                                                                  | `acbfcb7`     |
| `bayer-process`                    | 1887   | The patent is 1888                                                                                                                                            | `acbfcb7`     |
| `robotic-exoskeleton`              | 1960   | Hardiman began in 1965                                                                                                                                        | `acbfcb7`     |
| `capsule-endoscopy`                | 1999   | Concept early 1980s, first prototype swallowed 1997, PillCam approved 2001; nothing at 1999                                                                   | `acbfcb7`     |
| `float-glass-process`              | 1952   | Pilkington developed it 1953-1957, first profitable 1960                                                                                                      | `acbfcb7`     |
| `ramjet-engine`                    | 1907   | Lorin's patent is 1913, and describes a piston engine with exhaust trumpets                                                                                   | `acbfcb7`     |
| `blueprint`                        | 1840   | Every source dates Herschel's cyanotype to 1842                                                                                                               | `344cb43`     |
| `painting-canvas`                  | 1300   | Earliest surviving canvas oil painting c. 1410; canvas uncommon before the 16th century                                                                       | `344cb43`     |
| `double-entry-bookkeeping`         | 1200   | Earliest documented double-entry ledger is Amatino Manucci's Farolfi accounts, 1299-1300                                                                      | `344cb43`     |
| `handgun-first-use`                | 1364   | No Battle of Perugia exists, and European handheld firearm use is documented from 1331 at Cividale del Friuli — wrong on both counts                          | `344cb43`     |
| `veterinary-school`                | 1762   | The Lyon school was founded 1761                                                                                                                              | `bdd6d66`     |
| `selective-breeding-animals`       | 1700   | Robert Bakewell was born in 1725                                                                                                                              | `bdd6d66`     |
| `hydrochloric-acid-production`     | 1700   | Glauber's method is 1648                                                                                                                                      | `bdd6d66`     |
| `long-distance-travel-improvement` | 1700   | The journey-time evidence is 1750-1800                                                                                                                        | `bdd6d66`     |
| `zanzibar-clove-cultivation`       | 1818   | The plantation expansion is 1840s under Seyyid Said; the "leading exporter" claim could not be confirmed                                                      | `bdd6d66`     |
| `winnowing-tray-fan`               | -2000  | The one well-documented device is the Chinese rotary fan in Wang Zhen's _Nong Shu_, 1313 CE                                                                   | `1ef3bc2`     |
| `clausius-entropy`                 | 1850   | 1850 is the second law; entropy was coined in 1865                                                                                                            | `1ef3bc2`     |
| `sikh-empire-ranjit-singh`         | 1799   | 1799 is the capture of Lahore; the empire dates from the 1801 coronation                                                                                      | `e35e0a6`     |
| `pre-revolution-debt-crisis`       | 1786   | The Assembly of Notables met in 1787                                                                                                                          | `e35e0a6`     |
| `library-system`                   | 1848   | 1848 is the enabling statute; the reading room opened 1854                                                                                                    | `e35e0a6`     |
| `gupta-empire`                     | 320    | The dynasty was founded c. 240 by its namesake; 320 is Chandragupta I's accession                                                                             | `08a6d11`     |
| `compound-air-compressor`          | 1829   | No source supports a named first device at this date; the year is unverifiable                                                                                | `344cb43`     |
| `solid-state-lidar`                | 2010   | No company or year marks its invention                                                                                                                        | `acbfcb7`     |
| `inca-quipu-standardized`          | 1460   | No standardisation event is attested at all                                                                                                                   | `e1bd4cc`     |
| `deccan-sultanates`                | 1500   | No single event exists at this date                                                                                                                           | `e1bd4cc`     |
| `zhouyuan-sogdian-outpost`         | —      | Could not be supported at all: Zhouyuan is a Western Zhou Bronze Age site, not a Tang-era Sogdian one. Probably a mislabelled slug rather than a fixable date | `aa9961b`     |

## Imprecise year: a round date outside its evidence window

**Judgement calls, not errors.** Each is a round year standing in for a process, a reign or a
floruit the record places elsewhere. Changing them is optional and in several cases there is no
better single year to move to. Listed so nobody re-derives them.

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
