# The Cities Ablaze theme

A 35-card curated theme on cities destroyed by fire, from a Bronze Age port razed in the eastern
Mediterranean collapse to the Allied firebombing of Tokyo, plus the handful of decisive steps
taken to fight back: brigades, hydrants, sprinklers, codes.

## The scope rule

A card is in only if **a city (or a great building within one) burned**, or it is **a decisive
step in fighting urban fire** (brigades, hydrants, codes, extinguishers, sprinklers). A city
deliberately burned in war counts only if the fire itself is the event, not a general sack.

That last clause did real work:

- **`fourth-crusade-byzantine`** ("Fourth Crusade Sacks Byzantium") and **`mongol-baghdad`**
  ("Mongols Sack Baghdad") both read, on their `friendly_name`, like the general-sack case the
  rule excludes. Both are kept anyway: the 1204 sack is textbook-documented as three separate
  fires that burned a third of Constantinople over the campaign, and the 1258 sack burned the
  House of Wisdom and much of Baghdad along with the massacre. The fire is not incidental to
  either event, only under-billed in the existing card's wording. `sack-rome-visigoths` (410)
  gets the same reading — Alaric's men burned as they went.
- **`san-francisco-earthquake`** and **`lisbon-earthquake`** are in because their own
  descriptions already say a fire followed and did most of the damage — San Francisco's burned
  for three days on broken gas mains, Lisbon's consumed what the quake and tsunami had not. An
  earthquake card without that language would have been out.
- **`nika-riots`** is in on the same logic as the Crusader sack: a riot is not war, but this one
  burned the original Hagia Sophia and much of Constantinople, which is the beat regardless of
  what the existing `friendly_name` foregrounds.
- The Second Sino-Japanese War's Nanjing Massacre, the Rape of Nanking, and Guernica were all
  checked and left out: atrocity and bombardment, not a city burning down.

## The 35

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
| -1177 | `burning-of-ugarit`                | NEW            |
|  -586 | `babylonian-destruction-jerusalem` | foothold       |
|  -480 | `persians-burn-athens`             | NEW            |
|  -330 | `burning-of-persepolis`            | foothold · NEW |
|   -48 | `alexandria-library-caesar-fire`   | foothold · NEW |
|     6 | `rome-founds-vigiles`              | NEW            |
|    64 | `great-fire-rome`                  | foothold       |
|   532 | `nika-riots`                       |                |
|  1571 | `tatars-burn-moscow`               | NEW            |
|  1631 | `sack-of-magdeburg`                | NEW            |
|  1657 | `great-fire-of-meireki`            | NEW            |
|  1666 | `great-fire-london`                | foothold       |
|  1728 | `great-fire-of-copenhagen`         | NEW            |
|  1736 | `franklin-founds-fire-company`     | NEW            |
|  1755 | `lisbon-earthquake`                |                |
|  1760 | `great-boston-fire-1760`           |                |
|  1801 | `graff-post-fire-hydrant`          | NEW            |
|  1812 | `burning-of-moscow`                |                |
|  1814 | `british-burn-washington`          | foothold · NEW |
|  1824 | `edinburgh-municipal-fire-brigade` | NEW            |
|  1835 | `great-fire-new-york`              |                |
|  1842 | `great-fire-of-hamburg`            | NEW            |
|  1864 | `burning-of-atlanta`               | foothold · NEW |
|  1871 | `great-chicago-fire`               | foothold       |
|  1874 | `parmelee-automatic-sprinkler`     | NEW            |
|  1889 | `great-seattle-fire`               | NEW            |
|  1896 | `nfpa-founded`                     | NEW            |
|  1903 | `iroquois-theatre-fire`            | NEW            |
|  1906 | `san-francisco-earthquake`         | foothold       |
|  1911 | `triangle-shirtwaist-fire`         |                |
|  1923 | `great-kanto-earthquake`           |                |
|  1942 | `cocoanut-grove-fire`              | NEW            |
|  1943 | `hamburg-firestorm`                | NEW            |
|  1944 | `nazis-raze-warsaw`                | NEW            |
|  1945 | `tokyo-firebombing`                | foothold       |

22 of the 35 are new. Measured against the merged catalogue: size **35**, band 0 **10**, bins **6/8** (advisory), same-year pairs **0**.

18 of the 35 are new. At authoring time, with the new cards loaded via `--include-pending
--extra`: size **35**, spread **7/8 bins**, band 0 **12**, same-year pairs **0**.

```
node scripts/theme-gap.js --include-pending --extra <staging file> --slugs <the 35 above>
```

## Why the footholds are the footholds

Twelve is a wide margin over the floor of 5, for a structural reason: the theme's oldest
stretch sits in the emptiest part of the catalogue, exactly as with `clockwork`. `burning-of-ugarit`,
`babylonian-destruction-jerusalem`, `third-punic-war`, `rome-founds-vigiles` and
`great-fire-rome` span 1,200-odd years where almost nothing else in the catalogue competes for
placement, so they land in band 0 on sparsity alone. `sack-rome-visigoths`, `great-fire-london`,
`burning-of-moscow` and `tokyo-firebombing` are footholds on fame instead — each is a genuinely
famous fire independent of era. `tatars-burn-moscow`, `franklin-founds-fire-company`,
`british-burn-washington` and `burning-of-atlanta` are new cards that land in band 0 for the
same reasons as their neighbours (a sparse 16th-century Russian stretch, a famous name, two
famous American war stories), not because the labels were graded down to fit — `burning-of-atlanta`
and `british-burn-washington` are both graded `easy` on recognition, honestly.

## Deliberate omissions

**Spine beats cut for redundancy or crowding**, not lack of merit:

- **`-387` Gauls burn Rome.** Semi-legendary (the sources are late and moralizing), and the
  ancient end of the deck already carries five cards from Ugarit to the Vigiles; a sixth ancient
  entry so close to `sack-rome-visigoths` (410) — the "first sack in 800 years" callback the
  Visigoth card's own description makes — was cut rather than diluting that line.
- **`-48` Fire in Caesar's Alexandrian War.** The spine flagged it `confidence: medium` and
  noted "some ancient sources link it to library losses" — the Library of Alexandria's fate is
  a genuinely disputed question, and a short, factual description risks implying more than the
  sources support either way. Cut rather than write around a controversy the card can't contain.
- **`1795` Great Fire of Copenhagen.** In scope, but the deck already has five "a great city
  burned down" 18th-19th-century entries (London, New York, Chicago, Boston-adjacent Atlanta,
  Seattle); Copenhagen was the least distinct of the set and the first cut once the size gate
  was comfortably clear.
- **`1818` Manby's portable fire extinguisher.** In scope, but redundant with the hydrant
  (1801) and sprinkler (1874) already carrying the "decisive step in firefighting technology"
  thread; three inventions in that thread felt like enough.
- **`1851` Great Fire of San Francisco.** San Francisco already has a card (1906); a second
  San Francisco fire 55 years apart is defensible but was the marginal cut once the "great city
  burned" bucket needed trimming.
- **`1886` Great Vancouver Fire.** Three years from `great-seattle-fire` (1889) and the same
  beat — a newly built frontier city burns to the ground in under a day. Seattle's is the
  better-documented and slightly better-known of the pair.
- **`1904` Great Baltimore Fire.** Adjacent to `iroquois-theatre-fire` (1903) and
  `san-francisco-earthquake` (1906); its main distinguishing fact (standardized hose couplings)
  is a narrower version of the "decisive step" thread already carried by the hydrant, sprinkler
  and NFPA cards.
- **`1865` NYC gets a paid fire department.** In scope, but the "organized firefighting"
  thread already runs Vigiles (6) → Franklin's volunteers (1736) → NFPA (1896), and a fourth
  stop on that arc, one year from `burning-of-atlanta`, was the cut once the deck needed
  trimming to size.
- **`1872` Great Boston Fire.** One year from `great-chicago-fire` (1871) and two from
  `parmelee-automatic-sprinkler` (1874); Chicago is the more famous version of the same beat
  and both survive better without a third card wedged between them.
- **`1922` Great Fire of Smyrna.** In scope and well documented, but one year from
  `great-kanto-earthquake` (1923); cut as the less central of the pair once the deck needed
  trimming — Kanto's fire followed a natural disaster rather than a war, giving the surviving
  card more contrast with the Hamburg/Warsaw/Tokyo cluster nearby.

**A false positive the sweep would have suggested**, checked and rejected: the Reichstag fire
(1933) burned a single building for political theater, not a city; it belongs to a different
theme (arson as pretext) if one is ever built.

## Known crowding kept on purpose

The 1942-1945 run (`cocoanut-grove-fire`, `hamburg-firestorm`, `nazis-raze-warsaw`,
`tokyo-firebombing`) is four cards in four consecutive years — the tightest crowding in the
deck, and `theme-gap` flags every adjacent pair in it. All four are kept: this is the real
historical cluster the theme's late section is about, distinct events (a nightclub disaster
that rewrote fire codes, a firebombing over Europe, a systematic razing, a firebombing over the
Pacific) that happen to fall in the same four years because that is when they happened. Thinning
it would trade truthful clustering for an artificially even spread. `1903/1906/1911`
(Iroquois, San Francisco, Triangle) is the same trade on a smaller scale: three distinct American
fire-code turning points inside eight years, kept for the same reason.

## Still missing from the catalogue

Real gaps, not filler, left unwritten because they collide with a card already in the 35:

- **The Reichstag fire** (1933) — considered and rejected above on scope, not crowding, but
  worth naming since a keyword sweep surfaces it immediately.
- **The Great Fire of Smyrna** (1922) and **Great Boston Fire** (1872) — both genuinely in
  scope; see "Deliberate omissions" above. Either could replace a neighbour if this theme is
  ever re-cut.
- **Essen and Parry's caesium clock**-style "second version of a beat" cases don't really occur
  here — this theme's redundancy is almost all same-beat-different-city (frontier towns burn,
  American venue fires reform codes), not duplicate versions of one event, which is why the
  omissions above are trims rather than swaps.
- **Nero's Domus Aurea built on the ashes** and **London's 1834 Parliament fire** were checked
  and are about what rose after a fire or burned a single building, not a city burning — the
  same reasoning that excluded the Reichstag.

## Review edits

The reconciling pass admitted five general sack or siege cards (`third-punic-war`,
`siege-of-jerusalem-70ce`, `sack-rome-visigoths`, `fourth-crusade-byzantine`, `mongol-baghdad`)
on the grounds that fire was part of each. Review took them out: the scope rule admits a
wartime burning only when **the fire itself is the event**, and four of the five are already
Under Siege cards. In their place: `alexandria-library-caesar-fire` (shared with Places of
Learning), `great-boston-fire-1760`, and three new cards, `great-fire-of-copenhagen` (1728),
`edinburgh-municipal-fire-brigade` (1824) and `great-fire-of-hamburg` (1842). Anything above
that still discusses the five removed cards describes the pre-review deck; the table is current.
