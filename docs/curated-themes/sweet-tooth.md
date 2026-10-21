# The Sweet Tooth theme

A 30-card curated theme on sweet treats, from a Roman honey cheesecake to the Cronut queue in
SoHo: candy, chocolate, biscuits and desserts, and the firsts that put them in shops. This note
is why these 30 and not others.

## The scope rule

An event is in only if **it is a sweet treat**: a candy, a chocolate, a biscuit or a dessert
being invented, named, recorded or first sold.

The boundary with the neighbouring themes:

- **Savoury dishes** go to Born in a Kitchen.
- **Canning and freezing** go to Food Tech. Ice cream is in here as a dessert, not as
  refrigeration, which is why `cafe-procope-gelato`, `eskimo-pie-patented` and
  `ben-jerrys-scoop-shop` are in and the ice-making machines are not.
- **Cocoa and other drinks** go to What We Drink. Chocolate enters this deck only once it is
  eaten: `bakers-chocolate-founded` is a cocoa mill, kept because the cakes it ground were
  baking chocolate, and `first-chocolate-bar` is the drink becoming a bar.

Two edges were argued rather than assumed:

- **`indian-sugar-crystallisation`** is in. It is an ingredient, not a treat, but every card
  after it depends on keepable sugar, and it gives the deck its only foothold in the first
  millennium.
- **`cadbury-creme-egg-named`** is a renaming, not an invention. The egg was first sold in 1963
  as Fry's Creme Egg; the card's name and description say "named", and the 1971 brand is the
  one players know.

Cut from the spine: Lindt's conche (1879, fame 1, in the deck's densest decade), Peeps (1953),
Twix (1967) and Dippin' Dots (1988), to leave room for better-known cards. Earlier, Tootsie Roll
(1896), the Popsicle (1905) and M&Ms (1941) were dropped from the spine to meet the bunching
limit around 1900 and in the 1930s.

## The 30

| Year | Slug                           |                |
| ---: | ------------------------------ | -------------- |
| -160 | `cato-honey-cheesecake-recipe` | NEW            |
|  350 | `indian-sugar-crystallisation` | NEW            |
|  992 | `gingerbread-reaches-europe`   | NEW            |
| 1395 | `nuremberg-lebkuchen-recorded` | NEW            |
| 1670 | `candy-cane-first-handed-out`  | NEW            |
| 1686 | `cafe-procope-gelato`          | NEW            |
| 1764 | `bakers-chocolate-founded`     | NEW            |
| 1777 | `turkish-delight-on-sale`      | NEW            |
| 1832 | `sachertorte-invented`         | NEW            |
| 1847 | `first-chocolate-bar`          |                |
| 1868 | `cadbury-chocolate-box`        | NEW            |
| 1873 | `fry-chocolate-easter-egg`     | NEW            |
| 1875 | `milk-chocolate-invented`      |                |
| 1893 | `cracker-jack-debuts`          | NEW            |
| 1897 | `jell-o-sold-as-dessert`       | NEW            |
| 1900 | `hersheys-milk-chocolate-bar`  | foothold · NEW |
| 1904 | `ice-cream-cone-debut`         | foothold       |
| 1912 | `oreo-introduced`              | foothold · NEW |
| 1921 | `eskimo-pie-patented`          | NEW            |
| 1922 | `haribo-gummy-bear`            | foothold · NEW |
| 1926 | `pavlova-created`              | foothold · NEW |
| 1932 | `mars-bar-launched`            | NEW            |
| 1935 | `kit-kat-launched`             | foothold · NEW |
| 1938 | `chocolate-chip-cookie`        | foothold       |
| 1958 | `chupa-chups-lollipop`         | NEW            |
| 1964 | `nutella-launched`             | foothold · NEW |
| 1971 | `cadbury-creme-egg-named`      | foothold · NEW |
| 1974 | `kinder-surprise-launched`     | NEW            |
| 1978 | `ben-jerrys-scoop-shop`        | NEW            |
| 2013 | `cronut-hits-new-york`         | NEW            |

26 of the 30 were authored for this theme. The four reused cards are the chocolate bar, milk
chocolate, the ice cream cone and the chocolate chip cookie. The footholds are the reconciler's
picks for fame. theme-gap scores band 0 separately, from the difficulty label and how crowded
the timeline is.

Gates: size **30**, band 0 **7**, bins **7/8** (advisory), same-year pairs **0**, bunching **3
in 1868-1875**, shared **0** with any earlier theme. Re-measure rather than trust these:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending --overlap sweet-tooth
```

## Dates the fact check could not support

These three stay, with descriptions that hedge, and are flagged for review:

- **`gingerbread-reaches-europe` (992)**: the date of the Gregory of Nicopolis story, which
  sources treat as legend. The description says "traditionally said".
- **`candy-cane-first-handed-out` (1670)**: the Cologne choirmaster story has no contemporary
  record. The description says "is said".
- **`pavlova-created` (1926)**: the year of Anna Pavlova's tour. The earliest New Zealand
  recipes are 1927-29 and the Perth claim is 1935. Moving it to 1935 would put it in the same
  year as `kit-kat-launched`.

The detail-prose research found two more weak spots, which the fact check had passed:

- **`cracker-jack-debuts` (1893)**: the debut at the Chicago fair may be legend. The
  Rueckheims' own 50-year company history leaves the fair out, and a March 1896 Tribune called
  the snack a very recent invention. Moving the card to 1896 would put four cards in 1896-1904
  and fail the bunching gate, so it needs a decision: keep it, rename it, or cut it.
- **`sachertorte-invented`**: Wikipedia says the Metternich story was probably invented later
  by Eduard Sacher. The description's "for a prince's guests" repeats it.

Two fixes were made during the fact check. `nuremberg-lebkuchen-recorded` moved from 1296, which
is Ulm's record, to 1395. `eskimo-pie-patented` was renamed "Eskimo Pie Is Launched" to match
its 1921 year, because the patent came in 1922, Haribo's year. Its description now says Iowa and
no longer claims a stick.

## Known crowding kept on purpose

The 1920s and 1930s carry six cards, from Eskimo Pie to the chocolate chip cookie. The deck
keeps them because those two decades are when the branded sweet arrived, and four of the six
are footholds. The 1921/1922 pair (Eskimo Pie, Haribo) is one year apart but on different
continents and of different kinds.
