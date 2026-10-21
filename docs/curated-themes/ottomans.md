# The Sublime Porte theme

A 30-card curated theme on the Ottoman Empire, from Osman's frontier beylik to the end of the
caliphate: its battles, its sultans, its buildings, its treaties and its reforms. This note is
why these 30 and not others.

## The scope rule

An event is in only if **it is a defining moment of the Ottoman Empire.**

The boundary with the neighbouring themes:

- **The great sieges** go to Under Siege. Vienna (1529, 1683) and Malta (1565) never reached the
  spine. `constantinople-fall` is the exception, kept because the conquest of the capital is
  the empire's founding moment as much as a siege. It is the deck's one card shared with
  Under Siege, and it is also shared with Rome and Walls.
- **Caliphs before 1517** go to The Caliphs. The Ottoman story enters that office only with
  `selim-i-conquers-egypt-mamluks`, and leaves it with `islamic-caliphate-abolished`.
- **Lepanto** goes to Broadsides. `battle-of-preveza` stays, as the victory that gave the
  Ottomans the Mediterranean (it is shared with Pirates).

Two edges were argued rather than assumed:

- **`battle-of-ankara-timur-bayezid`** is in, although the Ottomans lost. The empire nearly
  ended there, and the decade of civil war that followed is part of the Ottoman story.
- **`greek-independence`** is in, as the first province to break away for good. It is the
  deck's card shared with Nations of Europe.

Cut from the spine of 40: the capture of Bursa (1326), Gallipoli (1354), Nicopolis (1396), the
entry into Baghdad (1534), the first coffeehouses (1554, a year off the catalogue's
`coffee-house-emergence`), the invasion of Cyprus (1570), Selim III's accession (1789), Muhammad
Ali in Egypt (1805), the 1856 Reform Edict and Abdulhamid II's deposition (1909). Each was the
thinnest on fame in its stretch of the timeline. Rhodes, Belgrade, Sèvres, Lausanne and Gallipoli
1915 were trimmed earlier to meet the bunching limit.

## The 30

| Year | Slug                                        |                |
| ---: | ------------------------------------------- | -------------- |
| 1299 | `ottoman-empire-founded`                    | foothold       |
| 1389 | `battle-of-kosovo`                          |                |
| 1402 | `battle-of-ankara-timur-bayezid`            | foothold · NEW |
| 1444 | `battle-of-varna`                           |                |
| 1453 | `constantinople-fall`                       | foothold       |
| 1465 | `ottoman-topkapi-palace`                    |                |
| 1492 | `bayezid-welcomes-sephardic-jews`           | foothold · NEW |
| 1514 | `safavid-battled-ottomans`                  |                |
| 1517 | `selim-i-conquers-egypt-mamluks`            | foothold · NEW |
| 1520 | `ottoman-suleiman-magnificent`              | foothold       |
| 1526 | `battle-of-mohacs-ottoman-hungary`          | foothold · NEW |
| 1538 | `battle-of-preveza`                         |                |
| 1557 | `ottoman-architecture-peak`                 |                |
| 1566 | `death-suleiman`                            |                |
| 1616 | `istanbul-blue-mosque`                      |                |
| 1699 | `treaty-of-karlowitz-ottoman`               | NEW            |
| 1718 | `tulip-era-ottoman`                         |                |
| 1729 | `ibrahim-muteferrika-first-printed-book`    | NEW            |
| 1774 | `treaty-of-kucuk-kaynarca`                  | foothold · NEW |
| 1821 | `greek-independence`                        |                |
| 1826 | `janissaries-abolished-auspicious-incident` | NEW            |
| 1839 | `tanzimat-reforms-gulhane-edict`            | NEW            |
| 1853 | `crimean-war`                               |                |
| 1876 | `ottoman-constitution-midhat-pasha`         | NEW            |
| 1878 | `congress-of-berlin`                        |                |
| 1908 | `young-turk-revolution`                     |                |
| 1914 | `ottomans-enter-first-world-war`            | foothold · NEW |
| 1918 | `armistice-of-mudros`                       | foothold · NEW |
| 1922 | `ottoman-sultanate-abolished`               | foothold · NEW |
| 1924 | `islamic-caliphate-abolished`               |                |

13 of the 30 were authored for this theme. The catalogue already held most of the famous
battles and buildings, but few of the treaties and reforms. The footholds are band 0 in
theme-gap after blind grading. theme-gap scores that from the difficulty label and how crowded
the timeline is around each year.

Gates: size **30**, band 0 **11**, bins **5/8** (advisory), same-year pairs **0**, bunching **3
in 1514-1520**, shared **1** with any earlier theme. Re-measure rather than trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap ottomans
```

## What the fact check could not support

- **`treaty-of-karlowitz-ottoman`**: the description calls the treaty the Ottomans' "first major
  territorial loss". Sources confirm the year and that Hungary and Transylvania passed to the
  Habsburgs, but call it the first peace the Ottomans had to accept on European terms. None
  supports "first major territorial loss", and the Banat stayed Ottoman. A rewording through
  `date-clues-apply.js` would settle it.

One fix was made during the fact check. `ibrahim-muteferrika-first-printed-book` was renamed
"First Muslim-Printed Ottoman Book", because presses run by religious minorities had already
printed in Ottoman lands. The slug keeps the old wording.

Two more weak spots came out of the region and detail research:

- **`treaty-of-kucuk-kaynarca`**: the description says the Ottomans had to "free the Crimean
  Khanate". The treaty made it independent in name, and Russia annexed it in 1783.
- **`safavid-battled-ottomans`** is a reused card titled "Safavid-Ottoman Military Conflicts",
  whose description is Chaldiran. It sits in 1514 as a battle, not as the century of wars its
  name suggests.

## Known crowding kept on purpose

Nine pairs sit inside theme-gap's 8-year advisory window. Two clusters are deliberate:

- **1514 / 1517 / 1520 / 1526** (Chaldiran, Egypt, Suleiman, Mohács): the empire doubled in a
  dozen years, and three of the four are footholds.
- **1908 / 1914 / 1918 / 1922 / 1924**: the end of the empire happened this fast. Three of the
  five are footholds, and the sultanate (1922) and the caliphate (1924) are two separate
  abolitions that players tend to confuse.
