# The First Woman theme

A 36-card curated theme on women who were first: the first recorded author, the first head of
government anywhere, the first person to fly a compiler's worth of code before there were
compilers. This note is why these 36 and not others.

## The scope rule

An event is in only if **it is the first time a woman did or held something** — first recorded,
first in the world, or a famous national first. Titles may name the woman; they may not name the
woman and state the date together (the date is what the player is placing).

Two edges were argued rather than assumed:

- **`hatshepsut-crowned-pharaoh`** is in on "one of the first," not "the first" — earlier women
  (Merneith, Sobekneferu) held royal power in Egypt before her. She is kept because she is the
  first woman on record to take the full royal titulary and rule as pharaoh outright rather than
  as a regent for a son, which is a genuine first even though "first female ruler of Egypt" is
  not. The card's title avoids the overclaim by saying "crowned," not "first."
- **`womens-suffrage-nz`** and **`first-woman-in-parliament`** (Finland) are national firsts about
  women collectively, not one named woman. They are kept because the spine's own scope rule
  explicitly allows "a famous national first," and both are exactly that — the same reading the
  spine used for New Zealand and Finland from the start.

## The 36

|  Year | Slug                                   |                |
| ----: | -------------------------------------- | -------------- |
| -2285 | `enheduanna-first-author-hymns`        | NEW            |
| -1478 | `hatshepsut-crowned-pharaoh`           | foothold · NEW |
|   400 | `hypatia-alexandria`                   | foothold       |
|   690 | `princess-wu-empress`                  | foothold       |
|  1008 | `murasaki-shikibu-genji`               |                |
|  1616 | `gentileschi-joins-accademia`          | NEW            |
|  1738 | `chatelet-fire-essay-published`        | NEW            |
|  1775 | `baret-completes-world-circuit`        | NEW            |
|  1786 | `herschel-discovers-comet`             | NEW            |
|  1843 | `lovelace-publishes-algorithm`         | foothold · NEW |
|  1849 | `blackwell-earns-medical-degree`       | foothold · NEW |
|  1893 | `womens-suffrage-nz`                   |                |
|  1903 | `curie-wins-nobel-prize`               | foothold · NEW |
|  1907 | `first-woman-in-parliament`            |                |
|  1916 | `rankin-elected-to-congress`           | NEW            |
|  1919 | `astor-takes-commons-seat`             | NEW            |
|  1921 | `coleman-earns-pilot-license`          | NEW            |
|  1932 | `amelia-earhart-atlantic`              | foothold       |
|  1952 | `hopper-builds-first-compiler`         | NEW            |
|  1960 | `bandaranaike-becomes-worlds-first-pm` | NEW            |
|  1963 | `first-woman-space`                    |                |
|  1966 | `gandhi-becomes-indias-pm`             | foothold · NEW |
|  1967 | `switzer-runs-boston-marathon`         | NEW            |
|  1968 | `chisholm-elected-to-congress`         | NEW            |
|  1969 | `meir-becomes-israels-pm`              | foothold · NEW |
|  1974 | `peron-becomes-worlds-first-president` | NEW            |
|  1975 | `tabei-summits-everest`                | NEW            |
|  1979 | `thatcher-becomes-pm`                  |                |
|  1981 | `oconnor-joins-supreme-court`          | foothold · NEW |
|  1983 | `ride-flies-into-space`                | foothold · NEW |
|  1992 | `jemison-flies-into-space`             | NEW            |
|  1993 | `morrison-wins-nobel-prize`            | NEW            |
|  2005 | `angela-merkel-elected`                | foothold       |
|  2006 | `sirleaf-elected-liberias-president`   | NEW            |
|  2011 | `lagarde-leads-the-imf`                | NEW            |
|  2021 | `harris-becomes-vice-president`        | foothold · NEW |

27 of the 36 are new. Measured against the merged catalogue: size **36**, band 0 **13**, bins **8/8** (advisory), same-year pairs **0**.

27 of the 36 are new. Existing catalogue matches: `hypatia-alexandria`, `princess-wu-empress`,
`murasaki-shikibu-genji`, `womens-suffrage-nz`, `first-woman-in-parliament` (Finland, live in
`candidates.json`), `amelia-earhart-atlantic`, `first-woman-space` (Tereshkova),
`thatcher-becomes-pm` and `angela-merkel-elected` were all already the right beat at the right
year and were reused rather than duplicated.

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated>
```

At authoring time, with the new cards loaded via `--include-pending --extra`: size **36**, bins
**8/8** `[2 2 1 1 5 6 8 11]`, band 0 **12**, same-year pairs **0**.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the catalogue is around a year, so a
foothold is a card that is easy **to place**, not necessarily a card a reader would call easy.

- `hatshepsut-crowned-pharaoh` and `hypatia-alexandria` land in band 0 despite `medium`
  difficulty labels because ancient Egypt and late-antique Alexandria are thin stretches of the
  catalogue — nothing crowds them into a harder band.
- The rest of the 12 are footholds on fame alone: Ada Lovelace, Elizabeth Blackwell, Marie Curie,
  Amelia Earhart, Indira Gandhi, Golda Meir, Sandra Day O'Connor, Sally Ride, Angela Merkel and
  Kamala Harris are ten of the very few "first woman to..." facts nearly every player already
  holds. That the deck's easiest cards are also its most famous names is the point of the theme —
  the footholds and the headline beats are the same cards.
- `enheduanna-first-author-hymns`, by contrast, does **not** land in band 0 even though it opens
  the deck — a `very-hard` label plus real crowding from other ancient-world events keeps it in
  band 2. The opening hand still has two other band-0 cards (`hatshepsut-crowned-pharaoh`,
  `hypatia-alexandria`) once the deck ramps into the ancient period, so the deck is not blind to
  start.

## Deliberate omissions

Cards a keyword sweep surfaces, or spine beats, left out on purpose.

- **Cut for size, favoring famous/well-attested beats over obscure duplicates of the same idea.**
  The spine had 45 beats; 36 is the ceiling. Dropped: `von-suttner` (Nobel Peace Prize, 1905 —
  crowds Curie 1903 and Finland 1907, and is the more obscure of the two Nobel-first beats),
  `kollontai` (1917 minister — crowds Rankin/Astor and is a narrower claim, "cabinet-level," than
  the head-of-government beats already in the deck), `quimby` (1912 Channel flight — the aviation
  slot is already carried by Coleman and Earhart), `garrett-anderson` (1865 — Blackwell already
  carries the "first woman doctor" beat and the two are only 16 years apart, which is the same
  national-variant duplication as Von Suttner/Curie), `maria-mitchell` (1847 comet — Herschel
  already carries "first woman to discover a comet," and Mitchell's card would sit 2-4 years from
  both its neighbors), `savitskaya` (1984 spacewalk — a third space-flight beat in nine years
  after Ride, on top of Tereshkova; two space firsts land in the deck already), `finnbogadottir`
  (1980 — a fourth "first woman head of state/government" beat within five years of
  Thatcher/O'Connor), `lockwood` and `woodhull` (1880, 1872 — both US legal/political firsts that
  duplicate the shape of the Rankin/Astor/Chisholm beats already carried, and both required the
  most speculative sourcing of the spine's "obscure" entries).
- **`first-woman-us-senator`** (Hattie Caraway, 1932) is a genuine in-scope existing card, but it
  shares its year with `amelia-earhart-atlantic`, which the spine already commits to — only one
  1932 card can be in the deck, and Earhart is the more famous of the two.
- **`women-first-compete-olympics-1900`** and sports-record cards (`ederle-first-woman-channel-swim-1926`,
  `fraser-sub-minute-1962`, `lis-hartel-dressage-silver-1952`) are genuine "first woman to..."
  facts but are about sport specifically; `switzer-runs-boston-marathon` already carries the
  sport slot and a second would crowd 1926/1952/1962 against existing beats.

## Still missing from the catalogue

Real gaps, not filler, that were not written because they collide with a card already in the 36:

- **Elizabeth Garrett Anderson** (1865, first woman licensed to practice medicine in Britain) and
  **Maria Mitchell** (1847, first American woman to discover a comet) are both genuinely
  in-scope national-first beats; both fold into the beat already carried by Blackwell and
  Herschel respectively, and both would crowd their carrier's neighborhood if added.
- **Alexandra Kollontai** (1917, first woman to hold a national cabinet post) and **Bertha von
  Suttner** (1905, first woman Nobel Peace laureate) are solid, well-attested beats sitting
  exactly where the deck is already densest (1903-1932); both are the best cards this theme
  does not have room for.
- **Svetlana Savitskaya** (1984, first woman to spacewalk) and **Vigdis Finnbogadottir** (1980,
  first woman democratically elected head of state) are kept in reserve for a future edit if the
  deck is ever loosened past 36 or another theme wants a space/heads-of-state beat.
