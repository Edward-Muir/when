# The Bridges & Tunnels theme

A 36-card curated theme about the things people build to get across something: bridges,
tunnels, aqueducts, viaducts, causeways and ship canals, from a rock-cut water tunnel under
Jerusalem to the Gotthard Base Tunnel. This note is why these 36 and not others.

## The scope rule

An event is in only if **it is a built crossing of water, valley or rock, and the engineering
is the story**. That admits bridges, tunnels, aqueducts, viaducts, causeways and ship canals,
and it excludes four categories that a keyword sweep drags in constantly:

- **Roads and railways as such.** The Appian Way and the Trans-Siberian are routes, not
  crossings. A viaduct or a base tunnel that carries a railway is in; the railway is not.
- **Harbours and dams.** They manage water rather than cross it.
- **Irrigation.** Canals that water fields are not ship canals — so `first-irrigation-systems`,
  `moche-irrigation-system`, `chimu-irrigation-expansion` and `khwarezm-development-canal` are
  out despite matching on "canal", and so is `irrigation-qanat-persia` for the same reason,
  even though a qanat is genuinely a tunnel.
- **Battles fought at bridges.** `battle-milvian-bridge` and `battle-of-stamford-bridge` are
  about armies, not spans. Xerxes' pontoon bridges are in, because there the crossing itself
  is the achievement being remembered.

The theme is deliberately global. Roman aqueducts, Chinese beam bridges, Ottoman arches,
Persian and Levantine water tunnels and the modern superlative-chasers all sit in the same
deck, which is also what makes it placeable: the eras are recognisable even when the
individual structures are not.

## The 36

Paste as `eventNames` into the workflow's `theme` input. `foothold` marks a band-0 card;
`NEW` marks an event authored for this theme.

| Year | Slug                        |               |
| ---: | --------------------------- | ------------- |
| -700 | `hezekiah-tunnel-jerusalem` | NEW           |
| -530 | `tunnel-engineering`        |               |
| -480 | `xerxes-hellespont-bridge`  | NEW           |
| -312 | `roman-aqueducts`           | foothold      |
| -250 | `arched-bridge-invented`    | foothold      |
|  -55 | `caesar-rhine-bridge`       | foothold, NEW |
|  -19 | `aqueduct-pont-garros`      | foothold      |
|   52 | `first-aqueduct`            | foothold      |
|  105 | `trajans-bridge-danube`     | NEW           |
|  605 | `anji-bridge-china`         | NEW           |
| 1059 | `luoyang-bridge-quanzhou`   | NEW           |
| 1209 | `pont-old-london`           |               |
| 1289 | `yuan-grand-canal`          |               |
| 1345 | `ponte-vecchio-florence`    | NEW           |
| 1357 | `charles-bridge-prague`     | NEW           |
| 1566 | `stari-most-mostar`         | NEW           |
| 1591 | `rialto-bridge`             |               |
| 1607 | `pont-neuf-paris`           | NEW           |
| 1681 | `canal-du-midi-opens`       | NEW           |
| 1730 | `ladoga-canal`              |               |
| 1761 | `canal-network-britain`     |               |
| 1781 | `iron-bridge`               |               |
| 1805 | `pontcysyllte-aqueduct`     | NEW           |
| 1826 | `menai-suspension-bridge`   |               |
| 1843 | `thames-tunnel-opens`       | NEW           |
| 1869 | `suez-canal`                | foothold      |
| 1883 | `brooklyn-bridge-completed` | foothold      |
| 1894 | `tower-bridge-london`       | foothold      |
| 1914 | `panama-canal`              | foothold      |
| 1932 | `sydney-harbour-bridge`     |               |
| 1937 | `golden-gate-bridge`        | foothold      |
| 1957 | `mackinac-bridge`           | NEW           |
| 1973 | `bosphorus-bridge`          | NEW           |
| 1994 | `chunnel-completed`         | foothold      |
| 2004 | `millau-viaduct`            |               |
| 2016 | `gotthard-base-tunnel`      |               |

Read the current band and spread figures from the catalogue rather than from here — a card's
band moves whenever the catalogue does, because it depends on how crowded the neighbourhood
around its year is:

```bash
npm run theme:gap -- --slugs <the 36 above, comma-separated>
```

At authoring time: size 36, bins 8/8 `[5 5 5 4 6 4 3 4]`, band 0 = 11, same-year pairs = 0.

## Why the footholds are the footholds

Band 0 is not "famous"; it is "easy to place", which blends the `difficulty` label with how
sparse the timeline is around that year. This theme is unusually comfortable there — 11
against a `MIN_BAND_ZERO` of 5 — and the reason is structural rather than lucky.

- **The Roman water-engineering run does most of the work.** `roman-aqueducts` (Aqua Appia),
  `arched-bridge-invented`, `caesar-rhine-bridge`, `aqueduct-pont-garros` (Pont du Gard) and
  `first-aqueduct` (Aqua Claudia) are five band-0 cards between 312 BCE and 52 CE. Roman
  infrastructure is both broadly taught and, more importantly, sits in a stretch of the
  catalogue that is thin enough for a rough guess to land. A player who knows only "Romans,
  and the empire came after the republic" can order most of them.
- **The 1869-1937 run supplies the rest.** `suez-canal`, `brooklyn-bridge-completed`,
  `tower-bridge-london`, `panama-canal` and `golden-gate-bridge` are the five crossings a
  general audience can actually picture, and they are spaced 14, 11, 20 and 23 years apart —
  wide enough that recognition converts into a correct placement.
- **`chunnel-completed`** is the one modern foothold; everything after it is a superlative
  contest between structures most players cannot date.

So unlike a regional theme, this deck did **not** have to widen its scope to find footholds,
and no foothold here is a compromise on the scope rule. The margin is large enough that
losing any one card does not threaten the gate — which is why the 1932/1937 crowding below
was resolved in favour of keeping both.

## Deliberate omissions

Everything here surfaced in the sweep or in the spine and was left out on purpose.

**Same-year collisions.** A player cannot order two cards sharing a year — it is a coin flip.
Resolved in each case by keeping the more canonical crossing:

- `suez-canal` (1869) over `brooklyn-bridge-begins` (1869); the Brooklyn Bridge is in the deck
  at its completion, which is the moment people remember.
- `seikan-tunnel` over `channel-tunnel-begins`, both 1988 — and then Seikan itself was dropped,
  see below.
- `akashi-kaikyo-bridge` over `great-belt-bridge`, both 1998 — and then Akashi was dropped for
  crowding, see below.
- `panama-canal-expanded` (2016) collides with `gotthard-base-tunnel` and is redundant with
  `panama-canal` anyway; `crimean-bridge` (2018) collides with
  `hong-kong-zhuhai-macau-bridge`; `ohio-canals-authorized` (1825) is a minor card colliding
  with `erie-canal`; `segmental-arch-bridge` and `arch-mechanics-understanding` are both dated
  -100 and both are generic technique cards.

**Near-year crowding.** The catalogue's real density is 1869-1914 and post-1988, and almost
every additional card there lands inside eight years of one already in the deck:

- `erie-canal` (1825) is one year from `menai-suspension-bridge` (1826). Menai stays: it is
  the first great suspension bridge and squarely a crossing, where the Erie is a navigation
  route across a state.
- `st-gotthard-road-tunnel` (1980) / `humber-bridge` (1981), and `sunshine-skyway-bridge`
  (1987) / `seikan-tunnel` (1988), are one-year pairs; none of the four survived the cut.
- `verrazano-narrows-bridge` (1964) sits 7 years from `mackinac-bridge` (1957). Mackinac was
  written instead because 1937 → 1957 → 1973 spaces the post-war run evenly and Verrazzano
  does not.
- `lake-pontchartrain-causeway` (1969) is 4 years from `bosphorus-bridge` (1973).
- `seikan-tunnel` (1988) is 6 years from `chunnel-completed` (1994) and tells nearly the same
  story — the world's long undersea rail tunnel. Dropping it removed the last modern advisory
  and freed the slot that `luoyang-bridge-quanzhou` used to close a 600-year hole.
- `akashi-kaikyo-bridge` (1998) is 4 years from the Channel Tunnel, `oresund-bridge` (2000) 6,
  `danyang-kunshan-grand-bridge` (2010) 6 from `millau-viaduct`, and
  `hong-kong-zhuhai-macau-bridge` (2018) 2 from `gotthard-base-tunnel`. The modern tail
  therefore keeps four cards with distinct superlatives — longest undersea tunnel, tallest
  bridge, longest rail tunnel, plus Bosphorus for reach — rather than eight cards competing
  for "longest".
- **One advisory was accepted rather than resolved**: `sydney-harbour-bridge` (1932) is 5
  years from `golden-gate-bridge` (1937). Both are top-tier recognisable bridges, Golden Gate
  is a foothold, and dropping either to buy a card in a thinner stretch would have cost more
  than the coin flip does. It is the only pair inside eight years in the final deck.

**Redundancy.** `grand-canal-china` (609) against `yuan-grand-canal` (1289) — one Grand Canal
card is enough, and the Yuan realignment sits in a stretch that is otherwise empty, where 609
would have been 4 years from the newly written `anji-bridge-china`. `eurotunnel-boring` (1990)
and `channel-tunnel-begins` against `chunnel-completed`. `pointed-arch-bridge` (500) and
`segmental-arch-bridge` (-100) against `arched-bridge-invented` (-250): three generic
"this arch type existed" cards for one idea.

**Out of scope, though they matched the sweep.** `first-irrigation-systems`,
`irrigation-qanat-persia`, `moche-irrigation-system`, `chimu-irrigation-expansion`,
`khwarezm-development-canal` and `canal-building-netherlands` are irrigation and drainage;
`canal-system` is Venice's street grid rather than a crossing; `paris-catacombs-created` is an
ossuary that happens to be underground; `battle-milvian-bridge` and `battle-of-stamford-bridge`
are battles; `waterproof-concrete` is a material; `tunnelling-shield` (1818) and
`tunnel-boring-machine` (1846) and `canal-lock` (-283) are enabling inventions, not crossings —
the shield's story is carried by `thames-tunnel-opens`, the tunnel it was invented for.
`crossrail-begins` (2009) is an urban railway, and a "construction begins" card besides.

**Existing slugs rejected in favour of a new event.** None of the 15 new cards displaced a
serviceable existing event: every one filled a hole where the catalogue held nothing at all.
The nearest thing to a substitution is `nazca-puquios-aqueducts` (450), which is called an
aqueduct but is an irrigation filtration gallery; it would have filled the 105 → 605 gap, and
it was cut on the scope rule rather than replaced.

## What is still missing from the catalogue

Real gaps, not filler. Most were not written because they collide with a card already in the
36 — the note says which.

- **The famous failures.** `tay-bridge-disaster` (1879) lands 4 years from the Brooklyn Bridge
  and `tacoma-narrows-collapse` (1940) 3 years from the Golden Gate, so neither could be
  placed fairly. A deck about crossings that never fall down is a real omission, and if the
  theme is ever widened one of the two anchors should be traded for its failure.
- **The Forth Bridge** (1890). Arguably a bigger beat than Tower Bridge, but 7 years from it
  and 7 from Brooklyn; the 1869-1914 stretch is already carrying four footholds.
- **The Eads Bridge** (1874, 5 years from Suez) and the **Corinth** (1893) and **Kiel** (1895)
  canals, both within a year of Tower Bridge.
- **The great Alpine rail tunnels** — Fréjus (1871, 2 years from Suez), Gotthard (1882, one
  year from Brooklyn) and Simplon (1906). The Alps are represented only by the Gotthard Base
  Tunnel at the modern end.
- **The Roman bridge run**: Alcántara (106) and the Aqueduct of Segovia (~112) are both within
  a decade of the newly written Trajan's Bridge, and Ponte Sant'Angelo (134) is close behind.
- **The Holland Tunnel** (1927), the first ventilated vehicular tunnel under a river, 5 years
  from Sydney.
- **Pont d'Avignon** (1185) and the Regensburg stone bridge (1146), which would sit either
  side of `luoyang-bridge-quanzhou`; and the **Jerwan aqueduct** (~690 BCE), the first true
  stone aqueduct bridge, 10 years from Hezekiah's Tunnel.
- **700-1050 CE generally.** After `anji-bridge-china` the deck jumps 454 years. There is a
  real story there — Islamic and Song-era bridge and canal work — and no catalogue card for
  any of it.
