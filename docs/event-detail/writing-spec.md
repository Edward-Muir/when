# Writing event detail

The voice rules for the long-form prose behind a placed card. The mechanism and the design
decisions are in [index.md](index.md); the authoring workflow, and the same rules restated for
someone about to write a batch, are in
[.claude/skills/write-event-detail/SKILL.md](../../.claude/skills/write-event-detail/SKILL.md).

Shape is enforced by [`scripts/events/detail-spec.js`](../../scripts/events/detail-spec.js), which
`src/utils/eventDetailCorpus.test.ts` runs over the whole corpus and `detail-apply.js` runs before
it writes anything. Everything that file cannot check is below and nowhere else.

## What this text is

Two or three paragraphs shown when a player turns over a card they have **already placed**. It
replaces the card's one-sentence `description`, which the player read one tap ago.

It is not an encyclopaedia entry and not a summary. The card has already said what the event was.
This is the part that makes them glad they tapped.

## Dates are allowed here, and wanted

`description` and `friendly_name` may never state a year, decade or century, because both are shown
to a player who has not placed the card yet and the date is the answer. **That rule does not apply
to this text.** Detail prose is unreachable until the year is already revealed: the gate is
`showsProseFor` in `GamePopup.tsx`, pinned by `GamePopup.test.tsx`.

So write dates freely and precisely. "On the morning of 7 April 1994" beats "the morning after".
Half the value of this text is the chronological texture the puzzle has to withhold: what else was
happening that year, how long the thing actually took, how much later the consequence landed. Write
around dates and the feature is wasted.

Detail prose is deliberately absent from `CLUE_FIELDS` in `scripts/events/date-clues.js`. Do not
add it.

## The band

|               |                                                    |
| ------------- | -------------------------------------------------- |
| Paragraphs    | **2-3**                                            |
| Per paragraph | **240-520 characters**                             |
| Total         | **620-1,250 characters**                           |
| Target        | ~900 characters, about 200 words, a 45-second read |

The reading surface is a 476px scroll region, roughly 20 lines at a 402px-wide phone, so ~900
characters is about 1.3 screens once the image has scrolled away. The total ceiling binds on three
paragraphs and the total floor binds on two, so neither a padded wall nor a two-stub entry passes.

**Do not write to the ceiling.** An entry that stops at 700 characters because it has said what it
has to say is better than one padded to 1,200.

## Rule 1: the first sentence carries the entry

The player has just placed a card they already knew something about. The first sentence has to hand
them something they did not have.

At 5,460 entries the risk is not that one is bad, it is that they all read the same. A spec that
says "open with an interesting hook" reliably produces one formula repeated 5,460 times. So the
rule names **kinds** of opening, and a batch may not lean on one kind repeatedly.

**A. The correction.** The famous version is wrong, or stops too early.

> Nobody signed Magna Carta. John sealed it in wax, most of the barons present could not write, and
> the document was annulled by the Pope within ten weeks.

**B. The near-miss.** It came very close to not happening.

> The Apollo 11 landing radar threw two program alarms in the last four minutes, and a
> twenty-six-year-old in Houston named Steve Bales had eighteen seconds to decide whether they
> meant abort.

**C. The unguessable consequence.** What it actually caused, which is not what anyone would guess.

> Mali was not on any European map before Mansa Musa left for Mecca. It was on the Catalan Atlas
> fifty years later.

**D. The person at the edge of the frame.** Not the famous one.

> The man who kept the Rosetta Stone from being shipped to Paris was a Royal Navy officer with no
> interest in Egyptian at all.

**E. The mundane cause.** The small practical reason behind the grand effect.

> Broughton wrote boxing's first rules because he had killed a man in the ring two years earlier
> and wanted to go on fighting.

**F. The plain lead.** A specific, checkable fact stated with no turn at all. This is the kind the
register carve-out (Rule 5) requires, and it is a hook rather than the absence of one.

> On the afternoon of 13 April 1919, thousands gathered in the walled garden at Amritsar for a
> meeting the British administration had banned.

What all six share is a **specific, checkable, slightly surprising fact**. What they avoid:

> ❌ The Battle of Marathon was one of the most significant battles of the ancient world.
> ❌ Few events have shaped the modern world as profoundly as the invention of the transistor.
> ❌ It is hard to overstate the importance of the printing press.

Those are throat-clearing about importance, not hooks. **If the first sentence would fit another
event with the nouns swapped, it is wrong.**

## Rule 2: do not restate the `description`

The `description` is on screen until the moment the card is placed. Repeating it in paragraph one
tells the player their tap bought nothing.

`mansa-musa-pilgrimage`, description: _"The Malian emperor's hajj to Mecca displayed such wealth it
caused inflation in Egypt."_

> ❌ Mansa Musa's pilgrimage to Mecca in 1324 was so lavish that it caused inflation in Cairo.
>
> ✅ Mali was not on any European map before Mansa Musa left for Mecca in 1324. It was on the
> Catalan Atlas of 1375, where a robed king sits below the Sahara holding a gold nugget, drawn by a
> cartographer working from stories that had travelled north through Cairo.

Extending the description's fact is fine. Repeating it is not. Enforced mechanically: a run of
**seven consecutive words** shared with the event's own `description` fails the entry, in any
paragraph, not just the first.

This bans repeating the description's **sentence**, not its **subject**. Where the description
holds the central number, usually a disaster's death toll, the prose may and often should come back
to it: break it down, give the contested range, say how it was counted. What it may not do is tell
the player the same thing again in the same shape.

And never describe the card art. No "pictured", "depicted", "the image shows". Players can see it.

## Rule 3: difficulty is not depth

`difficulty` grades how hard a card is to **place**, which is recognition and inferability. It says
nothing about how much record exists. `first-boxing-rules-broughton` is `very-hard` and has a
documented life behind it; `first-moon-landing` is `easy` and so is its research.

**Write a `very-hard` card at the same length and depth as an `easy` one.** Roughly 2,600 of the
5,460 events are `hard` or `very-hard`. Treating them as thin would hollow out half the corpus.

## Rule 4: when the record itself is thin, widen the lens

A few events genuinely have little specific record: early antiquity, "first recorded X" events
where the event _is_ a record rather than a moment, processes that happened over centuries.

The answer is never to pad and never to invent. It is to widen the lens onto what **is** well
attested: the institution, the place, what it replaced, what it made possible, how we know at all.

`first-recorded-cricket` (1611): almost nothing is known about the match. But the record itself is a
Sussex court case prosecuting two men for playing on a Sunday instead of going to church, which is
both true and far better than a padded paragraph on the origins of bat-and-ball games.

The lens has a stop on it: **every paragraph must come back to the card's own event.** Context that
widens and never returns is padding wearing a better coat.

There is **no exemption**. Every event gets an entry. `detail-report.js` demands 5,460 of 5,460 and
that is the merge gate.

## Rule 5: register, and the carve-out

**The voice is an interesting museum plaque.** Not a chatty blog, not an encyclopaedia entry, not a
tour guide. Authoritative without being stiff, plain without being flat, written by someone who
knows far more than the space allows and has picked the three things worth the space.

Museum-label practice lines up with the rules above, which is why it is the anchor rather than a
mood:

- A label **refers to the object in front of the visitor.** Every paragraph comes back to the
  card's own event (Rule 4's stop).
- It **assumes no prior knowledge and does not talk down.** No "as we all know", no explaining what
  a treaty is.
- It is **concrete**: names, dates, quantities, materials, distances. A plaque that says an object
  is significant has wasted its space. One that says what it is made of and who carried it has not.
- It is **short because attention is short**, and it stops when it has said the thing.
- **Active voice, plain verbs.** "Dyer marched fifty riflemen to the only exit", not "riflemen were
  positioned at the exit".

### The carve-out

**"Find an interesting hook" is actively wrong for atrocities, genocide, slavery and deaths**, and
those are well represented in the catalogue. This is a rule rather than a tone adjective, because
writers fail at the boundary rather than at the extremes:

- State what happened plainly, first, with no reversal and no twist. Hook kind **F**.
- No irony. No "remarkably", no "astonishingly".
- A death toll is never the surprise at the end of a sentence.
- The correction hook is still available, but only where it adds gravity rather than removing it.
  That the killing was planned in advance is a correction worth making. That a famous detail is a
  myth is not the thing to lead with.

A gallery about an atrocity has a plaque too, and it is exact, unshowy and unironic. The carve-out
is the house style applied honestly, not an exception to it.

Three graded cases, because the boundary is what needs showing:

**A mass-casualty disaster** — `krakatoa-eruption`. The full range is available. The deaths are
still stated plainly rather than deployed.

**Deaths inside contested politics** — `boston-massacre`. The famous version really is wrong: the
soldiers were acquitted, defended by John Adams. Saying so is legitimate and interesting. Five men
still died. Correct the record about the trial; do not be clever about the shooting.

**An atrocity** — `rwandan-genocide`.

> ❌ Remarkably, the fastest killing campaign in modern history needed no modern weapons at all.
>
> ✅ The killing began on 7 April 1994, the morning after the president's plane was shot down over
> Kigali, and it was not spontaneous: lists of names had been drawn up in advance, the radio
> station RTLM had spent months naming targets on air, and machetes had been imported by the
> container-load the year before.

Both open with the same underlying fact. The first one performs it.

## Rule 6: what may be asserted

The failure that scales worst is confident fabrication, and nothing in the pipeline catches it.

- **Write only what you would stake without a link.** A shorter honest entry beats a
  specific-sounding invented one.
- **Specifics are the point; inventing them is the sin.** A figure, distance, sum or name that is
  well attested is exactly what the player tapped for, so write it. One that has to be reached for
  is not to be softened into vagueness, it is to be **cut**. The test is provenance, not precision.
- **Never invent** a casualty figure, a quotation, a named individual, or the date of a subsidiary
  event.
- **Attribute contested claims rather than asserting them.** `mongol-black-death-spread`: the story
  that the Mongols catapulted plague corpses into Caffa comes from a single account by Gabriele de'
  Mussi, who was not there, and historians disagree about whether it spread anything. Write "a
  single contemporary account, by a notary who was not present, says", not "the Mongols catapulted".
  Vague attribution is not the same thing and is banned: "experts say" and "widely regarded as"
  launder a claim instead of sourcing it.
- **Attribution beats the band.** Hedging a contested figure costs characters a bare number does
  not, and the entry pays that cost. When Rule 6 and the length band collide, **a paragraph goes**,
  never the attribution.

### The `wikipedia_url` trap

1,830 of the 5,460 events carry an undeclared `wikipedia_url` alongside `wikipedia_views`. It is a
**lead, not a source**, and at least one is simply wrong:

```
battle-megiddo   year -1457   https://en.wikipedia.org/wiki/Battle_of_Megiddo_(1918)
```

That card is the 1457 BCE battle where Thutmose III took the Aruna pass. The link is the 1918 one.
A spec that said "check the linked article" would launder that error into the corpus.

So: before using a linked article, **confirm its year, place and actors match the card**. Never cite
it in the prose.

## Rule 7: the game's own bans

| Banned                                    | Why                                         |
| ----------------------------------------- | ------------------------------------------- |
| Second person (`you`, `your`)             | It is prose, not a tour guide               |
| Question marks                            | Kills "Did you know" and rhetorical openers |
| "Pictured", "depicted", "the image shows" | Never describe the card art                 |
| A 7-word run shared with `description`    | Rule 2                                      |
| Not ending in terminal punctuation        | Catches truncated generations               |
| "PLACEHOLDER" outside a flagged entry     | Lorem escaping into real prose              |

## Rule 8: the machine tells

This corpus will be written mostly by language models, and the thing that will make 5,460 entries
read as machine-written is not a factual error. It is a set of vocabulary and sentence habits every
model shares. They are catalogued, so the corpus bans them rather than hoping.

**Punctuation and typography.** No em dash (—) and no en dash (–), anywhere, for any purpose. The em
dash is the single most recognisable tell, and everything it does a comma, a colon, a semicolon or a
full stop does without the signature. Straight quotes and straight apostrophes only.

**Banned constructions.**

| Pattern                                                              | The tell                                                                            |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| "Not just X, but Y" / "Not only … but also" / "It is not X, it is Y" | _not merely a battle, but a statement of intent_                                    |
| Copula avoidance                                                     | _serves as_, _stands as_, _functions as_ → "was"                                    |
| Trailing participial summary clause                                  | _…, cementing his reputation_                                                       |
| Vague attribution                                                    | _experts say_, _widely regarded as_                                                 |
| The legacy closer                                                    | _paved the way_, _turning point_, _lasting legacy_, _to this day_, _would go on to_ |
| Critic-speak                                                         | _load-bearing_, _does the heavy lifting_                                            |
| Rule of three                                                        | Three adjectives or three clauses by reflex rather than because there are three     |

**Banned vocabulary.** delve, tapestry, pivotal, crucial, underscore, showcase, intricate,
meticulous, vibrant, robust, boasts, nestled, groundbreaking, renowned, multifaceted, foster,
enhance, interplay, deep dive, "beacon of", "realm of", "in the heart of", "rich history",
"a testament to", arguably, "it is worth noting", and sentence-initial Notably / Indeed / Ultimately
/ Moreover / Furthermore.

Most of these are Rule 1's throat-clearing in better clothes. A plaque that calls something pivotal
has used a word instead of a fact.

### These were measured before being adopted

A ban that fires on good historical writing would block Phase 3 for 137 batches, so every pattern
was first run against all 5,460 existing `description` and `friendly_name` strings.

**20 of the 37 candidates have zero precedent in the catalogue at all**: every dash and quote rule,
the "not just X but Y" parallelism, delve, tapestry, robust, boasts, nestled, multifaceted, "serves
as", "paved the way", "lasting legacy", "would go on to", and the rest. The remainder hit between 1
and 9 times each (_pivotal_ 3, _renowned_ 9, _showcase_ 9, _turning point_ 3), all in descriptions
written years ago to a different standard and none being rewritten. A non-zero count means
"plausible enough English that a writer will reach for it", which argues for the ban rather than
against it.

One candidate was dropped for noise: a broad participial-clause regex at 39 hits, narrowed to seven
verbs, which brings it to 17 and none in prose written to this spec. Each pattern in
`detail-spec.js` carries its measured count in a comment so nobody re-litigates it blind.

**This ban list applies to event prose only**, not to this repository's own documentation, which
uses em dashes as house style throughout. Do not go "fixing" the docs.

Sources: [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
(the best of them, and in this exact genre: editors cataloguing what they revert on historical
articles), [Pangram](https://www.pangram.com/signs-of-ai-writing) for frequency data,
[Jodie Cook's ban list](https://www.jodiecook.com/ban-list/) and
[Forbes on ChatGPT-isms](https://www.forbes.com/sites/aytekintank/2026/03/31/how-to-avoid-chatgpt-isms-in-your-writing-and-your-teams-too/)
for the parallelism. The museum register comes from the
[Smithsonian Guide to Interpretive Writing for Exhibitions](https://exhibits.si.edu/wp-content/uploads/2021/09/SI-Guide-to-Interpretive-Writing-for-Exhibitions.pdf)
and [Museums Galleries Scotland](https://www.museumsgalleriesscotland.org.uk/advice-article/creating-interpretive-text/).

## Shape

Roughly, and not a template to fill:

1. **The hook and the thing itself.** Open per Rule 1, then land what actually happened, with dates.
2. **The texture.** The detail, the contest, the people, the mechanism. Where hedging lives.
3. **What it left behind** (optional, and the reason two paragraphs is legal). The consequence, the
   argument still running, the thing that can still be gone and looked at.

Three paragraphs when the third earns itself, two when it does not.

**Be warned that three is the attractor.** Four out of four sub-agent entries came back at three
paragraphs without being asked, and so did **all ten** of the hand-written calibration entries,
written by someone who had just written this rule. Two is legal and right for a genuinely thin
event, but do not expect to produce many, and do not pad to three to look consistent.

The same goes for the floor. The ten calibration entries run 900 to 1,039 characters, median 963,
so in practice the band's working range is the top half of it. The 620 floor exists to reject
stubs rather than to describe a target, and it earned its place: it caught a 223-character
paragraph in the calibration set that wanted one more concrete fact.

## The calibration set

Ten entries were hand-written against this spec and read back cold against it. They are the corpus's
first real prose, and they are the gold set: read them before writing a batch.

| Slug                           | Year   | What it calibrates                                    |
| ------------------------------ | ------ | ----------------------------------------------------- |
| `moon-forming-impact`          | -4.5bn | No human actors; a hypothesis, so hedging             |
| `battle-megiddo`               | -1457  | The wrong `wikipedia_url`                             |
| `construction-hagia-sophia`    | 537    | The famous version is incomplete: the dome fell       |
| `mansa-musa-pilgrimage`        | 1324   | Description holds the famous fact, so restatement     |
| `mongol-black-death-spread`    | 1346   | A disputed claim, attributed rather than asserted     |
| `first-boxing-rules-broughton` | 1743   | `very-hard` written at full depth (Rule 3)            |
| `boston-massacre`              | 1770   | Deaths inside contested politics, the middle register |
| `krakatoa-eruption`            | 1883   | Mass-casualty disaster register                       |
| `transistor-invented`          | 1947   | The unguessable-consequence hook                      |
| `jallianwala-bagh-massacre`    | 1919   | The atrocity carve-out                                |

`jallianwala-bagh-massacre` is in the set because of what it cost. A first draft ran to 1,428
characters, over both the per-paragraph and the total cap, because attributing a contested death
toll (379 by the official inquiry, above a thousand by the Congress inquiry) costs characters that
a bare number does not. The fix was to drop a paragraph, the one following the story forward to
1940, and keep the attribution. That is now Rule 6's last line.
