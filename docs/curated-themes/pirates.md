# The Pirates & Privateers theme

A 34-card curated theme on armed robbery and raiding at sea, from the Bronze Age Delta to the
end of the Somali hijacking wave — pirates, corsairs, privateers, sea raiders, and the states
that fought them off. This note is why these 34 and not others.

## The scope rule

An event is in only if **it is armed robbery or raiding at sea (pirates, corsairs, privateers,
sea raiders), or a decisive act in the war against it.**

- **The raid or robbery itself**: a ship boarded, a coastal town sacked, a fleet seized —
  whether the raider is a stateless pirate, a state-commissioned privateer, or a corsair
  operating under a ruler's flag. The line between "pirate" and "privateer" is a legal fiction
  the theme deliberately does not police: Drake, Piet Heyn and Surcouf were all licensed by a
  crown, and all three are in for the same reason Blackbeard is — they took ships by force at
  sea.
- **The war against it**: a battle, siege, bombardment, conquest, trial, execution, pardon or
  treaty whose point was suppressing raiders. `decatur-burns-philadelphia` and
  `bombardment-algiers-slaves-freed` are wars, not robberies; they are in because the rule
  admits both halves of the fight.

Two edges were argued rather than assumed:

- **`grace-omalley-meets-elizabeth`** is in. The 1593 audience is not itself a raid, but it is
  the direct reckoning of O'Malley's raiding career with the state she raided against — the
  same shape as `drake-knighted-golden-hind`, just the opposite outcome.
- **`zheng-yi-sao-fleet-surrenders`** is in as the closing act of the largest pirate
  confederation in history: a negotiated surrender is still a decisive act ending raiding at
  sea, even though nobody fires a shot.

Excluded on the same rule: a fleet or admiral's mere existence without an act of raiding or
suppression (Barbarossa's 1533 promotion to grand admiral, cut — see below), and privateering
that never engages an enemy ship (there are several "letters of marque issued" candidates in
the wider catalogue that never surface here because nothing was actually taken).

## The 34

```
node scripts/theme-gap.js --include-pending --extra staging/pirates.json --slugs <the 34>
```

At authoring time: size **34**, bins **6/8**, band 0 **9**, same-year pairs **0**.

|  Year | Slug                                  |                |
| ----: | ------------------------------------- | -------------- |
| -1175 | `ramesses-iii-sea-peoples`            | foothold · NEW |
|  -229 | `rome-war-on-queen-teuta`             | NEW            |
|   -75 | `caesar-captured-cilician-pirates`    | foothold · NEW |
|   -67 | `pompey-sweeps-mediterranean-pirates` | foothold · NEW |
|   793 | `viking-lindisfarne`                  | foothold       |
|   845 | `vikings-sack-paris`                  | foothold · NEW |
|  1401 | `stortebeker-executed-hamburg`        | NEW            |
|  1516 | `barbarossa-brothers-seize-algiers`   | NEW            |
|  1538 | `battle-of-preveza`                   | NEW            |
|  1555 | `wokou-raiders-besiege-nanjing`       | NEW            |
|  1559 | `qi-jiguang-crushes-wokou`            | NEW            |
|  1572 | `drake-raids-nombre-de-dios`          | NEW            |
|  1581 | `drake-knighted-golden-hind`          | foothold · NEW |
|  1593 | `grace-omalley-meets-elizabeth`       | NEW            |
|  1628 | `piet-heyn-captures-treasure-fleet`   | NEW            |
|  1631 | `corsairs-sack-baltimore-ireland`     | NEW            |
|  1671 | `morgan-sacks-panama-city`            | NEW            |
|  1695 | `every-raids-ganj-i-sawai`            | NEW            |
|  1701 | `captain-kidd-hanged-london`          | foothold · NEW |
|  1718 | `blackbeard-killed-ocracoke`          | foothold · NEW |
|  1720 | `bonny-read-convicted-piracy`         | NEW            |
|  1722 | `bartholomew-roberts-killed`          | NEW            |
|  1756 | `vijaydurg-falls-to-british`          | NEW            |
|  1789 | `rachel-wall-hanged-piracy`           | NEW            |
|  1800 | `surcouf-captures-kent`               | NEW            |
|  1804 | `decatur-burns-philadelphia`          | NEW            |
|  1810 | `zheng-yi-sao-fleet-surrenders`       | NEW            |
|  1816 | `bombardment-algiers-slaves-freed`    | NEW            |
|  1830 | `france-conquers-algiers`             | NEW            |
|  1848 | `spain-storms-balanguingui`           | NEW            |
|  2004 | `recaap-piracy-pact-signed`           | NEW            |
|  2008 | `eu-operation-atalanta-launched`      | NEW            |
|  2009 | `maersk-alabama-hijacked`             | foothold · NEW |
|  2017 | `somali-hijackings-fall-to-zero`      | NEW            |

33 of the 34 are new. Measured against the merged catalogue: size **34**, band 0 **9**, bins **6/8** (advisory), same-year pairs **0**.

33 of the 34 are new — the catalogue held almost nothing that named a specific raid, trial or
battle, as opposed to the general subject of piracy (see "Deliberate omissions" below).

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, so the
footholds split into two families:

- **Ancient sparsity**: `ramesses-iii-sea-peoples` (-1175), `caesar-captured-cilician-pirates`
  (-75) and `pompey-sweeps-mediterranean-pirates` (-67) sit in stretches the catalogue barely
  touches, so even a reader who could not date them within a century still orders them
  trivially. `viking-lindisfarne` and `vikings-sack-paris` are the same story a millennium
  later — the early medieval catalogue is thin enough that two Viking raids 52 years apart are
  each easy to place.
- **Genuine fame**: `drake-knighted-golden-hind`, `captain-kidd-hanged-london`,
  `blackbeard-killed-ocracoke` and `maersk-alabama-hijacked` are footholds because they are
  three of the handful of pirate facts most players already hold — Drake's knighthood, Captain
  Kidd's name, Blackbeard's death, and the ship from a film most players have seen.

9 against a floor of 5 gives real margin: dropping any two footholds still clears the gate.

## Deliberate omissions

- **Cut from the spine for redundancy.** `1533 Barbarossa made grand admiral` — an
  administrative promotion, not a raid or a battle, and five years from `battle-of-preveza`
  which is the decisive naval act the promotion enabled anyway. `1579 Drake plunders the
Cacafuego` — a third Drake beat inside nine years alongside the 1572 raid and the 1581
  knighting; the raid and its reward already carry the arc. `1693 Thomas Tew's Red Sea raid`
  and `1698 Angre takes to the Konkan seas` — both crowd `every-raids-ganj-i-sawai` (1695) and
  `captain-kidd-hanged-london` (1701) without adding a beat those two don't already cover.
  `1627 Barbary corsairs raid Iceland` — obscure and one year from `piet-heyn-captures-treasure-fleet`
  (1628); `corsairs-sack-baltimore-ireland` (1631) already carries the Barbary-raid-on-a-Christian-
  coast beat. `1717 Pirates offered the King's Pardon` — an institutional policy footnote a
  year from `blackbeard-killed-ocracoke`; the pardon's failure is implicit in Blackbeard's death
  anyway. `1815 Lafitte's raiders join New Orleans` — the scope fit is the weakest on the spine
  (a privateer band folded into someone else's land battle, not a raid or a suppression in its
  own right) and it sits one year from `bombardment-algiers-slaves-freed`. `1981 Maritime Bureau
founded` — an institutional founding with no raid or battle attached to it, the weakest
  scope fit among the modern beats, and not needed once `recaap-piracy-pact-signed` and
  `eu-operation-atalanta-launched` carry the "war against it" beat for the modern era.
- **Existing catalogue cards checked and left out.** `barbary-wars` (1801, "Barbary Wars
  Begin") is in scope and close in year to `decatur-burns-philadelphia` (1804) and
  `surcouf-captures-kent` (1800); `decatur-burns-philadelphia` is the specific, well-known act
  within that war and is kept instead so the three-year stretch does not carry two cards for
  the same conflict. `viking-raids-begin` (also 793) is the same beat as
  `viking-lindisfarne` under a second slug; the `warfare`-categorised one was kept as the
  closer fit for a raiding theme.
- **False positives a keyword sweep drags in.** `every` matches "every" and "everywhere" across
  hundreds of unrelated descriptions; `read` matches "already", "spread" and "already read";
  `kidd` and `morgan` collide with `volleyball-invented` (William Morgan) and the 1907 banking
  panic (J.P. Morgan); `drake` also returns Drake the rapper's absence (none in this catalogue,
  but the anchor still matters) and Nasa's Drake equation candidates in other themes' staging.
  None of these needed anchoring fixes here because a manual per-beat `near.js year` check
  caught them before any grep-based net was run.

## Known crowding kept on purpose

Ten pairs in the 34 sit inside the 8-year advisory window `theme-gap` flags, more than most
curated themes carry. Three clusters are kept deliberately rather than trimmed further:

- **1555 / 1559** (`wokou-raiders-besiege-nanjing` → `qi-jiguang-crushes-wokou`): the raid and
  the campaign that broke it. Splitting them loses the "war against it" half of the scope rule
  for the wokou crisis entirely.
- **1718 / 1720 / 1722** (`blackbeard-killed-ocracoke` → `bonny-read-convicted-piracy` →
  `bartholomew-roberts-killed`): the crackdown that ended the Golden Age of Piracy happened in
  a five-year span in the real record; three cards this close is the honest shape of that
  history, not an authoring accident, and two of the three are footholds so the cluster costs
  the deck nothing at the open.
- **1800 → 1804 → 1810 → 1816** (Surcouf, Decatur, Zheng Yi Sao, the Algiers bombardment): four
  distinct actors — French, American, Chinese, Anglo-Dutch — converging on the same 16-year
  stretch because that is when the age of state-organised raid-suppression actually peaked.
  Trimming any one loses a region the deck otherwise has no other card for.

The 2008/2009 pair (`eu-operation-atalanta-launched` → `maersk-alabama-hijacked`) is kept for
the same reason clockwork kept its 1967/1972 pair: the second card is what the first was stood
up to prevent, and neither date can be moved without breaking that causal link.

## Still missing from the catalogue

Real gaps that were not written because they would crowd a card already in the 34:

- **The destruction of the Sea Peoples' fleet at Djahy** (~1178 BCE), a companion land-and-sea
  battle two years from `ramesses-iii-sea-peoples`.
- **The Rhodian sea patrol treaties** (2nd century BCE) that Rome's war on Teuta echoes —
  too close to `rome-war-on-queen-teuta` to add without a second Adriatic card.
- **The sack of London Bridge**-adjacent Viking raids of the 850s-870s — the Great Heathen Army
  already has its own catalogue card (`great-heathen-army`) outside this theme's scope (it is a
  land invasion, not a raid at sea).
- **Uluç Ali Reis's corsair career** (1570s) — a genuine Barbary figure of the first rank, but
  every date on his career sits inside eight years of `battle-of-preveza` or
  `corsairs-sack-baltimore-ireland`.
- **The Nassau pirate republic's founding** (~1713) — the setting for the pardon beat that was
  cut; reviving it would need `1717 Pirates offered the King's Pardon` back too.
- **The Barbary hostage crises of the 1780s-90s** (the Dey of Algiers's American captives) —
  the direct cause of the Barbary Wars, but inside eight years of `rachel-wall-hanged-piracy`.
- **A dedicated Anne Bonny or Mary Read biography card** — the theme keeps them as a joint
  trial card (`bonny-read-convicted-piracy`); splitting them into two would only deepen the
  1718-1722 cluster.
- **The end of the Barbary Wars proper** (1815, the Second Barbary War) — inside a year of
  `lafitte`'s cut date and four of `bombardment-algiers-slaves-freed`; the 1816 bombardment
  already carries the "Europe ends Barbary raiding" beat.
