# The Faith Founded theme

A 30-card curated theme on the beginnings of faiths, sects and religious orders, from Pentecost
to the Church of Satan. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is the founding of a religion, sect or religious order.**

- **A founding act**: a first revelation, a first community, a charter, a rule approved, a
  church organised. The card names the moment the body began, not its later spread or its
  most famous deed.
- **A schism counts when it founds something new.** The Anabaptists' first baptisms, Henry
  VIII's Act of Supremacy and Ammann's break with the Swiss Brethren each created a body that
  had not existed the day before, so they are in. A split that only divides an existing
  church, such as the Great Schism of 1054, is out.

The boundary with the neighbouring themes: Asia's religions and Sikhism belong to Faiths of
Asia, the papacy to Habemus Papam, the caliphate to The Caliphs. Muhammad's first revelation
and the Hijra are here because they found Islam itself, not a caliphate. The Bahá'í Faith and
Ahmadiyya were left out of the spine because they began in Asia.

Edges argued rather than assumed:

- **`knights-templar-founded`** is in. A military order is still a religious order: its
  members took monastic vows under a rule. The Teutonic Knights (1190) were cut only because
  two crusader orders 71 years apart add nothing the Templars don't already carry.
- **`english-reformation-henry`** is in as the founding of the Church of England, though it
  is an act of state.
- **`rastafari-begins-coronation`** is in. The movement dates itself from Haile Selassie's
  coronation, so the coronation is its founding moment, not an Ethiopian court event.
- **Akhenaten's Atenism** was cut. The only catalogue card
  (`akhenaten-religious-revolution`) is dated -1353, seven years off the spine's beat and with
  a different window, so it is not the same event in the same year. It also sat alone in a
  1,400-year gap before Pentecost.

## The 30

| Year | Slug                              |                |
| ---: | --------------------------------- | -------------- |
|   30 | `pentecost-church-begins`         | foothold · NEW |
|  240 | `mani-founds-manichaeism`         | foothold · NEW |
|  529 | `monte-cassino-founded`           |                |
|  610 | `muhammad-revelation`             | foothold       |
|  622 | `hejira-prophet-muhammad`         | foothold       |
|  767 | `anan-founds-karaite-judaism`     | NEW            |
|  910 | `cluny-abbey-founded`             |                |
| 1017 | `druze-faith-emerges`             | foothold · NEW |
| 1084 | `bruno-founds-carthusians`        | NEW            |
| 1098 | `cistercians-founded-citeaux`     | foothold · NEW |
| 1119 | `knights-templar-founded`         | foothold · NEW |
| 1173 | `peter-waldo-waldensians`         | NEW            |
| 1209 | `franciscan-order`                |                |
| 1216 | `dominic-founds-dominicans`       | foothold · NEW |
| 1517 | `protestant-reformation`          | foothold       |
| 1525 | `reformation-anabaptists`         |                |
| 1534 | `english-reformation-henry`       | foothold       |
| 1540 | `jesuits-founded`                 | foothold       |
| 1609 | `smyth-founds-first-baptists`     | NEW            |
| 1652 | `quaker-founding`                 |                |
| 1693 | `ammann-founds-amish`             | NEW            |
| 1738 | `wesley-heart-strangely-warmed`   | NEW            |
| 1774 | `ann-lee-shakers-america`         | NEW            |
| 1830 | `smith-founds-church-of-christ`   | foothold · NEW |
| 1865 | `salvation-army-founded`          |                |
| 1879 | `eddy-charters-christian-science` | NEW            |
| 1906 | `azusa-street-revival`            | NEW            |
| 1930 | `rastafari-begins-coronation`     | NEW            |
| 1950 | `missionaries-of-charity-founded` | foothold · NEW |
| 1966 | `lavey-founds-church-of-satan`    | foothold · NEW |

11 are reused from the catalogue and 19 were written for this theme. No card is shared with any
earlier theme.

Gates: size **30**, band 0 **14**, bins **6/8** (advisory), same-year pairs **0**, bunching
**2 in 1209-1216** (limit 3), shared **0**. A card's band moves whenever the catalogue around
its year does, so re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap faith-founded
```

## Cut from the spine

The blind spine had 44 beats; 14 were cut, mostly to thin the crowded stretches:

- **Early monasticism**: Antony's withdrawal to the desert (285) and Pachomius's first
  monastery (323). Benedict at Monte Cassino carries the monastic founding beat, and both
  dates were uncertain.
- **Crusader orders**: the Teutonic Knights (1190), as above.
- **The Reformation stretch**: Calvin's Institutes (1536), the Scottish Kirk (1560) and
  Teresa's Discalced Carmelites (1562). Five cards already sit between 1517 and 1540.
- **Later denominations**: Herrnhut and the Moravians (1727, a refounding, weaker on scope),
  the Seesen Reform Temple (1810), the Seventh-day Adventists (1863), the Watch Tower Society
  (1884, an incorporation date), Opus Dei (1928), Taizé (1940) and Scientology (1953).

## Known crowding kept on purpose

Two pairs sit inside theme-gap's 8-year advisory window:

- **1209 / 1216** (`franciscan-order` → `dominic-founds-dominicans`): the two great mendicant
  orders were founded within a decade of each other. Dropping either loses half of the story.
- **1534 / 1540** (`english-reformation-henry` → `jesuits-founded`): a Protestant founding and
  the Catholic order founded to answer the Reformation. Both are footholds, so the pair costs
  the opening nothing.

## Fact-check flags

- **`anan-founds-karaite-judaism` (767): unsupported.** Sources date Anan ben David's arrest
  to 767, but none gives a founding year; Britannica says only that he rose to prominence in
  the 760s. The card keeps 767 as the conventional date.
- Noted but supported: the Templars are dated 1118, 1119 or 1119/20 in different sources; a
  few date Smyth's first Baptist church to 1608; the Church of Satan's 1966 date is called
  disputed by one source; the Waldensians are also dated 1177, or 1170-1177.
