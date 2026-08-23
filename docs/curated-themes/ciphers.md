# The Codes & Ciphers theme

A 36-card curated theme running from a Bronze Age craftsman hiding a glaze recipe to the
software that finally cracked the Zodiac Killer's cryptogram. This note is why these 36 and
not others, and — unusually — why 34 of them had to be written from scratch.

## The scope rule

An event is in only if **it makes or breaks secret writing**: ciphers, codes, steganography,
cryptanalysis, signals intelligence, modern cryptography.

Deliberately out:

- **Ordinary writing systems and their decipherment.** A dead script is not a secret one.
  Nobody encrypted hieroglyphs; they were simply forgotten. That is a different theme, and it
  owns `rosetta-stone`, `hieroglyphics-decoded`, `behistun-inscription-carved`,
  `indus-script-appears` and `rongorongo-easter-island` — all of which a cipher keyword sweep
  drags in, and none of which belong here.
- **Public signalling codes.** Morse, semaphore, optical telegraph, talking drums
  (`drum-signal-codes`) transmit in the clear. Encoding is not concealing.
- **General computing milestones with no cryptographic content.** Colossus is in because it was
  built to attack the Lorenz cipher; the web and Bitcoin are not.

The one borderline call is `voynich-manuscript-created`. It is arguably an undeciphered script
rather than a cipher — but unlike rongorongo it has been the standing target of professional
cryptanalysts (Friedman's team included) for a century, and it is in the deck as a
cryptanalysis problem, not as a writing system.

## The catalogue had almost nothing

This is the extreme case of "themes lead, the catalogue follows". A tight sweep over
`cipher|cryptograph|cryptanal|encrypt|codebreak|steganograph|enigma|bletchley|one-time pad`
returns ten hits, of which eight are legal _codes_ or dead scripts. A full-text scan for
`cipher|crypt|secret|covert|intercept|espionage` over all 5,106 playable events returns 22, and
those add only Cold War secrecy stories, not cryptology.

**Exactly three existing events survived the scope rule**, and one of those was dropped on
crowding (see omissions). So the spine was written first, in full, and then 34 of its 36 beats
were authored. The whole 20th–21st century arc — Zimmermann aside, the catalogue's newest
cipher hit was 1912 — is new.

## The 36

Paste as `eventNames` into the workflow's `theme` input.

|  Year | Slug                              |          |     |
| ----: | --------------------------------- | -------- | --- |
| -1500 | `mesopotamian-glaze-cipher`       | foothold | NEW |
|  -600 | `atbash-cipher-scribes`           | foothold | NEW |
|  -499 | `histiaeus-tattooed-message`      |          | NEW |
|  -404 | `spartan-scytale-cipher`          | foothold | NEW |
|  -350 | `aeneas-tacticus-secret-messages` |          | NEW |
|  -150 | `polybius-square-cipher`          | foothold | NEW |
|   -50 | `caesar-shift-cipher`             | foothold | NEW |
|   300 | `kamasutra-secret-writing`        | foothold | NEW |
|   850 | `al-kindi-frequency-analysis`     | foothold | NEW |
|  1420 | `voynich-manuscript-created`      |          | NEW |
|  1467 | `alberti-cipher-disk`             |          | NEW |
|  1518 | `trithemius-polygraphia`          |          | NEW |
|  1586 | `babington-plot-cipher-broken`    |          | NEW |
|  1623 | `bacon-bilateral-cipher`          |          | NEW |
|  1650 | `great-cipher-of-france`          |          | NEW |
|  1716 | `vienna-black-chamber`            |          | NEW |
|  1795 | `jefferson-wheel-cipher`          |          | NEW |
|  1812 | `great-paris-cipher-broken`       |          | NEW |
|  1854 | `playfair-cipher-invented`        |          | NEW |
|  1863 | `kasiski-vigenere-attack`         |          | NEW |
|  1883 | `kerckhoffs-principle`            |          | NEW |
|  1917 | `zimmermann-telegram`             | foothold |     |
|  1919 | `vernam-one-time-pad`             |          | NEW |
|  1923 | `enigma-machine-sold`             |          | NEW |
|  1932 | `rejewski-breaks-enigma`          |          | NEW |
|  1940 | `turing-bombe-bletchley`          | foothold | NEW |
|  1943 | `colossus-lorenz-codebreaker`     |          | NEW |
|  1949 | `shannon-perfect-secrecy`         |          | NEW |
|  1970 | `crypto-ag-rigged-machines`       |          | NEW |
|  1976 | `diffie-hellman-key-exchange`     |          | NEW |
|  1978 | `rsa-algorithm-published`         |          | NEW |
|  1984 | `quantum-key-distribution`        |          | NEW |
|  1991 | `pgp-encryption-released`         |          | NEW |
|  2001 | `aes-encryption-standard`         |          | NEW |
|  2013 | `snowden-revelations`             | foothold |     |
|  2020 | `zodiac-cipher-solved`            |          | NEW |

Read the current band and spread figures from the catalogue rather than from here — a card's
band moves whenever the catalogue does:

```bash
node scripts/theme-gap.js --slugs <the 36 above, comma-separated> \
  --include-pending --extra <staging>/ciphers.json
```

At authoring time: size 36, bins 8/8 `[5 4 1 5 3 5 6 7]`, band 0 = 10, same-year pairs 0.

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how _sparse_ the timeline is around the year, so on
this catalogue an `easy` label lands in band 0 at any year at all, while a `medium` label only
does so before roughly 500 CE and in a few thin medieval stretches. That fact decided the shape
of the deck's opening.

Only four cards in the whole theme are honestly `easy` on recognition — Caesar's cipher, the
Bletchley bombe, and the two existing catalogue cards (`zimmermann-telegram`,
`snowden-revelations`). Four footholds is under the gate. The other six come from the ancient
half, where a `medium` label is enough:

- `mesopotamian-glaze-cipher` (-1500), `atbash-cipher-scribes` (-600),
  `spartan-scytale-cipher` (-404), `polybius-square-cipher` (-150),
  `kamasutra-secret-writing` (300) and `al-kindi-frequency-analysis` (850) all sit in stretches
  the catalogue barely occupies. None is famous; all are easy _to place_, which is the only
  property the opening hand cares about.
- Their `medium` grades are earned on **inferability**, not recognition, per the v3 rubric: each
  description carries a hard era anchor — cuneiform, Hebrew scribes, Sparta, a Greek historian,
  the Kama Sutra, the Baghdad House of Wisdom. A player who has never heard of Polybius still
  knows the card is classical.

The theme is therefore **not** short of footholds — it has 10 against a floor of 5, and the
margin is real rather than graded into existence. The lever if it ever shrinks is another
ancient or early-medieval cipher card, not a relabelled modern one: relabelling
`rsa-algorithm-published` as `easy` would move it to band 0 but would be a lie, and the modern
half of the timeline is so crowded that only `easy` gets there.

## Deliberate omissions

Everything below is a genuine beat of the subject that was left out on purpose.

**Same-year collisions.** A player cannot order two cards sharing a year.

- **Vigenère's `Traicté des chiffres` (1586)** collides with `babington-plot-cipher-broken`. The
  Mary Stuart break is the better card — famous names, a real consequence — and the Vigenère
  cipher is still in the deck twice over: `trithemius-polygraphia` is the tabula recta it is
  built on, and `kasiski-vigenere-attack` is its death.
- **Babbage breaks the Vigenère (1854)** collides with `playfair-cipher-invented`. Kasiski
  published; Babbage did not, so the 1863 card is the one history hangs the method on.
- **Purple broken (1940)** collides with `turing-bombe-bletchley`, which is both more famous and
  a foothold. Purple is the largest single omission in the deck.
- **Venona begins (1943)** collides with `colossus-lorenz-codebreaker`; its first decrypts
  (1946) then sit 3 years from `shannon-perfect-secrecy`. Cut for crowding, reluctantly — it is
  the best real-world story about one-time pad reuse.

**Near-year crowding.** Dropped because the placement would be luck:

- `room-40-admiralty` (1914), 3 years from `zimmermann-telegram` — which Room 40 decrypted
  anyway, so the moment is represented.
- Scherbius's Enigma patent (1918) sits between Zimmermann and Vernam; the card kept is the
  commercial machine going on sale, which is the same invention placed 5 years clear.
- Yardley's Black Chamber closed (1929), 3 years from `rejewski-breaks-enigma`.
- Navajo code talkers (1942), between the bombe and Colossus.
- Winterbotham revealing Ultra (1974), between Crypto AG and Diffie-Hellman.
- **DES adopted (1977)** falls exactly between `diffie-hellman-key-exchange` and
  `rsa-algorithm-published`. Public-key is the more consequential pair, and three cards in three
  years is unplayable.
- Shor's algorithm (1994), 3 years from `pgp-encryption-released`; `quantum-key-distribution`
  carries the quantum thread instead.
- al-Qalqashandi's cipher tables (1412), 8 years from `voynich-manuscript-created`.
- Bellaso's keyed cipher (1553), between Trithemius and the Babington plot. Its idea survives in
  the Trithemius and Kasiski cards.
- Cardano's grille (1550), same stretch; steganography is covered by Histiaeus and Bacon.
- `birth-alan-turing` (1912) — an **existing** catalogue slug, rejected. It sits 5 years from
  Zimmermann, and Turing is already on the board as the bombe card, which is the thing he did
  rather than the day he was born.

**Existing slugs rejected on scope, not quality.** The keyword sweep hands back a pile of
decipherment and law: `rosetta-stone`, `hieroglyphics-decoded`, `behistun-inscription-carved`,
`indus-script-appears`, `rongorongo-easter-island` (dead scripts, not secret ones);
`inheritance-law`, `marine-law`, `suleiman-kanuni-legal`, `great-yassa-code` and the dozen other
legal _codes_; `morse-code-invented` and friends, `drum-signal-codes`, `flag-signal-development`,
`optical-telegraph-system` (clear-text signalling); `bitcoin-created`, `ftx-crypto-collapse`
("crypto", different noun); `cia-created`, `u2-incident`, `sykes-picot-agreement`,
`pentagon-papers-ruling` (secrecy, not secret writing). Of the ~5,100 playable events, only
`zimmermann-telegram` and `snowden-revelations` made the deck.

**Accepted crowding.** Two pairs two years apart survive because both members are canonical and
there is no honest way to move either: `zimmermann-telegram` (1917) with `vernam-one-time-pad`
(1919), and `diffie-hellman-key-exchange` (1976) with `rsa-algorithm-published` (1978). A deck
without the one-time pad or without RSA would fail the subject in a way a coin-flip placement
does not.

## Still missing from the catalogue

Real gaps, not filler, if the theme is ever widened past 36 — most of them collide with a card
already in the deck, which is why they were not written: Purple and the Magic decrypts (1940),
Venona (1943/1946), Room 40 and ADFGVX with Painvin's break (1918), the American Black Chamber
(1929), the Navajo code talkers (1942), the U-110 naval Enigma capture (1941), the NSA's
founding (1952), Poe's _The Gold-Bug_ popularising cryptograms (1843), Bazeries finally reading
the Great Cipher (1893), the Clipper chip and the crypto wars (1993), Shor's algorithm (1994),
the Copiale cipher (2011) and the public exposure of Operation Rubicon (2020).
