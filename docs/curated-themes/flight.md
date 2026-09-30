# The Taking Flight theme

A 36-card curated theme on leaving the ground: the wingsuits and gliders that failed for
centuries, the balloon that first worked, and the unbroken run of firsts from Kitty Hawk to
Solar Impulse 2. This note is why these 36 and not others.

## The scope rule

An event is in only if **a person left the ground in a craft, or it is a craft or breakthrough
that made human flight possible**. Atmosphere only; spaceflight is out.

Two edges were argued rather than assumed:

- **`jet-engine-invented`** (Whittle's 1930 patent) is in even though nobody left the ground
  that day. It reads on the "breakthrough that made flight possible" half of the rule, the
  same clause that admits `garnerin-parachute-descent` (a safe-descent breakthrough) and
  `junkers-allmetal-aircraft` (a structural one). A patent alone would not qualify a
  non-aviation invention; this one is explicitly about propelling aircraft.
- **`coleman-earns-pilot-license`** is in on "qualified to and did leave the ground": Coleman's
  card is about earning the license that let her fly, not merely a biographical fact. The
  spine's claim that she was also the first Native American woman licensed to fly is disputed
  in the record, so the description states only the well-documented claim (first Black woman
  licensed to fly).
- **Spaceflight is out categorically.** No Sputnik, no Gagarin, no Apollo — even though several
  of this theme's aviators (the Wrights, Sikorsky's rotorcraft lineage) are usually discussed
  in the same breath as the space age. The line is atmosphere, not fame-by-association.

## The 36

| Year | Slug                                  |                |
| ---: | ------------------------------------- | -------------- |
| 1010 | `eilmer-flying-monk`                  | NEW            |
| 1709 | `passarola-balloon-demonstration`     | NEW            |
| 1783 | `hot-air-balloon`                     |                |
| 1785 | `blanchard-jeffries-channel-crossing` | NEW            |
| 1797 | `garnerin-parachute-descent`          | NEW            |
| 1804 | `cayley-glider-model`                 | NEW            |
| 1852 | `dirigible-airship`                   |                |
| 1853 | `cayley-coachman-flight`              | NEW            |
| 1890 | `ader-eole-liftoff`                   | NEW            |
| 1894 | `lilienthal-glider`                   |                |
| 1900 | `zeppelin-airship`                    |                |
| 1903 | `wright-brothers-flight`              | foothold       |
| 1906 | `santos-dumont-14-bis`                | NEW            |
| 1907 | `cornu-helicopter-hop`                | NEW            |
| 1909 | `bleriot-channel-crossing`            | foothold · NEW |
| 1912 | `quimby-channel-flight`               | NEW            |
| 1914 | `first-scheduled-airline`             |                |
| 1915 | `junkers-allmetal-aircraft`           | NEW            |
| 1919 | `alcock-brown-transatlantic`          |                |
| 1921 | `coleman-earns-pilot-license`         | NEW            |
| 1924 | `first-flight-around-world`           | NEW            |
| 1927 | `spirit-of-st-louis`                  | foothold       |
| 1929 | `graf-zeppelin-world-circle`          | NEW            |
| 1930 | `jet-engine-invented`                 |                |
| 1932 | `amelia-earhart-atlantic`             | foothold       |
| 1933 | `wiley-post-solo-world-flight`        | NEW            |
| 1937 | `hindenburg-disaster`                 | foothold       |
| 1939 | `helicopter-modern`                   |                |
| 1947 | `yeager-sound-barrier`                | foothold · NEW |
| 1949 | `dehavilland-comet-first-flight`      | NEW            |
| 1953 | `cochran-sound-barrier`               | NEW            |
| 1969 | `concorde-maiden-flight`              |                |
| 1970 | `boeing-747-enters-service`           |                |
| 1986 | `voyager-nonstop-world-flight`        | NEW            |
| 1999 | `piccard-balloon-circumnavigation`    | NEW            |
| 2015 | `solar-impulse-2-circles-globe`       | NEW            |

22 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **6**, bins **6/8** (advisory), same-year pairs **0**.

22 of the 36 are new.

```
node scripts/theme-gap.js --include-pending --extra staging/flight.json --slugs <the 36 above, comma-separated>
```

At authoring time: size **36**, bins **5/8** (advisory), band 0 **6**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year. Six cards
clear it: `hot-air-balloon`, `wright-brothers-flight`, `bleriot-channel-crossing`,
`spirit-of-st-louis`, `amelia-earhart-atlantic` and `hindenburg-disaster` are all labeled
`easy`, and each names a fact most players already hold (Montgolfier, Kitty Hawk, Bleriot,
Lindbergh, Earhart, the Hindenburg newsreel). `yeager-sound-barrier`, the one new foothold, is
graded `easy` on the same basis — breaking the sound barrier is a fact almost everyone knows
even without a name attached to it, and Yeager's name is the famous half.

The margin is thin: 6 against a floor of 5. This theme cannot spare a foothold the way
`clockwork.md`'s 11 could. If a future edit needs to drop one of the six, replace it with
another `easy`-label card from this list rather than simply removing it.

## Deliberate omissions

Cards a keyword sweep surfaces, left out on purpose.

- **Same-year collision.** The catalogue's own `parachute-invented` (1783, Lenormand's tower
  jump) is the same general beat as the spine's "First Parachute Descent" (1797, Garnerin's
  balloon descent), but it shares its year with `hot-air-balloon` (also 1783), and the two
  parachute events are different enough in method (tower jump vs. balloon descent) and 14
  years apart that treating them as interchangeable would misdate the beat either way. Rather
  than reuse a card that collides on year, `garnerin-parachute-descent` was written fresh at
  its own date.
- **Same-year collision, and covered another way.** The spine's "First Jet Aircraft Flies"
  (Heinkel He 178, 27 August 1939) was dropped because that exact year is already spent on
  `helicopter-modern` (Sikorsky's VS-300, catalogued at 1939 — see catalogue doubts below).
  The jet-propulsion beat is not lost: `jet-engine-invented` (Whittle's 1930 patent) already
  carries "the breakthrough that made powered jet flight possible" for this deck, and a second
  jet card five years after `dehavilland-comet-first-flight` would also crowd the 1947-1953
  stretch.
- **Redundant with a beat already in the deck.** The spine's "First Four-Engine Aircraft Flies"
  (Sikorsky's Russky Vityaz, 1913) was cut for crowding: 1912-1915 already carries
  `quimby-channel-flight`, `first-scheduled-airline` and `junkers-allmetal-aircraft`, three
  cards in three years, and a fourth technical "biggest/first configuration" aircraft card adds
  little beyond what `junkers-allmetal-aircraft` already does for that stretch.
- **Redundant with a beat already in the deck.** The spine's "First Takeoff From a Ship" (Eugene
  Ely, USS Birmingham, 1910) and "First Nonstop US Crossing" (Kelly and Macready, 1923) are
  both genuine firsts but sit one year from `bleriot-channel-crossing`/`quimby-channel-flight`
  and `coleman-earns-pilot-license`/`first-flight-around-world` respectively; both were cut to
  keep the two busiest stretches of the deck from getting a fourth close neighbour.

## Catalogue doubts

Existing cards reused even though their stored year does not quite match the spine's beat.

- **`lilienthal-glider`** is stored at 1894 ("Lilienthal's standard glider enabled repeated
  controlled flights"). The spine's beat is 1891, when Lilienthal began the controlled glides
  near Berlin; 1894 is when his design became the reproducible "standard" glider. Same person,
  same practice, a three-year gap between "began" and "standardized." Reused rather than
  duplicated.
- **`helicopter-modern`** is stored at 1939 ("Igor Sikorsky flew the VS-300, the first practical
  single-rotor helicopter"). The spine's beat is 1940, the VS-300's first _untethered_ free
  flight; the tethered first flight was September 1939. The existing card does not specify
  which milestone it means. Reused rather than duplicated, since it is unambiguously the same
  aircraft and design lineage.

## Still missing from the catalogue

Real gaps, not filler, cut for crowding rather than written:

- **Eugene Ely's shipboard takeoff** (1910, USS Birmingham) — the first aircraft launch from a
  ship, one year from both `bleriot-channel-crossing` and `quimby-channel-flight`.
- **Kelly and Macready's first nonstop US crossing** (1923, Fokker T-2) — three years from
  `coleman-earns-pilot-license` and one from `first-flight-around-world`.
- **Sikorsky's Russky Vityaz** (1913), the first four-engine aircraft — inside the deck's
  densest three-year run (1912-1915).
- **Heinkel He 178** (1939), the first jet-powered aircraft flight — collides on year with
  `helicopter-modern`, and the propulsion beat it would add is already carried by
  `jet-engine-invented`.

## Known crowding kept on purpose

Golden-age aviation happened in a rush: `theme-gap` flags roughly two dozen sub-8-year
neighbour pairs between 1783 and 1970, most of them 1-4 years apart. That density is the
theme, not a flaw in it — a scope rule this narrow (a person leaving the ground, or the craft
that let them) necessarily sits inside a hundred-year run of rapid firsts, and the brief allows a narrow historical stretch. One
1-year pair sits directly next to a foothold — `amelia-earhart-atlantic` (1932) to
`wiley-post-solo-world-flight` (1933) — and was left as is rather than pulled apart, since
every alternative in that stretch is at least as close to something else.

## Review edits

`passarola-balloon-demonstration` keeps its slug but is titled "Gusmão Floats a Model Balloon".
What Gusmão showed the Lisbon court in 1709 was a small unmanned hot-air balloon; the Passarola
was a separate bird-shaped airship design that never flew, so the old title named the wrong
craft.
