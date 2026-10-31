# The Big Thinkers theme

A 30-card curated theme on philosophy's defining works and teachings, from Confucius's
disciples to Rawls's veil of ignorance, one beat per thinker and spread across China, India, the
Islamic world and Europe. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a defining work or teaching of a great philosopher.**

- **One beat per thinker**, dated to the work or teaching they are remembered for: Plato is the
  Republic, not the Academy; Descartes is the Discourse, not his geometry.
- **The boundary**: Big Thinkers owns philosophy. Scientific discoveries go to Eureka Moments, so
  Bacon's Novum Organum (a method of science) was a natural cut, and the founding of religions
  goes to Faith Founded, which is why Nagarjuna is here as a philosopher of the Middle Way and
  not as a founder of a Buddhist school.

Edges argued rather than assumed:

- **`trial-of-socrates`** is in, although it is a trial and not a work: Socrates wrote nothing,
  and the trial is where his teaching is fixed in the record.
- **`gandhi-hind-swaraj`** is in as political philosophy (self-rule through nonviolence), the
  same shape as Mill and Rawls, not as an event of the independence movement.
- **`wang-yangming-great-awakening`** is a teaching, not a book: his Longchang enlightenment is
  the moment the school of mind begins.
- **Three cards reused at the catalogue's years, not the spine's.** `plato-writes-republic`
  (-380, spine -375), `marcus-aurelius-meditations` (170, spine 180) and `machiavelli-prince`
  (1513 written, spine 1532 printed) are the same events under a different dating convention,
  and writing new twins would have put duplicate events in the catalogue.

Cut from the 42-beat spine: Zeno (crowding Epicurus and Laozi), Lucretius, Ibn Khaldun, Bentham,
Schopenhauer, Kierkegaard and Heidegger (lowest fame), Boethius and Maimonides (balance in the
medieval stretch), and Bacon, Spinoza and Locke (the densest decades of the 1600s).

## The 30

| Year | Slug                                     |                |
| ---: | ---------------------------------------- | -------------- |
| -479 | `confucius-analects-compiled`            | foothold · NEW |
| -399 | `trial-of-socrates`                      | foothold       |
| -380 | `plato-writes-republic`                  | foothold       |
| -335 | `aristotle-peripatetic-school`           | foothold       |
| -306 | `epicurus-founds-garden-school`          | NEW            |
| -300 | `laozi-tao-te-ching`                     | foothold · NEW |
|  150 | `nagarjuna-middle-way-verses`            | NEW            |
|  170 | `marcus-aurelius-meditations`            | foothold       |
|  400 | `augustine-confessions-written`          | NEW            |
| 1027 | `avicenna-book-of-healing`               | NEW            |
| 1095 | `al-ghazali-philosophy`                  |                |
| 1265 | `aquinas-summa`                          |                |
| 1508 | `wang-yangming-great-awakening`          | NEW            |
| 1513 | `machiavelli-prince`                     | foothold       |
| 1580 | `montaigne-essays`                       |                |
| 1637 | `descartes-discourse-method`             | foothold       |
| 1651 | `hobbes-leviathan`                       |                |
| 1739 | `hume-treatise-human-nature`             | NEW            |
| 1762 | `rousseaus-social-contract`              |                |
| 1781 | `kant-critique-pure-reason`              | foothold       |
| 1792 | `wollstonecraft-vindication-rights-woman` | NEW           |
| 1807 | `hegel-phenomenology-of-spirit`          | NEW            |
| 1848 | `communist-manifesto`                    | foothold       |
| 1859 | `mill-on-liberty`                        | NEW            |
| 1883 | `nietzsche-thus-spoke-zarathustra`       | foothold · NEW |
| 1909 | `gandhi-hind-swaraj`                     | NEW            |
| 1921 | `wittgenstein-tractatus`                 | NEW            |
| 1943 | `sartre-being-and-nothingness`           | NEW            |
| 1949 | `beauvoir-second-sex`                    | NEW            |
| 1971 | `rawls-theory-of-justice`                | NEW            |

13 reused, 17 written for this theme. The footholds are the spine's fame-3 beats.

Gates: size **30**, band 0 **20**, bins **7/8** (advisory), same-year pairs **0**, bunching
**2** in any 10 years, largest overlap **1** (`schools`, via `aristotle-peripatetic-school`). Band
0 is high: the blind grade moved 12 of the new cards to easy. A card's band moves whenever the
catalogue around its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Known crowding kept on purpose

- **-306 / -300** (`epicurus-founds-garden-school` → `laozi-tao-te-ching`): different
  civilisations, and Laozi's date is a scholarly estimate in any case.
- **1508 / 1513** (`wang-yangming-great-awakening` → `machiavelli-prince`): Ming China and
  Florence, the deck's only East-West pairing of the Renaissance.
- **1943 / 1949** (`sartre-being-and-nothingness` → `beauvoir-second-sex`): the two halves of
  postwar Paris existentialism.

## Fact-check flags still open

- **`confucius-analects-compiled`** (-479): the year is Confucius's death, the traditional
  anchor. No source dates the compilation itself, which ran across the Warring States into the
  Han.
- **`avicenna-book-of-healing`** (1027): sources give completion around 1020 and 1027 as the
  publication date, while the description says "completed".
