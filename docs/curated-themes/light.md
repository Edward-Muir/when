# The "Let There Be Light" theme

A 35-card curated theme on **making artificial light** — the wick, the flame, the filament and
the diode — from an Egyptian rush candle to the law that switched the bulb off. This note is
why these 35 and not others.

## The scope rule

An event is in only if **it is a way of making artificial light**, or the electrification that
carried one. Lamps, candles, lanterns, lighthouses, fireworks, gas lighting, arc and
incandescent lamps, fluorescents, neon, lasers, LEDs and optical fibre all qualify. Deliberately
out:

- **Fire as warfare or disaster.** Beacon fire chains, the Great Fire, incendiary weapons.
- **Optics that only bend light.** Telescopes, spectacles, the Fresnel lighthouse lens — a
  lens redirects light somebody else made.
- **Photography.** The flashbulb is a light source, but the whole surrounding subject is image
  capture and it would drag the deck off its own topic.
- **Theories of what light is.** Huygens, Young's slits, Maxwell, the photoelectric effect.
  This deck is about making it, not studying it.

The one place the rule is stretched is **power generation** — Volta's pile, Faraday's generator,
Niagara. The brief's own wording allows "the electrification that carried them", and each of the
three is on the card as a lighting story: the pile is what Davy's arc burned through, and Niagara
is on for lighting Buffalo, not for the turbines.

## The 35

Paste `eventNames` from `light.theme.json` into the workflow's `theme` input.

|  Year | Slug                          |          |     |
| ----: | ----------------------------- | -------- | --- |
| -3000 | `candle-invented`             | foothold |     |
|  -700 | `terracotta-oil-lamp`         |          | NEW |
|  -500 | `lighthouse`                  | foothold |     |
|  -280 | `lighthouse-alexandria`       | foothold |     |
|    50 | `roman-factory-lamps`         |          | NEW |
|   610 | `lantern-festival-sui`        |          | NEW |
|   890 | `candle-clock-alfred`         |          | NEW |
|  1000 | `fireworks`                   | foothold |     |
|  1120 | `kaifeng-night-markets`       |          | NEW |
|  1268 | `paris-candlemakers-guild`    |          | NEW |
|  1330 | `mamluk-mosque-lamps`         |          | NEW |
|  1417 | `london-lantern-order`        |          | NEW |
|  1550 | `japanese-andon-lantern`      |          | NEW |
|  1611 | `cordouan-lighthouse`         |          | NEW |
|  1650 | `whale-oil-trade`             |          |     |
|  1667 | `paris-street-lanterns`       |          | NEW |
|  1750 | `spermaceti-candle-works`     |          | NEW |
|  1780 | `argand-lamp`                 |          | NEW |
|  1792 | `gas-lighting`                |          |     |
|  1800 | `volta-battery`               |          |     |
|  1809 | `arc-lamp`                    |          |     |
|  1817 | `baltimore-gas-streetlights`  |          | NEW |
|  1831 | `electric-generator`          | foothold |     |
|  1853 | `kerosene-lamp`               |          | NEW |
|  1879 | `light-bulb`                  | foothold |     |
|  1895 | `niagara-falls-power`         |          | NEW |
|  1904 | `tungsten-filament-lamp`      |          | NEW |
|  1910 | `neon-lighting`               |          |     |
|  1938 | `fluorescent-lamp`            |          | NEW |
|  1960 | `laser-invented`              |          |     |
|  1962 | `led-invented`                |          |     |
|  1970 | `low-loss-optical-fibre`      |          | NEW |
|  1980 | `compact-fluorescent-lamp`    |          | NEW |
|  1994 | `blue-led`                    |          | NEW |
|  2007 | `incandescent-bulb-phase-out` |          | NEW |

22 of the 35 are new, so **the theme cannot be dealt until the image pipeline has run over
them** — `loadAllEvents` hides an unillustrated event and the publish validator only ever sees
playable ones. Re-measure once the art lands, and read the current figures from the catalogue
rather than from here:

```bash
node scripts/theme-gap.js --slugs <the 35 above, comma-separated>
```

## Why the footholds are the footholds

Six cards land in band 0 — `candle-invented`, `lighthouse`, `lighthouse-alexandria`,
`fireworks`, `electric-generator`, `light-bulb` — one over `MIN_BAND_ZERO`. Band 0 blends the
`difficulty` label with how sparse the timeline is around the year, so the useful property is
"easy to place", not "well known", and these six have it for two different reasons:

- **Sparsity.** `candle-invented` (-3000), `lighthouse` (-500) and `lighthouse-alexandria`
  (-280) sit in stretches of the catalogue where a few centuries hold almost nothing, so an
  approximate guess is a correct one. `fireworks` (1000) does the same job for the medieval
  bin, which is otherwise this deck's hardest quarter — everything the theme has between 1120
  and 1417 is band 3.
- **Recognition in an uncrowded year.** `electric-generator` (1831) and `light-bulb` (1879) are
  the two `easy` cards of the electric half. They are the reason the deck's second half opens
  at all.

Every foothold is an **existing, already-illustrated** event, which is deliberate: the band-0
floor does not depend on any of the 22 cards still waiting for art. None of the new cards
reaches band 0, and none was written hoping to — the honest label for a Mamluk mosque lamp is
`hard`, and grading it `easy` to buy margin is exactly the move the authoring notes forbid.

The margin is one card. **Dropping a foothold is what fails validation**, and there is no
spare: the only other band-0 candidates the sweep turned up are `birth-thomas-edison` and
`birth-nikola-tesla`, both out of scope (see below). If headroom is ever needed the lever is a
new globally-easy light card in a sparse stretch — a Diwali or a Hanukkah lamp card would do
it — not a relabelled existing one.

## Deliberate omissions

**Crowding, resolved.** The theme's own century — roughly 1790 to 1910 — holds far more
canonical beats than a placeable deck can carry, since two cards inside eight years are mostly
luck. Kept the spine, dropped the neighbours:

- `safety-lamp` (1812) sits 3 years from `arc-lamp`, which is the first electric light and
  cannot go. The Davy lamp is a mining-safety card first anyway.
- **Pall Mall's gas street lamps** (1807), the canonical first gas-lit street, are 2 years from
  `arc-lamp`. `baltimore-gas-streetlights` (1817) tells the same story with clean spacing, so
  the beat survives and London does not.
- `gramme-machine-generator` (1873) and a **Yablochkov candle** card (1876) are 6 and 3 years
  from `light-bulb`. Electrification is already carried by `electric-generator` and
  `niagara-falls-power`.
- **Pearl Street Station** (1882) and `ac-power-distribution` (1884) are 3 and 5 years from
  `light-bulb`. This is the deck's most painful omission and the note below records it.
- A **Welsbach gas mantle** card (1885) is 6 years from `light-bulb`; the gas thread already
  runs 1792 → 1817.
- **Limelight** (1826) falls 5 years short of `electric-generator`.
- A **halogen lamp** card (1959) would sit 1 year from `laser-invented`.
- **Compact fluorescents** are dated at the Philips screw-in lamp rather than the 1976 GE
  spiral, which would have crowded `low-loss-optical-fibre`.

**Redundancy.** `carbon-fibers` (1860) is Swan carbonising paper for bulb filaments — the same
moment `light-bulb` and `tungsten-filament-lamp` already cover from both sides, and 7 years from
`kerosene-lamp`. `beacon-fire-chains` (-400) is a third fire-on-a-tower card next to two
lighthouses, and is signalling rather than lighting.

**Rejected in favour of a new card.** `fiber-optics` (1966) records Kao _proposing_ that fibre
could carry signals; `low-loss-optical-fibre` (1970) is Corning actually drawing glass clear
enough to do it, which is the light-carrying moment and also spaces cleanly off `led-invented`.
`worlds-columbian-exposition` (1893) exists, but its card is about Columbus and the Ferris
wheel with no mention of the White City's lamps, and 1893 is 2 years from Niagara — so the
electric-spectacle beat is carried by `niagara-falls-power` instead.

**Out of scope, though they look on-theme.** `birth-thomas-edison`, `birth-nikola-tesla` and
`birth-michael-faraday` are lives, not light — and taking a birth card because it happens to be
band 0 is how a theme stops being about its subject. `lighter` (1823) and `friction-match`
(1827) are ignition, not illumination. `electric-streetcar` (1881), `first-laser-eye-surgery`
(1987) and `solid-state-lidar` (2010) use light or current for something else. `sulfur-matches`
(577) is a firestarter, however tempting as a filler for the long medieval gap.

**Keyword false positives.** The obvious sweep is a trap here: a case-insensitive `\bLED\b`
matches every "revolt **led** by", and `illuminat` matches manuscript illumination — between
them they turned a 22-hit net into 102, dragging in the Delian League, the Book of Kells, the
Peasants' Revolt, Lampang, and a dozen births. `whale-oil-trade` is the one hit from that
neighbourhood that genuinely belongs.

## What is still missing from the catalogue

Real gaps, not filler — each was left unwritten because it collides with a card in the 35:

- **Pearl Street Station** (1882) — the first central station selling electric light. The
  single biggest hole in this deck, blocked only by `light-bulb` three years earlier.
- **Niagara → Buffalo** is covered, but the **war of the currents** as such is not.
- **Yablochkov candles lighting the Avenue de l'Opéra** (1876) — the first electrically lit
  street in Europe.
- **The Welsbach mantle** (1885), which kept gas competitive against the bulb for a generation.
- **Limelight in the theatre** (1837) and the **Drummond light** that preceded it.
- **The Rural Electrification Act** (1936) and the **sodium-vapour streetlamp** (1932), both
  blocked by `fluorescent-lamp`.
- **OLED thin films** (1987), blocked from both sides by the compact fluorescent and the blue
  LED.
- Older still: **Chinese wax and Roman beeswax candles**, the **Lanterna of Genoa** (1128), and
  **Diwali or Hanukkah lamps** — the last of which is the most promising future foothold,
  because it is globally recognised and lands in a sparse stretch.
