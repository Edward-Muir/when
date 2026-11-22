# The Flying Colours theme

A 30-card curated theme on national flags first raised or adopted, from the Dannebrog legend at
Lyndanisse to South Sudan's flag at its birth ceremony. This note is why these 30 and not
others.

## The scope rule

An event is in only if **it is a country's flag being first raised or officially adopted.**

- **The flag, not the country.** Independence itself belongs to Flags Come Down, a country's
  founding to Nations of Europe, and a colonial foothold to Flag Planted. A card is in here
  only when its headline is the flag: the day it first flew, or the act that fixed its design.
- **Famous flags only.** Each beat is a flag most players could picture, dated to its first
  hoisting or its formal adoption, whichever the record treats as the flag's birthday.

Edges argued rather than assumed:

- **`flag-dannebrog-lyndanisse`** is in as a legend, and its card says so ("was said to drop
  from heaven"). It is the oldest continuously used national flag's own origin story, and the
  story is the beat. Austria's red-white-red legend (1191) was cut: it has no documented source
  at all and was the weakest scope fit on the spine.
- **`flag-union-flag-st-patrick`** is a redesign, not a first raising. It is in because the
  1801 flag is the Union Flag as it flies today, the same shape of beat as Russia's tricolour
  returning in 1991.
- **`flag-russia-tricolour-returns`** and **`flag-soviet-hammer-sickle`** both stay: one flag
  replacing another is the theme's subject, and the 68 years between them keep them far apart.
- **`flag-grand-union-raised`** sits two years before the Stars and Stripes. It is dated to the
  Continental Navy's raising aboard the Alfred in December 1775, the better-documented event; the
  traditional Prospect Hill raising of 1 January 1776 is disputed.

## The 30

| Year | Slug                              |                |
| ---: | --------------------------------- | -------------- |
| 1219 | `flag-dannebrog-lyndanisse`       | NEW            |
| 1606 | `flag-first-union-flag`           | foothold · NEW |
| 1775 | `flag-grand-union-raised`         | NEW            |
| 1777 | `flag-stars-stripes-adopted`      | foothold · NEW |
| 1794 | `flag-french-tricolour-adopted`   | foothold · NEW |
| 1797 | `flag-italian-tricolore-first`    | NEW            |
| 1801 | `flag-union-flag-st-patrick`      | NEW            |
| 1812 | `flag-argentina-belgrano`         | NEW            |
| 1822 | `flag-greece-adopted`             | NEW            |
| 1848 | `flag-irish-tricolour-presented`  | NEW            |
| 1870 | `flag-japan-hinomaru-decreed`     | foothold · NEW |
| 1889 | `flag-brazil-green-gold`          | NEW            |
| 1898 | `flag-philippines-unfurled`       | NEW            |
| 1901 | `flag-australia-first-flown`      | NEW            |
| 1917 | `flag-thailand-tricolour-adopted` | NEW            |
| 1919 | `flag-germany-black-red-gold`     | NEW            |
| 1923 | `flag-soviet-hammer-sickle`       | NEW            |
| 1947 | `flag-india-tricolour-adopted`    | foothold · NEW |
| 1948 | `flag-israel-adopted`             | NEW            |
| 1949 | `flag-china-five-star-raised`     | foothold · NEW |
| 1957 | `flag-ghana-raised`               | NEW            |
| 1962 | `flag-nepal-double-pennant`       | NEW            |
| 1965 | `flag-canada-maple-leaf`          | foothold · NEW |
| 1971 | `flag-uae-raised`                 | NEW            |
| 1972 | `flag-bangladesh-adopted`         | NEW            |
| 1980 | `flag-zimbabwe-raised`            | NEW            |
| 1991 | `flag-russia-tricolour-returns`   | NEW            |
| 1994 | `flag-south-africa-new`           | foothold · NEW |
| 2008 | `flag-kosovo-unveiled`            | NEW            |
| 2011 | `flag-south-sudan-raised`         | NEW            |

All 30 were authored for this theme: the catalogue held no card whose headline was a flag. The
footholds are the reconciler's picks for genuine fame; the blind grade then rated 19 of the 30
easy, since a flag's design usually names its country and its era.

Gates: size **30**, band 0 **19**, bins **6/8** (advisory), same-year pairs **0**, bunching
**3 in 1794-1801** (limit 3), shared **0** with any earlier theme. Re-measure rather than trust
these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Deliberate omissions

Cut from the spine for spread, taking the least famous: Spain's red and yellow (1785),
Miranda's Venezuelan flag (1806), Chile's lone star (1817), Norway's Nordic cross (1821),
Belgium's tricolour (1831), the Ottoman star and crescent (1844), Cuba's lone star (1850) and
Nationalist China's flag (1928). Haiti tearing the white from the tricolour (1803) was dropped
earlier, at the spine, to clear the 1794-1803 bunching limit. The Netherlands (1572) and Peter
the Great's Russian tricolour (1693-1705) were left out because sources disagree on the date.

## Known crowding kept on purpose

Fourteen neighbouring pairs sit inside the 8-year advisory window. The tightest, 1947 / 1948 /
1949 (India, Israel, China) and 1971 / 1972 (the UAE, Bangladesh), are the honest shape of
decolonisation and partition, when new flags arrived a year apart. Each of the three post-war
flags is famous enough to place on its own.

## Fact-check flags

Two fixes were applied: the Japanese card names the Hinomaru, not the rayed Rising Sun flag, and
the UAE card says six sheikhdoms (Ras al-Khaimah joined in 1972). Nothing was left unsupported.
