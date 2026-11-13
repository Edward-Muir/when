# The War Machines theme

A 30-card curated theme on famous weapons and fighting machines, from the chariots at Kadesh
to the largest conventional bomb dropped in 2017: catapults, cannon, machine guns, tanks,
fighters, stealth aircraft and drones. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a famous weapon or fighting machine**: the weapon being
invented, patented, first flown, adopted, or used in the action that made its name.

The boundary with the neighbouring themes:

- **Nuclear bombs** go to The Atomic Age. The deck has no atomic weapon, and its largest bomb is
  the conventional one of 2017.
- **Rockets as launchers** go to Lift-Off! The V-2 is not here; the Patriot is, as a weapon
  aimed at other missiles.
- **Warship designs** go to Sail & Steam. Greek fire is in as the weapon, not the ship that
  carried it.

Three edges were argued rather than assumed:

- **Battles stand in for the weapon that won them.** `battle-kadesh` (the war chariot),
  `battle-chaeronea` (the Macedonian pike phalanx), `hannibal-crosses-alps` (war elephants),
  `siege-syracuse` (Archimedes' defence engines), `battle-crecy` (the longbow) and
  `nagashino-matchlock-volleys` (massed matchlocks) are in because each is the catalogue's card
  for that weapon's most famous day. The ancient stretch has almost no dated inventions, so
  without them the deck would open in 399 BCE with one card and jump to 674.
- **`leonardo-armoured-car`** is a drawing, never built. It is in as the most famous fighting
  machine on paper, and it gives the deck a card between 1453 and 1575.
- **`gatling-gun`** takes the catalogue's 1861 rather than the 1862 patent the spine found. It is
  the same gun, reused as it stands.

Cut from the spine for fame or bunching: Mongol gunpowder bombs, the Hussite war wagons,
Breitenfeld, the shrapnel shell, the Minié ball, the Armstrong gun, the M1 Abrams, Stuxnet (the
weakest on scope, a cyberweapon), Iron Dome and the Nagorno-Karabakh drone war.

## The 30

|  Year | Slug                                      |                |
| ----: | ----------------------------------------- | -------------- |
| -1274 | `battle-kadesh`                           |                |
|  -399 | `catapult-invented`                       | foothold       |
|  -338 | `battle-chaeronea`                        |                |
|  -218 | `hannibal-crosses-alps`                   | foothold       |
|  -213 | `siege-syracuse`                          |                |
|   674 | `greek-fire-constantinople`               | NEW            |
|  1044 | `gunpowder-formula-first-recorded`        |                |
|  1346 | `battle-crecy`                            |                |
|  1453 | `great-bombard-constantinople`            | NEW            |
|  1487 | `leonardo-armoured-car`                   | NEW            |
|  1575 | `nagashino-matchlock-volleys`             | NEW            |
|  1718 | `puckle-gun-patented`                     | NEW            |
|  1836 | `revolver-invented`                       |                |
|  1861 | `gatling-gun`                             |                |
|  1884 | `maxim-gun-invented`                      |                |
|  1911 | `first-aerial-bombing-libya`              | NEW            |
|  1915 | `second-battle-of-ypres-first-gas-attack` |                |
|  1916 | `tank-invented`                           | foothold       |
|  1921 | `thompson-submachine-gun`                 | NEW            |
|  1936 | `spitfire-first-flight`                   | foothold · NEW |
|  1943 | `dambusters-bouncing-bombs`               | foothold · NEW |
|  1944 | `me-262-jet-fighter-combat`               | NEW            |
|  1947 | `ak-47-designed`                          | foothold · NEW |
|  1955 | `b-52-enters-service`                     | NEW            |
|  1964 | `m16-rifle-adopted`                       | NEW            |
|  1983 | `f-117-stealth-fighter-service`           | NEW            |
|  1989 | `b-2-stealth-bomber-first-flight`         | NEW            |
|  1991 | `patriot-missiles-scuds`                  | NEW            |
|  2001 | `predator-drone-first-hellfire`           | NEW            |
|  2017 | `mother-of-all-bombs-combat`              | NEW            |

18 of the 30 were authored for this theme. The footholds are the reconciler's picks for fame.
theme-gap scores band 0 separately, from the difficulty label and how crowded the timeline is,
and the blind grade moved 12 of the new cards to easy, which is why band 0 is far above the
reconciler's six.

Gates: size **30**, band 0 **19**, bins **8/8** (advisory), same-year pairs **0**, bunching **3
in 1911-1916**, shared **1** with any earlier theme (Pharaohs, Tamed, Rome and Sieges, one card
each). Re-measure rather than trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap war-machines
```

## Dates the fact check could not support

None. The fact check passed all 18 new cards, but it searched only three (Greek fire, the M16
and Leonardo's car); the other 15 rest on the spine's sources and the checker's own knowledge.
Three dates carry a convention worth knowing:

- `greek-fire-constantinople` (674) is the start of the Arab siege; some sources put the first
  use of Greek fire at 671-673.
- `m16-rifle-adopted` (1964) is the Army's fielding of the XM16E1; other sources give 1962 to
  1967 depending on the service and the designation.
- `predator-drone-first-hellfire` (2001) is the February test firing in Nevada, not the first
  combat strike later that year.

## Known crowding kept on purpose

Nine neighbouring pairs fall inside theme-gap's 8-year advisory. Two clusters are kept:

- **1911 / 1915 / 1916** (the first bomb from a plane, gas at Ypres, the tank): three new ways
  of fighting in six years, which is the real shape of the First World War, and exactly at the
  bunching limit.
- **1943 / 1944 / 1947** (the bouncing bomb, the Me 262, the AK-47): a bomber raid, a jet and a
  rifle, so a player can order them by the war's course rather than by memory of the year.
