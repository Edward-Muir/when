# The Caliphs theme

A 30-card curated theme on the caliphate as an institution, from the choosing of the first
caliph to its abolition in Turkey. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a defining act of a caliph or caliphate.**

- **Founding and succession**: a caliph chosen, a dynasty's caliphate proclaimed, a rival
  caliphate declared (the Umayyads, Abbasids, Fatimids and the Cordoba caliphate).
- **Conquest and wars fought under a caliph's banner**: Yarmouk, Nahavand, Tours, Talas, the
  conquest of Spain and the sieges of Constantinople, taken as acts of the caliphate.
- **Monuments and capitals a caliph built**: Baghdad, Samarra, the Dome of the Rock, the Great
  Mosque of Damascus, Madinat al-Zahra.
- **The caliphate's end**: the Mongol sack, the Buyid and Seljuk takeovers, Saladin's end of the
  Fatimids, the Turkish abolition.

Boundary: Ottoman sultans belong to Sublime Porte, the Crusades to The Crusades, schools and
libraries to Places of Learning.

Edges argued rather than assumed:

- **`siege-of-jerusalem-638`** is reused for the spine's 637 beat. It is the same surrender to
  Umar, and 637 and 638 are alternate dates. If strict same-year matching is wanted, the beat
  becomes a new card.
- **`ottoman-sultanate-abolished` (1922) and `islamic-caliphate-abolished` (1924)** overlap the
  `ottomans` theme (2 shared). They stay because the caliphate's end is the theme's closing act.
- **`khilafat-movement-india`** is a campaign to defend the caliph, not an act of one. It is in
  as the last time the institution moved a mass movement.

## The 30

| Year | Slug                              |       |
| ---: | --------------------------------- | ----- |
|  632 | `abu-bakr-first-caliph`           | NEW   |
|  636 | `battle-of-yarmouk`               |       |
|  638 | `siege-of-jerusalem-638`          |       |
|  642 | `rashidun-victory-nahavand`       | NEW   |
|  650 | `quran-compiled`                  |       |
|  656 | `battle-of-the-camel-caliph-ali`  | NEW   |
|  661 | `umayyad-caliphate`               |       |
|  680 | `battle-karbala-husayn`           |       |
|  691 | `dome-rock-completed`             |       |
|  706 | `great-mosque-damascus-begun`     | NEW   |
|  711 | `islamic-conquest-spain`          |       |
|  717 | `siege-of-constantinople-717`     |       |
|  732 | `battle-tours`                    |       |
|  750 | `abbasid-caliphate`               |       |
|  751 | `battle-of-talas`                 |       |
|  762 | `baghdad-founded`                 |       |
|  786 | `harun-al-rashid-caliph`          |       |
|  836 | `samarra-founded-by-mutasim`      | NEW   |
|  909 | `fatimid-caliphate-established`   |       |
|  929 | `cordoba-caliphate-proclaimed`    | NEW   |
|  936 | `madinat-al-zahra-begun`          | NEW   |
|  945 | `buyids-seize-baghdad`            | NEW   |
|  969 | `fatimids-conquer-egypt`          |       |
| 1031 | `caliphate-cordoba-falls`         |       |
| 1055 | `seljuk-turks-capture-baghdad`    |       |
| 1171 | `saladin-ends-fatimid-caliphate`  | NEW   |
| 1258 | `mongol-baghdad`                  |       |
| 1919 | `khilafat-movement-india`         | NEW   |
| 1922 | `ottoman-sultanate-abolished`     |       |
| 1924 | `islamic-caliphate-abolished`     |       |

20 reused, 10 new.

Gates: size **30**, band 0 **18**, bins **3/8** (advisory), same-year pairs **0**, largest
overlap **2** (`founding-cities`, `sieges`, `ottomans`). A card's band moves whenever the
catalogue around its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Difficulty

The blind grader rated all 10 new cards as easy to place, so all 10 are `easy` and band 0
rose from 8 to 18. That is an unusually uniform grade for a deck whose new cards include
Samarra and the Buyids. A reviewer may want to re-grade it.

## Cuts

Spine beats not carried into the 30 (10-year bunching limit and fame): the 801 elephant gift to
Charlemagne, the 813 Abbasid civil war, the 833 Mihna, the 1058 Basasiri seizure of Baghdad,
the 1094 Fatimid succession split, the 1147 Almohad caliphate, the 1180 al-Nasir revival and
the 1261 Abbasid restoration in Cairo.

## Known gaps in the timeline

The deck has nothing between 1261 and 1919 and nothing before 632. That is the history of the
institution, not an authoring gap: the 1517 Ottoman takeover of the title was left to
`ottomans`.

## Fact-check flags

None `unsupported`. The checker ran a single search (on Nahavand's date) and checked the rest
against the spine's sources and its own knowledge, so the check is thin. Two things worth a
reviewer's eye:

- `saladin-ends-fatimid-caliphate`: the description says Saladin "had the sermon read in the
  name of the Abbasid caliph". The detail writer could not confirm the sermon in its searches,
  and the detail prose describes the proclamation of Abbasid suzerainty without it.
- The spine's years were written without searches. The agent's follow-up searches covered the
  added beats only; 650 (Quran) and 1147 (Almohads) are traditional or approximate dates.
