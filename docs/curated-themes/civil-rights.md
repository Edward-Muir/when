# The Civil Rights Road theme

A 30-card curated theme on struggles against segregation and racial discrimination, from the
first Black mutual-aid societies of the 1780s to the global protests of 2020, with the United
States and South Africa carrying most of the road. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a moment in a fight for racial equality**: an organisation
founded, a law won or lost, a protest, a text that moved the argument, or a milestone the
fight is credited with.

Edges, argued rather than assumed:

- **`plessy-v-ferguson` and `brown-v-board`** are court rulings, which Day in Court also
  claims. They stay because they are the two rulings the whole movement is defined against and
  for. The overlap is 2, inside the limit of 4.
- **`gandhi-thrown-off-train`** is in as the start of Gandhi's fight against racial
  discrimination in South Africa, a fight for racial equality even though the man is known for
  another.
- **`obama-elected`** is a milestone rather than a protest, kept as the moment many people see
  the fight reaching a landmark.
- **`apartheid-ends`** stands for the 1994 first multiracial election, in place of the
  spine's own new card.

Ending slavery goes to Chains Broken, other marches to Take to the Streets, other trials to Day
in Court.

## The 30

| Year | Slug                               |       |
| ---: | ---------------------------------- | ----- |
| 1787 | `free-african-society-founded`     | NEW   |
| 1829 | `walkers-appeal-pamphlet`          | NEW   |
| 1833 | `crandall-school-black-girls`      | NEW   |
| 1868 | `fourteenth-amendment-ratified`    | NEW   |
| 1870 | `fifteenth-amendment-ratified`     | NEW   |
| 1892 | `wells-southern-horrors`           | NEW   |
| 1893 | `gandhi-thrown-off-train`          | NEW   |
| 1896 | `plessy-v-ferguson`                |       |
| 1903 | `du-bois-souls-black-folk`         | NEW   |
| 1909 | `naacp-founded`                    |       |
| 1912 | `anc-founded`                      |       |
| 1914 | `garvey-founds-unia`               | NEW   |
| 1919 | `first-pan-african-congress-paris` | NEW   |
| 1925 | `pullman-porters-union`            | NEW   |
| 1939 | `marian-anderson-lincoln-memorial` |       |
| 1941 | `executive-order-8802`             | NEW   |
| 1948 | `truman-desegregates-military`     | NEW   |
| 1954 | `brown-v-board`                    |       |
| 1955 | `montgomery-bus-boycott`           |       |
| 1963 | `march-on-washington`              |       |
| 1964 | `civil-rights-act`                 |       |
| 1965 | `selma-to-montgomery-march`        |       |
| 1976 | `soweto-uprising`                  |       |
| 1983 | `mlk-day-signed`                   | NEW   |
| 1984 | `tutu-nobel-peace-prize`           | NEW   |
| 1990 | `nelson-mandela-freed`             |       |
| 1994 | `apartheid-ends`                   |       |
| 2008 | `obama-elected`                    |       |
| 2013 | `black-lives-matter-founded`       |       |
| 2020 | `george-floyd-protests`            |       |

15 of the 30 are reused from the catalogue and 15 were authored for this theme.

Gates: size **30**, band 0 **20**, bins **4/8** (advisory), same-year pairs **0**, bunching
**3** in 1892-1896. Band 0 reads high because the blind grader rated most new cards easy to
place; a card's band moves whenever the catalogue around its year does, so re-measure:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Deliberate omissions

Cut from the spine for density or fame: the 1875 Civil Rights Act, Negro History Week (1926),
the Bethune national council (1935), the 1996 South African constitution, the 2001 Durban
conference and the 2014 Ferguson protests. The 1950s and 1960s are crowded, so Sharpeville,
Little Rock, the Freedom Rides and Greensboro were not added.

The deck has no card before 1787 and the 1500s to 1700s are empty by scope; that is why the
spread gate reads 4/8 and stays advisory.

## Fact-check flags

None unsupported. The fact check made one fix (a dating word in the Pan-African Congress
description, now removed). Its searches were summaries only, with no pages fetched.
