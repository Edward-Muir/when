# The Peacock Throne theme

A 30-card curated theme on the Muslim rulers of Delhi, from the first sultan's minaret to the
exile of the last Mughal emperor: their coups, their battles, their capitals and their tombs.
This note is why these 30 and not others.

## The scope rule

An event is in only if **it is an act of a Delhi sultan or Mughal emperor.**

The boundary with the neighbouring themes:

- **The Company's rise** goes to The Raj. Thomas Roe's embassy to Jahangir's court (1615) reached
  the spine and was cut as Company business, although the reception was the emperor's act.
- **Persian shahs** go to Kings of Kings. Nadir Shah's sack of Delhi was cut for that reason: the
  act is the shah's, not the emperor's. The catalogue's `nadir-shah-sacks-delhi` is also dated
  1738, a year off the spine's 1739.
- **Ottoman sultans** go to Sublime Porte, and **Razia Sultana** to Crowned Queens. Neither
  reached the spine.

Three edges were argued rather than assumed:

- **`timur-sacks-delhi-1398`** is in, although Timur was no Delhi ruler. The theme's boundary
  names it, and the sack is what broke the sultanate. It is the one invader's act in the deck,
  which makes the Nadir Shah cut a judgement call rather than a rule.
- **`sher-shah-defeats-humayun-kannauj`** is in, although the emperor lost. Sher Shah took the
  Delhi throne by it, so the act is a Delhi ruler's on either reading.
- **`humayuns-tomb-begun`** is in as an act of the court: a widow of the emperor oversaw it.

Three reused cards are looser than "the same event in the same year":

- **`muhammad-bin-tughlaq-reforms`** (1330) covers both the token currency and the move of the
  capital to Daulatabad, so the spine's separate 1327 capital-move beat was cut as redundant.
- **`mughal-architecture-akbar`** stands in for the founding of Fatehpur Sikri. It sits at 1569,
  with a window to 1585 that covers the spine's 1571.
- **`mughal-akbar`** stands in for Akbar's coronation. It is the Second Panipat card, in his
  accession year, 1556.

Cut from the spine of 39: Jalaluddin Khalji's coup (1290), the capital moved to Daulatabad
(1327), Khizr Khan's Sayyid dynasty (1414), Khanwa (1527), Humayun's recovery of Delhi (1555),
the jizya abolished (1564), Thomas Roe (1615), Shah Jahan's accession (1628) and Nadir Shah
(1739). Apart from the boundary cuts, each was the thinnest on fame in a dense decade.

## The 30

| Year | Slug                                  |                |
| ---: | ------------------------------------- | -------------- |
| 1199 | `qutb-minar-begun-aibak`              | NEW            |
| 1206 | `delhi-sultanate`                     |                |
| 1229 | `iltutmish-caliphal-investiture`      | NEW            |
| 1296 | `alauddin-khalji-seizes-delhi`        | NEW            |
| 1303 | `alauddin-khalji-takes-chittor`       | NEW            |
| 1330 | `muhammad-bin-tughlaq-reforms`        |                |
| 1354 | `firoz-shah-founds-firozabad`         | NEW            |
| 1398 | `timur-sacks-delhi-1398`              | foothold · NEW |
| 1451 | `bahlul-lodi-founds-lodi-dynasty`     | NEW            |
| 1504 | `sikandar-lodi-founds-agra`           | NEW            |
| 1526 | `mughal-babur-founds`                 | foothold       |
| 1540 | `sher-shah-defeats-humayun-kannauj`   | foothold · NEW |
| 1556 | `mughal-akbar`                        |                |
| 1565 | `humayuns-tomb-begun`                 | foothold · NEW |
| 1569 | `mughal-architecture-akbar`           |                |
| 1576 | `battle-haldighati-mughals-mewar`     | foothold · NEW |
| 1582 | `akbar-din-ilahi`                     |                |
| 1605 | `jahangir-accession-agra`             | foothold · NEW |
| 1611 | `jahangir-marries-nur-jahan`          | foothold · NEW |
| 1632 | `taj-mahal-built`                     | foothold       |
| 1635 | `peacock-throne-unveiled-shah-jahan`  | foothold · NEW |
| 1638 | `shah-jahan-begins-red-fort`          | foothold · NEW |
| 1650 | `shah-jahan-begins-jama-masjid-delhi` | foothold · NEW |
| 1658 | `aurangzeb-seizes-throne-agra`        | foothold · NEW |
| 1673 | `badshahi-mosque-lahore-completed`    | NEW            |
| 1679 | `aurangzeb-orthodox-policies`         |                |
| 1707 | `aurangzeb-dies-deccan`               | foothold · NEW |
| 1771 | `shah-alam-ii-returns-delhi`          | foothold · NEW |
| 1837 | `bahadur-shah-zafar-accession`        | foothold · NEW |
| 1857 | `last-mughal-emperor-deposed`         | foothold · NEW |

22 of the 30 were authored for this theme. The catalogue held the founding, the Taj Mahal and
Akbar, but almost none of the sultanate's coups or the later emperors. The footholds are band 0
in theme-gap after blind grading. theme-gap scores that from the difficulty label and how
crowded the timeline is around each year.

**The grading looks generous.** The blind grader moved 18 of the 22 new cards, most of them
easier, and band 0 went from the reconciler's 6 to 16. Cards such as
`shah-alam-ii-returns-delhi` and `bahadur-shah-zafar-accession` are footholds because their text
gives the era away ("a Mughal emperor long in exile ... as a figurehead"), not because the names
are famous. That is what the placement-first grid is meant to do, but it is worth a look in
review.

Gates: size **30**, band 0 **16**, bins **3/8** (advisory), same-year pairs **0**, bunching **3
in 1632-1638**, shared **1** with any earlier theme (`mughal-babur-founds`, with Rise of
Empires). Re-measure rather than trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap mughals
```

## What the fact check could not support

- **`shah-alam-ii-returns-delhi`**: the year. The Marathas retook Delhi in early 1771 and the
  agreement with the emperor is 1771, but sources split on his arrival between late December 1771
  and January 1772. The card sits at 1771.
- **`last-mughal-emperor-deposed`**: the year. Bahadur Shah was captured in September 1857, and
  his reign is usually ended there, but the description also names the trial (January to March
  1858) and the exile to Rangoon (October 1858). The card sits at 1857; a window to 1858 or a
  description that stops at the capture would settle it.

No fixes were made. **The check was thinner than it should be:** the checker ran about four
searches across 22 cards, and the spine writer searched only five of its dates, so most `ok`
verdicts rest on the model's knowledge and uncited Wikipedia page names. The dates known to be
contested (Qutb Minar 1199, Humayun's Tomb 1565, the Peacock Throne 1635, the Red Fort 1638) were
among those checked.

Three more weak spots came out of the detail research:

- **`peacock-throne-unveiled-shah-jahan`**: the description says the throne is "said to have
  cost twice as much as the Taj Mahal". The detail writer found no authoritative source for the
  claim and left it out of the prose. A rewording through `date-clues-apply.js` would settle it.
- **`firoz-shah-founds-firozabad`**: the description puts the pillar "on its roof". Accounts
  differ on whether it stood atop the building or beside the mosque, and it was raised in 1356,
  two years after the founding.
- **The prose hedges heavily** ("one account says", "sources split") and two entries close on a
  grim attributed detail: the unburied dead in `timur-sacks-delhi-1398`, and the casket in
  `shah-alam-ii-returns-delhi`. All 22 pass `detail-spec.js`, but they deserve a cold read against
  the plaque voice and the atrocity carve-out. One date was corrected by hand before applying:
  the Aurangzeb entry had Shah Jahan falling ill in July 1658, after the battle it explains.

## Known crowding kept on purpose

Nine pairs sit inside theme-gap's 8-year advisory window. Two clusters are deliberate:

- **1632 / 1635 / 1638** (the Taj Mahal, the Peacock Throne, the Red Fort): Shah Jahan
  commissioned all three within a few years, and the deck is named for the middle one. It sits
  exactly on the bunching limit.
- **1565 / 1569 / 1576 / 1582**: Akbar's reign, with the tomb, the new capital, Haldighati and
  the Din-i Ilahi.
