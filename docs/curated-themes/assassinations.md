# The Assassinations theme

A 36-card curated theme running from an Assyrian palace coup to a Saudi consulate in Istanbul.
This note is why these 36 and not others: the scope rule, the footholds, and the cards that
were left out on purpose.

## Scope rule

An event is in only if **a named person was killed, or survived a serious attempt, for
political reasons**. Rulers, ministers, generals, activists, religious and intellectual
figures.

Out, however well a keyword sweep matches them:

- **Battlefield deaths.** Dying in a war you are fighting is not being assassinated.
- **Executions after trial.** A judicial beheading is a verdict, not an assassination —
  Charles I and Louis XVI are not in this deck.
- **Massacres of unnamed groups.** The theme is a person, not a body count.
- **Natural deaths**, however convenient they were to somebody.
- **Non-political killings**, which is what keeps `jack-the-ripper-murders` and
  `oj-simpson-trial` out despite both matching the sweep.

Descriptions are written factually. There is no dwelling on method or injury.

## The 36

Paste as `eventNames` into the workflow's `theme` input. `NEW` marks an event authored for
this theme; `foothold` marks band 0.

|    Year | Slug                                    |          |     |
| ------: | --------------------------------------- | -------- | --- |
| 681 BCE | `sennacherib-assassinated`              |          | NEW |
| 465 BCE | `death-xerxes-i`                        | foothold |     |
| 336 BCE | `philip-ii-macedon-assassinated`        | foothold | NEW |
|  44 BCE | `julius-caesar`                         | foothold |     |
|      41 | `caligula-assassinated`                 | foothold | NEW |
|     192 | `commodus-assassinated`                 |          | NEW |
|     415 | `hypatia-of-alexandria-killed`          |          | NEW |
|     661 | `caliph-ali-assassination`              | foothold |     |
|     969 | `nikephoros-phokas-assassinated`        |          | NEW |
|    1092 | `nizam-al-mulk-assassinated`            |          | NEW |
|    1170 | `murder-thomas-becket`                  |          |     |
|    1219 | `kamakura-internal-conflicts`           |          |     |
|    1381 | `wat-tyler-killed`                      |          | NEW |
|    1407 | `louis-of-orleans-assassinated`         |          | NEW |
|    1478 | `pazzi-conspiracy`                      |          | NEW |
|    1567 | `murder-of-lord-darnley`                |          | NEW |
|    1584 | `william-of-orange-assassinated`        |          | NEW |
|    1610 | `henry-iv-france-assassinated`          |          | NEW |
|    1634 | `wallenstein-assassinated`              |          | NEW |
|    1762 | `peter-iii-of-russia-killed`            |          | NEW |
|    1793 | `marat-killed-by-corday`                |          | NEW |
|    1812 | `spencer-perceval-assassinated`         |          | NEW |
|    1835 | `jackson-assassination-attempt`         |          | NEW |
|    1865 | `lincoln-assassination`                 | foothold |     |
|    1881 | `assassination-of-alexander-ii`         |          |     |
|    1901 | `assassination-of-mckinley`             |          |     |
|    1914 | `archduke-franz-ferdinand-assassinated` | foothold |     |
|    1923 | `pancho-villa-assassinated`             |          | NEW |
|    1940 | `trotsky-assassinated`                  |          |     |
|    1948 | `gandhi-assassination`                  | foothold |     |
|    1963 | `jfk-assassination`                     | foothold |     |
|    1968 | `mlk-assassination`                     | foothold |     |
|    1981 | `sadat-assassinated`                    |          | NEW |
|    1995 | `rabin-assassinated`                    |          | NEW |
|    2007 | `bhutto-assassinated`                   |          | NEW |
|    2018 | `khashoggi-murder`                      |          |     |

14 existing slugs, 22 newly authored. Read the current band and spread figures from the
catalogue rather than from here — a card's band moves whenever the catalogue around its year
does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

## The footholds

Ten cards land in band 0, which is unusually comfortable — Indonesia shipped with a margin of
one or two. The reason is structural rather than lucky: political murder is one of the few
subjects where the _most famous_ instance of each era is also the one the catalogue has always
carried, so the theme inherits `julius-caesar`, `lincoln-assassination`,
`archduke-franz-ferdinand-assassinated`, `gandhi-assassination`, `jfk-assassination` and
`mlk-assassination` already graded `easy`.

Band 0 blends the difficulty label with how _sparse_ the timeline is around the year, so two of
the footholds are not the obvious ones:

- `death-xerxes-i` (465 BCE) and `caliph-ali-assassination` (661) are `medium` labels sitting
  in stretches the catalogue barely populates. They are easy to _place_ without being easy to
  recognise, which is the only property the opening hand cares about.
- `philip-ii-macedon-assassinated` and `caligula-assassinated` were authored `medium` and land
  in band 0 for the same reason. They were written for coverage, not for the gate; the gate is
  a side effect.

The three post-1948 footholds (`gandhi-assassination`, `jfk-assassination`,
`mlk-assassination`) are the deck's most crowded neighbourhood, so they contribute least to
placeability despite the label. If the deck is ever trimmed, cut there and leave the ancient
footholds alone — they are the ones holding the opening hand up.

## Deliberate omissions

The catalogue is thin on this subject and the sweep returns only ~32 hits, but the 19th and
20th centuries hold most of them, and that is the deck's real structural problem: near-year
collisions, not scarcity.

**Same-year collisions.** `assassination-of-garfield` shares 1881 with
`assassination-of-alexander-ii`; Alexander II wins because his killing ended Russia's reform
era rather than reforming a civil service. `wwi-start` shares 1914 with Franz Ferdinand and is
not an assassination anyway. `rfk-assassination` shares 1968 with `mlk-assassination`;
`south-vietnam-coup` (Ngo Dinh Diem, in scope) shares 1963 with JFK. In every case a player
cannot order two cards on one year — it is a coin flip, not a placement.

**Near-year crowding, dropped though in scope.** The anarchist wave of 1894-1901 is four
assassinations inside seven years (Carnot, Empress Elisabeth, Umberto I, McKinley); only
`assassination-of-mckinley` survives, as the one already in the catalogue. `malcolm-x-assassinated`
(1965) sits two years from JFK and three from MLK. `lumumba-assassination` (1961) is two years
from JFK — a genuine loss, and the deck's most regrettable cut. Rosa Luxemburg (1919) is five
years from Franz Ferdinand and Michael Collins (1922) one year from Pancho Villa;
`assassination-of-indira-gandhi` (1984) is three years from Sadat, and
`assassination-attempt-on-reagan` and `assassination-attempt-on-pope` are both 1981, Sadat's
year, and each other's. Alexander I of Yugoslavia (1934), Heydrich (1942) and the July 20 plot
(1944) all crowd Trotsky and Gandhi. Rafic Hariri (2005) is two years from Bhutto, Boris
Nemtsov (2015) three from Khashoggi, and Shinzo Abe (2022) four.

The one advisory pair that survives is `jfk-assassination` (1963) against `mlk-assassination`
(1968), five years apart. Both are band-0 footholds and both are unarguable canonical beats;
an assassinations deck missing either would be obviously wrong in a way no spacing gain
justifies.

**Out of scope, though the sweep drags them in.** `gunpowder-plot` (1605) — a conspiracy
discovered in preparation, with no attempt ever made, and five years from Henry IV of France.
`night-of-long-knives` (1934) is a purge, not an assassination. `jonestown-massacre`,
`jack-the-ripper-murders`, `john-lennon-killed` and `oj-simpson-trial` are not political.
`year-five-emperors` (193) is the aftermath of Commodus's killing rather than the killing, and
sits one year from the card that is. `fingerprinting-adopted` and
`death-penalty-abolished-uk` are pure keyword noise.

**Existing slug rejected in favour of a new card.** None outright — but two existing cards were
kept in preference to a better-worded new one to save art: `kamakura-internal-conflicts` (1219)
is really the assassination of Shogun Sanetomo and reads as a governance card, and
`khashoggi-murder` carries more procedural detail than this theme's tone note would have
written. Both are already illustrated, which the 22 new cards are not.

## What is still missing from the catalogue

Real gaps, not filler, all left unwritten because they collide with a card already in the 36:

- **The 1961-1968 cluster.** Trujillo, Lumumba, Diem, Malcolm X, RFK. Five in-scope
  assassinations inside eight years, and the deck can hold two.
- **The anarchist wave**, 1894-1901: Sadi Carnot, Empress Elisabeth of Austria, Umberto I.
- **The 1979-1986 run**: Mountbatten, Park Chung-hee, Aquino, Indira Gandhi, Olof Palme,
  Rajiv Gandhi.
- **The 2005-2022 tail**: Hariri, Jo Cox, Nemtsov, Shinzo Abe.
- **Genuinely uncrowded and simply unwritten**: Ephialtes of Athens (461 BCE), the Gracchi
  (133 and 121 BCE), Domitian (96), Caracalla (217), al-Mutawakkil (861), Conrad of Montferrat
  (1192, the archetypal Nizari killing — cut only because `nizam-al-mulk-assassinated` already
  carries the Assassins), Edward II (1327), James I of Scotland (1437), Henry III of France
  (1589), the Duke of Buckingham (1628), Gustav III of Sweden (1792, one year from Marat),
  Paul I of Russia (1801), Rasputin (1916), Huey Long (1935), Abdullah I of Jordan and Liaquat
  Ali Khan (both 1951), and Zoran Djindjic (2003).

If the deck is ever widened past 36 it cannot be — "Theme Cleared!" stops being reachable. The
list above is therefore a swap menu, not a backlog.
