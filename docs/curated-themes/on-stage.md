# The On Stage theme

A 36-card curated theme on live performance itself: the birth of acting and of opera and of
ballet, and the openings and premieres that mark each one. Twenty-five centuries between a man
stepping out of a chorus line in Athens and a hip-hop musical transferring to Broadway. This
note is why these 36 and not others.

## The scope rule

An event is in only if it is **the birth of a form of live theatre, opera, ballet or stage
performance, a landmark premiere, or the opening of a famous playhouse.**

Excluded, even when the keyword net returns it: a playwright's birth or death (`birth-euripides`,
`birth-oscar-wilde`, `death-shakespeare`), a body of work rather than a single premiere
(`aeschylus-tragedy-origins`'s companions `euripides-medea`, `moliere-comedies`'s companions),
a building without a landmark opening or a genuinely famous name attached (many "Theatre" hits
are hostage crises or operating-theatre medicine, not stage venues), and a screen or recording
medium however performance-adjacent (`war-of-worlds-broadcast` is radio; `pinocchio-premieres`
is animation). "Landmark" is doing real work: this theme is not "any premiere of any play,"
which the catalogue could otherwise flood with; every premiere kept here is one still named as
a turning point in the history of its form.

Two edges argued rather than assumed:

- **`aeschylus-tragedy-origins`** stands in for **The Persians** (472 BCE). Its slug is about
  Aeschylus generally, but its `friendly_name` and description are specifically about
  introducing the second actor and complex dialogue — the technical birth the spine's beat is
  reaching for, not just a biography card. Same trap as `english-civil-war-aftermath` being the
  Restoration card: check the year and the actual title, not the name.
- **English theatres reopening in 1660** is left out. It is a real turning point for the
  institution of English theatre, but every card the catalogue offers for that year
  (`english-civil-war-aftermath`) is written entirely as the political Restoration — no stage,
  no ban, no women performers in its text — so using it would put a non-theatrical card in a
  theatre deck on the strength of its year alone. Writing a new one was rejected too: it would
  sit four years from `moliere-comedies` (Tartuffe, 1664), the tightest justified crowd this
  theme already carries, for a beat that is a legal change rather than a premiere or an opening.

## The 36

| Year | Slug                           |                |
| ---: | ------------------------------ | -------------- |
| -534 | `thespis-first-actor`          | foothold · NEW |
| -472 | `aeschylus-tragedy-origins`    |                |
| -458 | `oresteia-trilogy-premieres`   | NEW            |
| -429 | `sophocles-oedipus`            | foothold       |
| -411 | `lysistrata-premieres`         | foothold · NEW |
| -335 | `theatre-of-epidaurus-built`   | foothold · NEW |
|  -55 | `theatre-of-pompey-opens`      | foothold · NEW |
| 1375 | `noh-theater-emergence`        |                |
| 1545 | `commedia-dell-arte-emerges`   |                |
| 1581 | `ballet-de-cour-france`        |                |
| 1599 | `globe-theatre-built`          | foothold       |
| 1603 | `kabuki-theater-begins`        |                |
| 1607 | `monteverdi-orfeo`             |                |
| 1637 | `san-cassiano-opera-house`     | NEW            |
| 1664 | `moliere-comedies`             |                |
| 1728 | `beggars-opera-premieres`      | NEW            |
| 1778 | `la-scala-opens`               | foothold · NEW |
| 1791 | `magic-flute-premieres`        | foothold · NEW |
| 1816 | `barber-of-seville-premieres`  | NEW            |
| 1832 | `la-sylphide-premieres`        | NEW            |
| 1841 | `giselle-premieres`            | NEW            |
| 1853 | `la-traviata-premieres`        | NEW            |
| 1877 | `tchaikovsky-swan-lake`        |                |
| 1879 | `dolls-house-premieres`        | NEW            |
| 1895 | `earnest-premieres-london`     | NEW            |
| 1898 | `stanislavski-seagull-triumph` | NEW            |
| 1913 | `rite-of-spring`               |                |
| 1927 | `show-boat-premieres`          | NEW            |
| 1943 | `oklahoma-premieres`           | NEW            |
| 1957 | `west-side-story-opens`        |                |
| 1968 | `hair-opens-broadway`          | NEW            |
| 1975 | `chorus-line-premieres`        | NEW            |
| 1981 | `cats-opens-west-end`          | foothold · NEW |
| 1986 | `phantom-of-opera-premieres`   | foothold · NEW |
| 2003 | `wicked-premieres-broadway`    | foothold · NEW |
| 2015 | `hamilton-opens-broadway`      | foothold · NEW |

24 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **12**, bins **8/8** (advisory), same-year pairs **0**.

24 of the 36 are new.

```bash
node scripts/theme-gap.js --include-pending --extra staging/on-stage.json --slugs <the 36 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **36**,
bins **8/8**, band 0 **12**, same-year pairs **0**.

## Why the footholds are the footholds

Twelve is a wide margin over the floor of 5, and it splits into two different reasons:

- **Sparse-era footholds**: `thespis-first-actor` through `theatre-of-pompey-opens` sit in a
  stretch of the catalogue with almost nothing else in it, so a card that spans centuries is
  still trivially ordered against its neighbours — the same effect the clockwork theme's ancient
  devices get. `aeschylus-tragedy-origins`, `sophocles-oedipus` and `theatre-of-epidaurus-built`
  land in band 0 on that basis as much as on fame.
- **Genuinely famous footholds**: `globe-theatre-built`, `tchaikovsky-swan-lake`,
  `rite-of-spring`, `west-side-story-opens`, `la-scala-opens`, `cats-opens-west-end`,
  `phantom-of-opera-premieres`, `wicked-premieres-broadway` and `hamilton-opens-broadway` are
  band 0 because a player has actually heard of them — the Globe, Swan Lake, the Rite of Spring
  riot, and four modern mega-musicals are about as close to universal recognition as stage
  history gets. `magic-flute-premieres` graded `easy` on the same logic but landed band 1 by a
  hair, since three other Renaissance/Baroque cards crowd its neighbourhood.

## Deliberate omissions

**Spine beats cut.**

- **Antigone** (441 BCE) — dropped for redundancy. `aeschylus-tragedy-origins`, `oresteia`
  and `sophocles-oedipus` already carry Greek tragedy's premiere history; a fourth tragedy
  premiere adds nothing a reader could tell apart from the other three, so `lysistrata` (a
  comedy, a different genre) was kept instead for the variety.
- **The Bacchae** (405 BCE) — dropped, six years from `lysistrata-premieres` (411 BCE) and the
  fourth of five tragedy-premiere beats on the spine; cut for the same redundancy as Antigone
  rather than for the crowding, which was the smaller problem.
- **First Roman stage play** (240 BCE) — dropped. Genuinely in scope (the birth of a distinct
  tradition) but `theatre-of-pompey-opens` (55 BCE) already represents Roman theatre, is far
  more famous, and a reader cannot place either to a specific decade regardless, so the two
  together would have been two guesses at the same idea rather than two distinct facts.
- **The Theatre opens in London** (1576, Burbage) — dropped. The same beat as
  `globe-theatre-built` (1599) — "a purpose-built English playhouse opens in London" — with the
  Globe by far the more recognizable of the two, and dropping the earlier one also relieves a
  five-year crowd against `ballet-de-cour-france` (1581).
- **English theatres reopen** (1660) — see "The scope rule" above: no existing card actually
  covers the theatrical content of this beat, and a new card would crowd `moliere-comedies`
  (1664) by four years for a beat that is a legal change, not a premiere or an opening.
- **Carmen** (1875) and **Bayreuth Festspielhaus opens** (1876) — both dropped. Together with
  `tchaikovsky-swan-lake` (1877) they would have put three cards in three consecutive years, an
  unplayable stretch; Swan Lake was kept because it is free (already in the catalogue) and the
  most widely recognized of the three, and the deck already carries seven other opera premieres
  and venue openings (`san-cassiano-opera-house`, `beggars-opera-premieres`, `la-scala-opens`,
  `magic-flute-premieres`, `barber-of-seville-premieres`, `la-traviata-premieres`, plus
  `monteverdi-orfeo`), so losing two more does not thin the genre out.
- **The Marriage of Figaro** (1786) — dropped, five years from `magic-flute-premieres` (1791).
  Both are Mozart opera premieres in Vienna; keeping one avoids asking a player to date two
  near-identical facts against each other, and `magic-flute-premieres` was kept for its wider
  recognition (the Queen of the Night aria, the fairy-tale plot) over Figaro's more
  connoisseur-level fame.
- **My Fair Lady** (1956) — dropped, one year from `west-side-story-opens` (1957), a
  same-decade Broadway-musical collision as bad as a same-year one for placement purposes.
  West Side Story was kept because it is already in the catalogue and is the more
  internationally recognized of the two.

**Existing catalogue cards left out.** `euripides-medea` (431 BCE, "Euripides Writes Major
Tragedies") is a fifth Greek tragedy premiere on top of the three already kept, cut for the
same redundancy reasoning as Antigone and the Bacchae. `opera-emerges-florence` (1597, Peri's
Dafne) is arguably opera's true birth moment, ten years before `monteverdi-orfeo`, but the two
would sit inside a stretch already carrying `globe-theatre-built` (1599) and
`kabuki-theater-begins` (1603) — a fourth landmark within eight years of the other three was one
crowd too many, and `monteverdi-orfeo` is the more recognizable of the pair (L'Orfeo is still
staged; Dafne survives only in fragments). `sydney-opera-house-completed` (1973, easy, band 0)
was considered as a modern foothold and filler for the 1957-1968 gap but was left out as a
building without a landmark premiere behind it, the same standard that excludes other famous
theatres with no marquee opening night attached.

## Known crowding kept on purpose

Three stretches sit under the 8-year advisory line and were kept anyway, because each pairing
is between genuinely distinct beats rather than two versions of the same fact:

- **1599 → 1603 → 1607** (`globe-theatre-built`, `kabuki-theater-begins`, `monteverdi-orfeo`,
  4 years apart each): an English playhouse, a Japanese dance-drama form, and Italian opera —
  three unrelated traditions being born almost simultaneously on three different continents.
  Dropping any one loses a distinct tradition, not a duplicate.
- **1877 → 1879** (`tchaikovsky-swan-lake`, `dolls-house-premieres`, 2 years): a ballet premiere
  and the birth of modern realist drama — different forms entirely, and both are anchors of
  their respective genres in this deck.
- **1895 → 1898** (`earnest-premieres-london`, `stanislavski-seagull-triumph`, 3 years): a
  drawing-room comedy premiere against the birth of naturalistic stage acting — again distinct
  beats, not near-duplicates.
- **1968 → 1975 → 1981 → 1986** (`hair-opens-broadway`, `chorus-line-premieres`,
  `cats-opens-west-end`, `phantom-of-opera-premieres`, 5-7 years apart): the modern musical's
  rapid evolution through rock, verite, and the British mega-musical. Each is a different
  landmark of the form's history rather than a repeat, and none is skippable without leaving a
  visible hole in that lineage.

## Still missing from the catalogue

Real gaps, left unwritten because they collide with a card already in the 36:

- **The Theatre of Dionysus** as a building in its own right (as opposed to the plays staged in
  it) — folds into every Greek tragedy card already kept.
- **Peri's Dafne** (1597) and **Livius Andronicus's first Roman play** (240 BCE) — both argued
  above and left out for crowding/redundancy rather than lack of a slug.
- **The Comédie-Française founding** (1680) — a landmark institutional birth, but it sits 16
  years from `moliere-comedies` (its own actors founded it) and 48 from `beggars-opera-premieres`;
  there was no room left in a deck already carrying eleven cards between 1637 and 1791 without
  crowding one of them further.
- **The premiere of Verdi's Aida** (Cairo) and **Wagner's Tristan und Isolde** (Munich) — both
  genuinely landmark opera premieres, both left out because the 1853-1913 stretch is already
  carrying `la-traviata-premieres`, `tchaikovsky-swan-lake`, `dolls-house-premieres`,
  `earnest-premieres-london`, `stanislavski-seagull-triumph` and `rite-of-spring` — six cards in
  sixty years is already the deck's densest run.
- **Andrew Lloyd Webber's Evita** (1978) and **Les Misérables** (1985, Paris; 1985 London) —
  both sit inside a few years of `cats-opens-west-end` (1981) and `phantom-of-opera-premieres`
  (1986), the same mega-musical cluster already kept at its practical limit.

Note on Thespis: the spine itself flags this beat as low confidence, and it remains genuinely
traditional rather than documented — antiquity's sources disagree on the exact year and even on
whether the story is more legend than record. It is written here as the field's own convention
(the origin of the word "thespian," the date most commonly cited for the first competition) and
worded to hedge accordingly ("reportedly").

## Review edits

The new cards were written without a live search and checked afterwards. One date moved:
`theatre-of-epidaurus-built` is 335 BCE, inside the 340-330 BCE construction window the sources
give, not 350 BCE.
