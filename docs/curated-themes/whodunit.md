# The Whodunit theme

A 30-card curated theme on invented crime and the sleuths who solve it, from Poe's Dupin to
Richard Osman's retirees: the detective and crime novels that set the form, and the debuts of
the famous fictional detectives. This note is why these 30 and not others.

## The scope rule

An event is in only if **it is a detective or crime novel, or a famous sleuth's debut.** The
crime and the detective are invented; that is the whole boundary with the neighbouring themes.

- **Real police, real cases and real prisons** go to Crime & Punishment, even when a novel was
  drawn from one. Poe's Marie Roget, built on a real New York killing, was cut from the spine
  partly for that reason.
- **Horror** goes to Fright Night. `doyle-hound-of-the-baskervilles` is in because the spectral
  hound is a crime with a rational solution, not a monster.
- **Spies** go to Spy Games. No spy novel is in the 30.

Two edges were argued rather than assumed:

- **`highsmith-talented-mr-ripley`** is a crime novel told from the killer's side, with no
  detective worth the name. It is in because the rule admits crime novels as well as detective
  stories, and Ripley is as famous a creation as any sleuth here.
- **`tartt-the-secret-history`** is a "whydunit": the reader is told the killing on the first
  page. It is in on the same reading of the rule. Both it and Ripley are the first to swap out
  if the scope is ever read strictly as detection.

## The 30

| Year | Slug                                          |                |
| ---: | --------------------------------------------- | -------------- |
| 1841 | `poe-murders-rue-morgue`                      | NEW            |
| 1852 | `dickens-bleak-house-inspector-bucket`        | foothold · NEW |
| 1859 | `collins-woman-in-white`                      | NEW            |
| 1868 | `collins-the-moonstone`                       | NEW            |
| 1887 | `doyle-study-in-scarlet-holmes`               | foothold · NEW |
| 1891 | `holmes-strand-scandal-in-bohemia`            | foothold · NEW |
| 1902 | `doyle-hound-of-the-baskervilles`             | foothold · NEW |
| 1907 | `leroux-mystery-of-the-yellow-room`           | NEW            |
| 1910 | `chesterton-father-brown-debut`               | NEW            |
| 1920 | `christie-poirot-debut-styles`                | foothold · NEW |
| 1923 | `sayers-lord-peter-wimsey-debut`              | NEW            |
| 1926 | `christie-murder-of-roger-ackroyd`            | foothold · NEW |
| 1930 | `hammett-the-maltese-falcon`                  | foothold · NEW |
| 1934 | `christie-murder-on-the-orient-express-novel` | foothold · NEW |
| 1939 | `chandler-the-big-sleep-marlowe`              | NEW            |
| 1947 | `spillane-mike-hammer-i-the-jury`             | NEW            |
| 1949 | `macdonald-lew-archer-moving-target`          | NEW            |
| 1955 | `highsmith-talented-mr-ripley`                | NEW            |
| 1962 | `james-dalgliesh-cover-her-face`              | NEW            |
| 1975 | `dexter-inspector-morse-debut`                | NEW            |
| 1980 | `eco-the-name-of-the-rose`                    | NEW            |
| 1982 | `grafton-a-is-for-alibi`                      | NEW            |
| 1990 | `cornwell-scarpetta-postmortem`               | NEW            |
| 1992 | `tartt-the-secret-history`                    | NEW            |
| 1998 | `mccall-smith-no1-ladies-detective-agency`    | NEW            |
| 2003 | `brown-the-da-vinci-code`                     | foothold · NEW |
| 2005 | `larsson-girl-with-the-dragon-tattoo`         | NEW            |
| 2012 | `flynn-gone-girl`                             | NEW            |
| 2013 | `galbraith-cormoran-strike-debut`             | foothold · NEW |
| 2020 | `osman-thursday-murder-club`                  | NEW            |

All 30 were authored for this theme. The catalogue held no card naming any of the spine's
beats: before this deck, detective fiction was absent from it.

Gates: size **30**, band 0 **10**, bins **4/8** (advisory), same-year pairs **0**, bunching
**3 in 1902-1910** (the limit), shared **0** with any earlier theme. A card's band moves
whenever the catalogue around its year does, so re-measure rather than trust these figures:

```bash
npm run theme:gap -- --slugs <the 30 above, comma-separated>
```

## Years that needed a choice

A serialised novel has two candidate years. The deck takes the one most readers would recognise
as the book's arrival:

- `collins-woman-in-white` is 1859, when the serial began; the book came in 1860.
- `doyle-hound-of-the-baskervilles` is 1902, the book; the Strand serial began in 1901.
- `leroux-mystery-of-the-yellow-room` is 1907, the serial; the book came in 1908.
- `hammett-the-maltese-falcon` is 1930, the book; the Black Mask serial began in 1929.
- `christie-poirot-debut-styles` is 1920, the US first edition; the UK edition followed in 1921.
- `eco-the-name-of-the-rose` and `larsson-girl-with-the-dragon-tattoo` take the original-language
  year (1980, 2005), not the English one.

## Regions

Written works are tagged where they were written, or the author's base at the time, never the
setting (the regions spec). So Rue Morgue is United States, not France, and the Orient Express
is United Kingdom. The audit's five flags (India, Belgium, the United States, Botswana, Europe)
are characters' nationalities and settings, left out on purpose. Highsmith's Ripley is tagged
Italy from the author's base in Positano; no source confirmed where the book was drafted.

## Deliberate omissions

Cut from the 38-beat spine: Voltaire's Zadig (1747, a philosophical tale, not a crime novel),
Godwin's Caleb Williams (1794), Poe's Marie Roget (1842, a year after Rue Morgue with the same
sleuth), Gaboriau's Lerouge Case (1866, two years from The Moonstone), The Leavenworth Case
(1878), Trent's Last Case (1913, the 1902-1910 stretch is already at the bunching limit),
Inspector Wexford (1964) and Rebus (1987), both for spacing. The spine writer had already left
out Perry Mason, Miss Marple, Nancy Drew, Maigret, Cadfael and And Then There Were None to stay
inside the bunching cap.

## Fact-check flags still open

- `cornwell-scarpetta-postmortem`: the description says the novel launched "the forensic crime
  novel boom". The year and plot are confirmed; the sources praise its forensic detail but do
  not support the boom claim.
