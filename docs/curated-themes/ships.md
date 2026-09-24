# The Sail & Steam theme

A 35-card curated theme on the ship itself: not who sailed it or what it found, but the hull,
the rig or the engine that made it a new kind of thing. It runs from a cedar boat buried beside
the Great Pyramid to a crewless container ship, with the steam-to-iron-to-turbine transition of
the 1840s-1900s doing the heaviest lifting in the middle.

## The scope rule

A card is in only if it is **a new kind of ship or boat (a hull type, propulsion or rig), or a
single named vessel that changed seafaring.** Shipwrecks and underwater exploration are out
(The Deep has them); voyages of discovery are out unless the vessel itself is the point.

Two edges were argued rather than assumed:

- **Rome's First Quinquereme** (the spine's -260 beat) is cut. Rome copying a beached
  Carthaginian design is a story about empire and logistics, not about a hull type that did not
  exist before — the quinquereme itself is not new, only Rome's possession of one is. That is
  the wrong side of the scope line for a theme about ship innovation, so it did not make the
  deck even though it is a fine beat for a different theme.
- **The Caspian Sea Monster** and **the hovercraft** are in. Neither one "sails" in the
  traditional sense, but both are a hull riding on trapped air rather than displacement or
  planing, which is squarely "a new kind of ship or boat."
- **Flying Cloud's Record Run** and **Turbinia at Spithead** are in even though nothing was
  discovered and no war was fought — the vessel itself, not the voyage, is the point, which is
  exactly the carve-out the scope rule makes for a voyage.

## The 35

|  Year | Slug                                |                |
| ----: | ----------------------------------- | -------------- |
| -2560 | `khufu-ship`                        | foothold · NEW |
|  -700 | `phoenician-bireme`                 | NEW            |
|  -525 | `greek-trireme`                     | NEW            |
|   400 | `lateen-sail-spreads`               | NEW            |
|   600 | `polynesian-double-canoe-design`    |                |
|   800 | `longship-technology`               | foothold       |
|  1000 | `junk-watertight-bulkheads`         | NEW            |
|  1104 | `venice-founds-arsenal`             | NEW            |
|  1150 | `song-sternpost-rudder`             |                |
|  1200 | `hanseatic-cog`                     | NEW            |
|  1350 | `carrack-emerges`                   | NEW            |
|  1440 | `portuguese-caravels`               | foothold       |
|  1595 | `dutch-fluyt`                       | NEW            |
|  1637 | `hms-sovereign-of-the-seas`         | NEW            |
|  1776 | `turtle-submarine-attack`           |                |
|  1783 | `steamboat`                         |                |
|  1807 | `fultons-steamboat`                 | foothold       |
|  1819 | `first-atlantic-steamship-crossing` |                |
|  1845 | `rattler-beats-alecto`              | NEW            |
|  1851 | `flying-cloud-record-run`           | NEW            |
|  1859 | `french-ironclad-gloire`            | NEW            |
|  1860 | `hms-warrior-launches`              | NEW            |
|  1862 | `battle-hampton-roads`              |                |
|  1869 | `cutty-sark-launches`               | foothold · NEW |
|  1893 | `hms-havock-first-destroyer`        | NEW            |
|  1897 | `turbinia-storms-spithead`          | NEW            |
|  1900 | `uss-holland-commissioned`          | NEW            |
|  1906 | `hms-dreadnought-launches`          | foothold · NEW |
|  1919 | `bells-hydrofoil-record`            | NEW            |
|  1954 | `uss-nautilus-launched`             |                |
|  1955 | `hovercraft`                        |                |
|  1956 | `ss-ideal-x-sails`                  | NEW            |
|  1959 | `ns-lenin-enters-service`           | NEW            |
|  1966 | `caspian-sea-monster-flies`         | NEW            |
|  2021 | `yara-birkeland-launches`           | NEW            |

24 of the 35 are new. Measured against the merged catalogue: size **35**, band 0 **6**, bins **8/8** (advisory), same-year pairs **0**.

24 of the 35 are new.

```
node scripts/theme-gap.js --include-pending --extra staging/ships.json --slugs <the 35 above>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **35**,
bins **8/8**, band 0 **6**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year. This
theme's footholds are split between genuine sparsity and genuine fame:

- `khufu-ship` (-2560) lands band 0 on sparsity alone: almost nothing else in the catalogue
  sits in that stretch of the third millennium BCE, so a card nobody could date to the century
  is still trivially ordered.
- `longship-technology` (800) and `portuguese-caravels` (1440) are both `easy`-labelled and
  already well known — Vikings and the Age of Discovery are two of the few pre-1800 maritime
  facts most players hold.
- `fultons-steamboat` (1807) is the header case for the whole deck: it is a single famous name
  (Fulton, the Clermont) sitting in a stretch of the timeline the deck otherwise leaves alone
  between 1783 and 1819.
- `cutty-sark-launches` (1869) and `hms-dreadnought-launches` (1906) are the modern footholds,
  both genuinely famous rather than sparse — a preserved museum ship and the battleship whose
  name became the word for its whole class.

## Deliberate omissions

**Cut for scope.** Rome's First Quinquereme (see "The scope rule" above) — reverse-engineering
someone else's design is an empire story, not a new-ship-type story.

**Cut for crowding.** `ss-great-britain-launches` (1843, Brunel's iron-hulled, screw-driven
liner) was drafted and cut. It sat two years from `rattler-beats-alecto` (1845) in a stretch
already carrying `fultons-steamboat` (1807) → `first-atlantic-steamship-crossing` (1819) →
[gap] → `rattler-beats-alecto` (1845) → `flying-cloud-record-run` (1851), and dropping it took
one advisory crowding pair out of the deck for free — the same "free" trade the clockwork theme
made with `mechanical-clock`/`verge-escapement`, just in the other direction (cutting the
crowded card rather than swapping it for a foothold). `ss-great-britain-launches` is the single
best card this theme does not have room for; see below.

**Fulton's other firsts, cut as redundant.** The spine also listed Fulton's Nautilus submarine
(1800) and Symington's Charlotte Dundas (1802): three years apart from each other, two years
from `turtle-submarine-attack`'s aftermath, and five from `fultons-steamboat`. The deck already
carries the submarine beat (`turtle-submarine-attack`) and the steamboat beat twice over
(`steamboat` 1783, `fultons-steamboat` 1807, `first-atlantic-steamship-crossing` 1819) — a
fourth and fifth card making the same two points in the same 40-year window is redundancy, not
coverage.

**Existing cards reused despite a date question.** `polynesian-double-canoe-design` is dated
600 in the catalogue; the spine's beat is the earlier Lapita double hull of roughly 1500-1000
BCE. Both dates have a real basis — the earlier one for the type's origin in the western
Pacific, the later one for the remote-Pacific voyaging wave the catalogue's own description
half-describes ("carrying colonists... across open ocean") — so the existing card was reused
rather than duplicated, per the reconciliation rule, and the date is flagged here rather than
changed. `song-sternpost-rudder` is dated 1150 (a Song refinement); the spine's beat names the
Han-dynasty origin around year 100. The same call was made: one card for one beat, existing
date kept, discrepancy noted rather than silently resolved.

**Out of scope from the start.** Shipwrecks and underwater exploration (The Deep's territory);
any of Cook's, Magellan's or Columbus's voyages, since the point there is the discovery, not
the ship; pirate-era vessels from the in-flight `pirates.json` staging file, since piracy is
about who commanded a ship, not what kind of ship it was.

## Still missing from the catalogue

Real gaps, not filler, that were not written because they would collide with a card already in
the 35:

- **SS Great Britain** (1843) — see above; the best card cut for crowding, kept in reserve if a
  future edit needs the 1819-1845 stretch thinned instead of the 1843-1851 one.
- **SS Great Western** (1838) and **SS Great Eastern** (1858) — both genuine Brunel milestones,
  both left out because the deck already carries three of his contemporaries' achievements
  (Rattler, Flying Cloud, Warrior) in the same 25-year span.
- **Bermuda sloop rig** (~1670) — a real rig innovation, but low-confidence on both date and
  fame, and the 1637-1776 stretch it would fill is spread-advisory only, not gate-relevant.
- **NS Savannah** (1962), the first nuclear-powered merchant ship — three years from
  `ns-lenin-enters-service` and making largely the same point (nuclear propulsion applied to a
  civilian hull) a second time in a five-year span that already holds `uss-nautilus-launched`,
  `hovercraft` and `ss-ideal-x-sails`.
