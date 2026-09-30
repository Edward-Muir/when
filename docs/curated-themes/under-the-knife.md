# The Under the Knife theme

A 36-card curated theme on surviving the operating table itself — the cutting, the closing,
and everything that keeps a patient alive through both. From a Neolithic skull that healed
around a deliberate hole to a genetically modified pig's heart beating in a human chest.

## The scope rule

An event is in only if it is **a surgical procedure, a surgical tool or technique, or a means
of surviving surgery** — anaesthesia, antisepsis, transfusion, sutures. Drugs and vaccines in
general are out.

Edges argued rather than assumed:

- **Blood typing and storage** (`blood-types-discovered`, `citrate-blood-storage`,
  `blood-bank-established`) are in. They are not surgery themselves, but the brief names
  transfusion explicitly, and none of the three is a drug — they are what makes a transfusion
  survivable rather than fatal.
- **`da-vinci-surgical-robot`** is in as a surgical tool, the console-and-arms system itself,
  not the operations it later performed.
- **A public-health handwashing order** (`semmelweis-childbed-fever`) is in because it is
  antisepsis, named explicitly in scope, even though Semmelweis never picked up a scalpel.
- **General anatomical or medical-history cards are out** even when the same person appears
  elsewhere in the catalogue under a surgical card. Hippocrates has four catalogue entries
  (`birth-hippocrates`, `hippocrates-medicine`, `hippocrates-corpus`,
  `hippocratic-oath-composed`); none of them names a surgical technique, so none qualifies —
  `hippocratic-surgical-texts` was written new to cover the actual beat (fracture-setting,
  head-wound treatment, joint reduction).
- **A depiction of a procedure is not the procedure.** The spine's Saqqara relief beat
  (Egyptian tomb art showing a circumcision) was cut: it is evidence _about_ ancient surgery,
  the same role Edwin Smith's papyrus already plays for this deck, and it is a weaker, more
  obscure version of that same slot.

## The 36

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
| -6500 | `trepanation-earliest-known`       | foothold · NEW |
| -1754 | `hammurabi-surgeon-laws`           | foothold · NEW |
| -1600 | `edwin-smith-surgical-papyrus`     | foothold       |
|  -600 | `cataract-surgery-ancient`         | foothold       |
|  -400 | `hippocratic-surgical-texts`       | foothold · NEW |
|    30 | `celsus-de-medicina-encyclopedia`  |                |
|   200 | `galen-medical-dominance`          |                |
|  1000 | `al-zahrawi-surgical-encyclopedia` |                |
|  1363 | `guy-de-chauliac-surgery-text`     |                |
|  1545 | `pare-improves-wound-care`         |                |
|  1667 | `blood-transfusion`                |                |
|  1735 | `first-appendectomy`               | NEW            |
|  1809 | `mcdowell-first-ovariotomy`        | NEW            |
|  1846 | `anesthesia-invented`              |                |
|  1847 | `semmelweis-childbed-fever`        |                |
|  1853 | `chloroform-eases-childbirth`      |                |
|  1867 | `antiseptic-surgery`               |                |
|  1884 | `surgery-local-anesthesia`         |                |
|  1893 | `rubber-surgical-gloves`           |                |
|  1896 | `rehn-sutures-heart-wound`         | NEW            |
|  1901 | `blood-types-discovered`           |                |
|  1914 | `citrate-blood-storage`            | NEW            |
|  1920 | `magill-endotracheal-tube`         | NEW            |
|  1937 | `blood-bank-established`           |                |
|  1944 | `first-blue-baby-operation`        | NEW            |
|  1953 | `heart-lung-machine-first-use`     | NEW            |
|  1954 | `first-organ-transplant`           |                |
|  1958 | `pacemaker-implanted`              |                |
|  1963 | `first-lung-transplant`            |                |
|  1967 | `first-heart-transplant`           |                |
|  1982 | `first-artificial-heart`           |                |
|  1987 | `keyhole-laparoscopic-surgery`     |                |
|  1998 | `first-hand-transplant`            | NEW            |
|  2000 | `da-vinci-surgical-robot`          | NEW            |
|  2005 | `first-face-transplant`            |                |
|  2022 | `first-pig-heart-transplant`       |                |

12 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **5**, bins **8/8** (advisory), same-year pairs **0**.

11 of the 36 are new. At authoring time, with the new cards loaded via `--include-pending
--extra`:

```
size 36, bins 8/8 [5 2 2 2 4 8 7 6], band 0 5, same-year pairs 0
```

All four gates pass. Band 0 clears the floor of 5 with no margin, so read the next section
before dropping anything from the ancient end.

## Why the footholds are the footholds

All five band-0 cards sit before 400 BCE, for the same structural reason `clockwork.md`
describes: the deepest past is the emptiest part of the catalogue, so a card nobody could date
to the century is still trivially ordered against its neighbours.

- `trepanation-earliest-known` (new) and `edwin-smith-surgical-papyrus` span millennia in a
  stretch with almost nothing else in it.
- `rhinoplasty` and `cataract-surgery-ancient` are both existing catalogue cards that were not
  on the spine — added specifically because they already sat in that same sparse window and
  already cleared band 0, which is cheaper than writing new cards to hit the floor.
- `hippocratic-surgical-texts` (new) lands in the same run for the same reason, not because the
  label was graded down — see the Difficulty note in the next section.

There is no foothold after 400 BCE: everything from Celsus onward is band 1-3, so this deck's
opening hand is placeable only because of the ancient run. Do not trade any of the five away
without adding a replacement from the same window.

**On difficulty grading:** none of the 11 new cards were graded `easy`. Recognition-wise, none
of them is schoolbook material — even the famous "firsts" here (heart transplant, hand
transplant, the robot) are enthusiast-level, not classroom material — so all were graded
`medium` or `hard` on recognition alone, per the rubric. Their band comes entirely from where
they sit on the timeline, not from the label.

## Deliberate omissions

**Reused a catalogue card over authoring a duplicate — 26 of 36 slots:**

- `rhinoplasty` is used for the spine's "Sushruta describes rhinoplasty" beat instead of
  authoring a new card, even though its stored year (3000 BCE) is roughly 2,400 years earlier
  than the Sushruta Samhita's actual date (~600 BCE) that the spine cites. **Catalogue doubt:**
  this looks like a wrong year on an existing card, but per the reconciliation rule it was
  reused as-is rather than edited. Two other existing cards, `systematization-of-medicine` and
  `susruta-samhita`, cover the same Sushruta Samhita beat correctly dated at 600 BCE, but both
  are band 3 and land on the same year as `cataract-surgery-ancient`; `rhinoplasty` was picked
  over them for the band-0 win, at the cost of an internally inconsistent stored date.
- `galen-medical-dominance` (stored at 200) stands in for the spine's "Galen treats gladiators'
  wounds" (158). Same person, same general beat — advancing surgical knowledge through hands-on
  practice — but the catalogue's angle is his anatomical dissections rather than the gladiator
  clinic specifically, and the year is ~40 later than the spine's.
- `pare-improves-wound-care` (1545) stands in for "Pare ties off arteries" (1552, the siege of
  Metz specifically); same surgeon, same reform (ligature over cautery), stored seven years
  earlier.
- `rubber-surgical-gloves` (1893) stands in for "Halsted introduces surgical gloves" (1890);
  same event, stored three years later.
- `keyhole-laparoscopic-surgery` (1987) stands in for the spine's "First laparoscopic
  gallbladder op" (1985, credited to Erich Muhe in Germany). **Catalogue doubt:** the stored
  card credits "a French surgeon" — almost certainly Philippe Mouret's 1987 operation, a
  separate and later claimant in a genuine priority dispute over the first laparoscopic
  cholecystectomy. Reused as-is rather than edited or duplicated.
- Three catalogue cards cover the same antiseptic-surgery beat: `antiseptic-surgery` (1867,
  used), `lister-spray-operating-theatre` (1871) and `surgery-antiseptic-system` (1879, the
  Listerine tie-in). Only the earliest and most direct was kept; the other two are the same
  beat repeated.

**Spine beats cut:**

- **Egyptian surgical relief (-2400, circumcision depicted at Saqqara).** See the scope-rule
  section — a depiction of surgery, not surgery, and a weaker duplicate of the Edwin Smith
  papyrus slot.
- **Jakob Nufer's caesarean (1500).** The spine itself flags this as low confidence — a
  17th-century secondhand anecdote about a pig gelder operating on his own wife, historically
  treated as folklore rather than a documented case. Rather than author it as fact, it was
  dropped. The catalogue's `first-cesarean-mother-survives` (1794, Jesse Bennett) is a better
  attested alternative and was considered as a substitute, but left out to avoid a second
  caesarean card and keep the deck at 36 with stronger cards elsewhere.
- **First spinal anesthesia (1898, Bier).** Real and well documented, but anaesthesia is
  already carried by four cards (`anesthesia-invented`, `chloroform-eases-childbirth`,
  `surgery-local-anesthesia`, and cocaine's earlier local use); a fifth, more obscure entry
  three years from two others (`rehn-sutures-heart-wound` 1896, `blood-types-discovered` 1901)
  was cut for crowding.
- **First joint arthroscopy (1918, Takagi).** Real and in scope, but sits between two new cards
  already authored six years apart (`citrate-blood-storage` 1914, `magill-endotracheal-tube`
  1920); a third in that six-year stretch was one crowd too many.
- **Laser used to weld the retina (1961) and first successful arm reattachment (1962).** Both
  obscure, one year apart from each other, and inside the same dense transplant-surgery
  cluster documented below.
- **First pancreas transplant (1966).** Obscure, one year from `first-heart-transplant` (1967),
  and adds a fourth organ to a cluster that already runs kidney (1954), lung (1963) and heart
  (1967).
- **Carson separates conjoined twins (1987).** This is the one true same-year casualty: Carson's
  operation and Philippe Mouret's laparoscopic gallbladder surgery both fall in 1987 by the
  historical record, and the catalogue's laparoscopic card already occupies that year (see
  above). Between the two, the laparoscopic-surgery milestone was kept as the more foundational
  surgical-technique beat; Carson's is a genuine loss, not a weak one.

## Still missing from the catalogue

Real gaps, not filler, cut only because they collide with a card already in the 36:

- **The Sushruta Samhita's correct date (~600 BCE)** — covered above as a catalogue doubt
  rather than a gap; the true content is present, just misdated on the card that was used.
- **August Bier's first spinal anesthesia** (1898) and **Kenji Takagi's first joint arthroscopy**
  (1918) — both genuinely in scope, both cut for crowding against neighbours already in the 36.
- **Retinal laser photocoagulation** (1961), **the first successful limb reattachment** (1962)
  and **the first pancreas transplant** (1966) — three more organ/technique "firsts" from the
  same fifteen-year transplant-surgery boom (1953-1967) that already carries eight cards in
  this deck; any of the three would be a fine addition to a future edit if one of the eight is
  ever dropped.
- **Ben Carson's 1987 conjoined-twin separation** — see above; the only spine beat cut purely
  because of a same-year collision rather than crowding or weak sourcing.
- **The earliest amputation performed on a living patient who survived it** (`amputation-and-
surgery`, catalogued at roughly 31,000 BCE) — a genuinely in-scope existing card that was not
  needed once five band-0 footholds were reached without it; kept in reserve as the obvious
  first addition if the ancient end of this deck is ever widened.

## Review edits

`rhinoplasty` was dropped at review. Its description is the Sushruta Samhita's nose
reconstruction, which is dated to roughly 600 BCE, but the card sits at 3000 BCE, some 2,400
years early; a deck should not teach a wrong date because the error happens to make the card
easy. It is logged in [catalogue-error-backlog.md](../events-images/catalogue-error-backlog.md).
The foothold it supplied is replaced by a new card, `hammurabi-surgeon-laws` (1754 BCE), the
Code of Hammurabi's fee and penalty clauses for surgeons, a sibling of the existing
`code-hammurabi-interest-rules` and `hammurabi-alehouse-laws`. `amputation-and-surgery`
(31,000 BCE) was tried first and is not a foothold: its `very-hard` label outweighs the sparse
neighbourhood. Band 0 is back to exactly 5, the floor, so this is the first deck to recheck if
the catalogue moves.
