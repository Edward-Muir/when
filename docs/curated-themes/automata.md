# The Automata theme

A 35-card curated theme on machines built to act on their own, from a legend of a singing
mechanical man at the Zhou court to a chatbot that answers in prose. This note is why these 35
and not others — the scope rule that shaped the list, the footholds that make it playable, and
the cards deliberately left out.

## The scope rule

An event is in only if **it is a machine built to act on its own**: self-moving, self-regulating
or self-deciding. That admits water clocks that strike, temple automata, programmable machines,
calculating engines, industrial robots, autonomous vehicles and machine-learning systems.

It excludes three things the keyword sweeps kept dragging in, and the exclusions did real work:

- **Tools a human drives directly.** A hand loom, a printing press, a knitting frame, a stocking
  machine — powered or not, the operator is the intelligence. This is why the deck holds the
  Jacquard loom (the pattern is in the cards, not the weaver's hands) but no other loom.
- **Machines a human drives at a distance.** Remote control moves the operator, it does not
  remove them. This cost the deck two famous cards, Tesla's radio-controlled "teleautomaton"
  boat and Lunokhod 1, and one infamous one — the Mechanical Turk had a chess player inside.
- **Fiction, theory and tests.** Čapek's _R.U.R._ named the robot and Asimov's laws legislated
  it, but a play is not a machine; nor is the Turing test, nor Wiener's _Cybernetics_. The line
  is drawn at treatises that document machines that were actually built — al-Jazari, the Banu
  Musa, Hero — which are in.

Era target was roughly 1000 BCE to today, and the ancient and medieval end is where the
catalogue was emptiest: the probe that opened this work returned **7** playable events over
1206-2002, with **zero** band-0 cards. Twenty-one of the 35 are therefore new.

## The 35

Paste as `eventNames` into the workflow's `theme` input.

|    Year | Slug                              |              |
| ------: | --------------------------------- | ------------ |
| 950 BCE | `yan-shi-mechanical-man`          | foothold NEW |
| 350 BCE | `archytas-flying-dove`            | foothold NEW |
| 300 BCE | `antikythera-mechanism`           | foothold     |
| 250 BCE | `ctesibius-float-regulator`       | NEW          |
|       1 | `vending-machine`                 |              |
|     255 | `ma-jun-south-pointing-chariot`   | foothold NEW |
|     725 | `escapement-mechanism`            |              |
|     850 | `banu-musa-ingenious-devices`     | foothold NEW |
|    1092 | `su-song-clock-tower`             | NEW          |
|    1206 | `al-jazari-mechanical-art`        |              |
|    1300 | `mechanical-clock`                | foothold     |
|    1354 | `strasbourg-clock-rooster`        | NEW          |
|    1434 | `joseon-sejong-water-clock`       |              |
|    1495 | `leonardo-mechanical-knight`      | NEW          |
|    1560 | `turriano-mechanical-friar`       | NEW          |
|    1642 | `mechanical-calculator-pascaline` |              |
|    1739 | `vaucanson-digesting-duck`        | NEW          |
|    1774 | `jaquet-droz-writer-automaton`    | NEW          |
|    1788 | `watt-centrifugal-governor`       | NEW          |
|    1804 | `jacquard-loom`                   |              |
|    1822 | `babbage-difference-engine`       | NEW          |
|    1833 | `babbage-analytical-engine`       |              |
|    1866 | `whitehead-torpedo`               | NEW          |
|    1883 | `johnson-thermostat`              | NEW          |
|    1895 | `player-piano`                    |              |
|    1912 | `sperry-gyroscopic-autopilot`     | NEW          |
|    1948 | `grey-walter-tortoises`           | NEW          |
|    1958 | `mark-i-perceptron`               | NEW          |
|    1961 | `unimate-industrial-robot`        | NEW          |
|    1969 | `shakey-the-robot`                | NEW          |
|    1977 | `self-driving-car-prototype`      |              |
|    1997 | `deep-blue-beats-kasparov`        |              |
|    2005 | `darpa-grand-challenge-won`       | NEW          |
|    2016 | `alphago-beats-lee-sedol`         |              |
|    2022 | `chatgpt-released`                | foothold     |

`NEW` means the card was authored for this theme and **needs art before the theme can ship** —
`loadAllEvents` hides an unillustrated event, so publish validation (which only ever sees
playable events) reads 21 of these 35 as unresolved until the image pipeline has run. The figures
below were measured with the new records projected in:

```bash
node scripts/theme-gap.js --slugs <the 35 above> --include-pending --extra <staging>/automata.json
# size 35 (30-36) · bins 8/8 (6+) · band 0 7 (5+) · same-year pairs 0
```

Read band and spread from the catalogue rather than from here — a card's band moves whenever
the catalogue does.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how **sparse** the timeline is around the year, so it
rewards a card that is placeable, not a card that is famous. On this catalogue that resolves to
a simple arithmetic: any `easy` card is band 0 wherever it sits, and a `medium` card is band 0
only where fewer than about 30 other events lie within 25 years either side. Nothing `hard` can
reach it outside an almost empty stretch.

That is why five of the seven footholds are ancient, and why the ancient end of this theme —
the part the catalogue could not supply at all — turned out to be the part that makes it
playable:

- `yan-shi-mechanical-man` has **no** catalogue neighbour within 25 years. A player who knows
  only that the story is the oldest one in the deck places it correctly, which is exactly the
  property the opening hand needs.
- `archytas-flying-dove`, `ma-jun-south-pointing-chariot` and `banu-musa-ingenious-devices` sit
  in stretches holding 10-20 events. All three are graded `medium` on recognition and all three
  are standard openers in any history of robotics — the grade is not a lever pulled to pass the
  gate, and re-grading them `hard` would fail it honestly.
- `antikythera-mechanism` and `mechanical-clock` are the only two `easy` cards the existing
  catalogue offers inside the scope rule, and `chatgpt-released` is the third, at the far end.

The margin over `MIN_BAND_ZERO` is two. The lever if it is ever lost is another genuinely
recognisable device in an empty stretch of years — Hero's automatic theatre, Charlemagne's
clock from Baghdad — not a relabelled card here.

## Deliberate omissions

- **Out of scope, though the sweep found them.** `mechanical-turk` has no slug and was not
  written: it was a cabinet with a chess master folded inside, the opposite of the theme.
  Tesla's teleautomaton boat and `lunokhod-1` are steered by a human over a radio link.
  `knitting-machine` (1589), `power-loom-invented` (1785) and `handloom-frame-loom` are
  operator-driven. `maxim-gun-invented` (1884) self-loads, but a gunner holds the trigger.
  Čapek's _R.U.R._, Asimov's laws, _Metropolis_ and the Turing test are fiction or argument,
  not machines.
- **Same-year collisions.** `first-ai-program` (1956, Logic Theorist) collides with nothing in
  the deck but was dropped with the Dartmouth workshop when both proved to be a program and a
  conference rather than machines. `sojourner-mars-rover` would share 1997 with
  `deep-blue-beats-kasparov`, and `video-game-bertie-the-brain` (1950) sits on the Turing test
  year the deck does not use.
- **Near-year crowding.** `mechanical-clock-adoption` (1283) is 17 years from
  `mechanical-clock` and says the same thing; `strowger` (1891, unwritten) is 4 years from
  `player-piano`; `spirit-mars-rover` (2004) and `roomba-released` (2002) both crowd
  `darpa-grand-challenge-won` (2005); `gpt-language-model` (2018) and `waymo-self-driving`
  (2018) share a year with each other and sit 2 years from `alphago-beats-lee-sedol`;
  `mars-curiosity-landing` (2012) and `perseverance-mars-landing` (2021) crowd the same tail.
  Two advisory pairs were kept because both members are canonical: `mark-i-perceptron` (1958)
  against `unimate-industrial-robot` (1961) — the first learning machine and the first
  industrial robot — and `alphago-beats-lee-sedol` (2016) against `chatgpt-released` (2022),
  where the second is also a foothold.
- **Redundancy.** `pendulum-clock` (1656) and `anchor-escapement` (1657) are in scope, but the
  deck already carries six timekeepers and a seventh makes it read as a clocks theme;
  `babbage-difference-engine` took the slot instead. `hero-steam-engine` (50) would be a second
  Hero card next to `vending-machine`. `metronome-patented` (1815) and `jukebox-invented`
  (1889) are minor next to `player-piano`. `robotic-exoskeleton` (1960) is worn, not
  autonomous, and sits a year from Unimate. `solid-state-lidar` (2010) is a component.
  `home-automation` (1975) is a remote-control protocol.
- **Existing slugs rejected in favour of a new card.** `water-clock` (-2000, `easy`, band 0)
  would have been a free foothold, but it describes a vessel that measures time by flow with
  nothing self-acting about it; `ctesibius-float-regulator` was written instead as the honest
  version of that beat, and the foothold was found elsewhere. `first-ai-program` (1956) is the
  catalogue's only pre-1990 AI card and was rejected as software with no autonomy claim, with
  `mark-i-perceptron` written as the machine that beat covers.
- **False positives** the sweeps dragged in: Sojourner Truth, McCarthyism, the Defenestration
  of Prague, the Colossus of Rhodes (matched on "colossus"), Nagorno-Karabakh (drones), the
  Maroon Wars ("automatic" nowhere near it), and every Watt and Ford card in the catalogue.

## What is still missing from the catalogue

Real gaps, not filler, each left out for a stated reason:

- **Hero of Alexandria's automatic theatre and programmable cart** (c. 60) — the strongest
  unwritten ancient card; omitted only because `vending-machine` already carries Hero.
- **The clock Harun al-Rashid sent to Charlemagne** (807) — 43 years from the Banu Musa card
  and the same idea told from the receiving end.
- **Dondi's Astrarium** (1364) — 10 years from the Strasbourg cock.
- **The Prague orloj apostles** (1410) — 24 years from the Jagyeongnu.
- **The V-1 flying bomb** (1944) and **Elektro** (1939) — the deck's one thin stretch is
  1912-1948, and both would fill it. The V-1 is squarely in scope and is the best single
  addition if the theme is ever widened; Elektro responded to spoken commands, which puts it on
  the wrong side of the remote-control line.
- **ELIZA** (1966), **Samuel's self-learning checkers player** (1959), **AlexNet** (2012) and
  **Watson on _Jeopardy!_** (2011) — all in scope as machine-learning systems, all crowded out
  by neighbours already in the deck.
- **Ingenuity's first Mars flight** (2021) — the first autonomous aircraft on another world,
  four years from AlphaGo and a year from Perseverance.
