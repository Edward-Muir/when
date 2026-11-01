# The Gone Forever theme

A 30-card curated theme on species lost in the human era, from Madagascar's elephant birds to
the Chinese paddlefish: the last sightings, the last kills and the last named survivors. This
note is why these 30 and not others.

## The scope rule

An event is in only if **it is a species going extinct.**

- **The loss itself**: the last kill, the last sighting, the death of the last known individual,
  or the survey or ruling that declared the species gone. Named last survivors (Martha, Benjamin,
  Booming Ben, Celia, Lonesome George) are in as the clearest form of the beat.
- **The neighbours take the rest**: mass extinctions and prehistoric species go to Before Us,
  rescue and protection to Back from the Brink, and discoveries to Newfound Beasts.

Edges argued rather than assumed:

- **Functional extinction is in.** The baiji (2006) was declared functionally extinct after a
  survey found none, and `northern-white-rhino-decline` (2018), the death of Sudan, left his
  subspecies with no male. A first pass cut Sudan on that ground while keeping the baiji; the
  two are the same kind of ending, so both stay.
- **The ivory-billed woodpecker is in as a proposal**, retitled "Ivory-Bill Proposed Extinct".
  The 2021 beat was only a proposal to delist it as extinct, and the decision was later
  deferred, so the card says exactly that.
- **The dodo takes the existing card at 1681**, the extinction, rather than a new card for the
  1662 last sighting. Two dodo-extinction cards in the catalogue would be a duplicate.

## The 30

| Year | Slug                                       |                |
| ---: | ------------------------------------------ | -------------- |
| 1000 | `elephant-birds-vanish-madagascar`         | NEW            |
| 1445 | `moa-extinct-new-zealand`                  | NEW            |
| 1627 | `last-aurochs-dies`                        |                |
| 1681 | `dodo-driven-extinct`                      | foothold       |
| 1768 | `stellers-sea-cow-hunted-out`              | NEW            |
| 1844 | `last-great-auks-killed`                   | NEW            |
| 1858 | `last-cape-lion-shot`                      | NEW            |
| 1865 | `tasmanian-emu-extinct`                    | NEW            |
| 1876 | `falkland-islands-wolf-extinct`            | NEW            |
| 1883 | `last-quagga-dies`                         |                |
| 1895 | `stephens-island-wren-extinct`             | NEW            |
| 1902 | `rocky-mountain-locust-extinct`            | NEW            |
| 1907 | `huia-last-seen`                           | NEW            |
| 1914 | `passenger-pigeon-extinct`                 |                |
| 1918 | `last-carolina-parakeet-dies`              | NEW            |
| 1922 | `last-wild-barbary-lion-shot`              | NEW            |
| 1932 | `last-heath-hen-booming-ben`               | NEW            |
| 1936 | `last-thylacine-dies`                      |                |
| 1941 | `xerces-blue-butterfly-extinct`            | NEW            |
| 1952 | `caribbean-monk-seal-last-sighted`         | NEW            |
| 1970 | `caspian-tiger-extinct`                    | NEW            |
| 1976 | `javan-tiger-last-recorded`                | NEW            |
| 1987 | `dusky-seaside-sparrow-last-dies`          | NEW            |
| 1989 | `golden-toad-last-seen`                    | foothold · NEW |
| 2000 | `celia-last-pyrenean-ibex-dies`            | foothold · NEW |
| 2006 | `baiji-functionally-extinct`               | foothold · NEW |
| 2012 | `lonesome-george-dies`                     | NEW            |
| 2018 | `northern-white-rhino-decline`             | foothold       |
| 2021 | `ivory-billed-woodpecker-proposed-extinct` | NEW            |
| 2022 | `chinese-paddlefish-declared-extinct`      | NEW            |

24 of the 30 were written for this theme. The catalogue already held the aurochs, the dodo, the
quagga, Martha, Benjamin and Sudan.

Gates: size **30**, band 0 **5**, same-year pairs **0**, bunching **3** in 1914-1922 (limit 3),
shared **0** with any earlier theme, bins **6/8** (advisory). Re-measure rather than trust these
figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## Why the footholds are the footholds

Band 0 sits exactly at the floor of 5, so this deck has no margin. The blind grader made the
recent cards easy because their text pins the era: climate change and disease for the golden
toad, a clone for Celia, a river survey for the baiji. The dodo and Sudan are easy on their own
records. The first blind grade left band 0 at 3; Sudan's card and a second grading pass (which
moved the baiji to easy) brought it to 5. Famous older cards such as the great auk and Steller's
sea cow graded medium or hard, because nothing in their text dates them.

## Deliberate omissions

- **Cut from the spine for density and fame**: the bluebuck (c. 1800), the sea mink (1894) and
  the Japanese wolf (1905), all little known and in crowded stretches.
- **Cut to make room for footholds**: the Labrador duck (1878), two years from the Falkland
  wolf, and the po'ouli (2004), between Celia and the baiji.

## Fact-check flags still unsupported

- **`last-cape-lion-shot` (description)**: genetic work suggests the Cape lion was the southern
  population of the southern African lion, not a distinct subspecies, so "ending a distinct
  subspecies" is doubtful. The checker suggests dropping that clause. The year 1858 is the
  widely cited one.
- **`caspian-tiger-extinct` (year 1970)**: one disputed date among several. Sources range from
  the late 1950s to a 1998 sighting, with survival in Turkey reported into the early 1990s.
- **`last-wild-barbary-lion-shot` (year 1922)**: the fact check passed 1922, but the detail
  writer found it is the popular date only. A 2013 PLOS ONE review puts the last wild lion shot
  at Tizi n'Tichka in 1942, with Morocco's lions gone around 1948. The detail prose says so.
  Moving the card to 1942 would put 4 cards in 1932-1942, over the bunching limit, so the year
  needs Edward's call.
