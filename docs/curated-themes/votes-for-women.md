# The Votes for Women theme

A 30-card curated theme on women's suffrage, from Abigail Adams's letter to the first Saudi
municipal elections women could vote in. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is women winning the vote, or the fight for it.**

- **The win**: a law, constitution, ordinance or referendum that gave women the vote, or the
  first election they voted in. Each country's beat is its national win, except where a smaller
  jurisdiction got there first (Wyoming, the Isle of Man).
- **The fight**: the writing, meetings, arrests and protests aimed at winning the vote, and the
  reverses it had to undo (`new-jersey-ends-women-voting`).

The boundary with the neighbours: other voting milestones (the secret ballot, male suffrage,
lowering the age) go to The Ballot Box, and other women's firsts (the first woman MP, prime
minister or president) go to The First Woman. `finland-women-vote-stand` is in because the vote
and the right to stand came in one law; the first women taking their seats is The First Woman's.

Edges argued rather than assumed:

- **The 1790s writings** (`remember-the-ladies-letter`, `declaration-rights-woman-gouges`,
  `vindication-rights-of-woman`) are in as the fight's founding texts, though only Gouges
  demands the vote outright. They give the deck its only pre-1800 footing.
- **`world-anti-slavery-convention-women-barred`** is in because the 1840 snub is what turned
  Stanton and Mott toward Seneca Falls.
- **`swiss-women-federal-vote`** is told as the men's referendum, since that was the event: the
  Swiss vote was something men had to grant at the ballot box.
- **Two Saudi beats** (2011 promise, 2015 vote) are both kept: the promise is the decision, and
  the 2015 election is the first use.

Cut from the spine on fame and crowding: the 1850 National Women's Rights Convention, the 1866
petition to Parliament, the 1878 Anthony Amendment, the 1890 merger of the American groups,
South Australia 1894, Spain 1931, Vaud 1959, the 1990 Appenzell Innerrhoden ruling and the UAE
in 2006.

## The 30

| Year | Slug                                         |                |
| ---: | -------------------------------------------- | -------------- |
| 1776 | `remember-the-ladies-letter`                 | foothold · NEW |
| 1791 | `declaration-rights-woman-gouges`            | foothold · NEW |
| 1792 | `vindication-rights-of-woman`                | foothold · NEW |
| 1807 | `new-jersey-ends-women-voting`               | NEW            |
| 1840 | `world-anti-slavery-convention-women-barred` | NEW            |
| 1848 | `seneca-falls-convention`                    |                |
| 1851 | `ain-t-i-a-woman-speech`                     | foothold · NEW |
| 1869 | `wyoming-women-vote`                         | NEW            |
| 1872 | `susan-anthony-arrested-voting`              | foothold · NEW |
| 1881 | `isle-of-man-women-vote`                     | NEW            |
| 1893 | `womens-suffrage-nz`                         |                |
| 1902 | `australia-federal-women-vote`               | NEW            |
| 1903 | `pankhurst-founds-wspu`                      | foothold · NEW |
| 1906 | `finland-women-vote-stand`                   | NEW            |
| 1913 | `emily-davison-derby`                        | foothold · NEW |
| 1918 | `women-suffrage-uk`                          |                |
| 1920 | `womens-suffrage-us`                         | foothold       |
| 1928 | `equal-franchise-act-uk`                     | NEW            |
| 1934 | `turkey-women-vote`                          | foothold · NEW |
| 1944 | `france-women-vote-ordinance`                | NEW            |
| 1947 | `argentina-women-suffrage-law`               | foothold · NEW |
| 1950 | `india-women-vote-constitution`              | foothold · NEW |
| 1956 | `egypt-women-vote`                           | NEW            |
| 1963 | `iran-women-vote-referendum`                 | NEW            |
| 1971 | `swiss-women-federal-vote`                   | NEW            |
| 1984 | `liechtenstein-women-vote`                   | NEW            |
| 1994 | `south-africa-women-vote-1994`               | foothold · NEW |
| 2005 | `kuwait-women-political-rights`              | NEW            |
| 2011 | `saudi-king-promises-women-vote`             | NEW            |
| 2015 | `saudi-women-vote-and-run`                   | NEW            |

26 of the 30 were written for this theme; the catalogue held only the four best-known wins.

Gates: size **30**, band 0 **12**, bins **4/8** (advisory), same-year pairs **0**, bunching
**3 in 1902-1906** (limit 3), shared **1** with any one theme (`womens-suffrage-nz` with
first-women, `women-suffrage-uk` with english-history). Re-measure rather than trust these:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Known crowding kept on purpose

The 1902-1906 stretch (Australia, the WSPU, Finland) sits at the bunching limit, and 1913-1920
holds Davison, the 1918 Act and the 19th Amendment. That is the honest shape of the history:
the decade before and after the First World War is when most of the early wins came. Both
clusters lean on footholds, so they cost the opening little.

## Fact-check flags

None unsupported: all 26 new events were checked against sources. Two notes from the check:
`egypt-women-vote` is dated to the 1956 constitution, though women first voted in 1957, and
`france-women-vote-ordinance` is the April 1944 ordinance, confirmed that October.

## Taxonomy note

`isle-of-man-women-vote` is tagged United Kingdom because `regions.json` has no Isle of Man
entry, though the island is a Crown dependency, not part of the UK.
