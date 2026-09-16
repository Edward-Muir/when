---
name: write-event-detail
description: Write the long-form detail prose shown when a placed card is turned over. Use when writing, reviewing or batch-generating event detail text, or working in public/events/detail/.
---

# Writing Event Detail

The 2-3 paragraphs behind a **placed** card. Full rules and the reasoning:
[docs/event-detail/writing-spec.md](../../../docs/event-detail/writing-spec.md). Design and
mechanism: [docs/event-detail/index.md](../../../docs/event-detail/index.md).

This skill is the working version: the rule, why it exists in game terms, what enforces it, and a
right-vs-wrong pair.

## The one thing to understand first

The card's short `description` may never state a date, because it is shown to a player who has not
placed the card yet and **the date is the answer**. Detail prose is different: it cannot be reached
until the card is placed and the year is already on screen.

**So dates are allowed here, and wanted.** Every writer arrives assuming otherwise because the
no-dates rule is stated everywhere else in this repo. Write years, months, durations and "eleven
years later" freely. Writing around dates wastes the whole feature.

The gate is `showsProseFor` in `src/components/GamePopup.tsx`, pinned by `GamePopup.test.tsx`. Do
**not** add detail text to `CLUE_FIELDS` in `scripts/events/date-clues.js`.

## Entry format

One entry per event, keyed by slug, in a map file:

```json
{
  "battle-megiddo": {
    "paragraphs": [
      "First paragraph, 240-520 characters.",
      "Second paragraph, 240-520 characters.",
      "Optional third."
    ]
  }
}
```

| Field        | Rule                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `paragraphs` | 2-3 strings. No newlines inside one. No leading/trailing whitespace. |

`has_detail` on the event record is written by `detail-apply.js` in the same pass. **Never set it
by hand** — a flag without prose is a card that falls back to its description after a failed fetch,
and prose without a flag is writing nobody can reach.

## The band

|               |                                                    |
| ------------- | -------------------------------------------------- |
| Paragraphs    | 2-3                                                |
| Per paragraph | 240-520 characters                                 |
| Total         | 620-1,250 characters                               |
| Target        | ~900 characters, about 200 words, a 45-second read |

The reading surface is a 476px scroll region, about 20 lines on a 402px phone. Enforced by
`scripts/events/detail-spec.js`; `src/utils/eventDetailCorpus.test.ts` runs it over the corpus.

**Do not write to the ceiling.** 700 characters that have said the thing beats 1,200 padded.

## Rule 1: the first sentence carries the entry

**Why:** the player just placed a card they already knew something about. If the first sentence
tells them what they already had, the tap bought nothing. At 5,460 entries the real risk is that
they all read the same, so vary the _kind_ of opening across a batch.

Six kinds: **A** the correction (the famous version is wrong), **B** the near-miss, **C** the
unguessable consequence, **D** the person at the edge of the frame, **E** the mundane cause,
**F** the plain lead (required by the carve-out, Rule 5).

```
❌ The Battle of Marathon was one of the most significant battles of the ancient world.
✅ Nobody signed Magna Carta. John sealed it in wax, most of the barons present could not
   write, and the document was annulled by the Pope within ten weeks.
```

**The test: if the first sentence would fit another event with the nouns swapped, it is wrong.**

## Rule 2: do not restate the `description`

**Why:** the `description` is on screen until the moment the card is placed. Repeating it is the
most likely way to make this feature feel pointless.

**Enforced:** a run of **7 consecutive words** shared with the event's own `description` fails the
entry, in any paragraph. `detail-spec.js`.

`mansa-musa-pilgrimage` — description: _"The Malian emperor's hajj to Mecca displayed such wealth
it caused inflation in Egypt."_

```
❌ Mansa Musa's pilgrimage to Mecca in 1324 was so lavish that it caused inflation in Cairo.
✅ Mali was not on any European map before Mansa Musa left for Mecca in 1324. It was on the
   Catalan Atlas of 1375, where a robed king sits below the Sahara holding a gold nugget.
```

This bans repeating the **sentence**, not the **subject**. Where the description holds the central
number (a disaster's death toll, usually), come back to it: break it down, give the contested
range, say how it was counted.

Never describe the card art. Players can see it.

## Rule 3: difficulty is not depth

**Why:** `difficulty` grades how hard the card is to **place** (recognition), not how much record
exists. Roughly 2,600 of 5,460 events are `hard` or `very-hard`; treating those as thin hollows out
half the corpus.

Write a `very-hard` card at the same length and depth as an `easy` one.
`first-boxing-rules-broughton` is `very-hard` and has a documented life behind it.

## Rule 4: when the record is thin, widen the lens

**Why:** forcing two paragraphs out of an event you know one sentence about is exactly the pressure
that produces fabrication.

Never pad, never invent. Widen onto what **is** attested: the institution, the place, what it
replaced, what it made possible, how we know at all.

```
Event: first-recorded-cricket (1611). Almost nothing is known about the match.
❌ A padded paragraph on the origins of bat-and-ball games.
✅ The record is a Sussex court case prosecuting two men for playing on a Sunday instead of
   going to church.
```

**The lens has a stop: every paragraph must come back to the card's own event.** Context that
widens and never returns is padding.

There is no exemption. Every event gets an entry; `detail-report.js` demands 5,460 of 5,460.

## Rule 5: the voice is an interesting museum plaque

**Why:** a plaque is written by someone who knows far more than the space allows and has picked the
three things worth the space. That is exactly this job.

Concrete over significant. Active voice. Assumes no prior knowledge, does not talk down. Stops when
it has said the thing.

```
❌ Riflemen were positioned at the garden's only exit.
✅ Dyer marched roughly fifty riflemen to the garden's only usable exit.
```

### The carve-out: atrocities, genocide, slavery, deaths

**"Find an interesting hook" is actively wrong here**, and these are well represented in the
catalogue. Use hook kind **F**, the plain lead.

- State what happened plainly, first. No reversal, no twist.
- No irony. No "remarkably", no "astonishingly".
- **A death toll is never the surprise at the end of a sentence.**
- The correction hook is available only where it adds gravity. That the killing was planned in
  advance is worth correcting; that a famous detail is a myth is not the thing to lead with.

```
❌ Remarkably, the fastest killing campaign in modern history needed no modern weapons at all.
✅ The killing began on 7 April 1994, the morning after the president's plane was shot down
   over Kigali, and it was not spontaneous: lists of names had been drawn up in advance.
```

Both open with the same fact. The first one performs it. A gallery about an atrocity has a plaque
too, and it is exact, unshowy and unironic.

## Rule 6: what may be asserted

**Why:** confident fabrication is the failure that scales worst, and nothing in the pipeline
catches it.

- Write only what you would stake **without a link**.
- **Specifics are the point; inventing them is the sin.** A well-attested figure or distance is
  what the player tapped for. One you have to reach for gets **cut**, not softened into vagueness.
- Never invent a casualty figure, a quotation, a named individual, or a subsidiary date.
- Attribute contested claims. Vague attribution is banned and is not the same thing:

```
❌ Experts say the Mongols catapulted plague corpses into Caffa.
✅ A single contemporary account, by a notary who was not present, says the Mongols catapulted
   plague corpses over the walls.
```

- **Attribution beats the band.** When hedging a contested figure pushes the entry over the
  ceiling, **drop a paragraph, never the attribution.**

### The `wikipedia_url` trap

1,830 events carry an undeclared `wikipedia_url`. It is a **lead, not a source**, and at least one
is wrong:

```
battle-megiddo   year -1457   .../wiki/Battle_of_Megiddo_(1918)
```

That card is the 1457 BCE battle. The link is the 1918 one. **Confirm a linked article's year,
place and actors match the card before using it.** Never cite it in the prose.

## Rule 7 and 8: the hard bans

All enforced in `scripts/events/detail-spec.js`, so a batch cannot land carrying them.

**Game rules:** no second person (`you`, `your`), no question marks, no describing the card art, no
7-word run shared with the `description`, must end in terminal punctuation.

**No em dashes (—) or en dashes (–), ever.** Single most recognisable machine tell; a comma, colon,
semicolon or full stop does the same work. Straight quotes and apostrophes only.

**Banned constructions:** "not just X, but Y"; copula avoidance (_serves as_, _stands as_ — use
"was"); trailing participial summary (_…, cementing his reputation_); vague attribution (_experts
say_, _widely regarded as_); legacy closers (_paved the way_, _turning point_, _lasting legacy_,
_to this day_, _would go on to_); critic-speak (_load-bearing_, _does the heavy lifting_); the rule
of three by reflex.

**Banned vocabulary:** delve, tapestry, pivotal, crucial, underscore, showcase, intricate,
meticulous, vibrant, robust, boasts, nestled, groundbreaking, renowned, multifaceted, foster,
enhance, interplay, deep dive, "beacon of", "realm of", "in the heart of", "rich history", "a
testament to", arguably, "it is worth noting", and sentence-initial Notably / Indeed / Ultimately /
Moreover / Furthermore.

Every ban was measured against all 5,460 existing descriptions before adoption; 20 of 37 have zero
precedent in the catalogue. See the spec for the counts.

## Workflow for a batch

### 1. Get the worklist

```bash
node scripts/events/detail-report.js --chunks
```

Writes 40-event chunks to `untracked_data/event-detail/worklist/<shard>-NNN.json`, each holding
slugs, titles, years, categories, difficulties and existing descriptions. Smallest shard first.

### 2. Read the gold set

The ten calibration entries listed at the end of the spec are the corpus's first real prose. Read
them before writing. They transmit tone better than any amount of rule text.

### 3. Write a map file, never a shard

Write `untracked_data/event-detail/batch-NNN.json` as `slug -> { paragraphs }`.

**Never edit `public/events/detail/*.json` directly.** Parallel agents editing a shared 600 KB JSON
array corrupt it; this repo has already paid for that lesson once.

### 4. Apply

```bash
node scripts/events/detail-apply.js --dry-run     # validate without writing
node scripts/events/detail-apply.js batch-001.json
```

Validates the whole merged map first and **refuses the entire run on one bad entry**, so a
half-applied batch is unreachable. Writes the prose and `has_detail` together.

### 5. Verify

```bash
npm run typecheck && npm run lint
CI=true npm test -- --watchAll=false eventDetailCorpus
CI=true npm run build
node scripts/events/detail-report.js             # progress meter; non-zero until 5,460/5,460
```

### 6. Read five at random, cold, against the spec

**Drift is the failure mode here, not corruption** — the scripts already make corruption hard. Check
specifically: are the hooks all the same kind, and did every entry come back at three paragraphs.

## Common Mistakes to Avoid

1. **Writing around dates** — they are allowed here and wanted. This is the most common one.
2. **Restating the `description` in paragraph one** — fails `eventDetailCorpus.test.ts` on the
   7-word run check
3. **An em dash** — fails `eventDetailCorpus.test.ts`. Use a comma, colon or full stop
4. **A curly apostrophe** pasted from a source — fails the same check
5. **Opening with importance** ("one of the most significant…") instead of a fact
6. **A hook on an atrocity** — the carve-out requires the plain lead
7. **Padding a thin event to reach the floor** instead of widening the lens, or inventing to fill it
8. **Treating a `very-hard` card as having less to say** — difficulty is placement, not record
9. **Trusting `wikipedia_url`** without checking the year and actors match the card
10. **Writing to the 1,250 ceiling** because the room is there
11. **Three paragraphs every time** — it is the attractor; two is legal and often right
12. **Editing a shard directly** instead of a map file, or setting `has_detail` by hand
13. **Cutting the attribution to fit the band** — drop a paragraph instead
