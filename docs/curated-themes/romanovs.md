# The Romanovs theme

A 30-card curated theme on Romanov Russia, from the boy elected tsar in 1613 to the last tsar's
abdication in 1917. Catherine the Great is part of it. This note explains why these 30 and not
others.

## The scope rule

An event is in only if **it is a defining moment of Romanov Russia**, from 1613 to 1917.

- **The dynasty itself**: elections, coups, accessions, assassinations and the abdication.
- **The empire the dynasty built**: wars, annexations, the new capital, the railways, the
  emancipation of the serfs, and the court's culture (the Hermitage, the Fabergé eggs, War and
  Peace).

Two neighbours own the edges:

- **Red Flags** owns communism. The deck ends at the February Revolution's abdication, and the
  Bolsheviks' October seizure is not in it.
- **Rise Up!** owns Pugachev's revolt. The deck shares one card with it,
  `february-revolution-russia`, which is the dynasty's end as much as an uprising.

## The 30

| Year | Slug                              |                |
| ---: | --------------------------------- | -------------- |
| 1613 | `michael-romanov-elected-tsar`    | NEW            |
| 1654 | `treaty-of-pereyaslav`            |                |
| 1682 | `peter-and-ivan-co-tsars`         | NEW            |
| 1697 | `peter-great-embassy-europe`      | foothold · NEW |
| 1703 | `founding-st-petersburg`          | foothold · NEW |
| 1709 | `battle-poltava`                  |                |
| 1721 | `peter-proclaimed-emperor`        | foothold · NEW |
| 1741 | `elizabeth-seizes-russian-throne` | foothold · NEW |
| 1762 | `peter-iii-of-russia-killed`      |                |
| 1764 | `hermitage-museum`                |                |
| 1772 | `partition-poland`                |                |
| 1783 | `russia-annexes-crimea`           | NEW            |
| 1796 | `death-catherine-the-great`       |                |
| 1801 | `paul-i-assassinated`             | foothold · NEW |
| 1812 | `napoleon-russia`                 | foothold       |
| 1825 | `decembrist-revolt`               | NEW            |
| 1837 | `tsarskoye-selo-railway-opens`    | foothold · NEW |
| 1853 | `crimean-war`                     |                |
| 1861 | `emancipation-russian-serfs`      |                |
| 1867 | `alaska-purchase`                 |                |
| 1869 | `tolstoy-war-and-peace-completed` | foothold · NEW |
| 1881 | `assassination-of-alexander-ii`   |                |
| 1885 | `faberge-first-imperial-egg`      | foothold · NEW |
| 1891 | `trans-siberian-railway-begun`    | foothold · NEW |
| 1894 | `nicholas-ii-becomes-tsar`        | foothold · NEW |
| 1904 | `russo-japanese-war`              |                |
| 1905 | `bloody-sunday-st-petersburg`     | foothold · NEW |
| 1914 | `russia-enters-world-war-one`     | foothold · NEW |
| 1916 | `rasputin-murdered`               | foothold · NEW |
| 1917 | `february-revolution-russia`      |                |

17 of the 30 are new. The catalogue held the wars and the big reforms, but few of the dynasty's
own turns: no election of Michael, no founding of St Petersburg, no Bloody Sunday, no Rasputin.

Gates: size **30**, band 0 **14**, same-year pairs **0**, bunching **3** in 1861-1869 (the
limit), largest overlap **2** (assassinations: `peter-iii-of-russia-killed`,
`assassination-of-alexander-ii`). The cards fall in three of the eight bins, which is expected
for a 304-year theme and only advisory. Bands move as the catalogue changes, so re-measure
rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **Catherine's coup is told through Peter III.** The 1762 beat, "Catherine Seizes the Throne",
  reuses `peter-iii-of-russia-killed`. It is the same coup in the same year, since Peter died
  days after his wife deposed him, but the card's title names his death rather than her
  accession. A new card for the seizure itself would cost a second 1762 card, so the reuse
  stands unless a reviewer prefers to swap it.
- **Cut for fame or crowding.** Ten spine beats were cut to reach 30: the 1649 law code, the
  1666 church council and the Old Believers, the 1689 Treaty of Nerchinsk, Peter becoming sole
  tsar in 1696 (crowded by 1697 and 1703), Anna tearing up the nobles' conditions in 1730, the
  founding of Moscow University in 1755, the Treaty of Tilsit in 1807, Russian troops entering
  Paris in 1814 (crowded by 1812), the 1877 war with the Ottomans, and the First Duma in 1906
  (crowded by 1904 and 1905).
- **The Trans-Siberian card is the groundbreaking**, not the line's completion, so it is tagged
  North & Central Asia only, where the first stone was laid at Vladivostok.

## Open fact-check points

The fact check passed all 17 new cards. These wording points were judged acceptable and are
left for review:

- `peter-and-ivan-co-tsars` calls the 1682 rebels "palace guards". They were the streltsy,
  Moscow's musketeer regiments.
- `tsarskoye-selo-railway-opens` says Russia's first railway. It was the first public one.
- `russia-enters-world-war-one` has Russia going to war. Strictly, Germany declared war on
  Russia after Russia mobilised.
- `rasputin-murdered` gives the traditional poisoned, shot and drowned account, which historians
  dispute.
- `peter-proclaimed-emperor` (1721) and the Vladivostok first stone of
  `trans-siberian-railway-begun` were confirmed from search results rather than an opened page.
