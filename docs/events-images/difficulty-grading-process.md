# Difficulty Grading Process

This document describes how to use parallel sub-agents to grade the difficulty of historical events in the "When" timeline game.

## Overview

We have ~2000 events across 6 categories. To grade them efficiently, we spin up 6 parallel agents (one per category) that each grade their subset of events using the rubric defined in [difficulty-grading-rubric.md](./difficulty-grading-rubric.md).

## Prerequisites

1. **Wikipedia pageviews CSV** (optional but helpful): Located at `scripts/difficulty/output/wikipedia_pageviews.csv`
   - Contains event names and their Wikipedia pageview counts
   - Used as a secondary signal for recognition/familiarity

2. **Event JSON files**: Located at `public/events/*.json`
   - One file per category: conflict.json, cultural.json, diplomatic.json, disasters.json, exploration.json, infrastructure.json

3. **Output directory**: `scripts/difficulty/output/`
   - Agents write their graded results here as `graded_<category>.json`

## Step 1: Prepare the Grading Prompt

Each agent receives:

- The full rubric from difficulty-grading-rubric.md
- The category-specific events from the JSON file
- Wikipedia pageviews data for reference
- Target distribution: ~15-20% easy, ~35% medium, ~35% hard, ~10% very-hard

## Step 2: Launch Parallel Agents

Use Claude Code's Task tool to launch 6 agents simultaneously. Each agent:

1. Reads its category's event JSON file
2. Reads the Wikipedia pageviews CSV
3. Grades each event using the rubric:
   - Check recognition (would people know this?)
   - **Read the description** for temporal anchors
   - Assess placeability (can you reason out the era?)
   - Use pageviews as tiebreaker
4. Outputs a JSON file with the grades

### Example Agent Prompt

```
You are grading historical events for difficulty in a timeline game.

**Category**: conflict
**Input file**: public/events/conflict.json
**Output file**: scripts/difficulty/output/graded_conflict.json
**Pageviews reference**: scripts/difficulty/output/wikipedia_pageviews.csv

## Rubric Summary
[Include key points from difficulty-grading-rubric.md]

## Your Task
1. Read all events from the input file
2. For each event, determine difficulty (easy/medium/hard/very-hard):
   - Consider name recognition
   - **READ THE DESCRIPTION** - look for temporal anchors
   - Assess if a player could reason out the approximate era
   - Check pageviews as secondary signal
3. Write output JSON with format:
   [
     {"name": "event-name", "difficulty": "medium", "reasoning": "brief explanation"},
     ...
   ]

## Target Distribution
- easy: ~15-20%
- medium: ~35%
- hard: ~35%
- very-hard: ~10%
```

### Launching All 6 Agents

In Claude Code, use multiple Task tool calls in a single message to run them in parallel:

```
Task 1: subagent_type=general-purpose, prompt="Grade conflict events..."
Task 2: subagent_type=general-purpose, prompt="Grade cultural events..."
Task 3: subagent_type=general-purpose, prompt="Grade diplomatic events..."
Task 4: subagent_type=general-purpose, prompt="Grade disasters events..."
Task 5: subagent_type=general-purpose, prompt="Grade exploration events..."
Task 6: subagent_type=general-purpose, prompt="Grade infrastructure events..."
```

All 6 agents will run concurrently and write their output files.

## Step 3: Apply Grades to Event Files

Once all agents complete, run the apply script:

```bash
# Preview changes first
python3 scripts/difficulty/apply_grades.py --dry-run

# Apply changes
python3 scripts/difficulty/apply_grades.py
```

The script:

1. Reads all `graded_*.json` files from `scripts/difficulty/output/`
2. Updates the corresponding event JSON files in `public/events/`
3. Prints a report showing distribution changes

## Step 4: Verify

```bash
npm run typecheck      # Ensure no type errors
npm run find-duplicates # Check JSON integrity
```

## File Structure

```
scripts/difficulty/
├── output/
│   ├── wikipedia_pageviews.csv    # Pageview data (input)
│   ├── graded_conflict.json       # Agent output
│   ├── graded_cultural.json       # Agent output
│   ├── graded_diplomatic.json     # Agent output
│   ├── graded_disasters.json      # Agent output
│   ├── graded_exploration.json    # Agent output
│   └── graded_infrastructure.json # Agent output
└── apply_grades.py                # Script to apply grades

public/events/
├── conflict.json      # Updated with new difficulties
├── cultural.json
├── diplomatic.json
├── disasters.json
├── exploration.json
└── infrastructure.json
```

## Output JSON Format

Each agent outputs a JSON array:

```json
[
  {
    "name": "wwi-start",
    "difficulty": "easy",
    "reasoning": "Universally taught, everyone knows 1914"
  },
  {
    "name": "social-war-rome",
    "difficulty": "hard",
    "reasoning": "Low recognition but description mentions Rome = ancient anchor"
  }
]
```

## Tips for Better Results

1. **Emphasize description reading**: The most common error is grading based on name recognition alone without considering description clues.

2. **Provide concrete examples**: Include 3-5 examples of each difficulty level in the prompt.

3. **Set clear targets**: Tell agents the target distribution percentages.

4. **Review edge cases**: After grading, spot-check events that seem mis-graded and adjust manually or re-run specific categories.

## Re-running Specific Categories

If a category needs re-grading:

1. Delete or rename the old output: `mv graded_conflict.json graded_conflict_v1.json`
2. Launch a single agent for that category with updated instructions
3. Re-run `apply_grades.py`
