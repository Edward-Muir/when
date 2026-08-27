# The Clockwork theme

A 36-card curated theme on the measurement of time itself — the devices and the conventions,
from a stick casting a shadow to the vote that retired the leap second. This note is why these
36 and not others.

## The scope rule

An event is in only if **it is a device or a convention for measuring time**.

- **Devices**: gnomon, water clock, sundial, incense clock, escapement, tower clock,
  sandglass, mainspring watch, pendulum, balance spring, marine chronometer, wristwatch,
  quartz, caesium.
- **Conventions**: the sexagesimal hour, the Metonic cycle, the Julian and Gregorian and
  Hijri and Republican calendars, AD numbering, railway time, time zones and the prime
  meridian, daylight saving, the SI second, the leap second.

Excluded: events that merely _happen_ on a date or are _scheduled_, and astronomy that is
about the sky rather than about telling the time. That rule is what keeps `mayan-astronomy`
and `maya-astronomical-calendar` out while `mayan-written-calendar` — the Long Count, a
counting convention — stays in, and what keeps `gps-system` and
`satellite-navigation-transit` out even though both are atomic-clock applications: they
measure position, not time.

Two edges were argued rather than assumed:

- **`antikythera-mechanism`** is in. Its dials are Metonic, Callippic and Olympiad — it is a
  calendrical computer, not a telescope, and it sits directly across the timeline from
  `metonic-cycle`, the convention it mechanises.
- **`y2k`** is in. The millennium bug is a two-digit year field failing, i.e. a _convention
  for recording time_ meeting its limit. It is the one modern card that is neither a device
  nor a treaty, and it is admitted on that reading.

## The 36

Paste `eventNames` from `clockwork.theme.json` into the workflow's `theme` input.

|  Year | Slug                           |                |
| ----: | ------------------------------ | -------------- |
| -3000 | `gnomon-shadow-clock`          | foothold       |
| -2000 | `water-clock`                  | foothold       |
| -1500 | `sundial-invented`             | foothold       |
|  -700 | `babylonian-hour-division`     | foothold · NEW |
|  -432 | `metonic-cycle`                | NEW            |
|  -300 | `antikythera-mechanism`        | foothold       |
|  -100 | `mayan-written-calendar`       | foothold       |
|   -46 | `julian-calendar-reform`       | foothold · NEW |
|   500 | `incense-clock`                |                |
|   525 | `dionysius-anno-domini`        | NEW            |
|   638 | `hijri-calendar-adopted`       | NEW            |
|   725 | `escapement-mechanism`         |                |
|  1092 | `su-song-clock-tower`          | NEW            |
|  1300 | `mechanical-clock`             | foothold       |
|  1338 | `sandglass-at-sea`             | NEW            |
|  1386 | `salisbury-cathedral-clock`    | NEW            |
|  1410 | `prague-astronomical-clock`    | NEW            |
|  1510 | `henlein-portable-watch`       | NEW            |
|  1582 | `gregorian-calendar-reform`    | NEW            |
|  1602 | `galileo-pendulum-isochronism` | NEW            |
|  1656 | `pendulum-clock`               |                |
|  1675 | `balance-spring-watch`         | NEW            |
|  1714 | `longitude-act`                | NEW            |
|  1761 | `marine-chronometer`           |                |
|  1793 | `french-republican-calendar`   | NEW            |
|  1810 | `wristwatch`                   |                |
|  1840 | `railway-time-britain`         | NEW            |
|  1859 | `great-clock-westminster`      | foothold · NEW |
|  1884 | `time-zone-development`        |                |
|  1916 | `daylight-saving-time`         | foothold · NEW |
|  1927 | `quartz-clock`                 |                |
|  1949 | `atomic-clock-first`           |                |
|  1967 | `si-second-caesium`            | NEW            |
|  1972 | `utc-leap-second`              | NEW            |
|  2000 | `y2k`                          | foothold       |
|  2022 | `leap-second-retired`          | NEW            |

21 of the 36 are new. Read the current band and spread figures from the catalogue rather than
from here — a card's band moves whenever its neighbourhood does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`:
size **36**, bins **8/8**, band 0 **11**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how _sparse_ the timeline is around a year, so the
footholds are the cards that are easy **to place**, not the cards a reader would call easy.
This theme is unusually rich in them — 11 against a floor of 5 — and the reason is structural
rather than lucky: **timekeeping's origins sit in the emptiest part of the catalogue**.

- `gnomon-shadow-clock`, `water-clock` and `sundial-invented` span 1,500 years apiece in a
  stretch where the catalogue holds almost nothing. Three cards that a player could not date
  to a century are still trivially _ordered_, because nothing competes with them.
- `babylonian-hour-division` and `julian-calendar-reform` are new cards written into that same
  sparse BCE run, and they land in band 0 for the same reason — not because the labels were
  graded down. `julian-calendar-reform` also carries a famous name, which is the honest half
  of its easiness.
- `mechanical-clock` (1300) is the deliberate replacement for `verge-escapement` (1275). They
  are the same beat — the arrival of the weight-driven European clock — but one is `easy`/band
  0 and the other is `very-hard`/band 3. Taking the foothold version of a beat you were going
  to include anyway is free.
- `great-clock-westminster`, `daylight-saving-time` and `y2k` are the modern footholds, and
  each is genuinely famous rather than sparse: Big Ben, the clocks going forward, and the
  millennium bug are three of the very few timekeeping facts everyone holds.

The margin here is large enough that no single drop fails validation, which is the opposite of
`indonesia-theme.md`. If cards are ever swapped out, keep at least the three ancient devices —
they are the only reason the _opening_ hand is placeable at all, since everything between 500
and 1800 is band 1-3.

## Deliberate omissions

Cards a keyword sweep surfaces, left out on purpose.

- **Same-year collisions.** `coil-spring` and `mainspring` are both dated 1400 — a coin flip
  against each other, and both are superseded in the deck by `henlein-portable-watch` (1510),
  which is the beat (a watch you can carry) rather than the component.
- **Near-year crowding.** `anchor-escapement` (1657) is one year from `pendulum-clock` (1656);
  `crystal-oscillator` (1917) is one year from `daylight-saving-time` (1916) and is anyway the
  component behind `quartz-clock` (1927); `detent-escapement` (1766) is five years from
  `marine-chronometer` (1761); `metronome-patented` (1815) is five years from `wristwatch`
  (1810); `endless-chain-drive` (1000) crowds `su-song-clock-tower` (1092) — and is Su Song's
  clock filed under its drivetrain, which is the wrong emphasis for a timekeeping deck.
- **Redundancy.** `harrison-chronometer-series` (1735, H1) against `marine-chronometer`
  (1761, the trial that solved longitude): two Harrison cards in a 36-card deck is one too
  many, and `longitude-act` (1714) already sets up the problem. `gnomon-shadow-clock` and
  `sundial-invented` survive the same test only because 1,500 years separate them and both
  are footholds.
- **Rejected in favour of a new card.** `verge-escapement` (1275) — see the footholds section;
  `mechanical-clock` is the same beat and is a band-0 card.
- **Out of scope.** `mayan-astronomy` (600) and `maya-astronomical-calendar` (700) are
  observation, and `mayan-written-calendar` already carries the Long Count.
  `joseon-sejong-water-clock` (1434) and `joseon-scientific-innovation` (1442) are genuinely
  in scope but collide with each other and sit inside the deck's densest stretch
  (1386/1410/1510); the Jagyeongnu is the best card this theme does not have room for.
  `cahokia-woodhenge` (1000) is a solar calendar and was the last card cut — kept in reserve
  if a future edit needs the 725-1092 gap filled.
  `first-almanac` (1491), `russia-anno-domini` (1700) and `al-jazari-mechanical-art` (1206)
  are adjacent but not about measuring time — a printed year-book, a national adoption of a
  scheme `dionysius-anno-domini` already covers, and a book of automata.
- **False positives** the sweep drags in: `y2k`'s siblings aside, the `atomic` net returns
  Democritus, Dalton, Rutherford, Oppenheimer, Fermi, the Bohr model and every 1945 bomb;
  `gregorian` returns Gregorian chant; `calendar` returns the tennis and golf "calendar Grand
  Slam" cards and the NBA shot clock; `hour` returns Le Mans, the cycling hour record and
  Kipchoge; `westminster` returns two statutes; `watch` matches "watched"; and
  `birth-salvador-dali` arrives on the strength of melting clocks.

## Known crowding kept on purpose

`si-second-caesium` (1967) and `utc-leap-second` (1972) are five years apart, which
`theme-gap` flags as advisory. Both are kept: the caesium definition of the second and the
leap second are each named beats of the theme, the 1972 card is what `leap-second-retired`
(2022) refers back to, and neither date can be moved. It is the only sub-8-year pair in
the deck.

## Still missing from the catalogue

Real gaps, not filler, that were not written because they collide with a card already in
the 36:

- **Ctesibius' precision water clock** (~250 BCE) and the **Athenian court clepsydra**
  (~400 BCE) — both fold into `water-clock`.
- **The Tower of the Winds** (~50 BCE), a horologion combining sundials and a water clock —
  four years from `julian-calendar-reform`.
- **The first public sundial in Rome** (263 BCE) — the same device as `sundial-invented`.
- **The Taichu calendar reform** (104 BCE), China's move to a 365¼-day year — four years
  from `mayan-written-calendar`.
- **Graham's deadbeat escapement** (1715) — one year from `longitude-act`.
- **Fleming's time-zone proposal** (1879) and **US railroads' standard time** (1883) — both
  inside eight years of `time-zone-development` (1884), which covers the conference outcome.
- **Essen and Parry's caesium clock** (1955) — six years from `atomic-clock-first` (1949),
  and its consequence is already the 1967 card.
- **The Seiko Astron quartz wristwatch** (1969) — two years from `si-second-caesium`.
- **The optical lattice clock** (2001) — one year from `y2k`'s neighbourhood and, more to the
  point, unrecognisable to almost every player.

Written for the theme because nothing in the catalogue stood in for them: the sexagesimal
hour, the Metonic cycle, the Julian and Gregorian and Hijri and Republican calendars, AD
dating, Su Song's tower, the sandglass at sea, Salisbury, Prague, Henlein, Galileo's
pendulum, Huygens' balance spring, the Longitude Act, railway time, Big Ben, daylight
saving, the SI second, and both ends of the leap second's life.
