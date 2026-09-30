# The Places of Learning theme

A 35-card curated theme on schools, academies, universities and great libraries — the
institutions people built to teach and to keep knowledge, and the handful of times one was
deliberately burned. It runs from an Assyrian king's clay-tablet archive to a Belgian library
gutted twice in one century and an Iraqi one gutted a third time in living memory.

## The scope rule

An event is in only if **it is the founding, or the destruction, of a school, academy,
university or great library.**

- **Founding**: Plato's Academy, Aristotle's Lyceum, the Library of Alexandria, the House of
  Wisdom, dozens of medieval and modern universities from Bologna to Stanford.
- **Destruction**: Nalanda sacked in 1193, the House of Wisdom's books thrown in the Tigris in
  1258, Louvain's library burned twice, Sarajevo's and Mosul's more recently.

Excluded: an institution merely operating, flourishing, or teaching a famous curriculum — the
beat has to be the founding moment or the destruction, not the centuries in between. That is
what keeps `nalanda-university-science` (curriculum expansion, 500 CE) and
`al-kindi-frequency-analysis` (research done at the House of Wisdom, not its founding) out.

Two edges were argued:

- **`han-civil-service`** is in, as the Taixue beat. Its title is about the exam system, but
  its description is explicit — "Emperor Wu established the Imperial Academy" — so it is the
  founding of Han China's first state university wearing an exam-system name. This is the
  slug-vs-title trap the index warns about, the other direction: the title undersells what the
  card actually covers.
- **`nalanda-university`** stands in for Nalanda's founding even though its own window runs
  427–1200 and its description leans toward the institution's long flourishing rather than the
  single act of founding. It is reused rather than duplicated because it is dated to the
  founding year and there is nothing better; its wording is a mismatch to note, not a reason to
  write a second Nalanda-founding card.

Not in scope, and cut for it: `madrasa-education-flourishes` (a system spreading, not one
founding), `timbuktu-learning-center` and its neighbors (all about Timbuktu operating as a
center of learning, none dated to Sankore's actual founding), `bukhara-cultural-center` and
`samarkand-library-school` (both flourishing, not founding).

## The 35

| Year | Slug                             |                |
| ---: | -------------------------------- | -------------- |
| -668 | `ashurbanipal-library-founded`   | NEW            |
| -387 | `plato-founds-academy`           | foothold       |
| -335 | `aristotle-peripatetic-school`   | foothold       |
| -295 | `first-public-library`           | foothold       |
| -124 | `han-civil-service`              |                |
|  -48 | `alexandria-library-caesar-fire` | foothold · NEW |
|  427 | `nalanda-university`             |                |
|  830 | `bayt-al-hikma`                  | foothold       |
|  859 | `al-qarawiyyin-university`       |                |
|  970 | `fatimid-al-azhar-mosque`        |                |
| 1088 | `dom-university-bologna`         |                |
| 1150 | `dom-university-paris`           |                |
| 1167 | `oxford-founded`                 |                |
| 1193 | `nalanda-destroyed`              | NEW            |
| 1209 | `cambridge-university-founded`   | foothold       |
| 1218 | `salamanca-university-founded`   |                |
| 1257 | `university-paris-sorbonne`      |                |
| 1258 | `house-of-wisdom-destroyed`      | NEW            |
| 1348 | `charles-university-prague`      | NEW            |
| 1386 | `heidelberg-university`          |                |
| 1440 | `eton-college-founded`           | NEW            |
| 1575 | `leiden-university-founded`      | NEW            |
| 1583 | `edinburgh-university-founded`   | NEW            |
| 1636 | `harvard-college-founded`        | foothold · NEW |
| 1701 | `yale-founded`                   | NEW            |
| 1746 | `princeton-founded`              | NEW            |
| 1802 | `west-point-founded`             | NEW            |
| 1810 | `university-berlin-founded`      | NEW            |
| 1861 | `vassar-college-founded`         | NEW            |
| 1865 | `cornell-university-founded`     | NEW            |
| 1876 | `johns-hopkins-founded`          | NEW            |
| 1885 | `stanford-university-founded`    | foothold · NEW |
| 1914 | `louvain-library-burns`          | NEW            |
| 1992 | `sarajevo-library-destroyed`     | NEW            |
| 2015 | `mosul-libraries-destroyed`      | NEW            |

20 of the 35 are new. Measured against the merged catalogue: size **35**, band 0 **8**, bins **7/8** (advisory), same-year pairs **0**.

20 of the 35 are new.

At authoring time, with the new cards loaded via `--include-pending --extra`:

```
Candidates   35
Bands        easiest 8 / 18 / 8 / 1 hardest
Spread       7/8 bins  [4 6 10 4 4 5 0 2]
Range        668 BCE to 2015

Gates:
  PASS  size 35                (want 30-36)
  INFO  bins 7/8               (advisory, 6+ is spread)
  PASS  band 0 8               (want 5+)
  PASS  same-year pairs 0      (want 0)
```

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, and this
theme clears the floor comfortably — 8 against a floor of 5.

- `plato-founds-academy`, `aristotle-peripatetic-school` and `first-public-library` are already
  `easy`-labelled and sit in classical antiquity's sparse stretch of the catalogue: the
  Academy, the Lyceum and the Library of Alexandria are exactly the kind of famous, thinly
  surrounded cards that make band 0.
- `alexandria-library-caesar-fire` is graded `easy` on its own merits — "the Library of
  Alexandria burned" is one of the most widely known one-line facts in ancient history, more
  recognizable on its own than most of the founding dates around it.
- `bayt-al-hikma` and `cambridge-university-founded` are existing catalogue cards that land in
  band 0 on the strength of the label alone (`medium` and `easy` respectively) plus a
  reasonably open neighborhood.
- `harvard-college-founded` and `stanford-university-founded` are the modern footholds, both
  graded `easy`: Harvard and Stanford are two of the small set of universities whose names
  alone carry recognition, distinct from the harder-to-place regional or specialist founding
  dates around them (Yale, Princeton, Cornell, Johns Hopkins are all graded `medium` because
  the institution is well known but the specific founding year is not).

## Deliberate omissions

- **Spine beats dropped for redundancy or thinness.** `jixia-academy` (-318, obscure, low
  confidence) would have sat one beat after `plato-founds-academy`/`aristotle-peripatetic-school`
  and added a third ancient-academy card with no catalogue anchor to check it against; cut.
  `sankore-founded` (989, obscure, medium confidence — the actual founding date of the Sankore
  mosque-turned-university is genuinely contested in the sources) was cut rather than
  authored on a shaky date; Timbuktu's story is real but this theme has no clean founding
  moment for it to hang on. `university-of-naples-founded` (1224) and
  `jagiellonian-university-founded` (1364) were cut as the least distinctive of an already
  dense run of medieval European university foundings — both are real beats, neither adds a
  new kind of institution, a new geography, or a new register to the deck the way, say, Al-
  Azhar or Timbuktu would have. `st-andrews-founded` (1413) and `trinity-college-dublin-founded`
  (1592) were cut for the same reason. `louvain-library-burns-again` (1940, obscure) was cut as
  a near-duplicate of the 1914 burning — telling the same building's story twice adds length,
  not scope.
- **Cut once the catalogue produced a better card.** `tuskegee-institute-founded` (1881,
  existing, famous, band 1) is a genuine beat and was cut only to relieve crowding: it sat
  between `johns-hopkins-founded` (1876, 5 years) and `stanford-university-founded` (1885, 4
  years), and removing it fixed both gaps at once without touching band 0 (it wasn't one of
  the 8). It is the single card this theme would most want back if it needs to grow past 35.
- **False positives the sweep drags in.** `academy` and `university` return the Han civil
  service exams, Louis XIV's ballet academy, a Russian cadet corps, several sports-boat-race
  and college-football cards, and a string of "university expansion" or "learning center"
  cards about institutions operating rather than founded. `school` returns Raphael's _School of
  Athens_ (a painting), the Rugby School football legend, and a run of school-shooting
  disaster cards. `library` returns the Library of Congress and the Boston Public Library —
  real public libraries, but not the kind of "great library" this theme's edge cases (Alexandria,
  the House of Wisdom, Sarajevo, Mosul) mean.

## Known crowding kept on purpose

Two pairs remain inside 8 years and both are kept:

- `university-paris-sorbonne` (1257) and `house-of-wisdom-destroyed` (1258) are one year
  apart, but they are the theme's only Paris-founding beat and its only 13th-century
  destruction beat — dropping either loses a distinct kind of event, not a duplicate.
- `vassar-college-founded` (1861) and `cornell-university-founded` (1865) are four years
  apart. Cutting `tuskegee-institute-founded` already removed two of the four crowded pairs in
  this stretch (see above); cutting a second card from the 1861–1885 run to fix this last pair
  would mean losing either the first women's college graded to the same standard as men's, or
  the first non-sectarian, merit-admission university — neither is redundant with what
  survives it.

## Still missing from the catalogue

- **Jixia Academy** (-318) and **Sankore's founding** (989) — real gaps, not written because
  neither has a source-backed date solid enough to risk right now (see above).
- **A clean founding-only card for Timbuktu/Sankore** more broadly — everything the catalogue
  holds on it (`timbuktu-university-development`, `timbuktu-learning-center`,
  `songhai-university-timbuktu`) describes the city's centuries as a scholarly center, not a
  founding act, so none of them qualify under this theme's rule.
- **University of Naples** (1224) and **Jagiellonian University** (1364) — genuine founding
  beats, not written because the deck's medieval European run is already the theme's densest
  stretch and neither would have survived crowding once written.
