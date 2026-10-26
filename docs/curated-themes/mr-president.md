# The Mr President theme

A 30-card curated theme on US presidents taking office, from Washington on the Federal Hall
balcony to Obama on the National Mall. One card per president, each dated to his first oath.
This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a US president taking office**.

- **One beat per president, at his first oath.** A second inauguration is not a new president
  taking office, so Lincoln, FDR, Reagan and the rest appear once.
- **Successions count.** A vice president sworn in on a death or resignation is taking office
  as surely as one inaugurated in March. `theodore-roosevelt-sworn-in` (Buffalo),
  `truman-sworn-in` (the Cabinet Room) and `lbj-sworn-in-air-force-one` are in on that reading,
  and each is dated to its first oath.
- **The boundary with The Ballot Box.** Elections, campaigns, recounts and electoral-college
  fights belong to The Ballot Box. Cards here may mention a contested election as context
  (Jefferson, John Quincy Adams, George W. Bush), but the event is the oath, never the vote.
- **Stops at 2009.** Later presidents are live politics, so the theme ends with
  `obama-inaugurated`.

Two edges were argued rather than assumed:

- **Cleveland is in once.** His non-consecutive second term (1893) is a second taking of
  office, but the one-beat-per-president rule keeps only 1885.
- **Successions were cut more often than elections.** Tyler and Fillmore never made the spine
  (each shares a year or a crowded stretch with an elected neighbour), and Arthur's 1881 oath
  shares a year with Garfield's. The reconciler then cut Andrew Johnson, Coolidge and Ford for
  bunching, so only the three most famous successions survive.

## The 30

| Year | Slug                                  |                |
| ---: | ------------------------------------- | -------------- |
| 1789 | `washington-first-inauguration`       | foothold · NEW |
| 1797 | `john-adams-inauguration`             | foothold · NEW |
| 1801 | `jefferson-first-inauguration`        | foothold · NEW |
| 1809 | `madison-first-inauguration`          | foothold · NEW |
| 1817 | `monroe-first-inauguration`           | foothold · NEW |
| 1825 | `john-quincy-adams-inauguration`      | foothold · NEW |
| 1829 | `jackson-first-inauguration`          | foothold · NEW |
| 1841 | `william-henry-harrison-inauguration` | foothold · NEW |
| 1845 | `polk-inauguration`                   | NEW            |
| 1861 | `lincoln-first-inauguration`          | foothold · NEW |
| 1869 | `grant-first-inauguration`            | foothold · NEW |
| 1885 | `cleveland-first-inauguration`        | foothold · NEW |
| 1897 | `mckinley-first-inauguration`         | foothold · NEW |
| 1901 | `theodore-roosevelt-sworn-in`         | foothold · NEW |
| 1909 | `taft-inauguration`                   | foothold · NEW |
| 1913 | `wilson-first-inauguration`           | foothold · NEW |
| 1921 | `harding-inauguration`                | foothold · NEW |
| 1929 | `hoover-inauguration`                 | foothold · NEW |
| 1933 | `fdr-first-inauguration`              | foothold · NEW |
| 1945 | `truman-sworn-in`                     | foothold · NEW |
| 1953 | `eisenhower-first-inauguration`       | foothold · NEW |
| 1961 | `kennedy-inauguration`                | foothold · NEW |
| 1963 | `lbj-sworn-in-air-force-one`          | foothold · NEW |
| 1969 | `nixon-first-inauguration`            | foothold · NEW |
| 1977 | `carter-inauguration`                 | foothold · NEW |
| 1981 | `reagan-first-inauguration`           | foothold · NEW |
| 1989 | `george-hw-bush-inauguration`         | foothold · NEW |
| 1993 | `clinton-first-inauguration`          | foothold · NEW |
| 2001 | `george-w-bush-first-inauguration`    | foothold · NEW |
| 2009 | `obama-inaugurated`                   | foothold       |

29 of the 30 were authored for this theme. The catalogue held births, deaths, assassinations
and elections for most of these men, but no inauguration except Obama's.

Gates: size **30**, band 0 **29**, bins **4/8** (advisory), same-year pairs **0**, bunching
**3 in 1961-1969** (limit 3), shared **0** with any earlier theme. A card's band moves whenever
the catalogue around its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Why nearly everything is a foothold

The blind grader rated 28 of the 29 new cards as highly inferable: a president's name, plus a
clue in the description (a war, the Depression, a telegraph, a motion picture camera), pins the
era for most players. That makes the deck easy to start and hard to finish. The difficulty
lies in ordering neighbours four years apart, not in placing any one card against the wider
timeline. Only `polk-inauguration` grades medium.

## Known crowding kept on purpose

Ten pairs sit inside theme-gap's 8-year advisory window. Most are four years apart, one
presidential term, which is the honest shape of the theme: any run of consecutive presidents
looks like this. The tightest are:

- **1961 / 1963 / 1969** (`kennedy-inauguration` → `lbj-sworn-in-air-force-one` →
  `nixon-first-inauguration`): at the bunching limit. LBJ's oath aboard Air Force One is the
  most famous succession in the theme, so it stays, and the 1974 Ford succession was cut
  instead.
- **1929 / 1933** (Hoover → FDR): the crash between them is what tells a player the order.

## Fact-check flags

None are left `unsupported`. One description was fixed: the 1913 suffrage march took place the
day before Wilson's inauguration, not during it.

## Cut from the spine

Van Buren, Taylor, Pierce, Buchanan, Andrew Johnson, Hayes, Garfield, Benjamin Harrison,
Coolidge and Ford. The three fame-1 beats went for being obscure, and the rest to clear the
bunching gate in the denser stretches. Coolidge's lamplit farmhouse oath (1923) and Ford's
"long national nightmare" (1974) are the strongest cards that didn't make the cut, and they
could swap in if a neighbour is ever retired.
