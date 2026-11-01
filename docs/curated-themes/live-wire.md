# The Live Wire theme

A 30-card curated theme on electric power, from the Leyden jar to the Iberian blackout: how
electricity is made, stored and moved, and the grids that fail when it isn't. This note is why
these 30 and not others.

## The scope rule

An event is in only if **it is a way of making, storing or moving electric power.**

- **Making**: generators and power stations of every kind except nuclear (dynamos, steam,
  wind, geothermal, tidal, solar).
- **Storing**: batteries and their kin, from the Leyden jar and Volta's pile to the
  grid-scale battery at Hornsdale. A battery-electric or hybrid car is in for the pack it
  carries.
- **Moving**: transmission lines, national grids and interconnectors, and the blackouts that
  show what a grid is by its failure.

The boundary with the neighbouring themes: lamps go to Let There Be Light, dams to Waterworks,
nuclear stations to The Atomic Age, and Faraday's induction to Eureka Moments.

Edges argued rather than assumed:

- **Blackouts are in.** Four of the 30 (`northeast-blackout-1965`, `quebec-geomagnetic-blackout`,
  `northeast-blackout-2003`, `iberian-peninsula-blackout`) are failures of moving power. They
  are the beats most players remember living through or hearing about, and they carry the
  "grid" half of the scope better than any transmission milestone.
- **`chicago-worlds-fair-ac-power`** is in as the moment alternating current won the War of the
  Currents in public. It is about the system that lit the fair, not the lamps.
- **Cut for scope: the 1979 White House solar panels.** They heated water rather than making
  electricity.
- **Cut for a year mismatch: Grove's fuel cell (1838).** The catalogue's `fuel-cell` card sits
  at 1842, so it isn't the same event in the same year, and a second fuel-cell card would only
  crowd the early battery stretch.
- **Cut as fame-1 beats in crowded stretches:** the Daniell cell (1836), the Lauchhammer-Riesa
  110 kV line (1912), Britain's Electricity (Supply) Act (1926, which the 1935 grid card covers),
  the Crotched Mountain wind farm (1980) and the LIMPET wave plant (2000).

## The 30

| Year | Slug                                  |                |
| ---: | ------------------------------------- | -------------- |
| 1745 | `leyden-jar-capacitor`                |                |
| 1800 | `volta-battery`                       |                |
| 1832 | `pixii-hand-cranked-dynamo`           | NEW            |
| 1859 | `lead-acid-battery`                   |                |
| 1866 | `siemens-self-excited-dynamo`         | NEW            |
| 1873 | `gramme-machine-generator`            |                |
| 1881 | `godalming-public-electricity-supply` | NEW            |
| 1882 | `pearl-street-station-opens`          | foothold · NEW |
| 1888 | `wind-turbine-invented`               |                |
| 1893 | `chicago-worlds-fair-ac-power`        | foothold · NEW |
| 1895 | `niagara-falls-power`                 |                |
| 1899 | `nickel-cadmium-battery`              |                |
| 1904 | `larderello-geothermal-plant`         | NEW            |
| 1935 | `britain-national-grid-live`          | NEW            |
| 1941 | `smith-putnam-wind-turbine`           | NEW            |
| 1954 | `first-solar-cell`                    |                |
| 1960 | `the-geysers-geothermal-plant`        | NEW            |
| 1965 | `northeast-blackout-1965`             | NEW            |
| 1966 | `rance-tidal-power-station`           | NEW            |
| 1970 | `pacific-dc-intertie-opens`           | NEW            |
| 1984 | `dinorwig-pumped-storage-station`     | NEW            |
| 1989 | `quebec-geomagnetic-blackout`         | NEW            |
| 1991 | `lithium-ion-battery`                 |                |
| 1997 | `toyota-prius-launched`               | foothold · NEW |
| 2003 | `northeast-blackout-2003`             | NEW            |
| 2008 | `tesla-roadster-deliveries`           | foothold · NEW |
| 2015 | `tesla-powerwall-unveiled`            | foothold · NEW |
| 2017 | `hornsdale-power-reserve`             | foothold · NEW |
| 2019 | `hornsea-offshore-wind-farm`          | foothold · NEW |
| 2025 | `iberian-peninsula-blackout`          | NEW            |

21 new and 9 reused. Every reused card names the same event in the same year as its spine beat.

Gates: size **30**, band 0 **7**, bins **4/8** (advisory), same-year pairs **0**, bunching
**3** in 1873-1882, shared **2** with any one theme (light: `volta-battery`,
`niagara-falls-power`). A card's band moves whenever the catalogue around its year does, so
re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --overlap live-wire
```

## Why the footholds are the footholds

Five of the seven footholds sit in 1997-2019 (the Prius, the two Tesla cards, Hornsdale and
Hornsea). They are recent, branded, and easy to order against one another, so the deck opens
on its modern end. The other two, `pearl-street-station-opens` and
`chicago-worlds-fair-ac-power`, are the Edison-versus-Westinghouse story most players half-know.
Dropping any two footholds still clears the floor of 5.

## Known crowding kept on purpose

- **1881 / 1882** (`godalming-public-electricity-supply` → `pearl-street-station-opens`): the
  first public supply and the first central station a year apart, on two continents. Which
  came first is the point of the pair.
- **1965 / 1966** (`northeast-blackout-1965` → `rance-tidal-power-station`): a failure and a
  source a year apart, with nothing in common for a player to confuse.
- **2015 / 2017 / 2019** (Powerwall, Hornsdale, Hornsea): storage at home, storage at grid
  scale, then offshore wind. All three are footholds, so the cluster costs nothing at the open.

The deck is empty before 1745 and between 1745 and 1800, as the subject is.

## Fact-check flags still open

- **`britain-national-grid-live` (1935):** unsupported as a single year. Sources give the 132 kV
  grid built 1927-33, interconnected regional operation from 1933, and one integrated system
  from 1938. The spine writer took 1935 from National Grid's own history, which the fact
  checker could not confirm. Worth a reviewer's call: 1933 is the better-attested start.
