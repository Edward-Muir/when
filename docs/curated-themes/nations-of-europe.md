# The Nations of Europe theme

A 35-card curated theme: **one card per European country, and only the moment that country
dates itself from.** It runs from San Marino on Monte Titano to Montenegro's referendum —
roughly 301 to 2006 — and the whole design problem is that founding moments cluster, so the
work was choosing which country gets which century.

## The scope rule

Include an event only if it is **the** founding moment of a European country. Strictly one
card per country, no exceptions.

Everything after that moment is out: no later revolution, war, treaty, partition, occupation,
restoration or regime change, however important. `french-revolution`, `german-reunification`,
`hungarian-revolution`, `carnation-revolution`, `polish-soviet-war`, `brexit` and the whole
EU/EEC/Maastricht sequence are all excluded by the rule rather than by taste — the EU is not a
country, and a country that already has its card cannot have a second one.

Where a country has two defensible founding moments (Denmark's Gorm and Denmark's Jelling
stone; Iceland's Althing and Iceland's republic; Czechia's Bohemia and Czechia's 1993 split),
one is picked and the other is recorded below as a deliberate omission.

### The era is 843-1993, and that is correct

This theme cannot span 1000 BCE and should not try. European nation-founding starts with the
partition of the Carolingian empire and ends with the Velvet Divorce; the only pre-Carolingian
cards that honestly belong are San Marino and the first Bulgarian state. The gate that matters
is spread across **CDF-rank bins**, not raw years, and the catalogue is heavily weighted to
500-2000 CE — so a 301-2006 deck still occupies 7 of 8 bins. Nothing here is padded with
ancient filler to fake a range.

## The 35

Paste as `eventNames` into the workflow's `theme` input.

| Year | Country        | Slug                                 |          |     |
| ---: | -------------- | ------------------------------------ | -------- | --- |
|  301 | San Marino     | `san-marino-founded`                 |          | NEW |
|  681 | Bulgaria       | `first-bulgarian-empire-founded`     |          | NEW |
|  843 | France         | `treaty-verdun`                      | foothold |     |
|  862 | Russia         | `kyivan-rus`                         | foothold |     |
|  925 | Croatia        | `tomislav-crowned-croatia`           |          | NEW |
|  936 | Denmark        | `gorm-the-old-unites-denmark`        |          | NEW |
|  966 | Poland         | `baptism-of-poland-mieszko`          | foothold | NEW |
| 1000 | Hungary        | `stephen-first-king-hungary`         |          | NEW |
| 1085 | Czechia        | `kingdom-of-bohemia-established`     |          | NEW |
| 1143 | Portugal       | `portugal-becomes-a-kingdom`         |          | NEW |
| 1156 | Austria        | `privilegium-minus-austria`          |          | NEW |
| 1217 | Serbia         | `serbian-kingdom-stefan-crowned`     |          | NEW |
| 1253 | Lithuania      | `mindaugas-crowned-lithuania`        |          | NEW |
| 1278 | Andorra        | `andorra-pareatges-signed`           |          | NEW |
| 1291 | Switzerland    | `swiss-confederation`                |          |     |
| 1359 | Moldova        | `principality-of-moldavia-founded`   |          | NEW |
| 1469 | Spain          | `marriage-ferdinand-isabella`        | foothold |     |
| 1523 | Sweden         | `gustav-vasa-elected-king`           |          | NEW |
| 1581 | Netherlands    | `dutch-republic`                     |          |     |
| 1707 | United Kingdom | `act-of-union-britain`               |          |     |
| 1719 | Liechtenstein  | `liechtenstein-principality-created` |          | NEW |
| 1821 | Greece         | `greek-independence`                 |          |     |
| 1830 | Belgium        | `belgian-independence`               |          |     |
| 1839 | Luxembourg     | `luxembourg-independence-london`     |          | NEW |
| 1861 | Italy          | `kingdom-of-italy-proclaimed`        | foothold | NEW |
| 1871 | Germany        | `german-unification`                 |          |     |
| 1878 | Romania        | `romania-independence-recognized`    |          | NEW |
| 1905 | Norway         | `norway-independence-sweden`         |          |     |
| 1917 | Finland        | `finland-declares-independence`      |          | NEW |
| 1922 | Ireland        | `irish-free-state`                   |          |     |
| 1944 | Iceland        | `iceland-becomes-republic`           |          | NEW |
| 1964 | Malta          | `malta-independence`                 |          | NEW |
| 1991 | Ukraine        | `ukraine-declares-independence`      | foothold | NEW |
| 1993 | Slovakia       | `slovakia-becomes-independent`       |          | NEW |
| 2006 | Montenegro     | `montenegro-independence`            |          |     |

23 of the 35 were authored for this theme; the catalogue only ever held the other 12. Read the
current band and spread figures from the catalogue rather than from here — a card's band moves
whenever the catalogue around its year does:

```bash
node scripts/theme-gap.js --slugs <the 35 above, comma-separated>
```

At authoring time: size 35, bins 7/8, band 0 = 6, same-year pairs 0.

## Why the footholds are the footholds

Band 0 is `0.6 * recognition + 0.4 * local crowding`, so a foothold is a card that is **easy to
place**, which on this theme is almost never the same as a card that is easy to recognise. The
six sit in two groups:

- **Sparse-century cards graded at or above medium.** `treaty-verdun` (843), `kyivan-rus` (862)
  and `baptism-of-poland-mieszko` (966) are all `medium` labels, and they reach band 0 purely
  because the ninth and tenth centuries are thinly populated in the catalogue — there is little
  to confuse them with. `stephen-first-king-hungary` (1000) and `portugal-becomes-a-kingdom`
  (1143) are the same kind of card and land one band short; they are the reserve if the
  catalogue thickens around 843-966.
- **Genuinely famous cards.** `marriage-ferdinand-isabella` (1469),
  `kingdom-of-italy-proclaimed` (1861) and `ukraine-declares-independence` (1991) carry `easy`
  labels that survive their crowded neighbourhoods. These three are the only cards in the deck a
  general audience places without domain knowledge.

The margin over `MIN_BAND_ZERO` is **one card**, so dropping a foothold fails validation, and
there is no spare European founding famous enough to replace one. If more headroom is ever
needed the lever is a new globally-easy card in a sparse stretch — not relabelling
`stephen-first-king-hungary` as `easy`, which would be false.

Note what this theme has that Indonesia had to import: because the deck is 23 new cards, the
footholds could be **authored into the sparse centuries** rather than found. That is why three
of the six are medieval rather than modern. The modern half of the deck (1821-2006) is where the
catalogue is densest, so almost everything there lands in b3 no matter how well known it is.

## Deliberate omissions

### Two founding moments for one country — one had to go

- **Denmark.** The Jelling stone (c. 965), Denmark's "birth certificate", lost to Gorm the Old
  because it sits **one year** from the baptism of Poland. Gorm carries the same claim (the
  monarchy dates its unbroken line to him) and moves the card 30 years clear.
- **Czechia.** The 1993 split is Czechia's legal founding, but `slovakia-becomes-independent`
  already occupies 1993 and two cards on one year is a hard gate failure. Bohemia's elevation to
  a kingdom (1085) is the older claim and fills an otherwise empty stretch. Slovakia keeps 1993
  because it has no older founding at all.
- **Iceland.** `althing-iceland` (930) is the founding of the assembly, not of the state, and
  collides with Tomislav at 925. Iceland's own national day is the republic, so the republic is
  the card.
- **Poland.** The 966 baptism over Bolesław's coronation (1025); the millennium Poland
  celebrates is the baptism.
- **Romania.** The 1859 union of the principalities is the stronger founding claim but sits two
  years from the Kingdom of Italy. Recognition of independence (1878) is the same country's
  founding at a placeable distance.
- **Luxembourg.** Siegfried's castle (963) collides with Denmark and Poland; the 1815 creation of
  the grand duchy collides with Greece. The 1839 partition, which fixed the sovereign state and
  its borders, is clear of both.

### Existing slugs rejected in favour of a new card

- **`italian-unification` (1871)** — rejected because it shares a year with `german-unification`,
  which is an outright gate failure, and because it dates Italy from the capture of Rome rather
  than from the proclamation of the kingdom. `kingdom-of-italy-proclaimed` (1861) is the moment
  Italy dates itself from and clears Germany by ten years.
- **`serbia-independence` (1876)** and **`bulgaria-independence` (1878)** — both are Ottoman
  successions rather than foundings, they crowd each other by two years, and Bulgaria's would
  have shared 1878 exactly with Romania. Replaced by the states those countries actually date
  themselves from: Asparuh's Bulgaria (681) and Stefan's coronation (1217). This also pulled two
  cards out of the deck's most crowded century into empty ones.
- **`czechoslovakia-founded` (1918)** — a band-0 card and tempting for that reason alone, but
  Czechoslovakia is not a country any more, and using it would have given Czechia and Slovakia a
  shared card in a year one step from Finland's.

### Countries left out, and why

- **Albania (1912).** The genuine founding, dropped for near-year crowding: it sits 7 years from
  Norway and 5 from Finland, and that stretch already carries four cards in seventeen years.
  It is the first card to restore if the deck is ever widened past 35.
- **Slovenia, Croatia's 1991, North Macedonia, Belarus, Estonia, Latvia, Armenia, Georgia,
  Azerbaijan, Russia's own 1991.** A dozen countries can claim 1991 and only one card can hold
  it. Ukraine took it as the largest and most recognisable, which is also what makes it a
  foothold. Croatia and Moldova escaped the pile-up because they have older foundings (925,
  1359); the rest had nowhere else to go.
- **Estonia and Latvia (1918).** One year from Finland, and same-year with each other.
  Lithuania represents the Baltics from 1253 instead.
- **Bosnia and Herzegovina (1992).** Sits between Ukraine and Slovakia, in a three-consecutive-
  year run that was already the worst crowding in the deck.
- **Kosovo (2008).** Two years from Montenegro, and recognition is contested; Montenegro is the
  fully-recognised card.
- **Vatican City (1929).** `vatican-city-created` exists and is a real founding, but it is 7
  years from the Irish Free State in the deck's densest stretch, and a treaty-created enclave is
  the weakest reading of "nation".
- **Monaco (1297).** Six years from the Swiss Confederation. Andorra covers the medieval
  microstate case from 1278.
- **Turkey (1923), Cyprus (1960).** Turkey is one year from Ireland and mostly outside Europe;
  Cyprus is four years from Malta, which took the post-colonial Mediterranean slot.
- **England, Scotland, Wales.** The United Kingdom is the country, so it gets one card (1707).
  Æthelstan (927) and Kenneth MacAlpin (843) are the losses that hurt most — MacAlpin would in
  any case have shared his year with the Treaty of Verdun.

### Keyword false positives

The `founded|independen|unification|kingdom of` sweep returns 381 hits and almost all of them
are institutions, companies and non-European states: FIFA, the NFL, the Bauhaus, Interpol,
Starbucks, Amazon, the Kazakh Khanate, the Kingdom of Kush, Saudi Arabia, Panama, Liberia,
Burma, Ghana, and every European _university_ founding from Bologna to Heidelberg. A net is not
a theme.

## Still missing from the catalogue

Real gaps that were not written, because each one collides with a card already in the 35:
Albania's declaration (1912), Estonia and Latvia (1918), Slovenia and the rest of the 1991
cohort, Bosnia (1992), the Jelling stone (965), Æthelstan's kingdom of the English (927),
Kenneth MacAlpin's Alba (843), Monaco (1297) and Vatican City (1929). Writing any of them is
only worth doing alongside a decision about which existing card it displaces.
