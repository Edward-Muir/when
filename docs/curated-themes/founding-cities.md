# The Capitals Founded theme

A 35-card curated theme on the founding of cities that are national capitals today, from
Jerusalem's Jebusite hill fort to Nigeria's purpose-built move to Abuja. This note is why
these 35 and not the 45 beats on the original spine.

## The scope rule

An event is in only if **it is the founding of a city that is a national capital today** —
the traditional or attested founding, or the moment a purpose-built capital was established.

- **Attested foundings** (a specific person, year and act on the record): Baghdad, Dublin,
  Madrid, Thang Long/Hanoi, Bern, Dadu/Beijing, Hanseong/Seoul, Edo/Tokyo, Lima, Bogota,
  Santiago, Helsinki, Manila, Buenos Aires, Batavia/Jakarta, Bangkok, Bytown/Ottawa,
  Wellington, Kuala Lumpur, Addis Ababa, Nairobi, and the purpose-built modern capitals
  (Washington, New Delhi, Canberra, Brasilia, Abuja).
- **Traditional foundings** (legend or a first chronicle mention, not an eyewitness record):
  Jerusalem (King David), Rome (Romulus), Iceland/Reykjavik (Ingolfur Arnarson), Moscow (first
  chronicled).
- **The literal founding by merger**: Budapest, formed when Buda, Pest and Obuda were joined
  under one administration in 1873. It is the one beat in the theme that is not a settlement
  act at all, but the scope rule says "founded" and a legal unification is exactly that.

Two edges were argued rather than assumed:

- **`fatimids-conquer-egypt`** stands in for the founding of Cairo. Its `friendly_name` is
  about the conquest of Egypt, but its description explicitly credits the Fatimid general
  Jawhar with founding Cairo in 969 — the same year, the same act the spine names. Writing a
  second, near-identical 969 card for "Cairo Founded" would have been a duplicate in
  substance if not in slug, so this reuses the existing card rather than doubling up.
- **`vikings-iceland`** stands in for Reykjavik specifically. The card is worded as the
  general Norse settlement of Iceland (874), not the founding of Reykjavik by name, but
  Ingolfur Arnarson's landing — the event the card is dated to — is the same act tradition
  credits as both. No dedicated Reykjavik card exists in the catalogue.

Cut for failing the rule, or for being too indirect a reading of it: Vienna (only a Roman
military camp is attested at the spine's date, with an obscure fame and low confidence — no
citation strong enough to author on), Vilnius (a founding dream-legend with weak sourcing),
Ulaanbaatar/Orgoo (a mobile monastic camp with no fixed founding act), Astana/Akmola and
Islamabad — see "Deliberate omissions" below for why those two survived the scope test but
were cut anyway.

## The 35

|  Year | Slug                                  |                |
| ----: | ------------------------------------- | -------------- |
| -1000 | `david-establishes-jerusalem-capital` | foothold       |
|  -753 | `rome-founded`                        | foothold       |
|  -250 | `paris-parisii-settlement`            | foothold · NEW |
|    47 | `romans-found-londinium`              | foothold · NEW |
|   762 | `baghdad-founded`                     | foothold       |
|   841 | `viking-dublin-settlement`            | foothold       |
|   865 | `muhammad-i-founds-madrid-fortress`   | NEW            |
|   874 | `vikings-iceland`                     | foothold       |
|   969 | `fatimids-conquer-egypt`              |                |
|  1010 | `ly-thai-to-founds-thang-long`        | NEW            |
|  1147 | `moscow-first-chronicled`             | NEW            |
|  1191 | `berthold-v-founds-bern`              | NEW            |
|  1267 | `kublai-khan-builds-dadu`             | NEW            |
|  1325 | `aztec-tenochtitlan-founding`         | foothold       |
|  1394 | `taejo-founds-hanseong`               | NEW            |
|  1457 | `ota-dokan-builds-edo-castle`         | NEW            |
|  1535 | `pizarro-founds-lima`                 | NEW            |
|  1538 | `quesada-founds-bogota`               | NEW            |
|  1541 | `valdivia-founds-santiago`            | NEW            |
|  1550 | `gustav-vasa-founds-helsinki`         | NEW            |
|  1571 | `legazpi-founds-manila`               | NEW            |
|  1580 | `garay-refounds-buenos-aires`         | NEW            |
|  1619 | `batavia-founded`                     |                |
|  1782 | `rama-i-founds-bangkok`               | NEW            |
|  1790 | `dc-established`                      |                |
|  1826 | `john-by-founds-bytown`               | NEW            |
|  1840 | `settlers-found-wellington`           | NEW            |
|  1857 | `miners-found-kuala-lumpur`           | NEW            |
|  1873 | `buda-pest-obuda-unite-budapest`      | NEW            |
|  1886 | `menelik-founds-addis-ababa`          | NEW            |
|  1899 | `railway-depot-becomes-nairobi`       | NEW            |
|  1911 | `george-v-announces-new-delhi`        | foothold · NEW |
|  1913 | `foundation-stone-laid-canberra`      | foothold · NEW |
|  1960 | `brasilia-built`                      |                |
|  1991 | `abuja-becomes-nigeria-capital`       | NEW            |

25 of the 35 are new. Measured against the merged catalogue: size **35**, band 0 **10**, bins **8/8** (advisory), same-year pairs **0**.

25 of the 35 are new. At authoring time, with the new cards loaded via `--include-pending
--extra`:

```
Gates:
  PASS  size 35                (want 30-36)
  INFO  bins 8/8               (advisory, 6+ is spread)
  PASS  band 0 10              (want 5+)
  PASS  same-year pairs 0      (want 0)
```

## Why the footholds are the footholds

Ten cards land in band 0, twice the floor, and the mix is deliberate rather than lucky:

- `rome-founded`, `david-establishes-jerusalem-capital`, `romans-found-londinium` and
  `paris-parisii-settlement` sit in the emptiest stretch of the catalogue's BCE/1st-century
  run, so a player who has no idea whether Rome predates Paris by 250 or 500 years still
  places both correctly — nothing else nearby competes for the slot. `baghdad-founded` and
  `viking-dublin-settlement` extend that run into the early medieval gap.
- `vikings-iceland` and `aztec-tenochtitlan-founding` are footholds for the opposite reason —
  they are `easy`-labelled, widely taught facts (Norse Iceland, the Aztec capital's island
  site) that would be footholds in any deck.
- `george-v-announces-new-delhi` and `foundation-stone-laid-canberra` are the two modern
  footholds. Despite sitting only two years apart, both are famous enough — the Delhi Durbar
  and Australia's purpose-built capital are commonly known facts — that the difficulty label
  survives the crowding penalty and both still clear band 0.

Everything from 865 to 1899 is band 1-3: a run of specific, dated conquistador and colonial
foundings that are attested but not widely memorized, which is exactly what a deck about
city-founding acts (rather than the cities themselves) should look like.

## Deliberate crowding, kept on purpose

Three clusters sit under the 8-year advisory threshold. All three are kept because the dates
are fixed historical facts and each beat is independently a named national capital:

- **`pizarro-founds-lima` (1535) / `quesada-founds-bogota` (1538) / `valdivia-founds-santiago`
  (1541)** — three separate conquistadors founding three separate capitals within six years of
  each other, which is simply when that wave of conquest happened. Splitting any one out would
  lose a national capital from the deck for no scope reason.
- **`george-v-announces-new-delhi` (1911) / `foundation-stone-laid-canberra` (1913)** — both
  are the two clearest "purpose-built capital" beats in the whole spine (British India and
  the newly federated Australia both deciding, within two years of each other, to build a
  capital from nothing) and both are band-0 footholds. Dropping either would be a bigger loss
  than the crowding.

## Deliberate omissions

- **Reused rather than duplicated.** `fatimids-conquer-egypt` (969) covers the founding of
  Cairo — see "The scope rule" above — and `vikings-iceland` (874) covers Reykjavik. Writing
  new "Cairo Founded" or "Reykjavik Founded" cards at the same years would have been
  near-duplicates of what the catalogue already has.
- **Astana/Akmola (1830) and Islamabad (1961), cut for crowding against a kept card, not for
  scope.** Both are genuine in-scope foundings (a Cossack fortress that became Kazakhstan's
  capital; a planned city that replaced Karachi as Pakistan's), but Akmola sits 4 years from
  `john-by-founds-bytown` and Islamabad sits exactly 1 year from `brasilia-built` — the
  single tightest gap in the whole spine. With 45 candidate beats and a 36-card ceiling,
  these were the ones cut to relieve crowding rather than the more famous or more isolated
  neighbor.
- **Vilnius (1323), one year from `aztec-tenochtitlan-founding` (1325) and also the spine's
  lowest-confidence beat** (a founding legend involving a dream about an iron wolf, thinly
  sourced). Cut on both grounds together.
- **Pretoria (1855), one year from `miners-found-kuala-lumpur` (1857) and a murkier scope
  case besides** — South Africa has three seats of government (Pretoria administrative, Cape
  Town legislative, Bloemfontein judicial), with no single constitutional capital, unlike
  every other beat in the deck. Kuala Lumpur is the cleaner claim to "the" capital and was
  kept.
- **Copenhagen (1167), Stockholm (1252), Berlin (1237) and Naypyidaw (2005) were cut for
  size, not scope.** All four are legitimate in-scope beats (medium-confidence attested
  foundings, or in Naypyidaw's case a well-documented but historically thin 2005 relocation)
  cut only because the deck was already over the 36-card ceiling once every high-confidence
  beat was kept; these were the lowest-confidence or least isolated of what remained.
- **Vienna and Ulaanbaatar/Orgoo dropped for weak sourcing**, not cut for size. The spine
  itself flagged both `low`/`medium` confidence, and a general search did not turn up a
  citable founding act precise enough to write a factual 80-150 character description
  against — a Roman camp with no attested founding year for Vienna, and a mobile monastic
  camp with no fixed site or date for early Ulaanbaatar. Neither was verified further; both
  are candidates for a future pass if better sourcing turns up.

## Still missing from the catalogue

Real gaps, not filler:

- **Vienna's Roman-camp origin and early Ulaanbaatar's monastic camp** — both need a
  better-sourced founding act before either can be written; see above.
- **Vilnius, Astana/Akmola, Islamabad, Copenhagen, Stockholm, Berlin, Naypyidaw and
  Pretoria** — all eight are real, defensible capital-founding beats that simply lost out to
  crowding or the 36-card ceiling, not to the scope rule. Any of them is a reasonable future
  swap if a kept card is ever dropped.
