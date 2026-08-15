# Difficulty Grading Rubric v3

## Overview

This rubric grades historical events for the "When" timeline game.

Since v1.7.0 the `difficulty` label is no longer the final word on how hard a card is. It is one input to a composite score in `src/utils/difficultyScore.ts`:

```
C = 0.6 · recognition(label) + 0.4 · crowding(timeline density)
```

Cards are then sorted into four bands by the global quartiles of `C`, and `src/utils/deckBuilder.ts` composes the opening 24 cards from those bands. So the label feeds a function; it does not decide a card's fate on its own.

That split is what changed between v2 and v3 of this rubric. **Three signals were previously tangled together, and only two of them belong in the label:**

| Signal           | What it asks                                       | Who owns it                |
| ---------------- | -------------------------------------------------- | -------------------------- |
| **Recognition**  | Does a general audience know this event?           | **the label**              |
| **Inferability** | Do the name and description give temporal anchors? | **the label**              |
| **Crowding**     | How many other events sit near it in time?         | **computed, never graded** |

Rubric v2 called dimension 2 "placeability" and folded crowding into it. `difficultyScore.ts` independently computes crowding and _also_ called it placeability. They were never the same thing, but the overlap invited double-counting. v3 renames dimension 2 to **inferability** and removes crowding from the grader's job entirely.

> **Do not grade crowding.** Never mark an event harder because "that era is busy" or "lots happened around then". That is measured from the year distribution, it updates itself as events are added, and grading it by hand both double-counts it and goes stale. Grade only what is on the card.

The key insight still stands: **an obscure event with strong contextual clues is easier than a famous event whose name gives nothing away.**

## The Two Dimensions of Difficulty

### 1. Recognition (Do players know this event?)

| Level    | Description                                        | Examples                                        |
| -------- | -------------------------------------------------- | ----------------------------------------------- |
| High     | Taught in most schools worldwide                   | WWII, Moon Landing, Fall of Rome                |
| Medium   | Known to history enthusiasts or regional audiences | Thirty Years' War, Meiji Restoration            |
| Low      | Specialized knowledge required                     | Treaty of Tordesillas, Defenestration of Prague |
| Very Low | Only experts would recognize                       | Social War (Rome), Diet of Roncaglia            |

Recognition means a _general_ audience, not a historian. Judge it against someone who finished secondary school and reads the news — not against yourself.

### 2. Inferability (Can players reason out the era from the card?)

Judge this from the `friendly_name` and `description` **only** — that is all the player sees.

| Level    | Description                                    | Examples                                                |
| -------- | ---------------------------------------------- | ------------------------------------------------------- |
| High     | Name/description gives strong temporal anchors | "End of WWI" → 1918, "Roman Republic founded" → ancient |
| Medium   | Some clues narrow the era                      | "Italian allies vs Rome" → ancient/Roman period         |
| Low      | Few contextual clues                           | "Treaty signed" with no era indicators                  |
| Very Low | Misleading or no temporal context              | Generic names that could be any era                     |

Inferability is about _which era_, not _which year_. "This is clearly the Roman Empire, but I couldn't tell you the decade" is **high** inferability — narrowing a card to a 400-year window is a large win for the player. How much that window helps is exactly what the crowding term scores, and it is not your problem.

## Difficulty Matrix

|                          | High Inferability | Medium Inferability | Low Inferability |
| ------------------------ | ----------------- | ------------------- | ---------------- |
| **High Recognition**     | Easy              | Easy                | Medium           |
| **Medium Recognition**   | Easy              | Medium              | Hard             |
| **Low Recognition**      | Medium            | Hard                | Very Hard        |
| **Very Low Recognition** | Hard              | Very Hard           | Very Hard        |

## Contextual Clues That REDUCE Difficulty

Even obscure events become easier when the description contains:

### Strong Anchors (reduce difficulty by 1-2 levels)

- References to well-known empires: Rome, Byzantine, Ottoman, British Empire
- References to well-known figures: Napoleon, Caesar, Alexander, Queen Victoria
- References to well-known wars: WWI, WWII, Napoleonic Wars, American Civil War
- Technology markers: "first airplane", "invention of printing", "steam engine"
- Explicit era references: "medieval", "Victorian", "Renaissance"

### Medium Anchors (reduce difficulty by 1 level)

- Country names that imply era (e.g., "Prussia" → 18th-19th century)
- Religious context: "Reformation", "Crusade", "Papal"
- Colonial references: implies 16th-20th century
- Industrial/factory references: implies post-1750

### Weak Anchors (minor reduction)

- Geographic clues without temporal context
- Generic political terms (treaty, alliance, war)

## Difficulty Definitions

Targets are a **calibration anchor for a category, not a quota**. See "Targets are not quotas" below.

### Easy

- **Target**: ~20% of events
- Events most people learned in school OR obscure events with very strong temporal anchors
- Examples:
  - "World War II Ends" (universal knowledge)
  - "Fall of the Western Roman Empire" (famous + clear era)
  - "Social War - Italian allies vs Rome for citizenship" (obscure but Rome = ancient)

### Medium

- **Target**: ~35% of events
- History enthusiast knowledge OR less famous events with moderate context
- Examples:
  - "Thirty Years' War begins" (European history buffs know this)
  - "First Crusade launched" (moderate recognition + medieval anchor)
  - "Suez Canal Opens" (widely known, and "canal" anchors to the industrial era)

### Hard

- **Target**: ~35% of events
- Specialized knowledge with limited contextual clues
- Examples:
  - "Treaty of Tordesillas" (colonial era clue, but low recognition)
  - "War of the Roses begins" (English history, medieval anchor, low recognition)
  - "Sogdians Dominate Silk Road" (Silk Road anchors loosely; Sogdians do not)

### Very Hard (Expert)

- **Target**: ~10% of events
- Truly obscure with NO helpful context clues
- Reserved for events where even the description doesn't help place it
- Examples:
  - "Diet of Roncaglia" (what is this? when? no clues)
  - "Nika Riots" (Byzantine, but unless you know that...)
  - Obscure treaties between minor powers with no era indicators

## What Changed From v2

### Era-vagueness is no longer a downgrade

v2 pushed cards down a tier for "famous but the exact date is less known" — its worked example was _Magna Carta signed_ → Medium. That reasoning is now scored by the crowding term, so the card grades on recognition and anchors alone: high recognition, "Magna Carta" anchors firmly to medieval England, so **Easy**. The sparse medieval timeline around it is what the composite score is for.

Concretely, if your only reason to downgrade is _"but when exactly?"_, don't. Downgrade only when the card's **text** fails to place it in an era.

### Targets are not quotas

v2's process enforced per-file targets. That was wrong twice over.

Wrong unit: the game filters themed days on `category`, and a category is scattered across many JSON files. Measured, applying a target per file collapses `trade`'s band-0 warm-up pool from 30 cards to 17, while the same target applied per category lifts the catalogue-wide minimum from 27 to 33. **Grade and calibrate by category.**

Wrong strictness: some categories genuinely cannot reach 20% easy without lying. `trade` really is mostly Sogdian outposts and Xicalanco trade ports; `earth-life` really is mostly unrecognisable. Grade honestly, report what falls out, and note the deviation. A forced easy label is worse than a missed target, because it lands a genuinely obscure card in the opening foothold where a new player meets it first.

The failure mode to actually avoid is the opposite one: a whole category piled into `medium`. That leaves the recognition term nearly constant, so band assignment for those cards is driven entirely by crowding — which is exactly the case where crowding cannot help, because dense modern categories saturate it.

### Wikipedia pageviews are not a grading input

v2 used `wikipedia_views` as a tiebreaker. v3 does not use it at all:

- **Coverage is worthless.** The 1,999 events carrying the field are exactly the events an older process already graded. Coverage of everything else is zero, so it can only ever confirm existing grades.
- **It measures the wrong thing.** Views are article traffic, not event recognition. Compound cards inherit an unrelated article's fame — "AI Rapid Advancement (GPT-4)" resolves to the ChatGPT article and its 43M views. Topic articles inflate the same way: "Hydrogen Discovered" scores the _Hydrogen_ article.
- **Several URLs are misattributed**, and the CSV is stale relative to the corrections file.

The `wikipedia_views` / `wikipedia_url` fields remain in the event JSON and no app code reads them. Do not consult them when grading.

## Grading Process

For each event, ask:

1. **Recognition Check**: Would a typical educated adult recognize this event from the name alone?
   - Yes → Start at Easy/Medium
   - No → Start at Hard/Very Hard

2. **READ THE DESCRIPTION**: This is critical. The description is shown to players during gameplay.
   - Look for temporal anchors: empires, figures, wars, technology, eras
   - Look for cause/effect relationships that imply sequence
   - Look for references to other well-known events

3. **Inferability Check**: Based on name + description together, can a player reason out the approximate era?
   - Strong clues → Reduce difficulty by 1-2 levels
   - Medium clues → Reduce difficulty by 1 level
   - No clues → Keep at current level

4. **Sanity check against the tier definitions**, then stop. Do not adjust for how crowded the era is, and do not adjust to hit a percentage.

### Description Analysis Examples

| Event Name        | Description                                                                  | Clues Found                                            | Impact                         |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| Social War        | "Italian allies rebelled against Rome, eventually winning Roman citizenship" | Rome, citizenship → ancient Roman period               | Reduces from Very Hard to Hard |
| Nika Riots        | "Riots in Constantinople nearly overthrew Emperor Justinian"                 | Constantinople, Justinian → Byzantine, but when?       | No reduction, stays Very Hard  |
| Taiping Rebellion | "Chinese civil war led by someone claiming to be Jesus's brother"            | China, Christian influence → 19th century colonial era | Reduces from Very Hard to Hard |

## Examples of Re-graded Events

| Event                  | Old Grade | New Grade | Reasoning                                                                         |
| ---------------------- | --------- | --------- | --------------------------------------------------------------------------------- |
| Social War (Rome)      | Very Hard | Hard      | Low recognition, but "Rome" + "citizenship" = ancient anchor                      |
| Nika Riots             | Hard      | Very Hard | Low recognition, "riots" gives no era clue                                        |
| Fall of Constantinople | Medium    | Easy      | Medium recognition, and "Constantinople" anchors firmly                           |
| Treaty of Westphalia   | Hard      | Medium    | Ends Thirty Years' War = strong anchor                                            |
| Magna Carta signed     | Medium    | Easy      | v3: high recognition + medieval anchor; era-vagueness is now computed, not graded |

## Implementation Notes

When running the grading agents:

1. Provide event name AND description to the agent; withhold year-density and pageview data
2. Instruct agents on inferability explicitly, and that crowding is computed elsewhere
3. Batch by `category`, not by file
4. Require a one-line justification for every changed label
5. Treat the band-0 pool floor in `scripts/difficulty/grade/band_report.py` as the acceptance gate, not the label percentages

See [Events & Images](index.md) for the workflow and tooling.
