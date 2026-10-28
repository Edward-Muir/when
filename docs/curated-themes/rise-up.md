# The Rise Up! theme

A 30-card curated theme on popular uprisings, from the conscripts who broke the Qin dynasty to
Tahrir Square. Slaves, peasants, serfs, workers and colonised peoples all appear here, and every
card is ordinary people taking up arms or barricades against those who ruled them. This note is
why these 30 and not others.

## The scope rule

An event is in only if **it is an uprising of ordinary people against their rulers.**

- **In:** slave revolts (Spartacus, the Zanj, Nat Turner), peasant and serf risings (the
  Jacquerie, Wat Tyler, the German Peasants' War, Pugachev), urban insurrections (the Nika
  riots, the Paris Commune, Budapest) and Indigenous risings against colonial rule (the Pueblo
  Revolt, Tupac Amaru II, Chiapas).
- **Out, to neighbouring themes:** plots and putsches go to Coup!, peaceful marches to Take to
  the Streets, wars of independence to The Liberators, and the 1857 rebellion to The Raj. The
  Haitian Revolution and the 1863 January Uprising were left out of the spine for the same
  reason, since both read as wars of independence.

Some edges were argued rather than assumed:

- **`german-peasants-war-begins`** (1524) stands in for the spine's 1525 beat. It is the same
  war, dated by its first risings rather than its peak, so the deck takes 1524.
- **`spring-of-nations`** (1848) stands in for the spine's "barricades topple a king in Paris"
  beat. The wave across Europe is the better-known card, and the February barricades are its
  spark.
- **`french-revolution-start`** (1789) is in as the Bastille: a crowd storming a royal fortress
  is the theme's core image. It is not there for the revolution's later government.
- **`egyptian-revolution-2011`** is in rather than going to Take to the Streets, because it
  toppled a ruler after days of street battles, not only marches.

## The 30

|  Year | Slug                             |                |
| ----: | -------------------------------- | -------------- |
|  -209 | `chen-sheng-wu-guang-revolt`     | foothold · NEW |
|   -73 | `spartacus-revolt`               | foothold       |
|    60 | `boudica-revolt`                 | foothold · NEW |
|    66 | `jewish-revolt-begins`           | foothold       |
|   184 | `yellow-turban-rebellion`        |                |
|   532 | `nika-riots`                     |                |
|   869 | `zanj-rebellion-begins`          | foothold · NEW |
|  1358 | `jacquerie-peasant-revolt`       |                |
|  1381 | `peasants-revolt-england`        |                |
|  1524 | `german-peasants-war-begins`     |                |
|  1536 | `pilgrimage-of-grace-rising`     | foothold · NEW |
|  1637 | `shimabara-rebellion`            |                |
|  1680 | `pueblo-revolt-spanish-expelled` | NEW            |
|  1773 | `pugachev-rebellion`             | foothold · NEW |
|  1780 | `tupac-amaru-ii-rebellion`       | NEW            |
|  1786 | `shays-rebellion`                |                |
|  1789 | `french-revolution-start`        | foothold       |
|  1798 | `irish-rebellion-of-1798`        |                |
|  1831 | `nat-turners-rebellion`          |                |
|  1848 | `spring-of-nations`              |                |
|  1850 | `taiping-rebellion`              |                |
|  1871 | `paris-commune`                  |                |
|  1900 | `boxer-rebellion`                |                |
|  1905 | `first-russian-revolution`       |                |
|  1917 | `february-revolution-russia`     |                |
|  1953 | `east-german-uprising`           |                |
|  1956 | `hungarian-revolution`           |                |
|  1976 | `soweto-uprising`                |                |
|  1994 | `zapatista-uprising-chiapas`     | NEW            |
|  2011 | `egyptian-revolution-2011`       |                |

22 were already in the catalogue and 8 were written for this theme.

Gates: size **30**, band 0 **8**, bins **7/8** (advisory), same-year pairs **0**, bunching
**3 in 1780-1789** (limit 3), largest overlap **3** with chinese-dynasties
(`yellow-turban-rebellion`, `taiping-rebellion`, `boxer-rebellion`). A card's band moves
whenever the catalogue around its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Cut from the spine

Eleven of the 41 spine beats were cut to reach 30. All were rated at the lowest fame, and some
also crowded a card that was kept: Sicily's First Slave War, Huang Chao's rebellion (five years
from the Zanj), the Flemish revolt of 1323, Jack Cade, Dózsa, Masaniello, Stenka Razin, the
Swing Riots, the Silesian weavers, Morant Bay and Kronstadt.

## Fact check

All 8 new cards passed, with no fixes and nothing unsupported. Boudica is dated 60 by most
sources and 61 by some; the card keeps 60. The checker searched four of the eight (Boudica,
Zanj, Pueblo, Tupac Amaru II) and passed the other four from well-established dates.
