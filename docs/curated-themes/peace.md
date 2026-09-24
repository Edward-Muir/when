# The Peace at Last theme

A 35-card curated theme on the documents that ended wars: treaties, armistices and peace
settlements, from the oldest surviving peace treaty on record to a 1990s accord that stopped a
civil war. This note is why these 35 and not others.

## The scope rule

An event is in only if **it is a treaty, armistice or peace settlement that ended a named war**.

That is a narrow gate on purpose. It excludes the battles, sieges and campaigns of the wars
themselves (already well covered elsewhere in the catalogue), the alliances and ententes that
led _into_ a war (Triple Entente, Union of Utrecht), and settlements that merely redrew a
border or transferred territory without closing a state of war (the 1479 Treaty of Alcáçovas,
which divided Atlantic claims between Spain and Portugal outside any war). It also excludes
peace _processes_ that are not themselves the closing document (the Camp David Accords are the
1978 framework; the Egypt-Israel Peace Treaty of 1979 is the instrument that actually ended the
state of war, and only the latter is in the deck).

Two edges were argued rather than assumed:

- **`peace-of-callias`** is in, on the spine's own reading, even though its very existence is
  debated by historians — no copy survives and the earliest reference is a century later. It is
  admitted because ancient historiography treats it as the traditional close of the
  Greco-Persian Wars, and the card is written to say so ("reportedly", "scholars still
  dispute") rather than assert it as settled fact.
- **`treaty-of-amiens`** (in the catalogue as `peace-of-amiens`) is in even though the peace it
  made lasted about a year before war resumed. The same logic that keeps the Peace of Nicias
  and the Treaty of Brétigny in this deck despite their wars restarting applies here: the
  document is a genuine peace settlement for the war it names, and durability isn't the test.

## The 35

|  Year | Slug                          |          |
| ----: | ----------------------------- | -------- |
| -1259 | `first-peace-treaty`          | foothold |
|  -449 | `peace-of-callias`            | NEW      |
|  -421 | `peace-of-nicias`             | NEW      |
|  -188 | `first-treaty`                | foothold |
|   878 | `treaty-wedmore`              | foothold |
|  1183 | `peace-of-constance`          | NEW      |
|  1360 | `treaty-of-bretigny`          |          |
|  1454 | `peace-of-lodi`               | NEW      |
|  1475 | `treaty-of-picquigny`         | NEW      |
|  1526 | `treaty-madrid`               |          |
|  1555 | `peace-augsburg`              |          |
|  1559 | `peace-cateau-cambresis`      |          |
|  1648 | `peace-westphalia`            |          |
|  1667 | `treaty-breda`                |          |
|  1713 | `treaty-utrecht`              |          |
|  1748 | `treaty-aix-la-chapelle`      |          |
|  1763 | `treaty-paris-seven-years`    |          |
|  1783 | `treaty-paris-1783`           | foothold |
|  1802 | `peace-of-amiens`             |          |
|  1814 | `treaty-of-ghent`             |          |
|  1815 | `second-treaty-of-paris`      | NEW      |
|  1842 | `treaty-nanking`              | foothold |
|  1848 | `treaty-of-guadalupe-hidalgo` | NEW      |
|  1856 | `treaty-of-paris-crimean-war` | NEW      |
|  1866 | `peace-of-prague`             | NEW      |
|  1871 | `treaty-of-frankfurt`         |          |
|  1895 | `treaty-of-shimonoseki`       |          |
|  1918 | `wwi-end`                     | foothold |
|  1919 | `treaty-versailles`           | foothold |
|  1945 | `wwii-end`                    | foothold |
|  1953 | `korean-war-armistice`        |          |
|  1954 | `geneva-accords-indochina`    | NEW      |
|  1973 | `paris-peace-accords-1973`    |          |
|  1979 | `egypt-israel-peace`          |          |
|  1995 | `dayton-accords`              |          |

10 of the 35 are new. Measured against the merged catalogue: size **35**, band 0 **8**, bins **8/8** (advisory), same-year pairs **0**.

10 of the 35 are new; the other 25 were already in the catalogue, exactly as the spine's own
note expected ("the catalogue likely has many treaties"). At authoring time, with the new
cards loaded via `--include-pending --extra`:

```
size 35, bins 8/8, band 0 8, same-year pairs 0
```

## Why the footholds are the footholds

Band 0 blends the `difficulty` label with how sparse the timeline is around a year, so this
theme's 8 footholds split cleanly into two groups:

- **Ancient sparsity**: `first-peace-treaty` (1259 BCE), `peace-of-nicias` (421 BCE) and
  `first-treaty` (188 BCE) land in band 0 partly because almost nothing else in the catalogue
  sits near them, the same effect the Clockwork theme leaned on for its ancient devices.
- **Genuine fame**: `treaty-paris-1783`, `treaty-nanking`, `wwi-end`, `treaty-versailles` and
  `wwii-end` are band 0 because they are graded `easy` and are five of the handful of peace
  treaties most players could place within a decade without help — American independence, the
  end of the two World Wars and the treaty that ceded Hong Kong are common knowledge in a way
  the Peace of Prague or the Peace of Lodi are not.

The margin (8 against a floor of 5) covers the deck's real weak spot: everything between 1183
and 1954 outside the six footholds above sits in band 1-3, because treaty-signing is
intrinsically a "known to enthusiasts" kind of fact even when the war itself is famous.

## Deliberate omissions

- **Out of scope.** `camp-david-accords` (1978) is the framework, not the peace treaty;
  `egypt-israel-peace` (1979) is the treaty and is the one in the deck. `treaty-alcacovas`
  (1479) divides Atlantic claims but closes no named war, so it stays out despite sitting
  right next to `treaty-of-picquigny` on the timeline. `union-utrecht` (1579) and
  `triple-entente` (1907) are alliances forming, the opposite of a war ending.
- **Spine beats cut to hit the size band.** The spine listed 45 beats; 10 were dropped to land
  at 35 rather than crowd the deck past the useful range:
  - `the-king-s-peace` (387 BCE, Corinthian War) — genuinely in scope but the most obscure of
    three closely spaced ancient Greek peace beats; Callias and Nicias carry the era.
  - `peace-of-vervins` (1598, Franco-Spanish War) and `treaty-of-karlowitz` (1699, Great
    Turkish War) — both in scope, cut as the two least load-bearing cards in an already dense
    1526-1713 run of six treaties.
  - `treaty-of-san-stefano` (1878, Russo-Turkish War) — in scope but immediately revised by
    the Congress of Berlin months later, and the 1842-1895 stretch already carries six other
    treaties.
  - `peace-of-vereeniging` (1902, Second Boer War) and `treaty-of-portsmouth` (1905,
    Russo-Japanese War) — both obscure and both would have needed new cards for no gain in
    footholds or spread.
  - `treaty-of-lausanne` (1923, Turkish War of Independence) — obscure, and the 1918-1954 run
    already carries six treaties including two World War closings.
  - `treaty-of-san-francisco` (1951) — the _legal_ end of the WWII state of war, six years
    after `wwii-end` already covers the war's actual close; keeping both reads as the same
    beat twice.
  - `geneva-accords-1988` (Soviet-Afghan War) — in scope, cut as the least essential of three
    late-Cold-War-to-1990s treaties once `geneva-accords-indochina`, `paris-peace-accords-1973`
    and `dayton-accords` were already carrying that stretch.
  - `sudan-comprehensive-peace-agreement` (2005, Second Sudanese Civil War) — genuinely in
    scope, and the newest possible card, but obscure and the deck was already at 35 without it.

## Known crowding kept on purpose

Seven pairs sit within 8 years of each other; all are kept because each side is a distinct
named war closing on its own document, not the same beat twice:

- `peace-augsburg` (1555) / `peace-cateau-cambresis` (1559) — the Schmalkaldic War and the
  Italian Wars, unrelated conflicts that happen to close four years apart.
- `treaty-of-ghent` (1814) / `second-treaty-of-paris` (1815) — the War of 1812 and the
  Napoleonic Wars, genuinely different wars whose endings fall a year apart because both
  belong to the same Napoleonic-era wave of settlements.
- `treaty-nanking` (1842) / `treaty-of-guadalupe-hidalgo` (1848) — the First Opium War and the
  Mexican-American War, no relation beyond the decade.
- `peace-of-prague` / `treaty-of-frankfurt` (1871) — the Austro-Prussian and
  Franco-Prussian Wars, the two wars of German unification, five years apart because that is
  how close together Prussia actually fought them.
- `wwi-end` (1918) / `treaty-versailles` (1919) — the armistice and the formal peace for the
  same war, a year apart by design: the spine wants both the day the guns stopped and the
  treaty that made it official, exactly as it does again for WWII (`wwii-end`, 1945, stands
  alone here only because `treaty-of-san-francisco` was cut above).
- `korean-war-armistice` (1953) / `geneva-accords-indochina` (1954) — Korea and the First
  Indochina War, unrelated wars a year apart.
- `paris-peace-accords-1973` / `egypt-israel-peace` (1979) — Vietnam and the Arab-Israeli
  wars, six years apart.

None of these can be resolved by moving a date (all are attested to a specific year) or by
dropping a side without losing a named war from the deck, so they are accepted as the honest
shape of 20th-century diplomacy, which produces peace treaties in clusters.

## Still missing from the catalogue

Real gaps, not written because they collide with a card already in the 35 or because the
spine itself judged them dispensable (see omissions above): the Peace of Vervins, the Treaty
of Karlowitz, the Treaty of San Stefano, the Peace of Vereeniging, the Treaty of Portsmouth,
the Treaty of Lausanne, the Treaty of San Francisco, the 1988 Geneva Accords on Afghanistan,
and the Sudan Comprehensive Peace Agreement — nine genuinely in-scope treaties that a future
edit could add if this theme is ever widened past 35.
