# The Lost & Found theme

A 35-card curated theme about recovery: things that were buried, sunk or forgotten and then
found again, and scripts that died and were read again. It runs from a pharaoh digging the
Sphinx out of the sand to a king dug out of a Leicester car park.

## The scope rule

An event is in only if **something buried, sunken or forgotten was found again, or a dead
script was read again**. Excavations, tomb openings, wreck discoveries, manuscript
rediscoveries, decipherments.

Two exclusions do most of the work:

- **The loss is not the find.** Pompeii being buried is a volcano card; Pompeii being
  _rediscovered_ is a Lost & Found card. The catalogue is full of the first kind and the sweep
  drags them in — `dead-sea-scrolls-written` (150 BCE), `terracotta-army` (210 BCE),
  `sutton-hoo-burial` (625), `behistun-inscription-carved` (520 BCE), `antikythera-mechanism`
  (300 BCE) are all the moment of burial or manufacture, and all are out. Where the find was
  the better card and did not exist, it was written: `sutton-hoo-excavated` is a new card
  standing alongside, not replacing, the burial card. The Terracotta Army's find card already
  existed as `terracotta-warriors-discovered` — see the correction at the end of this note.
- **First contact and exploration are not rediscovery.** Reaching a place nobody in your
  culture had reached is a different theme; returning to a place that had been abandoned and
  forgotten is this one. `machu-picchu-discovered` and `petra-rediscovered` sit on the right
  side of that line because both sites were derelict and lost to the outside record;
  circumnavigations and landfalls are not here at all.

The **card year is the year of the finding**, never the year of the thing found. That is the
structural problem the deck has to solve, and the reason for the shape of the list below: left
alone, a rediscovery deck is a 1700-2000 deck with nothing before it.

## The 35

Paste as `eventNames` into the workflow's `theme` input.

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
| -1400 | `sphinx-cleared-from-sand`         | foothold · NEW |
|  -622 | `temple-scroll-found-josiah`       | foothold · NEW |
|  -550 | `nabonidus-excavates-ur`           | NEW            |
|  -150 | `confucian-classics-found-in-wall` | NEW            |
|   279 | `bamboo-annals-recovered`          | NEW            |
|   326 | `golgotha-excavated`               | foothold · NEW |
|   832 | `mamun-opens-great-pyramid`        | NEW            |
|  1070 | `justinian-digest-rediscovered`    | NEW            |
|  1345 | `petrarch-finds-cicero-letters`    | NEW            |
|  1417 | `poggio-recovers-lucretius`        | NEW            |
|  1480 | `domus-aurea-rediscovered`         | NEW            |
|  1506 | `laocoon-unearthed`                | NEW            |
|  1578 | `roman-catacombs-rediscovered`     | NEW            |
|  1709 | `herculaneum-well-discovery`       | NEW            |
|  1748 | `pompeii-excavation-begins`        |                |
|  1799 | `rosetta-stone`                    | foothold       |
|  1812 | `petra-rediscovered`               | NEW            |
|  1822 | `hieroglyphics-decoded`            |                |
|  1837 | `brahmi-script-deciphered`         | NEW            |
|  1847 | `nineveh-palace-excavated`         | NEW            |
|  1857 | `cuneiform-deciphered`             | NEW            |
|  1871 | `troy-discovered`                  |                |
|  1879 | `altamira-paintings-found`         | NEW            |
|  1900 | `knossos-palace-excavated`         | NEW            |
|  1911 | `machu-picchu-discovered`          | foothold       |
|  1922 | `tutankhamun-tomb`                 | foothold       |
|  1939 | `sutton-hoo-excavated`             | NEW            |
|  1947 | `dead-sea-scrolls`                 |                |
|  1952 | `linear-b-deciphered`              | NEW            |
|  1960 | `maya-glyphs-deciphered`           | NEW            |
|  1974 | `terracotta-warriors-discovered`   | foothold       |
|  1985 | `titanic-wreck-found`              | foothold       |
|  1991 | `otzi-iceman-discovered`           |                |
|  2000 | `thonis-heracleion-found`          | NEW            |
|  2012 | `richard-iii-grave-found`          | NEW            |

26 of the 35 are new. Read the current band and spread figures from the catalogue rather than
from here — a card's band moves whenever the catalogue around its year does:

```bash
node scripts/theme-gap.js --slugs <the 35 above, comma-separated>
```

At authoring time: size 35, spread **8/8** bins `[3 4 3 3 7 6 4 5]`, band 0 **8**, same-year
pairs **0**.

## The footholds, and why the ancient half exists

Eight cards land in band 0. Five are the obvious ones — `rosetta-stone`,
`machu-picchu-discovered`, `tutankhamun-tomb`, `terracotta-warriors-discovered`,
`titanic-wreck-found` — globally famous finds that carry an `easy` label and sit in stretches
the catalogue does not crowd.

The other three are **`sphinx-cleared-from-sand` (-1400)**, **`temple-scroll-found-josiah`
(-622)** and **`golgotha-excavated` (326)**. None of them is a famous _archaeological_ moment;
all three are band 0 anyway, because band 0 blends the difficulty label with how crowded the
timeline is around the year, and pre-1000 the catalogue is sparse enough that a `medium` label
scores into the easiest global quartile. Every one of the theme's seven pre-1000 cards would be
band 0 or band 1 on a `medium` grade; they are graded honestly (`hard`, `very-hard` where the
recognition really is expert-only) and three of them still carry the opening hand.

That is the whole reason the ancient half of this deck was written rather than found. A
rediscovery theme assembled from the catalogue is a **1700-2000 deck**, and 1700-2000 is the
most crowded stretch of the timeline there is — so an all-modern Lost & Found deck has almost
no footholds and no early bins. Ancient rediscoveries are what fix both problems at once, and
they exist: Nabonidus dating a foundation deposit under a ruined temple, a lost law scroll
turning up in a Temple repair, the Confucian classics recovered from a wall after the Qin
burnings, a Warring States chronicle spilling out of a robbed tomb, a caliph tunnelling into
the Great Pyramid. Seven cards before 1000 CE, all authored, three of them footholds.

The two Renaissance recovery cards (`petrarch-finds-cicero-letters`, `poggio-recovers-lucretius`)
and the Bologna recovery of Justinian's Digest do the same job for bins 2 and 3, which a
find-year deck would otherwise leave empty.

## Deliberate omissions

- **Same-year collisions.** `lucy-discovered` (1974) shares its year with the discovery of the
  Terracotta Army, which is the more famous find and a foothold; Lucy is out and the hominin
  strand goes with it. The Antikythera wreck, Evans at Knossos and the sealing-up of the
  Dunhuang library cave are **all 1900** — Knossos was written and the other two dropped. The
  Denisovans (2010) collide with Richard III (2012), and Nefertiti's bust (1912) with Machu
  Picchu (1911).
- **Near-year crowding.** `venus-de-milo-discovered` (1820) sits two years from
  `hieroglyphics-decoded`, so it is out despite being a clean fit. `neanderthal-fossil-found`
  (1856) is one year from the cuneiform decipherment and lost the coin toss to a decipherment
  the scope rule names explicitly. `java-man-discovered` (1891) fits the same slot as the
  Neanderthal card and was dropped with it, which also keeps the deck to archaeology rather than
  palaeoanthropology. George Smith reading the Gilgamesh flood tablet (1872) is one year off
  `troy-discovered`; Nag Hammadi (1945) is two years off the Dead Sea Scrolls; Lascaux (1940) is
  one year off Sutton Hoo, so Altamira (1879) carries cave art instead; Vasa raised (1961) is one
  year off the Maya decipherment. The two pairs that remain — Dead Sea Scrolls to Linear B (5
  years) and Titanic to Ötzi (6) — are four canonical cards and no substitution improves them.
- **Burial cards rejected in favour of a new find card.** `sutton-hoo-burial` (625),
  `terracotta-army` (210 BCE), `dead-sea-scrolls-written` (150 BCE),
  `behistun-inscription-carved` (520 BCE) and `antikythera-mechanism` (300 BCE) are all the
  making or the losing, not the finding. `sutton-hoo-excavated` was written to pair with the
  first; the Terracotta Army's find card already existed as `terracotta-warriors-discovered`.
  The others have no finding-card in this deck.
- **Keyword false positives** the sweep dragged in: `steam-shovel`, `tunnelling-shield`,
  `carbon-14-discovered` (a dating method, not a find), `california-gold-rush` and
  `klondike-gold-rush`, `eris-discovery`, `library-congress-established`, `first-public-library`,
  the whole monastic-manuscript strand (`book-of-kells`, `lindisfarne-gospels`,
  `monasteries-manuscript-preservation`) which is copying rather than recovery, and the
  palaeontology strand (`anning-finds-ichthyosaur`, `dinosaur-fossils`, `cuvier-proves-extinction`,
  `archaeopteryx-discovered`, `chicxulub-crater-confirmed`) which is a different theme.

## Still missing from the catalogue

Real gaps, not filler, each blocked by a collision rather than by not being worth a card:

- **The Gilgamesh flood tablet read aloud (1872)** — arguably the single most vivid "dead script
  speaks" moment there is, one year from `troy-discovered`.
- **The Dunhuang library cave (1900)** and **the Antikythera wreck (1900)**, both beaten by
  Knossos; the Antikythera mechanism's X-ray decoding (2006) would sit six years from two
  neighbours.
- **Nag Hammadi (1945)**, **Lascaux (1940)**, **Chauvet (1994)**, **the Vasa raised (1961)**,
  **the Mary Rose raised (1982)**, **the tomb of Philip II at Vergina (1977)**, **Mawangdui
  (1972)**, **Sanxingdui (1986)**, **Khufu's solar boat (1954)**, **the Codex Sinaiticus (1844)**
  and **the Denisovans (2010)** — every one of them lands within a few years of a card already in
  the 35. A second Lost & Found day, dealt from a different set of these, is the obvious use for
  them.
- **Hittite deciphered (1915)** and **Ugaritic deciphered (1930)** would round out the
  decipherment strand; both crowd `machu-picchu-discovered` and `tutankhamun-tomb`.
- Nothing here covers **rediscovery outside Eurasia and Egypt** before the modern era. Great
  Zimbabwe, Ubar and the Benin bronzes are all entangled with colonial "discovery" narratives
  that the scope rule's first-contact exclusion is there to keep out; a card that works would
  need to be about the site, not the visitor.

## A correction made at merge

`terracotta-army-discovered` was authored on the finding that the catalogue held only the
burial (`terracotta-army`, 210 BCE) and not the discovery. That was wrong: the discovery
already existed as **`terracotta-warriors-discovered`** (1974, illustrated) — in
`candidates.json`, which is easy to overlook because the `add-events` skill describes it as a
staging file. It is in `manifest.json`, so its events are live and playable like any other.

The deck now points at the existing card. `sutton-hoo-excavated` was re-checked the same way
and is genuinely new — the catalogue holds only `sutton-hoo-burial` (625).
