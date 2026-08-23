# The What We Drink theme

A 36-card curated theme on the drinks people make on purpose, and the rules they wrote about
drinking them — from Neolithic beer to New Coke. This note is why these 36 and not others.

## The scope rule

An event is in only if **it is a drink humans make on purpose, or a rule about drinking it**.
That takes in origins (beer, wine, tea, cacao, coffee), techniques (distillation, barrel
aging, carbonation, pasteurisation, lager brewing), the institutions that grew around a drink
(coffeehouses, breweries, temperance societies, café chains), and the law (Hammurabi's
alehouse clauses, the Quranic ban, the Reinheitsgebot, the Gin Craze statutes, Prohibition and
its repeal).

Three things are deliberately outside it:

- **Drinking water and sanitation.** Aqueducts, wells, cholera and chlorination are a
  different theme with a different point. Soda water is in, because it is manufactured to be
  a drink; a reservoir is not.
- **Food that is not drunk.** This is why the catalogue's `first-chocolate-bar` and
  `milk-chocolate-invented` are absent while `chocolate-in-mesoamerica` and
  `chocolate-introduced-europe` are present — cacao enters the theme as a drink and leaves it
  the moment it becomes a bar. Same reason `barley-domesticated` is out.
- **Famines.**

Era range 7000 BCE to 1985, with the weight from about 1450 onward where the drinks the
modern world actually consumes were assembled.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

|  Year | Slug                            |          |     |
| ----: | ------------------------------- | -------- | --- |
| -7000 | `first-beer-brewed`             | foothold |     |
| -6000 | `first-wine-making`             | foothold |     |
| -2700 | `tea-discovered-china`          | foothold |     |
| -1750 | `hammurabi-alehouse-laws`       |          | NEW |
| -1500 | `chocolate-in-mesoamerica`      | foothold |     |
|  -600 | `greek-symposium-wine`          | foothold | NEW |
|   100 | `vineyards-spread-rome`         |          |     |
|   625 | `quran-forbids-wine`            |          | NEW |
|   760 | `lu-yu-classic-of-tea`          |          | NEW |
|   850 | `coffee-origins-ethiopia`       | foothold |     |
|  1000 | `wine-barrel`                   |          |     |
|  1250 | `aqua-vitae-distilled`          |          | NEW |
|  1450 | `yemen-coffee-cultivation`      |          |     |
|  1494 | `first-scotch-whisky-record`    |          | NEW |
|  1516 | `reinheitsgebot-beer-purity`    |          | NEW |
|  1528 | `chocolate-introduced-europe`   | foothold |     |
|  1580 | `tea-ceremony-codification`     |          |     |
|  1610 | `tea-trade-begins`              |          |     |
|  1645 | `first-european-coffeehouse`    |          |     |
|  1664 | `first-colonial-rum-distillery` |          | NEW |
|  1690 | `champagne-region-bubbly`       |          |     |
|  1700 | `tea-craze-britain`             | foothold |     |
|  1730 | `gin-craze-london`              |          |     |
|  1759 | `guinness-brewery-lease`        |          | NEW |
|  1773 | `boston-tea-party`              | foothold |     |
|  1783 | `schweppes-bottled-soda-water`  |          | NEW |
|  1826 | `american-temperance-society`   |          | NEW |
|  1842 | `pilsner-first-brewed`          |          | NEW |
|  1864 | `pasteurization`                | foothold |     |
|  1886 | `coca-cola-invented`            | foothold |     |
|  1909 | `instant-coffee-introduced`     |          |     |
|  1920 | `prohibition-begins-us`         | foothold |     |
|  1933 | `prohibition-repealed-us`       | foothold | NEW |
|  1948 | `espresso-machine-crema`        |          | NEW |
|  1971 | `starbucks-coffee-chain`        | foothold |     |
|  1985 | `new-coke-launched`             |          | NEW |

15 of the 36 are new and need art before the daily can deal them. Read the current band and
spread figures from the catalogue rather than from here — a card's band moves whenever the
catalogue around it moves:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size 36, bins
8/8, band 0 fourteen, same-year pairs 0, and **no pair within 8 years** — the smallest gap in
the deck is ten years (1773 → 1783, and 1690 → 1700).

## Why the footholds are the footholds

This theme has an unusually easy time with `MIN_BAND_ZERO`. Fourteen band-0 cards against a
floor of five is roughly three times the margin the Indonesia theme scraped by on, and the
reason is structural rather than lucky: **drink beats are globally famous and land in sparse
stretches of the timeline.** Band 0 blends the `difficulty` label with how uncrowded the
years around the event are, and this theme's spine naturally sits in thin country —

- The four prehistoric origin cards (`first-beer-brewed`, `first-wine-making`,
  `tea-discovered-china`, `chocolate-in-mesoamerica`) are recognisable to anyone and sit in
  millennia where the catalogue holds almost nothing. They carry the opening hand on their own.
- `greek-symposium-wine` is new, and 600 BCE is the emptiest usable slot between the Bronze
  Age and Rome — it was written as much for that gap as for the beat.
- The modern footholds — `pasteurization`, `coca-cola-invented`, `prohibition-begins-us`,
  `prohibition-repealed-us`, `starbucks-coffee-chain` — are famous enough to survive the
  crowding of the last two centuries.

Because the margin is large, this is one theme where a foothold **can** safely be swapped out.
The constraint that actually bit here was not band 0 but **size**: the spine ran to 45
defensible beats and had to be cut to 36, which is why the omissions below are long.

## Deliberate omissions

- **Same-year collisions.** `alcohol-fermentation-mead` (7000 BCE) shares its year with
  `first-beer-brewed`; beer is the better-known card and mead is the tangent. Canned beer
  (Krueger, 1935) would have collided with `alcoholics-anonymous`, so neither was used.
- **Near-year crowding.** `phylloxera-wine-blight` (1863) sits one year from
  `pasteurization`, which is a foothold and had to stay. `champagne-region-wine` (1100) and
  `champagne-fairs` (1150) both lose to `champagne-region-bubbly` (1690), the card where
  champagne becomes the drink people mean. `lloyds-coffeehouse-insurance` (1688) is two years
  from Dom Pérignon and is really an insurance card wearing a coffeehouse. Priestley's
  carbonated water (1767) is six years from the Boston Tea Party, so the carbonation beat is
  carried by `schweppes-bottled-soda-water` (1783) instead — Schweppe is where carbonation
  becomes something you buy. `alcoholics-anonymous` (1935) is two years from the repeal, and
  the repeal is the bigger beat. `fair-trade-coffee-movement` (1988) is three years from New
  Coke and half about crops rather than drink. Hopped beer (~1350), Eisai's tea in Japan
  (1191) and the Judgment of Paris (1976) were all cut for spacing against neighbours already
  in the deck.
- **Redundancy.** `chocolate-europe` (1544) and `chocolate-trade-establishment` (1585) both
  restate `chocolate-introduced-europe` (1528). `coffee-cultivation-expansion` (1500) restates
  `yemen-coffee-cultivation` (1450). `coffee-houses-cairo` (1600) and `coffee-house-emergence`
  (1555) are a third and fourth coffeehouse card once Venice (1645) is in; Ottoman coffee
  culture is already carried by the Yemen card.
- **Rejected in favour of a new card.** `distillation` (-1200) reads as a laboratory
  technique — its own text is about separating liquids by boiling point — and the earliest
  Mesopotamian stills were for perfume, not drink. The theme's distillation beat is
  `aqua-vitae-distilled` (1250), the moment distillation first produces something people
  drink, with `first-scotch-whisky-record` (1494) as the follow-through.
  `distillation-techniques` (800, "Islamic Distillation Advances") was rejected for the same
  reason: its description names essential oils, perfumes and medicines, never a drink.
- **Out of scope by the food rule.** `first-chocolate-bar` (1847), `milk-chocolate-invented`
  (1875), `barley-domesticated` (-9000), `cheese`, `tofu-invented-china`, `garum-fish-sauce`,
  `first-sugarcane-cultivation`.
- **Keyword false positives.** `munich-beer-hall-putsch` (a coup that happened to be in a beer
  hall), `birth-louis-pasteur`, `corkscrew-patented` (an implement, not a drink — and the
  weakest card in a deck already at its ceiling), `wine-as-anaesthesia` (a surgical practice),
  `red-rum-third-grand-national-1977`, `scotch-tape`, `restoration-bourbon-monarchy`,
  `first-opium-war` and the entire "…Cup" sports catalogue that an unanchored `\bcup\b` drags
  in. A bare `tea` matches "steam" and "instead"; that alone inflated an early sweep from 34
  candidates to 714.

## What is still missing from the catalogue

Real gaps, not filler, left unwritten because the deck was already at 36 or because they
collide with a card that is in it:

- **Ancient.** The Hymn to Ninkasi (~1800 BCE), Egyptian beer rations at Giza (~2500 BCE), and
  Wang Bao's slave contract (59 BCE), the earliest firm documentary record of tea being bought.
- **Medieval and early modern.** Hopped beer and the Hanseatic hop trade (~1350), Eisai
  bringing tea to Japan (1191), the Vienna coffeehouses after the siege (1683), the Gin Act
  itself (1751) as distinct from the Gin Craze, and mezcal/tequila, which the catalogue does
  not touch at all.
- **Industrial.** Assam tea plantations and the first Indian tea sold in London (1838-9);
  Hansen's isolation of a pure lager yeast at Carlsberg (1883); the crown cork (1892), which
  is why a fizzy drink can be sold in a bottle at all.
- **Modern.** The French absinthe ban (1915), Nescafé (1938), Gatorade (1965), the Judgment
  of Paris (1976), Red Bull (1987) and the energy-drink category it created, and the craft
  brewing revival. The catalogue's newest drink card is 1988, so anything after that has to be
  written; New Coke (1985) is the deck's most recent card and there is room for two or three
  genuinely modern beats if this theme is ever widened past 36.
