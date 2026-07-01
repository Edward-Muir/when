# Difficulty Grading Rubric v2

## Overview

This rubric grades historical events for the "When" timeline game. The key insight: **difficulty is about placeability, not just recognition**. An obscure event with strong contextual clues (mentions Rome, references a well-known war, etc.) is easier to place than a famous event with an ambiguous timeframe.

## The Two Dimensions of Difficulty

### 1. Recognition (Do players know this event?)

| Level    | Description                                        | Examples                                        |
| -------- | -------------------------------------------------- | ----------------------------------------------- |
| High     | Taught in most schools worldwide                   | WWII, Moon Landing, Fall of Rome                |
| Medium   | Known to history enthusiasts or regional audiences | Thirty Years' War, Meiji Restoration            |
| Low      | Specialized knowledge required                     | Treaty of Tordesillas, Defenestration of Prague |
| Very Low | Only experts would recognize                       | Social War (Rome), Diet of Roncaglia            |

### 2. Placeability (Can players reason out the timeframe?)

| Level    | Description                                    | Examples                                                |
| -------- | ---------------------------------------------- | ------------------------------------------------------- |
| High     | Name/description gives strong temporal anchors | "End of WWI" → 1918, "Roman Republic founded" → ancient |
| Medium   | Some clues narrow the era                      | "Italian allies vs Rome" → ancient/Roman period         |
| Low      | Few contextual clues                           | "Treaty signed" with no era indicators                  |
| Very Low | Misleading or no temporal context              | Generic names that could be any era                     |

## Difficulty Matrix

|                          | High Placeability | Medium Placeability | Low Placeability |
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

### Easy

- **Target**: ~15-20% of events
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
  - "Magna Carta signed" (famous but exact date less known)
  - "First Crusade launched" (moderate recognition + medieval anchor)

### Hard

- **Target**: ~35% of events
- Specialized knowledge with limited contextual clues
- Examples:
  - "Treaty of Tordesillas" (colonial era clue, but specific date unknown)
  - "War of the Roses begins" (English history, medieval, but when exactly?)
  - "Defenestration of Prague" (famous among history buffs, but which century?)

### Very Hard (Expert)

- **Target**: ~10% of events
- Truly obscure with NO helpful context clues
- Reserved for events where even the description doesn't help place it
- Examples:
  - "Diet of Roncaglia" (what is this? when? no clues)
  - "Nika Riots" (Byzantine, but unless you know that...)
  - Obscure treaties between minor powers with no era indicators

## Grading Process

For each event, ask:

1. **Recognition Check**: Would a typical educated adult recognize this event from the name alone?
   - Yes → Start at Easy/Medium
   - No → Start at Hard/Very Hard

2. **READ THE DESCRIPTION**: This is critical. The description is shown to players during gameplay.
   - Look for temporal anchors: empires, figures, wars, technology, eras
   - Look for cause/effect relationships that imply sequence
   - Look for references to other well-known events

3. **Placeability Check**: Based on name + description together, can a player reason out the approximate era?
   - Strong clues → Reduce difficulty by 1-2 levels
   - Medium clues → Reduce difficulty by 1 level
   - No clues → Keep at current level

4. **Final Adjustment**: Consider Wikipedia pageviews as a tiebreaker
   - > 1M views: Likely well-known, lean easier
   - <10K views: Likely obscure, lean harder
   - But pageviews should NOT override placeability analysis

### Description Analysis Examples

| Event Name        | Description                                                                  | Clues Found                                            | Impact                         |
| ----------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------ |
| Social War        | "Italian allies rebelled against Rome, eventually winning Roman citizenship" | Rome, citizenship → ancient Roman period               | Reduces from Very Hard to Hard |
| Nika Riots        | "Riots in Constantinople nearly overthrew Emperor Justinian"                 | Constantinople, Justinian → Byzantine, but when?       | No reduction, stays Very Hard  |
| Taiping Rebellion | "Chinese civil war led by someone claiming to be Jesus's brother"            | China, Christian influence → 19th century colonial era | Reduces from Very Hard to Hard |

## Examples of Re-graded Events

| Event                  | Old Grade | New Grade | Reasoning                                                    |
| ---------------------- | --------- | --------- | ------------------------------------------------------------ |
| Social War (Rome)      | Very Hard | Hard      | Low recognition, but "Rome" + "citizenship" = ancient anchor |
| Nika Riots             | Hard      | Very Hard | Low recognition, "riots" gives no era clue                   |
| Fall of Constantinople | Medium    | Easy      | Medium recognition, but extremely famous date (1453)         |
| Treaty of Westphalia   | Hard      | Medium    | Ends Thirty Years' War = strong anchor                       |

## Implementation Notes

When running the grading agents:

1. Provide both event name AND description to the agent
2. Explicitly instruct agents to consider placeability, not just recognition
3. Have agents explain their reasoning for edge cases
4. Use pageviews as a secondary signal, not primary
