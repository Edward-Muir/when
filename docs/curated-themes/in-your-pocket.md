# The In Your Pocket theme

A 30-card curated theme on the gadgets people carry about with them, from the navigator's
compass to the coin-sized tracker on a key ring. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a phone or another gadget you carry around**: a device made to
travel on the person, in a pocket, a bag, a belt or a hand.

- **Phones and their ancestors**: the Handie-Talkie, the first mobile call, the DynaTAC, the
  first text, the BlackBerry, the iPhone and the foldable.
- **Pocket tools and instruments**: the compass, spectacles, the spyglass, the stethoscope,
  matches, the Swiss Army knife, the torch, the lighter, the pen.
- **Carry-anywhere cameras and players**: the Kodak, the Brownie, the Leica, the Instamatic,
  the transistor radio, the Walkman and the iPod.

The boundary with the neighbours: watches go to Clockwork, handheld game consoles to Insert
Coin, recorded-music formats to Press Play, and home appliances to Household Gadgets. The
Walkman and the iPod are in as carried devices, not as music formats.

Edges argued rather than assumed:

- **The early instruments** (`compass-navigation`, `eyeglasses-invented`,
  `telescope-invention`, `stethoscope-invented`) are the borderline of "a gadget you carry".
  They are in because each is a hand-held device made to go with its user, and they are the only
  cards that give the deck anything before 1800. They are the first to drop if the scope is read
  tighter.
- **`davy-safety-lamp`** is in as a light carried underground by a miner, the ancestor of the
  torch rather than a fixed lamp.
- **`thermos-vacuum-flask`** is in as a carry-anywhere container, closer to the pocket than to
  the kitchen.
- **`apple-ipad-introduced`** is in as a carried tablet, though it lives on the sofa as much as
  in a bag.

Cut from the spine, all fame 1 and sitting in crowded stretches: the slide rule (1622), the
Vest Pocket Kodak (1912), the Knirps folding umbrella (1928), the Curta calculator (1948), the
Sony TR-63 (1957), the Motorola Pageboy pager (1964) and the Psion Organiser (1984).

## The 30

| Year | Slug                             |                |
| ---: | -------------------------------- | -------------- |
| 1088 | `compass-navigation`             |                |
| 1286 | `eyeglasses-invented`            |                |
| 1608 | `telescope-invention`            | foothold       |
| 1815 | `davy-safety-lamp`               | NEW            |
| 1816 | `stethoscope-invented`           |                |
| 1827 | `friction-match`                 |                |
| 1884 | `fountain-pen`                   |                |
| 1888 | `kodak-roll-film-camera`         |                |
| 1891 | `swiss-army-knife-introduced`    | foothold · NEW |
| 1899 | `electric-flashlight-ever-ready` | NEW            |
| 1900 | `kodak-brownie-camera`           | NEW            |
| 1904 | `thermos-vacuum-flask`           | NEW            |
| 1925 | `leica-i-camera`                 | NEW            |
| 1933 | `zippo-lighter-introduced`       | NEW            |
| 1938 | `ballpoint-pen`                  |                |
| 1940 | `handie-talkie-radio`            | NEW            |
| 1954 | `transistor-radio`               |                |
| 1963 | `kodak-instamatic-camera`        | NEW            |
| 1972 | `hp-35-pocket-calculator`        | NEW            |
| 1973 | `first-mobile-phone-call`        | foothold       |
| 1979 | `walkman-released`               |                |
| 1983 | `motorola-dynatac-8000x`         | NEW            |
| 1992 | `first-sms-text-message`         |                |
| 1999 | `blackberry-email-device`        | NEW            |
| 2001 | `ipod-released`                  | foothold       |
| 2007 | `iphone-released`                | foothold       |
| 2010 | `apple-ipad-introduced`          | foothold · NEW |
| 2016 | `airpods-wireless-earbuds`       | foothold · NEW |
| 2019 | `samsung-galaxy-fold`            | NEW            |
| 2021 | `apple-airtag-tracker`           | NEW            |

The footholds are the reconciler's picks for the opening. 14 cards were reused from the
catalogue and 16 authored for this theme.

Gates, after blind grading: size **30**, band 0 **17**, bins **6/8** (advisory), same-year
pairs **0**, bunching **3** in 1884-1891, shared **1** (`seeing-inside`, via
`stethoscope-invented`). A card's band moves whenever the catalogue around its year does, so
re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Known crowding

The deck is honest about where pocket gadgets cluster: the 1880s-1900s (pen, Kodak, knife,
torch, Brownie, flask) and everything after 1970. Seventeen pairs sit inside theme-gap's
8-year advisory window; the tightest are 1815/1816 (lamp, stethoscope), 1899/1900 (torch,
Brownie) and 1972/1973 (HP-35, first mobile call). Each pair is two different kinds of device,
which gives a player something to reason from.

## Fact-check flags

- **`thermos-vacuum-flask`** (unsupported): Reinhold Burger's German patent is dated
  1 October 1903; the British and French filings and the Thermos company date from 1904, and
  the card's name says "Patented". Either keep 1904 and rename it "Thermos Flask Launched", or
  move it to 1903.
