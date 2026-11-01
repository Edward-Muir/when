# The Great Composers theme

A 30-card curated theme on the signature works of classical music's great composers, from
Hildegard of Bingen's sung morality play to John Adams's Nixon in China. One card per composer,
dated to the premiere or publication of the work they are best known for. This note is why these
30 and not others.

## The scope rule

An event is in only if **it is a famous work by a great composer of classical music**, dated to
its premiere or publication.

- **One beat per composer.** The deck is a tour of composers, not of a composer's catalogue, so
  Mozart gets The Magic Flute and not also the Requiem.
- **The boundary with the neighbours**: instruments and their inventions belong to Strike a
  Chord, and anthems and songs written for a cause belong to Sing Out!. A work is in here
  because of who wrote it and what it is, not because of a movement it served.

Edges argued rather than assumed:

- **`rhapsody-in-blue-premiere`** is in. It is jazz-inflected, but it is a concert work for piano
  and orchestra by a composer the classical repertoire claims.
- **`adams-nixon-in-china-premiere`** is in. Its subject is a diplomatic visit, but it is an opera
  about a historic event rather than a song for a cause, so it sits on this side of Sing Out!.
- **`mendelssohn-wedding-march`** is dated to the 1843 premiere of the full incidental music, not
  to the 1826 overture, because the march is what players know.

## The 30

| Year | Slug                             |                |
| ---: | -------------------------------- | -------------- |
| 1151 | `ordo-virtutum-hildegard`        | foothold · NEW |
| 1365 | `machaut-messe-de-nostre-dame`   | foothold · NEW |
| 1436 | `dufay-nuper-rosarum-flores`     | foothold · NEW |
| 1567 | `palestrina-pope-marcellus-mass` | NEW            |
| 1607 | `monteverdi-orfeo`               |                |
| 1721 | `bach-brandenburg-concertos`     | NEW            |
| 1725 | `vivaldi-four-seasons`           | foothold       |
| 1742 | `handel-messiah`                 |                |
| 1791 | `magic-flute-premieres`          | foothold       |
| 1798 | `haydn-creation-oratorio`        | NEW            |
| 1824 | `beethoven-ninth`                | foothold       |
| 1830 | `berlioz-symphonie-fantastique`  | NEW            |
| 1839 | `chopin-24-preludes-published`   | NEW            |
| 1843 | `mendelssohn-wedding-march`      | foothold · NEW |
| 1853 | `la-traviata-premieres`          |                |
| 1867 | `strauss-blue-danube-waltz`      | foothold · NEW |
| 1875 | `bizet-carmen-premiere`          | foothold · NEW |
| 1876 | `wagner-ring-cycle-bayreuth`     | NEW            |
| 1893 | `dvorak-new-world`               |                |
| 1896 | `puccini-la-boheme-premiere`     | NEW            |
| 1901 | `rachmaninoff-piano-concerto-2`  | NEW            |
| 1905 | `debussy-clair-de-lune`          | foothold · NEW |
| 1913 | `rite-of-spring`                 |                |
| 1924 | `rhapsody-in-blue-premiere`      |                |
| 1928 | `ravel-bolero-premiere`          | foothold · NEW |
| 1936 | `prokofiev-peter-and-the-wolf`   | foothold · NEW |
| 1937 | `orff-carmina-burana-premiere`   | foothold · NEW |
| 1962 | `britten-war-requiem-premiere`   | foothold · NEW |
| 1976 | `glass-einstein-on-the-beach`    | NEW            |
| 1987 | `adams-nixon-in-china-premiere`  | foothold · NEW |

21 of the 30 were authored for this theme. The 9 reused cards are the catalogue's existing
classical landmarks, each naming the same work in the same year.

Gates: size **30**, band 0 **15**, bins **6/8** (advisory), same-year pairs **0**, bunching
**3 in 1867-1876**, shared **4** with on-stage (`monteverdi-orfeo`, `magic-flute-premieres`,
`la-traviata-premieres`, `rite-of-spring`). A card's band moves whenever the catalogue around its
year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Why the footholds are the footholds

- **Medieval sparsity**: Hildegard, Machaut and Dufay sit where the catalogue is thin, so they are
  easy to order even for a player who could not date them within a century.
- **Genuine fame**: the Four Seasons, The Magic Flute, Beethoven's Ninth, the Wedding March, the
  Blue Danube, Carmen, Clair de Lune, Boléro, Peter and the Wolf and O Fortuna are tunes most
  players can hum.
- **Modern sparsity**: Britten and Adams sit in stretches with few other art cards.

## Deliberate omissions

- **On-stage overlap.** `barber-of-seville-premieres` (1816) and `tchaikovsky-swan-lake` (1877)
  name spine beats and exist in the catalogue, but on-stage already shares four cards with this
  deck, the most any pair of themes may share. Haydn (1798) and Berlioz (1830) took their places.
- **Crowding.** Perotin (1198), Tallis (1570), Allegri (1638), Purcell (1689), Gluck (1762),
  Schubert's Ave Maria (1825), Liszt's Hungarian Rhapsody No. 2 (1851), Rimsky-Korsakov's
  Scheherazade (1888), Holst's The Planets (1918), Barber's Adagio (1938) and Pärt's Spiegel im
  Spiegel (1978) were cut to keep the spread inside the bunching gate.
- **Dropped from the spine before reconciling**: Elgar, Mahler, Brahms, Messiaen, Shostakovich and
  Copland, to clear the 1936-1944 and other crowded windows.

## Known crowding kept on purpose

Ten pairs sit inside theme-gap's 8-year advisory window. The tightest are Bizet/Wagner
(1875/1876) and Prokofiev/Orff (1936/1937); each pair is two of the most famous works of its
decade, and both pairs include a foothold.

## Fact-check flags still unsupported

- **`machaut-messe-de-nostre-dame` (year):** sources date the Mass to the early 1360s, between
  1360 and 1365; 1365 is the latest bound, not a documented year.
- **`bach-brandenburg-concertos` (description):** the year is confirmed, but sources do not
  support "in hopes of winning a job". Bach was already Kapellmeister at Cöthen and the Margrave
  had asked for compositions; "sent to a Margrave who had asked for his music" would be safer.
