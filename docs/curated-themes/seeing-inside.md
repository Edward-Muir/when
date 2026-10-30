# The Seeing Inside theme

A 30-card curated theme on the ways doctors have looked inside, listened to and tested the
living body, from an Egyptian papyrus's examination routine to mass swab testing. This note
explains why these 30 and not others.

## The scope rule

An event is in only if **it is a way of looking inside or testing the body.**

- **Examination by the senses**: reading the pulse, tapping the chest, listening through a tube,
  scoring a newborn. These come first in the deck because, for most of history, the senses were
  the only instrument.
- **Instruments and scans**: the thermometer, the endoscope in each of its forms, the blood
  pressure cuff, the ECG and EEG, ultrasound, CT, MRI and fMRI.
- **Tests on the body's fluids and cells**: blood groups, the TB germ under the microscope, the
  smear test, the HIV test, the home pregnancy test and mass virus testing.

Four neighbours own the edges:

- **Eureka Moments** owns the discovery of X-rays, so the deck has no Röntgen card. The scans
  that X-rays made possible (Forssmann's catheter, CT) are in, because they are ways of looking.
- **Under the Knife** owns operations. The deck shares two cards with it,
  `edwin-smith-surgical-papyrus` and `blood-types-discovered`, which is within the limit of 4.
  Both are examination or testing as much as surgery.
- **Wonder Drugs** owns treatment, and **Code of Life** owns genetics, so no card here is a
  drug, a vaccine or a genetic test.
- `koch-tuberculosis-bacterium` is shared with Plagues. It is in here as the start of laboratory
  diagnosis of an infection.

## The 30

|  Year | Slug                                |                |
| ----: | ----------------------------------- | -------------- |
| -1600 | `edwin-smith-surgical-papyrus`      | foothold       |
|  -400 | `hippocratic-bedside-diagnosis`     | foothold · NEW |
|  -280 | `herophilus-pulse-timing`           | foothold · NEW |
|   280 | `wang-shuhe-pulse-classic`          | NEW            |
|  1025 | `avicenna-medical-education`        |                |
|  1543 | `vesalius-anatomy`                  |                |
|  1612 | `santorio-body-thermometer`         | NEW            |
|  1674 | `leeuwenhoek-blood-cells`           | foothold · NEW |
|  1761 | `auenbrugger-chest-percussion`      | NEW            |
|  1806 | `bozzini-light-conductor`           | foothold · NEW |
|  1816 | `stethoscope-invented`              |                |
|  1851 | `ophthalmoscope-invented`           |                |
|  1882 | `koch-tuberculosis-bacterium`       |                |
|  1896 | `riva-rocci-blood-pressure-cuff`    | NEW            |
|  1901 | `blood-types-discovered`            |                |
|  1903 | `electrocardiogram-invented`        |                |
|  1924 | `berger-eeg-recorded`               | NEW            |
|  1928 | `papanicolaou-smear-test`           | NEW            |
|  1929 | `forssmann-heart-catheter`          | NEW            |
|  1952 | `apgar-score-newborns`              | NEW            |
|  1957 | `hirschowitz-fibre-optic-endoscope` | foothold · NEW |
|  1958 | `first-ultrasound-imaging`          |                |
|  1971 | `first-ct-scan-patient`             | foothold · NEW |
|  1976 | `home-pregnancy-test-launched`      | NEW            |
|  1977 | `first-mri-human-scan`              | foothold · NEW |
|  1985 | `first-hiv-blood-test`              | foothold · NEW |
|  1992 | `fmri-brain-imaging`                | foothold · NEW |
|  2000 | `capsule-endoscopy-camera-pill`     | foothold · NEW |
|  2018 | `smartwatch-ecg-approved`           | foothold · NEW |
|  2020 | `mass-covid-testing`                | foothold · NEW |

21 of the 30 are new. The catalogue held the famous instruments (stethoscope, ophthalmoscope,
ECG, ultrasound) and a few landmark texts, but almost none of the tests.

Gates: size **30**, band 0 **13**, bins **8/8** (advisory), same-year pairs **0**, bunching
**3 in 1896-1903** (limit 3), largest overlap **2** (under-the-knife). Bands move as the
catalogue changes, so re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap seeing-inside
```

## The edges argued

- **Not reused.** Three catalogue cards were near the spine but kept apart. `first-microscope`
  (1674) is Leeuwenhoek's microscope, not his blood cells. `capsule-endoscopy` is dated 1999,
  where the camera pill's Nature report is 2000. `covid-19-pandemic` is the outbreak, not the
  testing.
- **Cut to reach 30.** The spine's least famous beats, most of them in crowded decades, were
  cut: Floyer's pulse-watch (1707), García's laryngoscope (1854), Allbutt's pocket thermometer
  (1867), Nitze's cystoscope (1877), Basch's blood pressure meter (1881), the Wassermann test
  (1906), Salomon's mammography (1913) and Dussik's ultrasound of the brain (1942). The Guthrie
  heel-prick test (1961) was dropped from the spine itself to keep 1952-1961 at three beats.
- **Footholds.** The blind grade made the modern scans and tests easy, since a player can place
  "smartwatch" or "new virus" from the text alone. The ancient footholds are easy because the
  catalogue around them is sparse. `stethoscope-invented` sits in band 1 despite its fame,
  because the early 19th century is crowded.

## Open fact-check points

- **`herophilus-pulse-timing` (-280).** -280 is roughly Herophilus's death. Sources date his
  pulse work to about 300 BCE with no precise year, and some credit the water-clock pulse to
  his teacher Praxagoras. The checker suggests -300.
- **`wang-shuhe-pulse-classic` (280).** Sources say only that the Maijing was compiled in the
  third century CE. No source gives 280.
- **`santorio-body-thermometer` description.** The card says Santorio put the thermoscope in a
  patient's mouth. The fact checker accepted 1612 as the book that first mentions an oral
  thermoscope, but the detail writer found no support for the mouth placement and dropped it
  from the prose. Reword the description through `date-clues-apply.js` if it can't be sourced.
- **`leeuwenhoek-blood-cells` description.** The card says he was the first to describe red
  blood cells. Swammerdam (1658) and Malpighi saw them earlier, so the prose credits him with
  the first accurate description. The card's description may want the same hedge.
- **Detail prose spot-checks** the writer could not verify: Bozzini in Frankfurt and dying in
  1809, Auenbrugger's father's inn in Graz, Adrian and Matthews reproducing Berger's rhythm in
  1934, and "roughly sixty" Hippocratic texts.
- `hippocratic-bedside-diagnosis` (-400) is a round anchor for the Hippocratic school, and the
  checker accepted it as such. `santorio-body-thermometer` (1612) is the date of the book that
  first mentions the oral thermoscope; a scaled version may date to 1625.

## Intro

The popup this theme opens with (rules in [index.md](index.md#theme-intros)).

- **Blurb:** How doctors learned to look inside, listen to and test the living body.
- **Fact:** Laennec rolled a sheet of paper into a tube to listen to a patient's heart because
  he felt it improper to press his ear to a young woman's chest.

Sources: [Stethoscope (Wikipedia)](https://en.wikipedia.org/wiki/Stethoscope); [René Laennec (Wikipedia)](https://en.wikipedia.org/wiki/Ren%C3%A9_Laennec).
