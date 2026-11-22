# The Taxing Times theme

A 30-card curated theme on what states took and what they counted, from the tax remission
carved on the Rosetta Stone to the global minimum corporate tax: taxes, tariffs and censuses.
This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a tax, a tariff or a census.** The card is the levy or the count
itself, not what people did about it.

- **The revolts taxes sparked** go to Rise Up!. The poll tax is here as the Community Charge
  starting in Scotland (`scotland-poll-tax`), not as the riots that followed in London.
- **The Boston Tea Party** goes to What We Drink. The spine offered the Tea Act instead, and it
  was cut for crowding rather than scope.
- **Money itself** goes to Hard Currency. No coinage, bank or currency card is in the 30.

Edges that were argued rather than assumed:

- **`magna-carta`** is a charter, not a tax. It is in because its best-known clauses limit what
  the king could levy without consent, which is the deck's subject from the other side.
- **`danegeld-first-paid`** is a tribute paid to raiders. It is in because the payment gave its
  name to the English land tax that followed.
- **`social-security-act`** and **`pay-as-you-go-withholding`** are in as the payroll tax and the
  way income tax is collected, not as welfare history.
- **`gatt-established`** and **`nafta-takes-effect`** are tariff cuts rather than tariffs, and
  are in on that reading. **`hollerith-tabulator-census`** is in as a census, though the card is
  as much about the machine.

## The 30

| Year | Slug                                |     |
| ---: | ----------------------------------- | --- |
| -196 | `rosetta-stone-tax-decree`          | NEW |
|    2 | `han-dynasty-census`                | NEW |
|    6 | `quirinius-census-judea`            | NEW |
|  991 | `danegeld-first-paid`               | NEW |
| 1086 | `domesday-book`                     |     |
| 1188 | `saladin-tithe-levied`              | NEW |
| 1215 | `magna-carta`                       |     |
| 1634 | `ship-money-levied`                 | NEW |
| 1696 | `window-tax-england`                | NEW |
| 1698 | `peter-great-beard-tax`             | NEW |
| 1765 | `stamp-act`                         |     |
| 1790 | `first-us-census`                   |     |
| 1799 | `first-british-income-tax`          |     |
| 1815 | `corn-laws-enacted`                 | NEW |
| 1842 | `peel-revives-income-tax`           | NEW |
| 1846 | `corn-laws-repealed-britain`        |     |
| 1861 | `us-first-federal-income-tax`       | NEW |
| 1890 | `hollerith-tabulator-census`        |     |
| 1909 | `peoples-budget-lloyd-george`       | NEW |
| 1913 | `us-federal-income-tax`             |     |
| 1930 | `smoot-hawley-tariff`               |     |
| 1935 | `social-security-act`               |     |
| 1943 | `pay-as-you-go-withholding`         | NEW |
| 1947 | `gatt-established`                  |     |
| 1954 | `france-introduces-vat`             | NEW |
| 1978 | `california-proposition-13`         | NEW |
| 1989 | `scotland-poll-tax`                 | NEW |
| 1994 | `nafta-takes-effect`                | NEW |
| 2006 | `china-abolishes-agricultural-tax`  | NEW |
| 2021 | `global-minimum-corporate-tax-deal` | NEW |

19 were authored for this theme and 11 are reused, each naming the same event in the same year
as its spine beat. The table carries no `foothold` flags: theme-gap reports the band-0 count but
does not name the cards, and the count is high enough (14) that the opening is not at risk.

Gates: size **30**, band 0 **14**, bins **7/8** (advisory; the empty bin is everything before
300 BCE), same-year pairs **0**, bunching **2 in any 10 years** (limit 3), shared **2** with
English History (`domesday-book`, `magna-carta`) and 1 each with Kings of England, Famine and
Silicon Dreams. A card's band moves whenever the catalogue around its year does, so re-measure
rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

Band 0 was 5 on the reconciler's placeholder difficulties and rose to 14 after the blind grade,
which moved 15 of the 19 new cards, most of them to easy: a card that names Vikings, a crusade,
a tsar or a civil war gives its era away.

## Years that needed a choice

- `rosetta-stone-tax-decree` is 196 BCE, the Memphis decree; one source gives 195.
- `ship-money-levied` is 1634, the first writs to the coastal counties; the extension inland
  that the description mentions came in 1635.
- `peter-great-beard-tax` is 1698. The spine first had 1705, and the search moved it.
- `us-federal-income-tax` is 1913, the Sixteenth Amendment's ratification.
- `scotland-poll-tax` is 1989, the Scottish start; England and Wales followed in 1990.
- `france-introduces-vat` is 1954, the French law. The fact check notes that the tax first
  covered large firms only and reached the wider economy later.

## Close pairs

theme-gap lists eight pairs within 8 years, where placement is mostly luck. The tightest are
`window-tax-england` and `peter-great-beard-tax` (2 years), then `han-dynasty-census` and
`quirinius-census-judea`, `peel-revives-income-tax` and `corn-laws-repealed-britain`,
`peoples-budget-lloyd-george` and `us-federal-income-tax`, and `pay-as-you-go-withholding` and
`gatt-established` (4 years each). None breaks a gate. The beard tax is the first to swap out
if the pair with the window tax plays badly.

## Regions

`saladin-tithe-levied` is France and United Kingdom, where the ordinance was issued and
collected; Jerusalem is the crusade's destination and is left out. `danegeld-first-paid` is
United Kingdom only, since Vikings are a people and not a state. `quirinius-census-judea` is
Israel, Palestine and Italy (Rome as the actor). `global-minimum-corporate-tax-deal` is France
and Global, France for the OECD's seat in Paris; that focal place is arguable.

## Deliberate omissions

Cut from the 40-beat spine to reach 30, for weak scope, lower fame or crowding in the
1760-1850 stretch: Florence's Catasto (1427), Kangxi's land-tax freeze (1712), the Townshend
Duties (1767), the Tea Act (1773), Hamilton's whiskey excise (1791), the first British census
(1801), Britain scrapping its income tax (1816), the window tax's repeal (1851), the National
Insurance Act (1911) and the US Tax Reform Act (1986).

## Fact-check flags still open

- `danegeld-first-paid`: the year and the payment of silver after Maldon are confirmed. The
  description's "then taxed his people to raise it" is not: the national land tax is dated to
  1012, and no scholarly source was found for a levy in 991.
- `us-first-federal-income-tax`: the year is confirmed. The description says Congress later let
  the measure lapse, but the 1861 tax was repealed and replaced by the Revenue Act of 1862; it
  was the income tax as a whole that expired, in 1872.
