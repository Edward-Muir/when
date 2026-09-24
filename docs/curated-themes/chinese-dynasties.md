# The Mandate of Heaven theme

A 36-card curated theme spanning the whole of Chinese imperial history, from the semi-legendary
Xia to Puyi's abdication in 1912. This note is why these 36 and not others.

## The scope rule

A card is in only if it is **a Chinese dynasty's founding, its defining peak act (by a ruler or
the court), or its fall** — Xia/Shang to the end of the Qing.

Edges argued rather than assumed:

- **`wang-mang-usurps-han`** is in as the fall of Western Han, even though the interregnum it
  opens (Wang Mang's own Xin dynasty) never appears as its own card — Xin never gets a founding
  _or_ fall beat here, because nothing distinguishes it from the fall/restoration pair that
  already bracket it (`wang-mang-usurps-han` and `han-dynasty`'s own restoration are one story).
- **`silk-trade-begins`** (Zhang Qian's mission) is in as a defining peak act of the Han court —
  a state-sponsored act of the imperial court, not merely a trade development, which is what
  keeps it inside the rule that a battle or a treaty needs a court or ruler behind it.
- **`macartney-mission-rebuffed`** is in on the same reading: refusing a foreign trade mission is
  an act _of the court_, not an event that merely happens to a dynasty.
- **`princess-wu-empress`** (Wu Zetian) is in even though her own Zhou dynasty is a footnote —
  the spine's own reasoning holds: seizing the throne is the defining peak act of imperial rule
  in the Tang era, whichever dynastic name she gave it.

## The 36

|  Year | Slug                           |                |
| ----: | ------------------------------ | -------------- |
| -2070 | `xia-dynasty`                  | foothold       |
| -1600 | `shang-dynasty-established`    | foothold       |
| -1046 | `establishment-zhou-dynasty`   | foothold       |
|  -221 | `qin-unification`              | foothold       |
|  -213 | `qin-book-burning`             | foothold       |
|  -206 | `han-dynasty`                  | foothold       |
|  -130 | `silk-trade-begins`            | foothold       |
|     9 | `wang-mang-usurps-han`         | NEW            |
|   184 | `yellow-turban-rebellion`      |                |
|   208 | `battle-red-cliffs`            | foothold · NEW |
|   220 | `fall-han-dynasty`             |                |
|   280 | `sima-yan-jin-unification`     |                |
|   316 | `fall-western-jin`             |                |
|   609 | `grand-canal-china`            |                |
|   618 | `tang-dynasty`                 |                |
|   690 | `princess-wu-empress`          | foothold       |
|   755 | `an-lushan-rebellion`          |                |
|   907 | `fall-tang-dynasty`            | foothold       |
|   960 | `song-dynasty`                 | foothold       |
|  1127 | `jin-forces-sack-kaifeng`      | NEW            |
|  1271 | `yuan-khanate-founded`         | foothold       |
|  1279 | `mongol-khubilai-conquest`     |                |
|  1351 | `red-turban-rebellion-begins`  | NEW            |
|  1368 | `ming-dynasty`                 | foothold       |
|  1405 | `ming-treasure-fleets`         |                |
|  1420 | `ming-forbidden-city`          |                |
|  1449 | `ming-emperor-captured-tumu`   | NEW            |
|  1644 | `qing-dynasty`                 | foothold       |
|  1681 | `kangxi-military-campaigns`    |                |
|  1755 | `qing-xinjiang-conquest`       |                |
|  1793 | `macartney-mission-rebuffed`   | NEW            |
|  1842 | `treaty-nanking`               | foothold       |
|  1850 | `taiping-rebellion`            |                |
|  1900 | `boxer-rebellion`              |                |
|  1911 | `chinese-revolution`           |                |
|  1912 | `last-emperor-china-abdicates` | foothold       |

6 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **16**, bins **6/8** (advisory), same-year pairs **0**.

6 of the 36 are new. Figures at authoring time, with the new cards loaded via
`--include-pending --extra`:

```
size 36                (want 30-36)   PASS
bins 6/8                (advisory)    INFO
band 0 15               (want 5+)     PASS
same-year pairs 0       (want 0)      PASS
```

## Why the footholds are the footholds

Fifteen band-0 cards against a floor of 5 — the theme is unusually rich in them, for two
structural reasons rather than luck:

- **The dynastic foundings and endings that make a nation-state history textbook are
  overwhelmingly `easy`-labelled already**: `shang-dynasty-established`, `qin-unification`,
  `han-dynasty`, `yuan-khanate-founded`, `ming-dynasty`, `qing-dynasty`,
  `treaty-nanking`, `last-emperor-china-abdicates` are all `easy` in the catalogue, because a
  named dynasty's start and end are exactly the kind of fact a general-knowledge quiz asks.
- **The oldest and newest ends of the deck sit in genuinely sparse stretches**: nothing else in
  the catalogue crowds the Xia/Shang/Zhou run before -1000, and 1842-1912 (treaty, rebellion,
  revolution, abdication) is a tight, mostly China-specific run that a player anchors against
  itself rather than against unrelated world history.

## Deliberate omissions

- **Duplicate catalogue cards for the same beat**, kept out to avoid same-slug redundancy:
  `zhou-dynasty-begins` (Muye, same beat as `establishment-zhou-dynasty`, same year, same
  wording almost); `silk-road-established` (same beat as `silk-trade-begins`, same year);
  `three-kingdoms-period` (same beat as `fall-han-dynasty`, same year, weaker fit for "fall");
  `jin-dynasty-reunifies-china` (same beat as `sima-yan-jin-unification`, same year).
- **Spine beats cut for redundancy against a card already doing the job.** "Zhou Court Flees to
  Luoyang" (-770) is one year from "Death of King You Ends Western Zhou" (-771) and covers a
  weaker, more obscure act (an administrative relocation, not a fall or founding); both beats
  fighting over one slot, cut the weaker and cut the slot entirely rather than force a same-year
  or one-year pair this early in the deck. "Qin Capital Falls to Rebels" (-207) is the same
  transitional moment `han-dynasty` (-206) already covers — the catalogue collapses Qin's fall
  and Han's founding into one card, the way `mongol-khubilai-conquest` later does for Song's
  fall and Yuan's founding, so authoring a separate -207 card would be a one-year duplicate of a
  beat already in the deck. "Sui Reunifies a Divided China" (589) sits 8 years from a Sui
  founding beat and is redundant with `grand-canal-china` (609) as the dynasty's defining peak
  act; rather than write two new Sui cards 8-28 years apart, the deck skips the founding beat
  entirely and lets the Grand Canal carry Sui's whole entry. "Guangwu Restores the Han" (25) is
  16 years from "Wang Mang Usurps the Han Throne" (9) and is the weaker half of the pair — Han's
  restoration is already implied by the Han dynasty's overall presence in the deck (`han-dynasty`
  at the founding end), so only the fall (Wang Mang) was written. "Sima Yan Founds the Jin
  Dynasty" (265) and "Jin Reunifies China" (280) are the same person's the same act 15 years
  apart in the spine; the catalogue's `sima-yan-jin-unification` (280) already credits Sima Yan
  by name for founding Jin via conquering Wu, so the earlier beat was dropped rather than
  authored as a near-duplicate.
- **Catalogue doubts, reused anyway.** `han-dynasty` is dated -206 in the catalogue against the
  spine's -202 for Liu Bang's actual proclamation as emperor; the catalogue's date is the fall
  of Qin/rise of Liu Bang broadly, four years earlier than the formal declaration, and it is
  reused rather than duplicated. `silk-trade-begins` is dated -130 against the spine's -138 for
  Zhang Qian's departure; the catalogue dates the trade route's opening rather than the envoy's
  departure. `kangxi-military-campaigns` is dated 1681 and bundles the Three Feudatories revolt,
  the Taiwan conquest and the Dzungar wars into one card; the actual fall of the last Ming
  loyalist stronghold on Taiwan was 1683, two years later, and the spine's own 1662 (Koxinga's
  death, not the conquest) is off by more than the catalogue is.

## Still missing from the catalogue

Real gaps, not filler:

- **Cao Pi's forced abdication of the last Han emperor** (220) — the catalogue's
  `fall-han-dynasty` already occupies that year and covers the same collapse in more general
  terms; a Cao Pi-specific card would be a same-year duplicate.
- **Li Yuan's actual proclamation as Tang emperor** vs. the broader "Tang Dynasty Established"
  card already in the deck at the same year — no daylight between them worth a second card.
- **A dedicated Zhu Yuanzhang/Hongwu Emperor card** distinct from `ming-dynasty` — the catalogue
  card already names the founding act; nothing is lost by not splitting it.

## Known crowding kept on purpose

Two pairs sit inside 8 years and both are kept:

- **`qin-book-burning` (-213) and `han-dynasty` (-206), 7 years apart.** The Qin dynasty only
  ruled fifteen years total, so any two of its own beats — or a Qin beat and the dynasty that
  immediately replaced it — are necessarily close. Neither date can move; both are true to the
  compressed history they describe.
- **`chinese-revolution` (1911) and `last-emperor-china-abdicates` (1912), 1 year apart.** These
  are the start and the end of the same six-week collapse — the Wuchang mutiny and Puyi's
  abdication are the two facts most players actually hold about 1911-12, and splitting them
  further apart would misrepresent how fast the Qing fell. This is the tighter of the two pairs,
  the theme's only sub-5-year gap, kept for the same reason `clockwork.md` keeps its
  1967/1972 pair: both ends of the same story are named beats, and one refers back to the other.
