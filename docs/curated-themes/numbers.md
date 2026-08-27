# The Numbers & Proofs theme

A 36-card curated theme tracking **mathematical ideas entering human thought**, from Thales
squinting at a pyramid's shadow to Perelman posting the Poincaré proof to a preprint server.
This note is why these 36 and not others.

## The scope rule

An event is in only if **a mathematical idea is the subject**. That covers counting and place
value, zero, irrational / negative / imaginary numbers, Euclidean and non-Euclidean geometry,
algebra, algorithms, calculus, probability, set theory, incompleteness, computability, and
landmark proofs.

Three things are deliberately out, and each of them had real candidates in the catalogue:

- **Calculating machines.** An abacus, a slide rule and a difference engine are devices, not
  ideas. `abacus-invented`, `slide-rule` and `birth-charles-babbage` are all cheap band-0-ish
  hits and all three are out. (`leibniz-binary-system` stays — base-2 numeration is a number
  system, and the card is about the notation, not a machine.)
- **Applied physics and engineering.** `lagrange-mechanics`, `maxwell-equations`,
  `avogadro-molecular-hypothesis`, `fresnel-wave-optics`, `ampere-electromagnetism` and
  `metric-system-france` / `decimal-currency-uk` (metrology and coinage, not mathematics).
- **Biographies.** `birth-pythagoras`, `birth-euclid`, `birth-archimedes`, `birth-descartes`,
  `birth-pascal`, `birth-charles-babbage`, `birth-bertrand-russell`, `birth-kurt-godel`,
  `birth-alan-turing`, `birth-john-von-neumann`, `hypatia-alexandria`. The catalogue is rich in
  these and none of them names an idea. Where the person mattered, the _work_ is the card —
  which is why Gödel, Turing and Russell's circle appear through `godel-incompleteness-theorems`
  and `turing-computable-numbers` rather than through their birthdays.

The catalogue was written by people who care about the ancient half of this story and stops
caring around Euler: a tight sweep returns 29 playable events whose newest hit is Britain going
decimal. **Everything from Gauss onward is authored here** — nineteen new cards, which is more
than half the deck.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

| Year | Slug                                  |          |     |
| ---: | ------------------------------------- | -------- | --- |
| -585 | `thales-measurement-pyramid`          |          |     |
| -530 | `pythagoras-theorem`                  | foothold |     |
| -450 | `irrational-numbers-discovered`       | foothold | NEW |
| -400 | `concept-of-zero`                     | foothold |     |
| -300 | `euclid-elements-geometry`            | foothold |     |
| -250 | `archimedes-measures-circle`          | foothold | NEW |
| -100 | `nine-chapters-mathematical-art`      |          | NEW |
|  250 | `diophantus-algebra`                  |          |     |
|  499 | `aryabhata-zero-concept`              |          |     |
|  600 | `maya-mathematical-innovation`        |          |     |
|  628 | `brahmagupta-algebra-india`           |          |     |
|  820 | `khwarizmi-algorithms`                |          |     |
| 1070 | `omar-khayyam-algebra`                |          |     |
| 1202 | `arabic-numerals-adoption`            |          |     |
| 1400 | `kerala-school-mathematics`           |          |     |
| 1545 | `cardano-ars-magna`                   |          | NEW |
| 1614 | `napier-logarithms`                   |          | NEW |
| 1637 | `descartes-analytical-geometry`       |          |     |
| 1654 | `pascal-probability-theory`           |          |     |
| 1684 | `newton-leibniz-calculus`             | foothold |     |
| 1703 | `leibniz-binary-system`               |          |     |
| 1736 | `euler-graph-theory`                  |          |     |
| 1763 | `bayes-theorem`                       |          | NEW |
| 1801 | `gauss-disquisitiones`                |          | NEW |
| 1829 | `non-euclidean-geometry`              |          | NEW |
| 1846 | `galois-group-theory`                 |          | NEW |
| 1854 | `boole-laws-of-thought`               |          | NEW |
| 1874 | `cantor-uncountable-infinity`         |          | NEW |
| 1900 | `hilbert-problems`                    |          | NEW |
| 1931 | `godel-incompleteness-theorems`       |          | NEW |
| 1936 | `turing-computable-numbers`           |          | NEW |
| 1963 | `cohen-continuum-hypothesis`          |          | NEW |
| 1976 | `four-colour-theorem-proved`          |          | NEW |
| 1983 | `classification-finite-simple-groups` |          | NEW |
| 1994 | `fermat-last-theorem-proved`          |          | NEW |
| 2003 | `poincare-conjecture-proved`          |          | NEW |

Read the current band and spread figures from the catalogue rather than from here — a card's
band moves whenever the catalogue around its year does:

```bash
npm run theme:gap -- --slugs <the 36 above, comma-separated>
```

At authoring time, projected over playable + pending: **size 36, bins 8/8 `[6 6 3 5 6 3 3 4]`,
band 0 = 6, same-year pairs 0**, range 585 BCE to 2003.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how _sparse_ the catalogue is within ±25 years, so it
rewards a recognisable card sitting in an empty stretch of time. Mathematics is unusually kind
here: its famous early results are ancient, and the ancient catalogue is thin.

All six footholds are pre-1700, and five of them are pre-Common-Era:

- `pythagoras-theorem`, `euclid-elements-geometry` and `concept-of-zero` are the school-syllabus
  cards. They are `easy`/`medium` labels landing in centuries where the catalogue holds almost
  nothing, so both halves of the score push them down.
- `irrational-numbers-discovered` and `archimedes-measures-circle` are **authored to be
  footholds**. Both are genuinely famous — the square root of two, and pi — and both sit in the
  emptiest quarter of the timeline. They are the deliberate answer to the fact that everything
  this theme wants after 1800 lands in the catalogue's most crowded years and can never be band 0.
- `newton-leibniz-calculus` (1684) is the only post-Renaissance foothold and the reason the
  opening hand is not exclusively BCE.

The margin over `MIN_BAND_ZERO` is one card. **The lever if it ever slips is another famous
ancient result, not a relabelled modern one** — every modern card in this deck carries a density
penalty large enough that even an `easy` label cannot reach band 0.

This is also why `newton-leibniz-calculus` (1684, band 0) is in the deck and `newton-calculus`
(1666) is not: one calculus card is enough, and the pair are redundant, so the deck keeps the one
that opens.

## Deliberate omissions

**Same-year collisions.** A player cannot order two cards sharing a year.

- `pythagoras-school` shares -530 with `pythagoras-theorem`; the theorem is the idea.
- `birth-euclid` (-325) against `euclid-elements-geometry` (-300), and `birth-archimedes` (-287)
  against `archimedes-measures-circle` (-250) — biographies either way.
- `aryabhata-astronomy` shares 499 with `aryabhata-zero-concept`.
- `arabic-numerals-india` (600) shares its year with `maya-mathematical-innovation`. The Maya
  card is the independent invention and the more surprising placement; the Indian decimal story
  is already carried by `aryabhata-zero-concept` and `arabic-numerals-adoption`.
- `gupta-mathematics` and `hypatia-alexandria` both sit at 400.
- **`fermat-last-theorem-proved` exists at 1994 rather than as the 1637 margin note** because
  1637 is `descartes-analytical-geometry`, and La Géométrie is not droppable. The conjecture is
  therefore in the deck only through its proof — which is also the beat the theme actually
  wanted, since the interesting mathematics is Wiles', not the marginalia.

**Near-year crowding, dropped.** `seljuk-tilework` (1150, and a false positive anyway) against
`bhaskara-mathematics-india`; `brunelleschi-perspective` (1413) 13 years from Kerala and in any
case an art card; `arabic-manuscript-illumination` (1200) two years from Fibonacci;
`zero-concept-india` (500) one year from Aryabhata; `khwarezm-al-biruni` and `islamic-bookbinding`
(both 1000) near Khayyam.

**Two crowded pairs kept on purpose.** `godel-incompleteness-theorems` (1931) →
`turing-computable-numbers` (1936) is 5 years, and `four-colour-theorem-proved` (1976) →
`classification-finite-simple-groups` (1983) is 7. Both trip the advisory. Incompleteness and
computability are the two beats the theme exists to reach, and dropping either the first
computer-assisted proof or the classification would leave the modern arc with nothing between
Cohen and Wiles. The deck is at the 36-card ceiling, so there is no spare beat to swap in.

**Redundancy.** `newton-calculus` (1666) — see above. `zero-concept-india` (500) and
`arabic-numerals-india` (600) both restate `aryabhata-zero-concept`. `euler-mathematics` (1748,
"Euler Advances Mathematics") is a vague card 12 years from `euler-graph-theory`, which names a
specific idea. `lagrange-number-theory` (1770) is the four-squares theorem and was cut in favour
of `gauss-disquisitiones`, which is the number-theory beat that matters and sits in a year the
deck otherwise had nothing near. `bhaskara-mathematics-india` (1150) is `very-hard`, vague, and
sits between Khayyam and Kerala with nothing of its own to say — it was the card cut to get from
37 to 36.

**Existing slugs rejected in favour of an authored card.** None of the nineteen new events
displaced a serviceable existing one — every one of them fills a hole. The closest thing to a
replacement is `gauss-disquisitiones` over `lagrange-number-theory` and `euler-mathematics`,
which were vague rather than wrong.

**False positives the sweep dragged in.** `nazca-lines` ("geometric"), `receipt`,
`tally-sticks` (44,000 BCE and about notches, not number), `giordano-bruno-burned`,
`khwarezm-center-learning`, `neptune-discovered`, `passenger-pigeon-extinct` ("infinite"),
`bank-of-china-tower` and `marina-bay-sands` (both "geometry"),
`first-recorded-vital-statistics`, `boethius-logic-translation`, `first-ai-program`,
`chatgpt-released`.

## What is still missing from the catalogue

Real gaps, not filler — each was written out of the spine for a stated reason and would be worth
authoring if this theme is ever widened or re-cut:

- **Zeno's paradoxes** (~-450) — collides with `irrational-numbers-discovered`, which is the
  better card for the same slot.
- **Apollonius' _Conics_** (~-200) and **Eratosthenes' sieve** (~-240) — both crowd
  `archimedes-measures-circle`.
- **Fermat's Last Theorem conjectured** (1637) — the Descartes collision above.
- **Bernoulli's law of large numbers** (1713) — 10 years from `leibniz-binary-system`, and
  probability already has Pascal and Bayes.
- **Abel's proof that the quintic is unsolvable** (1824) — 5 years from `non-euclidean-geometry`;
  the result reaches the deck through `galois-group-theory` instead.
- **The Riemann hypothesis** (1859) — 5 years from `boole-laws-of-thought`. The single most
  famous open problem in mathematics is absent from this deck purely on spacing, and it is the
  first card to add if anything else is ever dropped.
- **Peano's axioms** (1889), **Russell's paradox** (1901) and **_Principia Mathematica_** (1910) —
  the foundations crisis is represented by Cantor, Hilbert and Gödel; a fourth and fifth card
  would crowd 1900.
- **Von Neumann and Morgenstern's game theory** (1944), **Shannon's information theory** (1948)
  and **Nash equilibrium** (1950) — one of these belongs in the deck and none fits: 1944 is 8
  years from Turing and the three crowd each other.
- **Mandelbrot's fractal geometry** (1967/1975) — 1967 is 4 years from Cohen, 1975 is 1 year from
  the four colour theorem.
- **Public-key cryptography / RSA** (1976-77) — same year as the four colour theorem, and
  arguably applied rather than an idea.
