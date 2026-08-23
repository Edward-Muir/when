# The Games Board

A 36-card curated theme about games people play sitting down — on a board, at a table, or with
a deck of cards — and about the machines that eventually beat them at it. It runs from Senet in
predynastic Egypt to AlphaGo. This note is why these 36 and not others.

## The scope rule

An event is in only if **it is a game played on a board, at a table, or with cards — or a
machine that beat humans at one**.

The rule exists to keep one specific thing out. A keyword sweep for `game` returns 180 playable
events and the great majority of them are **sport**: the Olympics, cuju, the Mesoamerican
ballgame, football, baseball, the Super Bowl, a Wimbledon final. There is already a 373-event
`sports` category in the catalogue and this is emphatically not that theme. Athletic sport of
every kind is out, including the cases that sit closest to a table: `mary-queen-scots-billiards`
is a cue sport, and `pong-arcade-game` is a video game of a cue-adjacent one.

Video games are out for the same reason, with one carve-out: a landmark _machine plays a game_
moment counts even when the machine is the whole story. That is why
`video-game-bertie-the-brain` is in — Bertie was a four-metre relay computer that played
noughts and crosses against people at an exhibition, which is the first entry in a line that
ends with Chinook and AlphaGo — while `first-arcade-video-game`, `nes-released` and
`game-boy-released` are not.

Mathematics about games is out, with one carve-out on the same principle:
`pascal-probability-theory` stays because the problem of points is a question about how to
settle **an unfinished game of dice**, and dice are in the theme. Von Neumann's _Theory of
Games and Economic Behavior_ and the Nash equilibrium are general theory that happens to be
named after games, so they are out.

## The 36

Paste `eventNames` from `games.theme.json` into the workflow's `theme` input.

|  Year | Slug                              |          |     |
| ----: | --------------------------------- | -------- | --- |
| -3100 | `senet-board-game-egypt`          | foothold |     |
| -3000 | `dice`                            | foothold |     |
| -2600 | `royal-game-of-ur`                | foothold |     |
| -1400 | `nine-mens-morris-game`           | foothold | NEW |
| -1000 | `mancala-sowing-game`             | foothold | NEW |
|  -800 | `knucklebones-astragaloi`         | foothold |     |
|  -500 | `go-game-china`                   |          |     |
|   100 | `ludus-latrunculorum`             |          |     |
|   200 | `patolli-aztec-game`              |          |     |
|   280 | `chaturanga-proto-chess`          | foothold |     |
|   480 | `tabula-roman-backgammon`         |          |     |
|   650 | `shatranj-persia`                 |          | NEW |
|   868 | `playing-cards-tang-china`        |          |     |
|  1000 | `shogi-japan`                     |          |     |
|  1100 | `xiangqi-chinese-chess`           |          |     |
|  1283 | `alfonso-book-of-games`           |          | NEW |
|  1377 | `playing-cards-reach-europe`      |          | NEW |
|  1440 | `tarot-cards-italy`               |          |     |
|  1475 | `modern-chess-queen-rules`        |          |     |
|  1638 | `ridotto-venice-casino`           |          | NEW |
|  1654 | `pascal-probability-theory`       |          |     |
|  1700 | `dominoes-reach-europe`           |          | NEW |
|  1750 | `snakes-and-ladders-india`        |          |     |
|  1770 | `mechanical-turk-chess-automaton` |          | NEW |
|  1824 | `kriegsspiel-prussian-army`       |          | NEW |
|  1875 | `mahjong-emerges-china`           |          | NEW |
|  1886 | `first-world-chess-championship`  |          | NEW |
|  1925 | `contract-bridge-devised`         |          | NEW |
|  1935 | `monopoly-board-game`             |          |     |
|  1950 | `video-game-bertie-the-brain`     |          |     |
|  1959 | `samuel-checkers-program`         |          | NEW |
|  1970 | `world-series-of-poker-first`     |          | NEW |
|  1981 | `trivial-pursuit-launched`        |          |     |
|  1997 | `deep-blue-beats-kasparov`        |          |     |
|  2007 | `chinook-solves-checkers`         |          | NEW |
|  2016 | `alphago-beats-lee-sedol`         |          |     |

15 of the 36 are new and need art before the daily can deal them. Read the current band and
spread figures from the catalogue rather than from here — a card's band moves whenever the
catalogue does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated> \
  --include-pending --extra <staging>/games.json
```

At the time of writing: size 36, bins 8/8 `[7 6 4 4 4 2 5 4]`, band 0 = 7, same-year pairs 0,
no pair inside 8 years.

## Why the footholds are the footholds

Every foothold in this deck is pre-300 CE, and that is not a coincidence — it is the whole
shape of the theme's difficulty.

Band 0 is `0.6 × recognition + 0.4 × (normalised density in a ±25-year window)`, cut at the
catalogue's 25th percentile. The density term is what does the work here. A `medium` card in a
year where the catalogue holds fewer than about thirty neighbours lands in band 0; the same
`medium` card anywhere after roughly 1200 CE cannot, because the catalogue is too crowded there.
So the footholds are not the famous cards — Monopoly, Deep Blue and AlphaGo are all band 1 or 2
— they are the **ancient** ones, where a millennium of empty timeline does the placing for you.

That gives this theme an unusual luxury: it is one of the few subjects whose canonical opening
beats are genuinely 3000 BCE. Senet, dice, the Royal Game of Ur and knucklebones were already
in the catalogue and are already band 0. Two more were authored to widen the margin and, more
importantly, to fill a real hole — the catalogue jumped straight from Ur at 2600 BCE to
knucklebones at 800 BCE with nothing in between:

- `nine-mens-morris-game` (-1400) — mills boards cut into temple stone in Egypt. The mills
  family is a canonical world board game and was entirely absent.
- `mancala-sowing-game` (-1000) — likewise: the sowing games are one of the four or five great
  board game families on earth and the catalogue had no card for them at all.

The margin over `MIN_BAND_ZERO` is two cards, which is comfortable, but note where the slack
is: it is **only** in the ancient block. Dropping any pre-300 CE card costs a foothold and
nothing later in the deck can replace it. If more headroom is ever wanted, the lever is another
ancient game card, not a relabelled modern one.

## Deliberate omissions

**Same-year collisions.** `mehen-snake-game` (-3000) collides with `dice`; `dice` is the more
foundational card and Mehen is `hard` where dice is `easy`, so dice keeps the slot and the
foothold. `petteia-greek-board-game` (-500) collides with `go-game-china`, and petteia is in any
case the same lineage as `ludus-latrunculorum`, which is already in. `rubiks-cube-invented`
(1974) collides with `dungeons-and-dragons-released` and is out on scope anyway.

**Near-year crowding.** `settlers-of-catan-released` (1995) sits **two** years from
`deep-blue-beats-kasparov`, and Deep Blue is not droppable — it is the hinge of the theme's last
act. Catan is the single most painful omission here; the modern Eurogame revival is a real beat
and `trivial-pursuit-launched` (1981) is a thin substitute for it. `scrabble-invented` (1938) is
three years from `monopoly-board-game`. `dungeons-and-dragons-released` (1974) is four years from
the World Series of Poker and seven from Trivial Pursuit; there is no arrangement of that decade
that fits WSOP, D&D and Trivial Pursuit without a flagged pair.
`checkers-draughts-standardized` (1756) and `first-jigsaw-puzzle` (1767) both crowd
`snakes-and-ladders-india` (1750) and `mechanical-turk-chess-automaton` (1770) — and the jigsaw
is a solitary puzzle rather than a game, so it was the easy cut. `hnefatafl-viking-game` (700) is
50 years from `shatranj-persia`, which is legal, but tafl is again the latrunculi lineage, so it
lost the slot to geographic breadth (`patolli-aztec-game` is the deck's only card from the
Americas). A `hoyle-whist-treatise` card at 1742 was drafted and dropped: eight years from Snakes
and Ladders is exactly on the crowding line, and whist's descendant is covered by
`contract-bridge-devised`.

**Redundancy.** `chess-emerges-india` (600) was rejected in favour of `chaturanga-proto-chess`
(280). They are the same moment written twice — the existing description of `chess-emerges-india`
literally reads "the game chaturanga developed in India" — and only one can be in the deck.
Chaturanga keeps the slot because 280 CE is in the sparse stretch where it scores a foothold and
because it leaves 650 free for `shatranj-persia`, which is the _next_ link in the chain rather
than a restatement of the same one. A `landlords-game-patented` (1904) card was drafted and
dropped as too close a retelling of Monopoly.

**Keyword false positives** the sweep drags in, all of them the word "game" or "monopoly" doing
something else: the entire Olympic and Paralympic series, the gladiator games, cuju, kemari, the
Mesoamerican ballgame, the Super Bowl, the Ice Bowl, "The Greatest Game Ever Played",
Chamberlain's 100-point game, the first televised NFL game — and separately every commercial
monopoly in the catalogue (`voc-dutch-east-india`, `standard-oil-founded`, `salt-monopoly-china`,
`wool-staple-monopoly`, `madder-dye-monopoly`, `kilwa-gold-monopoly`), which share a keyword with
the board game and nothing else. `gamestop-short-squeeze` and `crossword-puzzle-published` are
the other two the net caught.

## What is still missing from the catalogue

Authoring stopped at 36 because 36 is the ceiling at which "Theme Cleared!" stays reachable, not
because the theme ran out. These are real gaps, not filler, and several are better cards than the
weakest thing currently in the deck:

- **Cards and gambling.** Hoyle's _Short Treatise on Whist_ (1742), poker's emergence in New
  Orleans (~1829), Magic: The Gathering (1993) and the collectible card game as a form.
- **Chess.** The Staunton pattern (1849) and the first international tournament in London
  (1851) — both crowd each other and the theme already carries five chess cards.
- **Board games.** Ludo patented in England (1896), Cluedo (1949), Risk (1957), Diplomacy
  (1959), and Catan (1995), which is only out on crowding.
- **Go.** The Honinbo school under Tokugawa patronage (1612) is the one obvious absence in the
  deck's East Asian spine; it collides with nothing and would be the first card to add if the
  size ceiling ever moves.
- **Machines.** Shannon's _Programming a Computer for Playing Chess_ (1950), Watson at Jeopardy
  (2011) and Libratus at heads-up poker (2017). Libratus is one year from AlphaGo, so it can
  never join this deck; the other two can.
