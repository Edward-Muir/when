# The Tamed theme

A 34-card curated theme on animals brought into human service, from the first wolf that
stayed by a fire to the sheep cloned from an adult cell. This note is why these 34 and not
others.

## The scope rule

An event is in only if **it is an animal brought into human service**: a domestication, a new
breed, a working-animal role (war horse, messenger pigeon, sniffer dog), or a milestone in
keeping animals (first zoo, first vet school, cloned sheep).

Excluded: an animal that is merely present in an event (Hannibal's elephants get in on the
working-animal role they perform crossing the Alps and losing at Zama; a battle that happens to
involve cavalry, with no animal-specific point being made, does not). Wildlife firsts that are
about the species rather than about people using it (extinctions, first-appears-in-fossil-record
cards) are out — `last-quagga-dies`, `passenger-pigeon-extinct` and the woolly mammoth cards all
surface on animal keywords and are not in scope. Silk and wool _trade_ cards are out unless the
card is the domestication itself; the Silk Road's fifty-odd trade posts are commerce, not taming.

One edge was argued rather than assumed:

- **`veterinary-school`** (1762, Lyon) is in. It is not on the spine, but the scope rule
  explicitly names "first vet school" as an in-scope milestone, and the catalogue already has
  the exact card. Added to reach the count with a genuine beat rather than a marginal one.

## The 34

|   Year | Slug                               |                |
| -----: | ---------------------------------- | -------------- |
| -30000 | `dog-becomes-companion`            | foothold       |
|  -8500 | `domestication-cattle`             | foothold       |
|  -8400 | `domestication-of-sheep-and-goats` | foothold       |
|  -7500 | `cats-domesticated`                | foothold       |
|  -5000 | `domestication-of-donkeys`         |                |
|  -4000 | `water-buffalo-domesticated`       | NEW            |
|  -3630 | `silkworm-domesticated`            | foothold       |
|  -3600 | `hierakonpolis-royal-menagerie`    | foothold · NEW |
|  -3500 | `domestication-horses`             | foothold       |
|  -2900 | `dromedary-camel-domesticated`     | foothold · NEW |
|  -2400 | `honeybee-keeping-begins`          | foothold       |
|  -2000 | `falconry-emerges-central-asia`    | foothold · NEW |
|  -1500 | `chickens-domesticated`            | foothold       |
|  -1400 | `kikkuli-horse-training-text`      | NEW            |
|   -390 | `rome-sacred-geese-alarm`          | foothold · NEW |
|   -326 | `hydaspes-war-elephants`           | foothold · NEW |
|   -218 | `hannibal-crosses-alps`            | foothold       |
|   -202 | `battle-zama`                      | foothold       |
|    -43 | `mutina-pigeon-messengers`         | NEW            |
|    322 | `stirrup-invented`                 |                |
|   1762 | `veterinary-school`                |                |
|   1791 | `general-stud-book-published`      | NEW            |
|   1793 | `jardin-des-plantes-zoo-opens`     | NEW            |
|   1814 | `barry-rescue-dog-legend`          | NEW            |
|   1828 | `london-zoo-opens-regents-park`    | foothold · NEW |
|   1859 | `first-formal-dog-show`            | NEW            |
|   1873 | `kennel-club-founded-britain`      | NEW            |
|   1893 | `old-hemp-border-collie-ancestor`  | NEW            |
|   1917 | `beersheba-cavalry-charge`         | NEW            |
|   1929 | `seeing-eye-guide-dog-school`      | NEW            |
|   1942 | `izbushensky-cavalry-charge`       | NEW            |
|   1957 | `laika-in-space`                   |                |
|   1992 | `przewalski-horses-rewilded`       | NEW            |
|   1996 | `dolly-sheep-cloned`               | foothold       |

19 of the 34 are new. Measured against the merged catalogue: size **34**, band 0 **17**, bins **6/8** (advisory), same-year pairs **0**.

19 of the 34 are new.

```bash
node scripts/theme-gap.js --include-pending --extra staging/tamed.json --slugs <the 34 above>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **34**,
bins **6/8**, band 0 **17**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, and this
theme has an unusually large number of them (17, more than triple the floor of 5) for the same
structural reason as `clockwork`: **the first eight domestications sit in the emptiest stretch
of the catalogue**, so an `easy`-labelled card there is trivially ordered even though nobody
could date it to a millennium.

- `dog-becomes-companion`, `domestication-cattle`, `domestication-of-sheep-and-goats`,
  `cats-domesticated`, `domestication-horses`, `silkworm-domesticated` and
  `chickens-domesticated` are all pre-existing `easy`/`medium` catalogue cards with multi-century
  windows in a stretch nothing else competes with.
- `hannibal-crosses-alps`, `battle-zama`, `stirrup-invented`, `laika-in-space` and
  `dolly-sheep-cloned` are famous rather than sparse — five of the very few animal-service facts
  most players already hold a date for.
- `london-zoo-opens-regents-park` and `beersheba-cavalry-charge` are the two new cards that land
  in band 0: Regent's Park zoo and the Australian Light Horse charge are both widely known
  enough that grading them `easy`/`medium` on recognition, not on the band, is honest.

The margin is large enough that several of these could be swapped for weaker versions of the
same beat without failing the gate, unlike a thinner theme where every foothold is load-bearing.

## Deliberate omissions

Cards and spine beats left out on purpose.

- **Redundant with an existing catalogue card, so the near-duplicate NEW card was never
  written.** `zoo-ancient` (-1500, "Ancient Egyptian pharaohs maintained exotic animal
  collections") reads as the same beat as the spine's "Egypt Keeps a Royal Menagerie," but it
  collides on year with `chickens-domesticated` (also -1500) and, on inspection, describes a
  later and more generic phenomenon than the specific Predynastic evidence at Hierakonpolis the
  spine beat cites. `hierakonpolis-royal-menagerie` was written fresh at -3600 instead of reusing
  `zoo-ancient`, both to dodge the collision and because it is the more precise claim.
- **Same-year collision, existing vs existing.** `domestication-of-pigs` and
  `domestication-cattle` are both dated -8500 in the catalogue. Cattle stays (famous, `easy`);
  the pig beat is dropped rather than authoring a redundant "pigs domesticated in China"
  card the existing entry already folds in.
- **Redundancy between two spine beats.** "Bactrian Camels Tamed in Asia" (-2600) is dropped —
  it is the same beat as `dromedary-camel-domesticated` (-2900) one species over, and 300 years
  apart is thin cover for carrying both. "Merino Sheep Reach Australia" (1797) is dropped for
  crowding three "new breed" beats into a six-year span (1791/1793/1797) with the general stud
  book and the Jardin des Plantes; merino is the weakest claim of the three (a breed arriving
  somewhere, not a breed or an institution being founded). "The American Kennel Club Is Founded"
  (1884) is dropped as the same beat as `kennel-club-founded-britain` (1873, "the world's
  first"), 11 years and one country apart. "First Guide Dog School Opens" (Oldenburg, 1916) is
  dropped in favor of `seeing-eye-guide-dog-school` (1929) — the same beat, and the American
  school is the more recognizable name.
- **Crowding trimmed after the first gate pass.** `ghent-police-dogs-deployed` (1899, NEW) and
  `denmark-cattle-ai-program` (1936, NEW) were authored and then cut: the first crowded
  `old-hemp-border-collie-ancestor` (1893, six years away), the second crowded both
  `seeing-eye-guide-dog-school` (1929, seven years) and `izbushensky-cavalry-charge` (1942, six
  years). Cutting these two removed three of the five original crowded pairs without giving up a
  beat the spine treats as central.
- **Out of scope.** "Mechanical Hare Racing Debuts" (1926) is dropped — the spine itself flags it
  `obscure`, and an artificial lure a greyhound chases is a thinner "working-animal role" claim
  than everything else in the deck; it reads as a sport, not a job. Wildlife-extinction and
  taxonomy cards a keyword sweep on "domesticat-", "zoo" and "tame" pull in
  (`last-quagga-dies`, `passenger-pigeon-extinct`, `last-thylacine-dies`, the woolly-mammoth
  pair, `first-bees`) are about a species' fate, not a service role, and stay out.
- **Doubtful dates, reused anyway.** Several existing cards are the right beat with a date that
  reads differently from the spine's estimate; per the reconciliation rule they are reused as-is
  rather than edited: `domestication-of-donkeys` (catalogue -5000, spine estimated -3100),
  `silkworm-domesticated` (catalogue -3630, spine -2700), `chickens-domesticated` (catalogue
  -1500, spine -1650). All three are within the range of published estimates for genuinely
  contested prehistoric dates; none looked wrong enough to warrant a `WebSearch` check.

## Known crowding kept on purpose

Two pairs remain inside 8 years, both accepted rather than resolved:

- `general-stud-book-published` (1791) and `jardin-des-plantes-zoo-opens` (1793), 2 years apart.
  Both are named milestones in the scope rule's own examples (a new breed, a first zoo) and nine
  years of the catalogue's Georgian/Revolutionary stretch has nothing else to space them against.
- `przewalski-horses-rewilded` (1992) and `dolly-sheep-cloned` (1996), 4 years apart. Both are
  genuine closing beats — a conservation breeding success and the cloned sheep the scope rule
  names outright — and the modern end of the catalogue is thin enough on in-scope cards that
  moving either is not an option without dropping it.

Everything else in the deck sits 12+ years from its nearest neighbour.

## Still missing from the catalogue

Real gaps, not filler, that were not written because they would collide with or duplicate a
card already in the 34:

- **Bactrian camels tamed in Central Asia** (~-2600) — the same beat as
  `dromedary-camel-domesticated`, one species over; see Deliberate omissions.
- **Merino sheep reach Australia** (1797) and **the American Kennel Club founded** (1884) —
  both genuinely in scope, both cut for crowding/redundancy against a card already in the 34.
- **Ghent's first police dogs** (1899) and **Denmark's cattle AI program** (1936) — both
  written to full staging quality and then cut purely for 6-7 year crowding; either is a clean
  drop-in replacement if a future edit needs to swap something else out.
- **A named messenger-pigeon service beyond Mutina** — the spine's "Baghdad Sets Up a Pigeon
  Post" (1150) was cut early for low confidence and to avoid a second pigeon-messenger beat
  1,193 years after `mutina-pigeon-messengers`; it remains a real and uncrowded gap (nothing
  else sits near 1150) if the deck is ever expanded past 34.
