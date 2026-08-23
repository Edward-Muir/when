# The Hard Currency theme

A 36-card curated theme about money itself — the stuff people pay with, and the institutions
that issue or govern it — from cowrie shells to Bitcoin. This note is why these 36 and not
others.

## The scope rule

An event is in only if **it is a form of money, or the institution that issues or governs
one**. That admits coinage, paper money, banks and central banks, mints, monetary standards,
currency unions, hyperinflations, payment cards and crypto.

It excludes three things the keyword sweep drags in by the dozen:

- **Trade and commerce generally.** A merchant voyage, a trade route, a spice monopoly is not
  money. `letters-exchange-banking`, `letter-of-credit-development` and
  `venetian-state-bond-prestiti` are credit and debt instruments, not currency.
- **Company foundings.** The VOC and the Amsterdam and Antwerp exchanges are firms and
  markets. `stock-exchange-amsterdam`, `antwerp-stock-exchange` and
  `new-york-stock-exchange-founded` are all out.
- **Stock-market and asset events**, unless the instrument itself is the story.
  `tulip-mania-crashes` (band 0, and painful to give up) is a bulb bubble;
  `subprime-mortgage-crisis`, `greek-debt-crisis`, `asian-financial-crisis` and
  `ftx-crypto-collapse` are markets seizing up, not currencies being issued.

Metal mining is out for the same reason — `silver-discovered-at-potosi`,
`athenian-laurion-silver-mines`, `california-gold-rush` and `gold-rush-currency-clipper` supply
the metal but are not the money. The one place the rule is stretched is a coin whose _name_
came out of a mine: the Joachimsthal thaler, below, is in because the card is about the coin.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

|  Year | Slug                              |          |     |
| ----: | --------------------------------- | -------- | --- |
| -1200 | `cowrie-shell-money-china`        | foothold | NEW |
|  -600 | `first-coins`                     | foothold |     |
|  -510 | `athenian-owl-tetradrachm`        |          |     |
|  -400 | `punch-marked-coins-india`        |          | NEW |
|  -330 | `alexander-coinage-empire`        | foothold | NEW |
|  -221 | `qin-standardization`             | foothold |     |
|  -211 | `roman-denarius-introduced`       | foothold |     |
|   270 | `roman-currency-debasement`       |          |     |
|   312 | `byzantine-solidus-introduced`    |          |     |
|   696 | `islamic-gold-dinar-minted`       |          |     |
|   960 | `chinese-paper-money`             |          |     |
|  1158 | `english-pound-sterling-origin`   |          |     |
|  1260 | `kublai-khan-paper-currency`      |          |     |
|  1284 | `venice-gold-coin-standard`       |          |     |
|  1397 | `medici-banking`                  |          |     |
|  1473 | `fugger-banking-empire`           |          |     |
|  1497 | `spanish-pieces-of-eight`         |          |     |
|  1520 | `joachimsthaler-first-struck`     |          | NEW |
|  1544 | `great-debasement-henry-viii`     |          | NEW |
|  1609 | `bank-of-amsterdam-founded`       |          |     |
|  1661 | `swedish-banknotes-issued`        |          |     |
|  1694 | `bank-of-england`                 |          |     |
|  1717 | `gold-standard-newton`            |          |     |
|  1781 | `continental-dollar-collapse`     |          |     |
|  1792 | `us-dollar-established`           |          |     |
|  1815 | `rothschild-banking-empire`       |          |     |
|  1862 | `us-greenbacks-issued`            |          | NEW |
|  1873 | `german-gold-mark-adopted`        |          | NEW |
|  1913 | `federal-reserve-created`         |          |     |
|  1923 | `weimar-hyperinflation`           | foothold |     |
|  1933 | `us-leaves-gold-standard`         |          |     |
|  1944 | `bretton-woods-conference`        |          |     |
|  1958 | `first-credit-card-bankamericard` |          |     |
|  1971 | `end-of-bretton-woods`            |          |     |
|  1999 | `euro-introduced`                 | foothold |     |
|  2009 | `bitcoin-created`                 |          |     |

Seven of these are new and **have no art yet**, so `theme:gap` and the publish validator will
read the theme as 29 cards until the image pipeline has run. Measure it the way it was
authored:

```bash
node scripts/theme-gap.js --slugs <the 36 above> --include-pending \
  --extra <staging>/money.json
```

Read the current band and spread figures from the catalogue rather than from here; a card's
band depends on how crowded its neighbourhood is, so both move whenever the catalogue does.

## Why the footholds are the footholds

`MIN_BAND_ZERO` wants five cards in the catalogue's easiest global quartile, and band 0 blends
the `difficulty` label with how _sparse_ the timeline is around the year — so "easy to place"
is not "well known". Money is a subject with almost no globally-easy cards: a tight probe of
the whole catalogue turned up only six band-0 events in scope, and two of them
(`euro-introduced` 1999 and `euro-coins-circulation` 2002) are the same event three years
apart. Assembling from what existed would have shipped a theme sitting exactly on the gate.

Four of the seven footholds are therefore **ancient**, and three of those were written for
this deck. Before ~500 CE the catalogue is thin enough that a `medium` recognition label still
lands in band 0, so the lever available was a genuinely recognisable money card in an empty
stretch of years — not a relabelled hard one:

- `cowrie-shell-money-china` (1200 BCE) opens the deck. Cowries are the single fact most people
  can name about pre-coin money, and nothing else in the deck is within 600 years of it.
- `alexander-coinage-empire` (330 BCE) rides its recognition entirely on Alexander. The
  tetradrachm is obscure; the man is not, and that is what band 0 measures.
- `qin-standardization` (221 BCE) and `roman-denarius-introduced` (211 BCE) are the two
  existing ancient footholds, and they sit 10 years apart — just outside the 8-year crowding
  advisory. That is the tightest joint in the deck and it is deliberate: dropping either costs
  a foothold that cannot be replaced.
- `first-coins` (600 BCE) is the only card in the theme labelled `easy` on its own merits.
- `weimar-hyperinflation` and `euro-introduced` are the only two modern events in scope that
  are globally easy, and they carry the whole second half.

The margin over the gate is two. Dropping a foothold is what fails validation, and there is no
spare money card to swap in — the lever, if more headroom is ever needed, is another famous
money card in an empty stretch of years.

## Deliberate omissions

**Same-year collisions.** A player cannot order two cards on one year, so exactly one of each
of these groups survives:

- 600 BCE: `first-coins` over `coins-invented` — the same Lydian moment written twice, and
  `first-coins` is labelled `easy`, which is what makes it a foothold.
- 270: `roman-currency-debasement` over `aksumite-coinage`. Losing the first African coinage
  hurts; the Roman debasement is the beat the 312 solidus answers.
- 1150: `banking-origins` and `templars-banking-network` collide with each other and sit 8
  years from the pound sterling card.
- 1300: `bimetallic-standard-attempts` and `debasement-currency-crisis`, both `very-hard` and
  both vague.
- 1397: `medici-banking` over `medici-banking-innovations`; `medici-florentine-bank` (1434) is
  the same bank a third time.
- 1933: `us-leaves-gold-standard` over `fdr-gold-confiscation` and `glass-steagall-act`.
- 1971: `end-of-bretton-woods` over `decimal-currency-uk` and `smithsonian-agreement`.

**Near-year crowding**, dropped because a spare beat existed:

- `persian-daric-gold-coin` (515) is 5 years from the Athenian owl.
- `central-bank` (1668, the Riksbank — the oldest central bank still running) is 7 years from
  the Stockholms Banco note card. The banknote is the rarer beat; the Bank of England covers
  "central bank" far more recognisably.
- `first-paper-money-colonial` (1690) is 4 years from the Bank of England. A real loss.
- `mississippi-bubble` (1720) is 3 years from Newton's gold standard. John Law's paper money is
  squarely in scope and squarely unplaceable next to 1717.
- `first-bank-united-states` (1791) is 1 year from the Coinage Act. The dollar beats the bank.
- `spanish-price-revolution` (1550) is 6 years from the Great Debasement.
- `first-savings-bank` (1810) is 5 years from Rothschild; `swiss-bank-secrecy-law` (1934) is 1
  year from the US leaving gold; `panic-of-1907` (1907) is 6 years from the Fed it caused.
- `credit-card-invented` (1950, Diners Club) is 6 years from Bretton Woods, which is why the
  card beat is carried by `first-credit-card-bankamericard` (1958) instead — the ancestor of
  Visa, and the only arrangement that leaves the deck with **zero** pairs inside 8 years.
  `first-debit-card` (1966) and `atm-invented` (1967) collide with each other and with 1971.
- `euro-coins-circulation` (2002) is 3 years from the euro's introduction, and would have been
  a second foothold. Not worth a coin-flip placement at the end of the deck.
- Zimbabwe's hyperinflation has no card, and the year it would take (2008) is 1 from Bitcoin.

**Redundancy.** `banknote` (700), `paper-money-china` (810) and `song-paper-money-system` (1024)
are three more tellings of Chinese paper money; `chinese-paper-money` (960) is the one that
actually describes the jiaozi, and it sits in the emptiest part of the run.
`florin-gold-standard` (1252) is the same beat as the Venetian ducat 32 years later and 8 years
from Kublai Khan's chao — the ducat and the chao are the pair that space properly.
`panic-of-1837` and `panic-of-1893` are a third and fourth monetary-breakdown card in a deck
that already has the Continental collapse, the Great Debasement and Weimar.

**Out of scope**, though the sweep returns them: `shekel-weight-standard`, `cheque`,
`loan-deeds`, `first-promissory-clay-tablets`, `code-hammurabi-interest-rules` and
`english-exchequer-tally` are units of account, credit instruments and tax machinery rather
than money; `tally-sticks` is dated 44,000 BCE and is a counting notch, not currency;
`barter-money-transition` (1000) is a process, not an event.

**False positives** the regex dragged in: a vending machine, Avicenna's _Canon_, madrasas and
European universities, Lalibela's rock churches, the Bank of China Tower, blood banks, the
Mississippian mound builders, Great Zimbabwe, the word "dinosaur" being coined, Mount Holyoke,
Prussian public education, a jigsaw puzzle, and Ford's five-dollar wage.

**Existing slugs rejected in favour of a new card.** None — every new event fills a hole. Two
came close: `spanish-price-revolution` was the nearest thing to the Great Debasement and
`gold-standard-newton` the nearest thing to the classical gold standard, but both are different
moments a century or more away, so they were treated as crowding, not as substitutes.

## Still missing from the catalogue

Real gaps, not filler, left unwritten because each collides with a card already in the 36 or
would push it past the clearable ceiling:

- **Diocletian's coinage reform** (294) and **Augustus' reform of the aureus** (23 BCE) — the
  two Roman monetary overhauls the deck brackets without naming. `roman-aureus-gold-coin` (40
  BCE) exists and is the closest stand-in for the second.
- **The assignat hyperinflation** (1795), which sits 3 years from the US Coinage Act. The most
  painful omission in the deck: it is a canonical hyperinflation with no card at all.
- **The Latin Monetary Union** (1865), 3 years from the greenbacks.
- **Zimbabwe's hyperinflation** (2008) and **El Salvador adopting Bitcoin** (2021).
- **Monte dei Paschi di Siena** (1472), the oldest surviving bank, 1 year from Fugger.
- **The Currency Act** (1764) and the **Maria Theresa thaler** (1741), which would fill the
  64-year hole between Newton and the Continental collapse — the deck's longest gap in a dense
  stretch of catalogue.
- **India's silver rupee closing to free coinage** (1893) and the **Bank of Japan** (1882), the
  non-Western half of the gold-standard story the German gold mark card only gestures at.
