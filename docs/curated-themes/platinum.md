# The Platinum theme

A 30-card curated theme on famous albums, from Elvis's 1956 debut to Folklore in 2020. This note
is why these 30 and not others.

## The scope rule

An event is in only if **it is a famous album, named for its release.**

- **The albums themselves.** Single anthems, protest songs and charity singles belong to Sing
  Out!, the birth of styles to Born to Groove, concerts to Crowd Roars, and formats such as the
  LP to Press Play. Soundtrack albums are in only when the record, not the film, is the famous
  thing.
- The spine ran 43 beats and the reconciler cut 13 for density and fame (1955, 1965, 1968, 1970,
  1978, 1985, 1986, 1992, 1995, 2000, 2004, 2007 and 2014). The reconciler recorded no
  individual reason for each cut, only that the deck was trimmed for density and fame.
- Two cards reuse the catalogue: `michael-jackson-thriller` and `nevermind-album`. They are the
  deck's footholds, alongside the many easy picks.

## The 30

| Year | Slug                                  |          |
| ---: | ------------------------------------- | -------- |
| 1956 | `elvis-presley-debut-album`           | NEW      |
| 1959 | `miles-davis-kind-of-blue`            | NEW      |
| 1963 | `dylan-freewheelin-album`             | NEW      |
| 1966 | `beach-boys-pet-sounds`               | NEW      |
| 1967 | `beatles-sgt-pepper`                  | NEW      |
| 1969 | `beatles-abbey-road`                  | NEW      |
| 1971 | `led-zeppelin-iv-album`               | NEW      |
| 1972 | `bowie-ziggy-stardust-album`          | NEW      |
| 1973 | `pink-floyd-dark-side-album`          | NEW      |
| 1975 | `springsteen-born-to-run-album`       | NEW      |
| 1976 | `eagles-hotel-california-album`       | NEW      |
| 1977 | `fleetwood-mac-rumours-album`         | NEW      |
| 1979 | `pink-floyd-the-wall-album`           | NEW      |
| 1980 | `acdc-back-in-black-album`            | NEW      |
| 1982 | `michael-jackson-thriller`            | foothold |
| 1984 | `prince-purple-rain-album`            | NEW      |
| 1987 | `u2-joshua-tree-album`                | NEW      |
| 1989 | `madonna-like-a-prayer-album`         | NEW      |
| 1991 | `nevermind-album`                     | foothold |
| 1994 | `nas-illmatic-album`                  | NEW      |
| 1997 | `radiohead-ok-computer-album`         | NEW      |
| 1998 | `lauryn-hill-miseducation-album`      | NEW      |
| 2002 | `norah-jones-come-away-with-me-album` | NEW      |
| 2006 | `amy-winehouse-back-to-black-album`   | NEW      |
| 2011 | `adele-21-album`                      | NEW      |
| 2013 | `beyonce-surprise-album`              | NEW      |
| 2015 | `kendrick-to-pimp-a-butterfly-album`  | NEW      |
| 2016 | `beyonce-lemonade-album`              | NEW      |
| 2019 | `billie-eilish-debut-album`           | NEW      |
| 2020 | `taylor-swift-folklore-album`         | NEW      |

Gates: size **30**, band 0 **21**, bins **2/8** (advisory: every card is after 1950, so the deck
cannot spread across the timeline), same-year pairs **0**, bunching **8 in 1971-1980** (the limit),
shared with any earlier theme **0**. Re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Known crowding kept on purpose

Nearly every adjacent pair sits inside theme-gap's 8-year advisory window. That is the shape of
the subject: the canonical albums arrive about one a year from 1966 to 1980.

## Fact-check flags

None unsupported: 26 ok and 2 description fixes (both removed date clues), applied.
Items worth a second look in review:

- Several detail-prose claims are single-source and hedged in the text (the Joshua Tree US
  number-ones, the Folklore 16-hour announcement, the Pepsi figure for Like a Prayer).
- The Illmatic line about the album being the benchmark for lyrical hip-hop paraphrases the card's
  own description and was not independently sourced.
- Region tags follow where each album was made. `u2-joshua-tree-album` is tagged Ireland only;
  the audit notes its text names America.

## Intro

The popup this theme opens with (rules in [index.md](index.md#theme-intros)).

- **Blurb:** Thirty landmark albums across rock, pop, soul and hip-hop, judged as whole records rather than as singles.
- **Fact:** The Beatles nearly called Abbey Road "Everest", after the brand of cigarettes their engineer Geoff Emerick smoked in the studio.

Sources: [abbeyroad.com](https://www.abbeyroad.com/news/deconstructing-abbey-road-cover-photography-session-2588) (The original working title for Abbey Road was Everest... Engineer Geoff Emerick was smoking Everest cigarettes in the studio.).
