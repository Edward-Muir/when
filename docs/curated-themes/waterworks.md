# The Waterworks theme

A 36-card curated theme on the engineering of water itself — the canals, tunnels, dams,
cisterns and dykes built to move it where people needed it or hold it back where they did
not, from the first Mesopotamian irrigation ditches to the steel gates that protect London
from the North Sea. This note is why these 36 and not others.

## The scope rule

An event is in only if **it is a structure or system that moves or holds back water by
design**: irrigation, qanats, aqueducts, canals, locks, dams, dykes, sewers, water supply.

Excluded on purpose: **bridges and tunnels built to cross water** — that is the existing
"Bridges & Tunnels" theme (`crossings.md`), and a tunnel that carries water rather than
traffic (Hezekiah's Tunnel, a qanat) stays firmly on this side of the line. Also excluded:
a device or process that merely touches water without moving or containing it by design
(a water wheel grinding grain, a diving helmet, a submarine) and any earthwork that is not
about water at all (`offas-dyke-built` is a boundary rampart against Wales, not a sea
dyke — a keyword net for "dyke" catches it and it has to be thrown back).

One edge argued rather than assumed: **`hezekiah-tunnel-jerusalem`** is in as a
water-supply tunnel channeling a spring inside a city's walls, the same category as a qanat,
not as a crossing — nobody crosses through it, they drink from what it carries.

## The 36

Paste `eventNames` from `waterworks.theme.json` into the workflow's `theme` input.

|  Year | Slug                           |                |
| ----: | ------------------------------ | -------------- |
| -6000 | `first-irrigation-systems`     | foothold       |
| -2900 | `lagash-girsu-canal-network`   | NEW            |
| -2600 | `levee`                        |                |
| -2450 | `mohenjo-daro-covered-drains`  | foothold · NEW |
|  -800 | `earliest-persian-qanats`      | foothold · NEW |
|  -750 | `great-dam-of-marib`           | NEW            |
|  -700 | `hezekiah-tunnel-jerusalem`    |                |
|  -690 | `sennacherib-jerwan-aqueduct`  | NEW            |
|  -600 | `first-sewer-system`           | foothold       |
|  -312 | `roman-aqueducts`              | foothold       |
|  -256 | `dujiangyan-irrigation-system` | foothold · NEW |
|   -30 | `petra-nabataean-water-system` | foothold · NEW |
|   -19 | `aqueduct-pont-garros`         | foothold       |
|   450 | `nazca-puquios-aqueducts`      |                |
|   480 | `sigiriya-water-gardens`       | NEW            |
|   532 | `basilica-cistern-built`       | foothold · NEW |
|   570 | `marib-dam-collapses`          | foothold · NEW |
|   609 | `grand-canal-china`            |                |
|   700 | `hohokam-canal-network`        | NEW            |
|   900 | `khmer-baray-hydraulics`       |                |
|  1289 | `yuan-grand-canal`             |                |
|  1455 | `machu-picchu-water-channels`  | NEW            |
|  1466 | `chapultepec-aqueduct`         | NEW            |
|  1612 | `beemster-polder-drained`      | NEW            |
|  1652 | `great-level-fens-drained`     | NEW            |
|  1825 | `erie-canal`                   |                |
|  1842 | `croton-aqueduct-opens`        | NEW            |
|  1865 | `london-main-drainage`         |                |
|  1869 | `suez-canal`                   | foothold       |
|  1900 | `chicago-river-reversal`       | NEW            |
|  1913 | `la-aqueduct-owens-valley`     | NEW            |
|  1914 | `panama-canal`                 | foothold       |
|  1932 | `afsluitdijk-completed`        | NEW            |
|  1936 | `hoover-dam`                   | foothold       |
|  1970 | `aswan-high-dam`               |                |
|  1982 | `thames-barrier-completed`     | NEW            |

20 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **13**, bins **8/8** (advisory), same-year pairs **0**.

20 of the 36 are new.

```bash
node scripts/theme-gap.js --include-pending --extra <staged file> --slugs <the 36 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **36**,
bins **8/8** (11/9/1/4/2/5/3/1), band 0 **14**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, so the
footholds are the cards that are easy **to place**, not the cards a reader would call easy —
14 against a floor of 5, comfortably clear.

- `first-irrigation-systems`, `lagash-girsu-canal-network` and `mohenjo-daro-covered-drains`
  span the emptiest stretch of the whole catalogue (6000-2450 BCE); nothing competes with
  them for a placement, which is what makes two of the three new cards footholds without
  being graded down to get there.
- `earliest-persian-qanats`, `first-sewer-system` (the existing `Cloaca Maxima` card),
  `roman-aqueducts`, `dujiangyan-irrigation-system`, `petra-nabataean-water-system` and
  `aqueduct-pont-garros` are the BCE run through Rome's founding aqueduct and the Pont du
  Gard — six more footholds from the same ancient sparseness, three of them new cards
  written directly into that gap.
- `basilica-cistern-built` and `marib-dam-collapses` (532, 570) land in band 0 on genuine
  fame as much as sparseness — the Basilica Cistern is a well-known Istanbul landmark and
  the Marib Dam's final collapse is a documented turning point for pre-Islamic Yemen.
- `suez-canal`, `panama-canal` and `hoover-dam` are the modern footholds, and each is
  famous outright: three of the very few water-engineering facts everyone already holds.

The margin here is large, so no single drop threatens the gate. If cards are ever swapped
out, keep the three ancient devices in the first row — they are the reason the opening hand
is placeable at all, since almost everything from 450 to 1900 sits in band 1-3.

## Deliberate omissions

Cards a keyword sweep surfaces, left out on purpose.

- **Redundancy inside the same beat.** `gudea-restores-lagash-canals` (a Lagash canal
  _restoration_, ~2100 BCE) was dropped in favor of `lagash-girsu-canal-network` — the
  original digging is the more novel beat, and a restoration eight centuries later reads as
  the same card twice. `zhengguo-canal-completed` (Qin state, -246) was dropped for the same
  reason against `dujiangyan-irrigation-system` (-256): both are Warring-States-era Chinese
  irrigation canals ten years apart, and Dujiangyan is the far more recognizable of the two
  (it is still working today).
- **Third instance of a beat already carrying two cards.** `aqua-traiana-opens` (Trajan's
  109 CE aqueduct for Rome) was cut: the deck already has `roman-aqueducts` (Aqua Appia,
  -312) and `aqueduct-pont-garros` (Pont du Gard, -19) covering "Roman aqueduct," and a
  third makes the beat over-represented rather than richer.
- **Near-year crowding, resolved by dropping one side.** The spine's beats for London's New
  River (1613, an artificial water-supply channel) and the draining of the Beemster (1612)
  are one year apart. New River was cut in favor of Beemster, which is the more singular
  milestone (the first large reclaimed polder) and is less redundant with the Croton and
  Los Angeles aqueducts already in the deck. `westfriese-omringdijk` (a 1250 dyke-ring
  closure) was cut for a similar reason: it is real and in scope, but the deck's Dutch water
  story is already told by Beemster (1612) and the Afsluitdijk (1932), and a third Dutch
  dyke/polder card this close together crowds a single national story at the expense of
  everything else waiting for a slot.
- **Out of scope.** `offas-dyke-built` (785, a "dyke" the keyword net returns) is a land
  boundary earthwork against Wales, nothing to do with water. `mohenjo-daro` (the existing
  city-founding card, -2500) and `petra-treasury-carved` / `petra-nabataean-trade` (the
  existing Petra cards, -100 and -50) are about the same places as two of this theme's new
  cards but are themselves about a different beat (a city being founded, a monument being
  carved, a trade route) rather than a water system, so they are not duplicates and were
  left alone rather than folded in.
- **Catalogue doubts, reused anyway.** `first-sewer-system` (Cloaca Maxima) carries year
  -600 in the catalogue against the spine's -580; `roman-aqueducts` (Aqua Appia) and
  `aqueduct-pont-garros` (Pont du Gard) both carry years within a handful of the spine's own
  estimates. All three are the same beat as the spine intended and are used as-is, per the
  instruction to reuse rather than duplicate even when a date looks slightly off. No
  existing event's date looked wrong enough here to need a web check.

## Known crowding kept on purpose

Three pairs sit inside 8 years of each other, all flagged by `theme-gap` as advisory:

- `london-main-drainage` (1865) and `suez-canal` (1869) — 4 years. Both are named beats of
  the theme (a city's sewer network finished; a sea-level canal opened) and neither date can
  move; they simply happen to fall in the same crowded decade of Victorian engineering.
- `la-aqueduct-owens-valley` (1913) and `panama-canal` (1914) — 1 year, the tightest pair in
  the deck. Two flagship engineering projects of the same design-and-build era opening back
  to back is a fact about the period, not a choice; both are essential beats.
- `afsluitdijk-completed` (1932) and `hoover-dam` (1936) — 4 years, the same story: two of
  the interwar era's signature dams/dykes, dates fixed by history.

All three are accepted for the same reason `clockwork.md` accepted its one sub-8 pair: the
beats are load-bearing and the dates are real, not round numbers chosen for convenience.

## Still missing from the catalogue

Real gaps, not filler, that were not written because they collide with a card already in
the 36:

- **Ctesibius' and other classical water-control devices** already exist in the catalogue
  outside this theme (`ctesibius-float-regulator`) but are clock components, not water
  infrastructure, so they were never candidates here.
- **The Khwarezmian and Chimú canal networks** (`khwarezm-development-canal`, 1200;
  `chimu-irrigation-expansion`, 1350) are genuinely in scope and already in the catalogue,
  but both sit in the deck's most crowded medieval stretch (900-1652, six cards already) and
  were left out to avoid a seventh.
- **Venice's canal system** (`canal-system`, 1000) was considered and rejected: Venice's
  canals are navigable waterways the city grew around rather than a system built to move or
  hold back water by design, so it reads as a maritime-trade beat wearing a canal's name
  rather than a waterworks beat.
- **Gudea's canal restoration and the Zhengguo Canal** — see Deliberate omissions above;
  both are real, sourced beats with no room left once their redundant twin was kept.
