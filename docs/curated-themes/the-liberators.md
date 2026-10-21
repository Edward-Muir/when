# The Liberators theme

A 30-card curated theme on Latin America's struggle for independence, from the Comunero revolt
in New Granada to the first Cuban republic. Its events are the risings, conspiracies, campaigns,
battles and treaties by which the colonies of Spain, Portugal and France broke away. This note
is why these 30 and not others.

## The scope rule

An event is in only if **it is part of Latin America's struggle for independence.**

- **The struggle itself**: a plot, a rising, a campaign, a battle, a declaration, a treaty of
  recognition, or the death or capture of a leader that changed the war. Haiti's revolution is
  in from its first night, because its war against France was a war for independence as well as
  against slavery.
- **The neighbours take the rest**: the Spanish conquest goes to Conquistadors, the end of
  slavery as such to Chains Broken, and Tupac Amaru's rising to Rise Up!

Edges argued rather than assumed:

- **The Dominican beats are in**, including the two that won independence from Haiti rather
  than a European power (`duarte-founds-la-trinitaria`, `dominican-independence-declared`). The
  scope says Latin American independence, not independence from Europe, and the Dominican
  story runs straight on into the war against Spain's re-annexation (`dominicans-rise-capotillo`,
  `spain-leaves-santo-domingo`).
- **Puebla (1862) and Maximilian's execution (1867) are out.** Both defend an already
  independent Mexico against France. That is sovereignty, not independence.
- **Puerto Rico's 1897 autonomy charter is out**: an autonomy grant is the weakest scope fit on
  the spine, and it sits in the deck's most crowded decade.
- **Cuba's 1902 republic is in** as the end of the last Spanish-American independence war:
  sovereignty passed from the American occupation to a Cuban government.

## The 30

| Year | Slug                                     |                |
| ---: | ---------------------------------------- | -------------- |
| 1781 | `comuneros-revolt-new-granada`           | NEW            |
| 1789 | `inconfidencia-mineira-plot`             | NEW            |
| 1791 | `haitian-revolution-uprising-begins`     | foothold · NEW |
| 1793 | `narino-prints-rights-of-man`            | foothold · NEW |
| 1797 | `gual-espana-conspiracy`                 | NEW            |
| 1802 | `toussaint-louverture-captured`          | foothold · NEW |
| 1804 | `haitian-revolution`                     |                |
| 1808 | `portuguese-court-reaches-brazil`        | foothold · NEW |
| 1810 | `grito-de-dolores`                       | NEW            |
| 1813 | `bolivar-named-el-libertador`            | foothold · NEW |
| 1817 | `san-martin-crosses-andes`               | foothold · NEW |
| 1819 | `battle-of-boyaca`                       | foothold · NEW |
| 1822 | `brazil-independence`                    |                |
| 1824 | `battle-of-ayacucho`                     |                |
| 1828 | `uruguay-independence`                   |                |
| 1830 | `bolivar-dies-santa-marta`               | foothold · NEW |
| 1836 | `spain-recognizes-mexico`                | NEW            |
| 1838 | `duarte-founds-la-trinitaria`            | NEW            |
| 1844 | `dominican-independence-declared`        | NEW            |
| 1851 | `narciso-lopez-invades-cuba`             | NEW            |
| 1863 | `dominicans-rise-capotillo`              | NEW            |
| 1865 | `spain-leaves-santo-domingo`             | NEW            |
| 1868 | `grito-de-yara`                          | NEW            |
| 1873 | `virginius-affair`                       | NEW            |
| 1878 | `protest-of-baragua`                     | foothold · NEW |
| 1892 | `marti-founds-cuban-revolutionary-party` | foothold · NEW |
| 1895 | `grito-de-baire`                         | foothold · NEW |
| 1896 | `antonio-maceo-killed`                   | NEW            |
| 1898 | `treaty-paris-spain-cedes-colonies`      | foothold · NEW |
| 1902 | `cuba-becomes-republic`                  | foothold · NEW |

26 of the 30 were written for this theme. The catalogue already held Haiti's 1804 independence,
Brazil's in 1822, Ayacucho and Uruguay's independence, and nothing else that named a specific
act of the wars.

Gates: size **30**, band 0 **13**, same-year pairs **0**, bunching **4** in 1789-1797 (limit 4),
shared **0** with any earlier theme, bins **2/8** (advisory: the whole theme falls within 121
years). Re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## Why the footholds are the footholds

The blind grader rated the cards from their text alone, and the placement-first grid makes a
card easy when its text pins the era, however obscure the event. So `protest-of-baragua` and
`narino-prints-rights-of-man` are footholds: the Ten Years' War and the French declaration of
rights each anchor their decade. Bolívar, Toussaint, Napoleon's chase of the Portuguese court,
Martí and the war with the United States do the same for the rest.

## Deliberate omissions

- **Cut from the spine for density**, to keep every 10-year window at 4 cards or fewer:
  Toussaint's 1801 constitution (Haiti already has three cards in 1791-1804), Venezuela's 1811
  declaration, the 1821 Battle of Carabobo, and the 1897 Puerto Rican autonomy charter.
  Carabobo was an example beat; it fell in the crowded 1817-1824 stretch, beside Boyacá and
  Ayacucho, which already tell Bolívar's victories.
- **Dropped before the spine**, for the same window limit: the Jamaica Letter (1815), the
  Congress of Tucumán (1816), Maipú (1818), the Plan of Iguala (1821), Bolivia's founding
  (1825) and the Congress of Panama (1826).

## Fact-check flags still unsupported

- **`narino-prints-rights-of-man` (year 1793)**: sources split between 1793 and 1794. The
  printing is most specifically dated to December 1793 and the arrest to August 1794. The deck
  keeps 1793, the printing, which is what the card names.
