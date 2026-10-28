# The Day in Court theme

A 30-card curated theme on famous trials and court rulings, from Socrates in Athens to a
livestreamed defamation verdict. This note explains why these 30 and not others.

## The scope rule

An event is in only if **it is a famous trial or court ruling.** The card is the courtroom
moment itself: the trial, the verdict or the judgment, never the crime, the execution or the
law that followed.

Four neighbours own the edges:

- **Civil Rights Road** shares the civil-rights rulings. `dred-scott-decision`,
  `plessy-v-ferguson`, `brown-v-board` and `marriage-equality-us` are in here as rulings; the
  movements around them belong to that theme.
- **Banned!** owns trials of books and ideas, Galileo's included, so no censorship trial is here.
- **Crime & Punishment** owns police and prisons. A famous crime is in only through its trial.
- **Law of the Land** owns written law, so a statute or constitution is never a card here.

## The 30

|  Year | Slug                               |                |
| ----: | ---------------------------------- | -------------- |
|  -399 | `trial-of-socrates`                | foothold       |
|  1431 | `trial-of-joan-of-arc-rouen`       | foothold · NEW |
|  1535 | `trial-of-sir-thomas-more`         | foothold · NEW |
|  1649 | `charles-i-put-on-trial`           | foothold · NEW |
|  1692 | `salem-witch-trials`               | foothold       |
|  1735 | `zenger-libel-acquittal`           | NEW            |
|  1770 | `boston-massacre-soldiers-trial`   | foothold · NEW |
|  1803 | `marbury-v-madison`                |                |
|  1841 | `amistad-supreme-court-ruling`     | foothold · NEW |
|  1857 | `dred-scott-decision`              |                |
|  1859 | `john-brown-trial-harpers-ferry`   | foothold · NEW |
|  1894 | `dreyfus-affair`                   |                |
|  1895 | `oscar-wilde-trials`               | foothold · NEW |
|  1896 | `plessy-v-ferguson`                |                |
|  1921 | `sacco-vanzetti-convicted`         | NEW            |
|  1925 | `scopes-trial`                     |                |
|  1931 | `al-capone-tax-evasion-conviction` | foothold · NEW |
|  1935 | `lindbergh-kidnapping-trial`       |                |
|  1945 | `nuremberg-trials`                 |                |
|  1954 | `brown-v-board`                    | foothold       |
|  1961 | `eichmann-trial`                   |                |
|  1964 | `mandela-sentenced`                |                |
|  1966 | `miranda-v-arizona`                | foothold       |
|  1973 | `roe-v-wade`                       | foothold       |
|  1974 | `us-v-nixon-supreme-court`         | foothold · NEW |
|  1992 | `rodney-king-officers-acquitted`   | foothold · NEW |
|  1995 | `oj-simpson-trial`                 | foothold       |
|  2000 | `bush-v-gore-ruling`               | foothold · NEW |
|  2015 | `marriage-equality-us`             | foothold       |
|  2022 | `depp-v-heard-verdict`             | foothold · NEW |

14 of the 30 are new. The catalogue held the landmark American rulings and the great
20th-century trials, but rarely the trial behind a famous death: it had Joan of Arc's burning,
More's and Charles I's executions, and the Boston Massacre, without their trials.

Gates: size **30**, band 0 **19**, same-year pairs **0**, bunching **3 in 1894-1896** (the
limit), largest overlap **1** (big-thinkers, `trial-of-socrates`). Spread is 7/8 bins
(advisory); nothing falls between 287 BCE and 1000, because the spine had no beat there. Bands
move as the catalogue changes, so re-measure rather than trust these figures:

```bash
node scripts/theme-gap.js --slugs <the 30 above, comma-separated> --include-pending
```

## The edges argued

- **The trial, not the death.** `death-william-wallace`, `joan-of-arc-executed`,
  `charles-i-execution` and `boston-massacre` share a year with a spine beat but name a
  different event, so none was reused. Charles I's trial is `charles-i-put-on-trial` because the
  older slug `trial-of-charles-i` is retired in `deprecated.json`.
- **Cut for fame or scope.** William Wallace, Raleigh, the M'Naghten verdict, Aaron Burr and
  Michael Jackson were the weakest on fame or scope. The Pendle witches gave way to Salem, and
  Standard Oil read as commerce more than courtroom.
- **Cut for crowding.** The Lincoln conspirators (beside Dred Scott and John Brown), the Tokyo
  trial (a year after Nuremberg), Hinckley and Milosevic were cut to keep every 10-year window
  at 3 cards or fewer.
- **Recent, famous people are left out of the art.** The scenes for Capone, Nixon, Rodney King,
  Bush v. Gore and Depp v. Heard show the object or the room, not the people.

## Open fact-check points

None. The fact check returned all 14 new cards as supported. It searched the Boston Massacre
trial, Zenger and Sacco and Vanzetti; the other 11 years rest on well-established dates.
