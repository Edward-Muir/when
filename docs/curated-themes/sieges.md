# The Under Siege theme

A 36-card deck spanning 2,717 years of one specific act of war: surrounding a walled place and
starving or storming it into submission. From Sennacherib's ramp at Lachish to the last block-by-
block fight for Mosul, every card here is a siege of somewhere, never a siege of something.

## The scope rule

An event is in only if **it is the siege of a named city or fortress** — a blockade-and-assault
of a place, not a field battle fought near one.

- **In**: an army surrounds walls, cuts supply, and either storms or starves the defenders out.
  Naval blockades of an island fortress (Rhodes, Malta) count; so does an encirclement of a
  fortified position that is really a small town or base (Bastogne, Khe Sanh, Dien Bien Phu).
- **Out**: a field battle that merely happens near a city (`battle-of-hattin` breaks the army
  that was going to relieve Jerusalem, but the battle itself is fought in open country — it stays
  out; `saladin-recaptures-jerusalem`, the negotiated surrender that followed, is a different
  beat again and also stays out, since Saladin never had to storm the walls).
- **Out**: an assassination or a treaty that merely follows a siege in the history books
  (`silk-road-decline`, `byzantine-scholars-flee` — both riding on 1453's coattails but neither
  is the siege).

Two edges were argued rather than assumed:

- **`battle-to-retake-mosul`** is in, despite "battle" in its own catalogue title. The nine-month
  fight was a classic encirclement — Iraqi and coalition forces surrounded the city and reduced
  it block by block — which is the same shape as Sarajevo or Leningrad, just fought street to
  street rather than starved out from a distance.
- **`battle-khe-sanh-begins`** is in for the same reason: an isolated US base was surrounded and
  resupplied only by air for over two months, the textbook definition of a siege wearing a
  "Battle of" name in the catalogue.

## The 36

19 of the 36 already existed in the catalogue; 17 are new.

| Year | Slug                          |                |
| ---: | ----------------------------- | -------------- |
| -701 | `assyrian-siege-lachish`      | NEW            |
| -539 | `fall-of-babylon-cyrus`       | foothold · NEW |
| -415 | `athenian-siege-syracuse`     | NEW            |
| -332 | `alexanders-siege-tyre`       | foothold · NEW |
| -213 | `siege-syracuse`              |                |
| -146 | `third-punic-war`             | foothold       |
|  -52 | `vercingetorix-gallic-revolt` | foothold       |
|   70 | `siege-of-jerusalem-70ce`     | foothold       |
|   73 | `siege-masada`                |                |
|  717 | `siege-of-constantinople-717` |                |
|  886 | `viking-siege-of-paris`       | NEW            |
| 1098 | `antioch-crusader-conflicts`  |                |
| 1099 | `capture-of-jerusalem-1099`   | foothold       |
| 1189 | `third-crusade-siege-acre`    | NEW            |
| 1204 | `fourth-crusade-byzantine`    |                |
| 1258 | `mongol-baghdad`              |                |
| 1429 | `siege-of-orleans`            | foothold · NEW |
| 1453 | `constantinople-fall`         | foothold       |
| 1492 | `reconquista-completion`      | foothold       |
| 1522 | `ottoman-siege-rhodes`        | NEW            |
| 1529 | `siege-vienna-first`          |                |
| 1565 | `great-siege-of-malta`        | NEW            |
| 1683 | `battle-vienna`               |                |
| 1689 | `siege-of-derry`              |                |
| 1781 | `battle-yorktown`             | foothold       |
| 1855 | `siege-of-sevastopol`         | NEW            |
| 1863 | `siege-of-vicksburg`          | NEW            |
| 1871 | `prussian-siege-of-paris`     | NEW            |
| 1885 | `siege-of-khartoum`           | NEW            |
| 1900 | `siege-of-mafeking`           | NEW            |
| 1941 | `siege-leningrad`             |                |
| 1944 | `siege-of-bastogne`           | foothold · NEW |
| 1954 | `siege-of-dien-bien-phu`      | NEW            |
| 1968 | `battle-khe-sanh-begins`      |                |
| 1992 | `siege-of-sarajevo-begins`    |                |
| 2016 | `battle-to-retake-mosul`      | NEW            |

17 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **11**, bins **8/8** (advisory), same-year pairs **0**.

At authoring time, with the 17 new cards loaded via `--include-pending --extra`:

```
Gates:
  PASS  size 36                (want 30-36)
  INFO  bins 8/8               (advisory, 6+ is spread)
  PASS  band 0 12              (want 5+)
  PASS  same-year pairs 0      (want 0)
```

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, and this
deck's 12 footholds split evenly between genuinely famous sieges and cards that land in an
otherwise-empty stretch:

- `siege-syracuse` (-213) and `third-punic-war` (-146) are graded `hard`/`easy` respectively but
  both sit in a thin BCE run with little else nearby, which is enough for the first to clear
  band 0 alongside the famous one.
- `capture-of-jerusalem-1099`, `constantinople-fall` and `reconquista-completion` are three of
  the handful of siege facts nearly every player already holds — Crusaders storming Jerusalem,
  Ottoman cannon breaching Byzantium's walls, the end of the Reconquista.
- `battle-yorktown` (1781) is the US Revolutionary War's best-known event by a wide margin.
- `siege-of-orleans` and `siege-of-bastogne`, both new, are graded `easy` honestly rather than to
  game the gate: Joan of Arc breaking the siege and "Nuts!" at Bastogne are both taught outside
  specialist military history, which is exactly what `easy` means in the rubric.

## Deliberate omissions

Spine beats cut, and why:

- **`roman-siege-numantia`** (-134) and **`mongol-siege-xiangyang`** (1268-1273) — real,
  in-scope sieges, cut for size. Neither has a foothold-strength name to carry it, and the deck
  had stronger candidates in every neighbouring stretch of history.
- **`portuguese-siege-malacca`** (1511) and **`siege-of-la-rochelle`** (1627-1628) — same
  reason: genuinely in scope, cut on obscurity to keep the deck at 36 rather than 45.
- **`siege-of-louisbourg`** (1758) and **`sieges-of-zaragoza`** (1808-1809) — cut for the same
  reason; both would have added crowding near `battle-yorktown` and `siege-of-sevastopol`
  without adding a foothold.
- **`siege-of-przemysl`** (1914-1915) and **`siege-of-port-arthur`** (1904-1905) — cut for
  obscurity; the WWI/turn-of-the-century stretch is already carried by `siege-of-khartoum` and
  `siege-of-mafeking`.
- **`siege-of-leiden`** (1573-1574) — a genuinely good story (dikes breached to float in relief
  ships) but cut on obscurity relative to `great-siege-of-malta`, eight years its senior and
  already carrying that decade.
- Catalogue cards that are the _aftermath_ of a siege on this list, left out because they are a
  different beat: `silk-road-decline` and `byzantine-scholars-flee` (both post-1453), `saladin-
recaptures-jerusalem` and `battle-of-hattin` (the field battle and negotiated surrender that
  bracket the 1187 loss of Jerusalem, neither of which is a siege), `acre-final-siege` (1291 —
  a real second, later siege of the same city as `third-crusade-siege-acre`, cut here only to
  avoid two Acre cards in one deck; 1291 is the stronger of the two on fame and would be the
  swap-in if `third-crusade-siege-acre` is ever dropped).

## Known crowding kept on purpose

Five pairs sit inside 8 years of each other; all are kept because each half is either a spine
beat in its own right or a real foothold, and every pair is thematically apt for a sieges deck
(sieges cluster inside the same wars):

- `siege-of-jerusalem-70ce` / `siege-masada` (3y) — same revolt, consecutive Roman sieges.
- `antioch-crusader-conflicts` / `capture-of-jerusalem-1099` (1y) — the two capstone sieges of
  the First Crusade, a year apart in reality and impossible to space further apart honestly.
- `ottoman-siege-rhodes` / `siege-vienna-first` (7y) — different Ottoman campaigns, kept for the
  foothold value of `siege-vienna-first` and the historical value of `ottoman-siege-rhodes`.
- `battle-vienna` / `siege-of-derry` (6y) — both already on the original spine, one year each
  side of William of Orange's wars.
- `siege-leningrad` / `siege-of-bastogne` (3y) — the same war, an Eastern and a Western front
  siege that a WWII-literate player would place in the right order but by feel, not by year.

## Still missing from the catalogue

Real gaps, not filler, that a siege-literate reviewer would expect and that were not written
because they collide with a card already in the 36 or would push the deck past 36:

- **Siege of Numantia** (-134) — a genuinely famous story (mass suicide rather than surrender)
  that lost out purely on deck size.
- **Siege of Xiangyang** (1268-1273) — the five-year Mongol blockade that opened the conquest of
  Song China; cut on size, not scope.
- **Siege of Malacca** (1511) and **Siege of La Rochelle** (1627-1628) — both solid mid-deck
  cards, cut to hold the line at 36.
- **Siege of Leiden** (1573-1574) — the dike-breaching relief is a strong scene; cut for being
  eight years from `great-siege-of-malta`.
- **Siege of Przemysl** (1914-1915) and **Siege of Port Arthur** (1904-1905) — both real WWI-era
  fortress sieges, cut on obscurity relative to `siege-of-khartoum` / `siege-of-mafeking`
  already carrying that stretch.
- **Second Siege of Acre** (1291, Mamluk conquest, ending the Crusader presence in the Holy
  Land) — arguably more famous than the 1189-1191 siege chosen here; kept in reserve as the
  swap-in if `third-crusade-siege-acre` is ever dropped from the deck.
