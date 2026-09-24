# The Walls & Fortresses theme

A 34-card curated theme on the building, and occasional fall, of fortifications built to keep
people out — city walls, border walls, castles, forts, defensive lines — from Uruk's raiders to
a 2006 act of Congress. This note is why these 34 and not others.

## The scope rule

An event is in only if it is **the building, or the fall or demolition, of a fortification
built to keep people out**: city walls, border walls, castles, forts, defensive lines. A siege
of a fortress is out unless the wall's fall is the point — another theme, Under Siege, takes
sieges, and a `sieges.json` staging file already shares this catalogue pass.

Two edges were argued rather than assumed:

- **`constantinople-fall`** is in, even though the beat is famous as a siege. Its own
  description is "Ottoman forces conquered the Byzantine capital", but the reason 1453 is
  remembered at all is that Ottoman cannon broke walls that had held for a thousand years — the
  wall's fall is the whole point of the date, not incidental to it. It is the theme's
  clearest case of "unless" doing real work.
- **`herod-builds-masada-fortress`** (building, kept) is split from **Masada's fall** (a siege
  ending in mass suicide, cut). The construction is a fortress built for defense; the fall is
  remembered for the suicide, not for a wall coming down, so it belongs to Under Siege instead.

## The 34

|  Year | Slug                                |                |
| ----: | ----------------------------------- | -------------- |
| -2700 | `walls-of-uruk-raised`              | NEW            |
|  -575 | `walls-of-babylon-rebuilt`          | foothold · NEW |
|  -461 | `long-walls-of-athens-built`        | NEW            |
|  -404 | `long-walls-of-athens-torn-down`    | foothold · NEW |
|  -378 | `servian-wall-of-rome-built`        | foothold · NEW |
|  -221 | `great-wall-china`                  | foothold       |
|   -35 | `herod-builds-masada-fortress`      | foothold · NEW |
|   122 | `hadrian-wall-construction`         | foothold       |
|   142 | `antonine-wall-built`               | NEW            |
|   273 | `aurelian-walls-encircle-rome`      | NEW            |
|   413 | `theodosian-walls-completed`        | foothold · NEW |
|   483 | `sigiriya-rock-fortress-raised`     | NEW            |
|   785 | `offas-dyke-built`                  |                |
|  1078 | `tower-london`                      | foothold       |
|  1142 | `krak-des-chevaliers-rebuilt`       | NEW            |
|  1200 | `great-zimbabwe-stone-construction` |                |
|  1280 | `malbork-castle-built`              | NEW            |
|  1355 | `carcassonne-refortified`           | NEW            |
|  1400 | `walls-of-benin-city-built`         | NEW            |
|  1453 | `constantinople-fall`               | foothold       |
|  1458 | `kumbhalgarh-fort-built`            | NEW            |
|  1485 | `kremlin-walls`                     |                |
|  1538 | `suleiman-rebuilds-jerusalem-walls` | NEW            |
|  1586 | `cartagena-walls-begun`             | NEW            |
|  1593 | `mombasa-fort-jesus-construction`   |                |
|  1755 | `fort-ticonderoga-built`            | NEW            |
|  1930 | `france-builds-maginot-line`        | foothold · NEW |
|  1940 | `warsaw-ghetto-wall-built`          | NEW            |
|  1942 | `germany-builds-atlantic-wall`      | NEW            |
|  1953 | `korean-dmz-fortified`              | NEW            |
|  1961 | `berlin-wall-built`                 | foothold       |
|  1989 | `berlin-wall-fall`                  | foothold       |
|  2002 | `israel-builds-west-bank-barrier`   | NEW            |
|  2006 | `us-secure-fence-act-signed`        | NEW            |

24 of the 34 are new. Measured against the merged catalogue: size **34**, band 0 **12**, bins **7/8** (advisory), same-year pairs **0**.

24 of the 34 are new.

```bash
node scripts/theme-gap.js --include-pending --extra scratchpad/staging/walls.json --slugs <the 34 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **34**,
bins **7/8**, band 0 **12**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, and this
theme clears the floor by a wide margin — 12 against a floor of 5.

- `walls-of-uruk-raised` (2700 BCE) sits in the emptiest stretch of the whole catalogue; almost
  nothing else is dated within a millennium of it, so it is trivially ordered even though a
  player could not date it to a century.
- `great-wall-china`, `hadrian-wall-construction`, `tower-london`, `constantinople-fall`,
  `berlin-wall-built` and `berlin-wall-fall` are the theme's genuinely famous cards — the
  ones almost any player has heard of regardless of era. Between them they anchor the ancient,
  medieval and modern thirds of the deck.
- `france-builds-maginot-line` (1930) is the odd one out: an `easy`-label card in a moderately
  crowded era, kept as a foothold precisely because "the Maginot Line" is a phrase people know
  even when they could not otherwise place a single interwar fortification date.

## Deliberate omissions

**Cut for being a siege, not a wall's fall.** Three spine beats framed as a fortress "falling"
were dropped because the catalogue's existing card for each is unmistakably about the siege or
its human drama, not about a wall coming down, and a parallel `sieges.json` staging pass is
already claiming this ground for an Under Siege theme:

- **Masada falls** (73 CE) — the catalogue's `siege-masada` is about the mass suicide, not a
  breached wall. The fortress's _construction_ (`herod-builds-masada-fortress`, kept) stays
  in scope; its fall does not.
- **Battle of the Alamo** (1836) — `texas-revolution-alamo` is a last-stand narrative, not a
  wall-breach one.
- **Fall of Fort Sumter** (1861) — `american-civil-war` is framed as the war's opening shot,
  not the fort's walls giving way.

**Reused, not duplicated, at the catalogue's own year.** Six spine beats already had an
exact-match card, so no new event was written for them, and each is placed at the catalogue's
year rather than the spine's guess:

- `great-wall-china` (Qin unifies the wall, spine said 221 BCE — matches)
- `hadrian-wall-construction` (spine said 122 — matches, catalogue also carries a separate
  128 "completed" card, not used, to avoid an 8-year collision with nothing to gain)
- `offas-dyke-built` (spine said 785 — matches exactly, description and all)
- `tower-london` (spine said 1078 — matches exactly)
- `great-zimbabwe-stone-construction` (spine said "Great Zimbabwe's walls rise", 1200-1400 —
  the catalogue's card is explicitly about the walls, not the sibling `great-zimbabwe` card
  about "massive stone structures" generally)
- `constantinople-fall`, `kremlin-walls` (catalogue year 1485, five years off the spine's 1493
  guess), `mombasa-fort-jesus-construction` (catalogue year 1593, two years off the spine's
  1595), `berlin-wall-built`, `berlin-wall-fall` — same pattern, catalogue year used throughout.

**Cut to shrink the 1449-1458 cluster.** The spine's Ming Great Wall rebuild (1449) sat 4 years
from the Constantinople card and 9 from Kumbhalgarh; `ming-rebuild-great-wall` was cut rather
than either of the other two, since it was the least distinctive of the three (a rebuilding,
not a first construction or a famous fall) and its removal also breaks a three-card pileup into
a single more tolerable 5-year gap.

**Cut for the same reason.** `chateau-gaillard-completed` (1197, Richard the Lionheart's
Norman castle) sat 3 years from `great-zimbabwe-stone-construction` (1200), an existing card
whose year cannot be moved. Gaillard was the newly-authored side of that pair, so it was the
one dropped.

**Out of scope, not authored.** `danevirke-earthwork` (Danish rampart, 500-968 CE) was left out
as redundant with `offas-dyke-built` — both are earthen border ramparts from the same few
centuries, and the theme only needs one. `vauban-neuf-brisach` (1698-1702) and
`suomenlinna-fortress-built` (1748-1788) were both cut for the same reason against each other
and against `fort-ticonderoga-built` (1755): all three are 18th-century star forts built by a
European power to guard a frontier, and the deck only needed one representative of the type.
Ticonderoga was kept for being the most recognizable to an English-speaking audience.
`walls-of-avila-raised` (Spanish city wall, 1097) was cut as the weakest of several
similarly-obscure medieval city-wall beats once the deck was already at its ceiling.

## Known crowding kept on purpose

Four pairs sit inside 8 years of each other, and none of them can be moved without either
falsifying history or dropping a card the theme needs more than it needs the spread:

- `constantinople-fall` (1453) and `kumbhalgarh-fort-built` (1458) — 5 years. Both are
  genuine, unrelated beats (an empire's end in Anatolia, a fort's construction in Rajasthan);
  the nearer Ming card was already cut to shrink this from a three-card pileup to a pair.
- `cartagena-walls-begun` (1586) and `mombasa-fort-jesus-construction` (1593) — 7 years, the
  two colonial coastal forts of the deck, on opposite sides of the Atlantic-to-Indian-Ocean
  world; keeping both is the point of having either.
- `warsaw-ghetto-wall-built` (1940) and `germany-builds-atlantic-wall` (1942) — 2 years, both
  fixed World War II dates that cannot move.
- `israel-builds-west-bank-barrier` (2002) and `us-secure-fence-act-signed` (2006) — 4 years,
  the deck's two 21st-century border-wall cards, both real and both recent.

## Still missing from the catalogue

Real gaps, not filler:

- **Danevirke** (Danish earthwork rampart, 500-968 CE) — folds into `offas-dyke-built`'s
  "early medieval earthen border rampart" beat; a genuine second example, not written because
  the deck does not need two.
- **Walls of Ávila** (Spain, 1097) — the best-preserved complete medieval city wall in Europe,
  cut only for crowding pressure at the deck's ceiling, not for weakness of the beat itself.
- **Chateau Gaillard** and **Ming's Great Wall rebuild** — both fully researched and written,
  then cut for year-crowding against fixed-year existing cards (see Deliberate Omissions).
  Either is ready to swap back in if a future edit drops something else nearby instead.
- **Vauban's Neuf-Brisach** and **Suomenlinna** — both genuine 18th-century star forts, cut
  as redundant with `fort-ticonderoga-built`. Either would extend the deck past 34 if a future
  edit wants a 35th or 36th card.
