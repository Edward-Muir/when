# The Code of Life theme

A 30-card curated theme on discovering and editing DNA and genes, from Mendel's peas to the first
bespoke gene-editing therapy for a baby. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a step in discovering or editing DNA and genes.**

- **Discovering**: the experiments, maps and codes that showed what heredity is made of and how
  it is read: Mendel's ratios, the chromosome theory, Morgan's flies, Avery and Hershey-Chase,
  the double helix, the genetic code, sequencing and the genome projects.
- **Editing**: the tools and acts that change genes on purpose: restriction enzymes,
  recombinant DNA, PCR, cloning, induced stem cells and CRISPR therapy.

Boundary: Code of Life owns genetics. Evolution and natural history go to Field Notes, scanning to
Seeing Inside, and domesticated animals to Tamed.

Edges argued rather than assumed:

- **`dolly-sheep-cloned`** is in. Cloning from an adult cell is a step in manipulating genes, but
  it overlaps Tamed by one card.
- **`he-jiankui-gene-edited-babies`** is in as the first human germline edit. The scene shows a
  nursery and an embryo dish, with no people.
- **`dna-structure`** is the one overlap with Eureka.

## The 30

|  Year | Slug                              |                |
| ----: | --------------------------------- | -------------- |
|  1866 | `mendel-genetics`                 |                |
|  1869 | `miescher-isolates-nuclein`       | NEW            |
|  1882 | `flemming-chromosomes-mitosis`    | NEW            |
|  1900 | `mendel-work-rediscovered`        | NEW            |
|  1902 | `chromosome-theory-inheritance`   | NEW            |
|  1909 | `johannsen-coins-gene`            | NEW            |
|  1910 | `morgan-fruit-fly-linkage`        | NEW            |
|  1913 | `sturtevant-first-genetic-map`    | NEW            |
|  1927 | `muller-xray-mutations`           | NEW            |
|  1928 | `griffith-transforming-principle` | NEW            |
|  1931 | `mcclintock-crossing-over`        | NEW            |
|  1941 | `one-gene-one-enzyme`             | NEW            |
|  1944 | `avery-dna-heredity`              | NEW            |
|  1952 | `hershey-chase-experiment`        | NEW            |
|  1953 | `dna-structure`                   | foothold       |
|  1956 | `human-46-chromosomes`            | NEW            |
|  1966 | `genetic-code-cracked`            | NEW            |
|  1970 | `first-restriction-enzyme`        | NEW            |
|  1973 | `cohen-boyer-recombinant-dna`     | foothold · NEW |
|  1977 | `dna-sequencing-method`           |                |
|  1983 | `mullis-invents-pcr`              | NEW            |
|  1984 | `dna-fingerprinting`              |                |
|  1990 | `human-genome-project`            |                |
|  1996 | `dolly-sheep-cloned`              | foothold       |
|  2003 | `human-genome-completed`          |                |
|  2006 | `induced-stem-cells-created`      |                |
|  2012 | `crispr-gene-editing`             | foothold       |
|  2018 | `he-jiankui-gene-edited-babies`   | foothold · NEW |
|  2023 | `first-crispr-therapy-approved`   | foothold · NEW |
|  2025 | `custom-base-editing-infant`      | NEW            |

21 of the 30 were authored for this theme, and 9 were already in the catalogue. The footholds
marked above are the reconciler's easy-labelled cards, before the blind grade moved some
difficulties; re-measure band 0 rather than trust them.

Gates: size **30**, band 0 **7**, bins **3/8** (advisory), same-year pairs **0**, bunching 3 in
1900-1909, shared 1 with Eureka (`dna-structure`). Overlap: 1 with Eureka, 1 with Tamed
(`dolly-sheep-cloned`).

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Deliberate omissions

Four spine beats were cut: **1888 Chromosomes Get Their Name** and **1892 Weismann's germ plasm**
(theory and naming, not discovery steps, and they thinned the dense early run), **1946 bacteria
swap genes** (cut to fix bunching in 1944-1953) and **2001 draft human genome** (two years from
the 2003 completion). Famous beats the spread rule excluded: Asilomar, Meselson-Stahl, the first
codon, the cystic fibrosis gene, the first synthetic cell and the Neanderthal genome.

The deck is all 1866 onward, which is the history of the science, so the earlier stretches of the
timeline are empty by design.

## Fact-check flags

None are unsupported. Two descriptions were fixed (an RNA codon, and "botanists" for the
rediscovery of Mendel). Cards dated by publication year rather than the work: Sturtevant (map
built 1911), Muller (experiments 1926), the 46-chromosome count (found December 1955), Miescher
(published 1871). The 2025 infant card rests on press coverage and the NEJM paper's online
release. The detail prose for 17 of the 21 new cards was written from memory with only claims the
writer was confident in; the unchecked ones are Hoppe-Seyler delaying Miescher's paper to 1871,
Mendel's paper sitting for 34 years, Avery's age, Griffith's death in a 1941 bombing raid, 16 of
17 patients in the Casgevy trial, He Jiankui's sentence and fine, and Chase not sharing the Nobel.

## Intro

The popup this theme opens with (rules in [index.md](index.md#theme-intros)).

- **Blurb:** The experiments, maps and tools that revealed how heredity is written, and then let us edit it.
- **Fact:** Friedrich Miescher first isolated DNA in 1869 from the pus on discarded surgical bandages, and called it nuclein.

Sources: [Friedrich Miescher (Wikipedia)](https://en.wikipedia.org/wiki/Friedrich_Miescher).
