# The Deep

A 34-card curated theme about people going deliberately under water — and about what they
found down there. It runs from Aegean sponge divers to the Titan implosion. This note is why
these 34 and not others.

## The scope rule

An event is in the theme only if **humans went deliberately under water, or found what sank**.
That admits breath-hold and sponge diving, diving bells, diving suits and helmets, submarines
and submersibles, scuba and staged decompression, undersea cables laid, deep-sea biology, and
wreck discoveries.

It excludes three things the catalogue is full of and a keyword sweep drags in:

- **Surface voyages and the sinkings themselves.** `titanic-disaster` is not this theme;
  `titanic-wreck-found` is. Same for `vasa-sinking` against the salvage of Vasa's guns, and
  `shackleton-endurance` against the wreck being found on the Weddell Sea floor.
- **Naval battles.** The Hunley is here because it is a submarine, not because it is a
  Civil War engagement; no other action made the cut.
- **Tsunamis and marine geology done from the surface.** `storegga-tsunami` is a wave;
  `seafloor-spreading-confirmed` is a magnetometer towed behind a ship. Neither puts a person
  under water.

The catalogue is very thin here. A keyword sweep over diving, submarines, wrecks, salvage and
oceanography returned 28 playable events, of which only four survived the scope rule — and the
newest of those is from before the modern era of remote vehicles and repeat Challenger Deep
dives. So **30 of the 34 cards are newly authored**, including essentially the whole ancient
arc, the whole early-modern diving-bell arc, and everything after the Mariana Trench card.

## The 34

Paste as `eventNames` into the workflow's `theme` input.

|  Year | Slug                            |          |     |
| ----: | ------------------------------- | -------- | --- |
| -1000 | `aegean-sponge-divers`          | foothold | NEW |
|  -700 | `gulf-pearl-diving`             | foothold | NEW |
|  -480 | `scyllis-combat-diver`          |          | NEW |
|  -414 | `syracuse-underwater-palisade`  |          | NEW |
|  -350 | `aristotle-diving-kettle`       |          | NEW |
|  -332 | `alexander-diving-bell`         | foothold | NEW |
|  -100 | `roman-urinatores`              |          | NEW |
|   250 | `ama-divers-japan`              | foothold | NEW |
|   600 | `marine-law`                    |          |     |
|  1250 | `bacon-undersea-instruments`    |          | NEW |
|  1300 | `coral-trade-mediterranean`     |          |     |
|  1500 | `leonardo-diving-apparatus`     |          | NEW |
|  1535 | `nemi-diving-bell`              |          | NEW |
|  1620 | `drebbel-submarine-thames`      |          | NEW |
|  1664 | `vasa-cannon-salvaged`          |          | NEW |
|  1690 | `halley-diving-bell`            |          | NEW |
|  1715 | `lethbridge-diving-engine`      |          | NEW |
|  1776 | `turtle-submarine-attack`       |          | NEW |
|  1788 | `smeaton-diving-bell-pump`      |          | NEW |
|  1823 | `deane-diving-helmet`           |          | NEW |
|  1837 | `siebe-closed-diving-dress`     |          | NEW |
|  1851 | `dover-calais-submarine-cable`  |          | NEW |
|  1864 | `hunley-sinks-housatonic`       |          | NEW |
|  1872 | `challenger-expedition`         |          | NEW |
|  1900 | `antikythera-wreck-found`       |          | NEW |
|  1908 | `haldane-decompression-tables`  |          | NEW |
|  1934 | `bathysphere-descent`           |          | NEW |
|  1943 | `aqua-lung-invented`            | foothold | NEW |
|  1960 | `mariana-trench`                |          |     |
|  1977 | `hydrothermal-vents-discovered` |          | NEW |
|  1985 | `titanic-wreck-found`           | foothold |     |
|  1995 | `kaiko-challenger-deep`         |          | NEW |
|  2012 | `cameron-challenger-deep`       |          | NEW |
|  2023 | `titan-submersible-implosion`   | foothold | NEW |

Measured with the new cards staged in (`--include-pending --extra`): size 34, spread 8/8 bins
`[6 3 2 5 6 4 3 5]`, band 0 = 7, same-year pairs 0, and no pair inside eight years. Re-read
those from the catalogue rather than from here once the art exists — a card's band depends on
how crowded its neighbourhood is, and this theme adds 30 events to that neighbourhood itself:

```bash
npm run theme:gap -- --slugs <the 34 above, comma-separated>
```

## Why the footholds are the footholds

`MIN_BAND_ZERO` wants five cards in the catalogue's easiest global quartile, and band 0 blends
the `difficulty` label with how _sparse_ the timeline is around the year. This theme gets its
seven from two different mechanisms, and it is worth knowing which is which, because they fail
differently.

**Three are genuinely famous cards, easy in any neighbourhood.** `aqua-lung-invented`,
`titanic-wreck-found` and `titan-submersible-implosion` are graded `easy` on recognition —
Cousteau's demand valve, Ballard's discovery, and a submersible implosion that was global front
-page news. These sit in the densest stretch of the catalogue (600-700 events within a 25-year
window) and are still band 0, because an `easy` label alone lands under the first quartile cut
anywhere on the timeline. They are load-bearing and none of them can be swapped for another
card in this theme; there is no fourth globally-easy deep-sea event.

**Four are ordinary cards standing in empty centuries.** `aegean-sponge-divers`,
`gulf-pearl-diving`, `alexander-diving-bell` and `ama-divers-japan` are all `medium`, which is
band 1 or worse from 600 CE onward — but before that the catalogue holds 8-20 events per
25-year window, and the sparsity term drags a `medium` under the cut. That is why the ancient
end of this theme is written as four separate breath-hold and diving-bell cards rather than one
summary card: **the ancient cards are the opening hand**, and thinning them to two would leave
the theme on five and one relabelling away from failing validation.

Note what this rules out. `scyllis-combat-diver` (b2) and `aristotle-diving-kettle` (b2) sit in
the same sparse centuries and are _not_ footholds, because `hard` costs more than sparsity
returns. Regrading either to `medium` to buy a foothold would be grading crowding, not
recognition, which is exactly what `difficultyScore.ts` asks authors not to do. If this theme
ever needs more headroom, the lever is another genuinely famous card — a Challenger Deep or a
Ballard-scale discovery — not a relabelled one.

## Deliberate omissions

**Existing slugs rejected in favour of a new card.**

- `submarine-first-practical` (1864, the French _Plongeur_) collides on the year with
  `hunley-sinks-housatonic`, and only one can be in the deck. The Hunley is the more canonical
  beat — the first submarine to sink a warship — and grades `medium` where the Plongeur card
  grades `hard`, which the opening hand cares about. The Plongeur card is also categorised
  `media`, which is wrong for it, so it was not the card to build on.
- `rebreather` (1878, Fleuss's closed-circuit set) is squarely in scope and already
  illustrated, but it sits six years from `challenger-expedition` (1872) — inside the
  coin-flip window. It was dropped in favour of `haldane-decompression-tables` (1908), which
  covers the same "how do you survive down there" beat, is the bigger of the two, and lands in
  clear water.
- `birth-jacques-cousteau` (1910) was left out because the theme already carries Cousteau at
  the moment that matters, `aqua-lung-invented`, and a birth card would have crowded
  `haldane-decompression-tables`.
- `pandya-dynasty` (600) is about pearl fisheries but collides on the year with `marine-law`,
  and it is fundamentally an empires card. `marine-law` won the slot: the Rhodian sea law is
  where salvage shares were set by the depth the diver worked at, which is this theme.

**Near-year crowding dropped.** `phips-treasure-salvage` (1687, the Concepción) is three years
from `halley-diving-bell`; the bell is the more consequential beat and Phips went.
`royal-george-salvage` (1839, the first large-scale diving operation) is two years from
`siebe-closed-diving-dress`, and the Siebe dress is what made it possible.
`first-transatlantic-cable` (1858) and `transatlantic-cable-completed` (1866) both crowd the
Hunley, and between them and `dover-calais-submarine-cable` they are three cards for one beat;
Dover-Calais is the _first_ working undersea cable, so it kept the slot.
`endurance-wreck-found` (2022) is one year from the Titan implosion, and Titan is an
irreplaceable band-0 foothold where Endurance is not.

**Redundancy.** `alberti-nemi-salvage` (1446) and `nemi-diving-bell` (1535) are the same lake
and the same sunken ships; the bell is the technical first. `piccard-bathyscaphe-fnrs2` (1948)
against `mariana-trench` (1960), which is the same vehicle lineage arriving at the bottom.
`uss-nautilus-launched` (1954) and a North Pole transit card are one submarine twice, and both
crowd the Trieste dive.

**Keyword false positives the sweep dragged in.** `burberry-trench-coat` and
`first-battle-of-the-marne` (trench), `pearl-harbor` (pearl), `birth-john-calvin` and
`servetus-burned-at-stake` — both dragged in by an `alvin\b` alternative that was anchored on
the right but not the left, so it matched **C**_alvin_; anchor both ends. `chunnel-completed`
and `seikan-tunnel` (under water, but a tunnel is not diving), `louganis-head-injury-1988` and
`fina-founded-1908` (springboard diving is a sport, not the deep), `imjin-war-turtle-ship`
(Korean turtle ships were armoured, not submersible), `whale-oil-trade` (surface whaling),
`first-animals-sponges` and `first-coral-reefs` (marine life, but no humans and hundreds of
millions of years outside the era target), and `antikythera-mechanism` — which is in the
catalogue at the year the device was _made_, not the year sponge divers found it, so the
theme carries `antikythera-wreck-found` instead.

## What is still missing from the catalogue

Real gaps, not filler, left unwritten because each collides with a card already in the 34 or
would have pushed past the clearable ceiling:

- **Saturation diving**, the whole arc: Bond's Genesis experiments, Conshelf I, Sealab II,
  Tektite II and its all-woman aquanaut crew, and Comex's record chamber dives. Every plausible
  year for these falls within eight years of `mariana-trench` (1960) or
  `hydrothermal-vents-discovered` (1977).
- **Sylvia Earle's untethered JIM-suit walk** (1979) and **the raising of the Mary Rose**
  (1982), both crowded out by `titanic-wreck-found` (1985).
- **Project Azorian** (1974) — the Glomar Explorer raising part of a Soviet submarine — three
  years from the hydrothermal vents.
- **The Bismarck wreck** (1989) and **the Endurance wreck** (2022), the two obvious companions
  to the Titanic discovery.
- **The Census of Marine Life** (2000) and **deep-sea polymetallic nodule mining** (the first
  full collector trial, 2021): both are the modern deep as an industry and a survey rather than
  an expedition, and both crowd neighbours.
- **Paul Bert on the bends** (1878) — the physiology that `haldane-decompression-tables` turned
  into a procedure — and **Vescovo's Five Deeps** (2019), seven years from Cameron's solo dive.
- The medieval stretch is genuinely empty in the catalogue and only two cards cover it here.
  Cola Pesce, the Hepu pearl beds, and Marco Polo on the Gulf of Mannar fishery are all
  candidates if this theme is ever widened.
