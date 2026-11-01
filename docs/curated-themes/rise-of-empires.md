# The Rise of Empires theme

A 30-card curated theme on the founding of great empires, from Sargon's Akkad to the German
Empire, one card per empire and every inhabited continent but Oceania represented. This note is
why these 30 and not others.

## The scope rule

An event is in only if **it is the founding of a great empire**, dated to the founding itself or
to its founder's first conquest.

- **One beat per empire.** Each card is the moment an empire began. Its rulers, its high points
  and its fall belong to that empire's own theme: The Roman Story, Mandate of Heaven, Sublime
  Porte, Peacock Throne, Caliphates. That is why the overlap with each neighbour is a single
  card.
- **A founder's first conquest counts as the founding** when the empire has no cleaner start.
  `alexander-invades-persia-granicus` (334 BC) and `hammurabi-babylon-rise` (1792 BC) are dated
  this way, as are the reused `timur-tamerlane-conqueror` and `inca-empire-expansion`.

Edges the reconciler argued rather than assumed, all cut:

- **The Delian League** (478 BC) is an alliance that Athens turned into a hegemony, not a
  founded empire, and the weakest scope fit on the spine.
- **Portugal at Ceuta** (1415), **Cortés in Mexico** (1519) and **Jamestown** (1607) are the
  start of overseas expansion, the conquest of someone else's empire, and a colony. None is a
  founding.
- **Peter the Great's imperial title** (1721), **Napoleon's coronation** (1804) and **the Meiji
  Restoration** (1868) are a ruler's new title or a restoration. They belong to the later story
  of a state that already existed.
- **The Han** (202 BC) belongs to Chinese Dynasties and crowds the Qin decade. **The Abbasids**
  (750) belong to Caliphates, with the Umayyads kept as the caliphal founding. **The Solomonic
  dynasty** (1270) is a dynasty change and the least famous beat. **Sunni Ali's Songhai**
  (1468) was the least famous beat left, and it was cut on fame.

## The 30

|  Year | Slug                                 |                |
| ----: | ------------------------------------ | -------------- |
| -2334 | `sargon-akkad-empire`                | foothold       |
| -1792 | `hammurabi-babylon-rise`             | foothold · NEW |
| -1550 | `new-kingdom-egypt-begins`           | foothold       |
|  -911 | `assyrian-empire-expansion`          | foothold       |
|  -626 | `nabopolassar-neo-babylonian-empire` | foothold · NEW |
|  -550 | `achaemenid-empire-persia`           | foothold       |
|  -334 | `alexander-invades-persia-granicus`  | foothold · NEW |
|  -322 | `maurya-empire`                      |                |
|  -247 | `arsaces-founds-parthian-empire`     | foothold · NEW |
|  -221 | `qin-unification`                    | foothold       |
|  -209 | `modu-shanyu-xiongnu-empire`         | foothold · NEW |
|   -27 | `roman-empire-founded`               | foothold       |
|   224 | `sasanian-empire-persia`             | foothold       |
|   320 | `gupta-empire`                       |                |
|   661 | `umayyad-caliphate`                  | foothold       |
|   800 | `charlemagne`                        | foothold       |
|   802 | `khmer-empire`                       |                |
|   962 | `holy-roman-empire`                  | foothold       |
|  1037 | `seljuk-empire-founded`              |                |
|  1206 | `genghis-khan`                       | foothold       |
|  1235 | `mali-empire-establishment`          |                |
|  1299 | `ottoman-empire-founded`             | foothold       |
|  1336 | `vijayanagara-empire`                |                |
|  1370 | `timur-tamerlane-conqueror`          |                |
|  1428 | `aztec-empire`                       | foothold       |
|  1438 | `inca-empire-expansion`              | foothold       |
|  1501 | `safavid-dynasty-founded`            |                |
|  1526 | `mughal-babur-founds`                | foothold       |
|  1816 | `shaka-zulu-kingdom`                 |                |
|  1871 | `german-unification`                 |                |

25 of the 30 were already in the catalogue. The 5 new cards fill the ancient Near East and the
steppe: Babylon twice, Alexander, Parthia and the Xiongnu.

Gates: size **30**, band 0 **20**, bins **6/8** (advisory), same-year pairs **0**, bunching
**2 in 800-802**, largest overlap **1** (nations-of-europe, chinese-dynasties, pharaohs, rome,
ottomans and the-caesars each share one card). A card's band moves whenever the catalogue
around its year does, so re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap rise-of-empires
```

## Known crowding kept on purpose

`charlemagne` (800) and `khmer-empire` (802) sit two years apart, which `theme-gap` flags.
They are on opposite sides of the world, and either cut would lose Europe's or Southeast Asia's
only medieval founding.

## Fact-check flags

The fact check marked all 5 new cards `ok`, with no `fix` or `unsupported` verdicts. Two dates
are traditional rather than certain:

- `arsaces-founds-parthian-empire`: 247 BC is the conventional Arsacid epoch. Some scholars
  date the seizure of Astabene, or Parthia, nearer 238 BC. The detail prose presents 247 as the
  epoch, not as the date of the conquest.
- `modu-shanyu-xiongnu-empire`: 209 BC rests on Sima Qian, who wrote about a century later.
