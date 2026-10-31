# The Silicon Dreams theme

A 30-card curated theme on the machines of computing, from the punched-card tabulator that
counted the 1890 census to a quantum chip of 2024: valves, transistors, chips, mainframes,
home computers and supercomputers. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a computer, a chip or other computing hardware**: a machine or
a component being built, first run, launched or shown to reach a milestone.

The boundary with the neighbouring themes:

- **Mechanical calculators** go to Automata, which is why the deck starts with Hollerith's
  electric tabulator and leaves Babbage and the arithmometer alone.
- **Wartime codebreaking machines** go to Codes & Ciphers. Colossus and the Bombe are not here;
  the Z3 and ENIAC are, because neither was built to break a cipher.
- **Software** goes to Hello, World. Compilers, operating systems and the web stay out, and a
  milestone is in only when the machine is the story.
- **Pocket devices** go to In Your Pocket. The iPad was dropped from the spine for this, and no
  phone, calculator or handheld console is in.

Two edges were argued rather than assumed:

- **`deep-blue-beats-kasparov`** and **`ibm-watson-jeopardy`** are in as machines. Each is a
  purpose-built IBM system whose public test was a game; the cards are about the computer, not
  the chess or the quiz. Deep Blue is the deck's one card shared with earlier themes (Automata
  and Games).
- **`de-forest-triode-audion`** and **`eccles-jordan-flip-flop`** are components, not
  computers. They are in as the parts every electronic computer was later built from, and they
  give the deck its only cards between 1890 and 1931. Both carry the patent-filing year (1906,
  1918) rather than the grant (1908) or the paper (1919).

Cut from the spine for bunching or fame: TRADIC (1954), the PDP-1 (1960), the PDP-8 (1965), the
Xerox Alto (1973, though `xerox-alto-gui` exists in the catalogue), the Cray-1 (1976, which put
five cards in 1975-1984), the Intel 486 (1989), the Pentium (1993), the AMD Opteron (2003) and
Google's TPU (2016).

## The 30

| Year | Slug                                |                |
| ---: | ----------------------------------- | -------------- |
| 1890 | `hollerith-tabulator-census`        | NEW            |
| 1906 | `de-forest-triode-audion`           | NEW            |
| 1918 | `eccles-jordan-flip-flop`           | NEW            |
| 1931 | `bush-differential-analyzer`        | NEW            |
| 1938 | `programmable-computer-z1`          |                |
| 1941 | `zuse-z3-computer`                  | NEW            |
| 1946 | `first-eniac-computer`              |                |
| 1947 | `transistor-invented`               | foothold       |
| 1948 | `manchester-baby-runs-program`      | NEW            |
| 1951 | `univac-i-delivered`                | NEW            |
| 1956 | `hard-disk-drive`                   |                |
| 1958 | `kilby-first-integrated-circuit`    | NEW            |
| 1964 | `ibm-system-360-announced`          | NEW            |
| 1971 | `microprocessor-invented`           |                |
| 1975 | `personal-computer`                 | foothold       |
| 1977 | `apple-ii-released`                 | foothold · NEW |
| 1981 | `ibm-pc-launched`                   | foothold · NEW |
| 1984 | `apple-macintosh-1984`              |                |
| 1985 | `arm1-processor-first-runs`         | NEW            |
| 1997 | `deep-blue-beats-kasparov`          |                |
| 1998 | `imac-launched`                     | foothold · NEW |
| 1999 | `nvidia-geforce-256-gpu`            | NEW            |
| 2001 | `ibm-quantum-factors-15`            | NEW            |
| 2008 | `roadrunner-petaflop-supercomputer` | NEW            |
| 2011 | `ibm-watson-jeopardy`               | foothold · NEW |
| 2012 | `raspberry-pi-released`             | NEW            |
| 2019 | `quantum-computing-supremacy`       |                |
| 2020 | `apple-m1-chip`                     | NEW            |
| 2022 | `frontier-exascale-supercomputer`   | NEW            |
| 2024 | `google-willow-quantum-chip`        | NEW            |

21 of the 30 were authored for this theme. The nine reused cards are the Z1, ENIAC, the
transistor, the hard disk, the microprocessor, the Altair (`personal-computer`), the Macintosh,
Deep Blue and Google's 2019 quantum supremacy claim. The footholds are the reconciler's picks
for fame. theme-gap scores band 0 separately, from the difficulty label and how crowded the
timeline is.

Gates: size **30**, band 0 **14**, bins **3/8** (advisory), same-year pairs **0**, bunching **4
in 1938-1947**, shared **1** with any earlier theme (Automata, Games). Re-measure rather than
trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap silicon-dreams
```

## Dates the fact check could not support

None. The fact check passed all 21 new cards. The iMac (1998) and Watson (2011) rest on the
checker's own knowledge and the spine's sources rather than a search result.

## Known crowding kept on purpose

The subject only exists for about 130 years, so the deck is dense by nature: bins sit at 3/8,
and 25 neighbouring pairs fall inside theme-gap's 8-year advisory. Two clusters are kept:

- **1946 / 1947 / 1948** (ENIAC, the transistor, the Manchester Baby): the electronic computer,
  the part that would replace its valves, and the first stored program, in three straight
  years. That is the real shape of the history, and the transistor is a foothold.
- **2019 / 2020 / 2022 / 2024** (quantum supremacy, the M1, Frontier, Willow): three kinds of
  machine, quantum, consumer and supercomputer, so a player can order them by what they know
  of each line rather than by memory of the year.
