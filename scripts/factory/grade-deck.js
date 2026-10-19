#!/usr/bin/env node
/**
 * Blind difficulty grading for a deck's new events (factory.md, Task B, "Grade").
 *
 *   node scripts/factory/grade-deck.js --deck <id> --worklist   # write grade-worklist.json
 *   node scripts/factory/grade-deck.js --deck <id> --apply      # grades.json -> new-events.json
 *
 * The reconciler wrote the cards and knows their dates, so it grades what it knows, not what a
 * player sees. The first Sweet Tooth deck graded "Cato's Honey Cheesecake Recipe" very hard,
 * although its text says "a Roman statesman". So a separate `deck-difficulty-grader` agent gets
 * a worklist with only what the player sees: the name, the description and the category, never
 * the year. It rates recognition and inferability, and `--apply` turns those into a difficulty
 * with the placement-first grid (difficulty.js), so the arithmetic is never left to a model.
 */

const fs = require('fs');
const path = require('path');

const { DECKS_DIR } = require('./config');
const { INFERABILITY, RECOGNITION, difficultyFor } = require('./difficulty');
const { parseArgs, readJson, run, writeJson } = require('./cli');

function main() {
  const args = parseArgs(process.argv.slice(2), ['worklist', 'apply']);
  if (!args.deck) throw new Error('--deck <id> is required');
  const dir = path.join(DECKS_DIR, args.deck);
  const eventsFile = path.join(dir, 'new-events.json');
  const events = readJson(eventsFile);

  if (args.worklist) {
    const worklist = events.map(({ name, friendly_name, description, category }) => ({
      name,
      friendly_name,
      description,
      category,
    }));
    writeJson(path.join(dir, 'grade-worklist.json'), worklist);
    console.log(`Wrote ${worklist.length} cards to grade-worklist.json (no years)`);
    return;
  }

  if (args.apply) {
    const grades = readJson(path.join(dir, 'grades.json'));
    const problems = [];
    const changes = [];
    for (const e of events) {
      const g = grades[e.name];
      if (!g) {
        problems.push(`${e.name}: no grade`);
        continue;
      }
      if (!RECOGNITION.includes(g.recognition) || !INFERABILITY.includes(g.inferability)) {
        problems.push(
          `${e.name}: recognition and inferability must each be one of ${RECOGNITION.join(', ')}`
        );
        continue;
      }
      const difficulty = difficultyFor(g.recognition, g.inferability);
      if (difficulty !== e.difficulty) changes.push(`${e.name}: ${e.difficulty} -> ${difficulty}`);
      e.difficulty = difficulty;
    }
    const extra = Object.keys(grades).filter((slug) => !events.some((e) => e.name === slug));
    if (extra.length) problems.push(`grades for cards not in the deck: ${extra.join(', ')}`);
    if (problems.length)
      throw new Error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
    writeJson(eventsFile, events);
    console.log(`Graded ${events.length} cards; ${changes.length} changed`);
    for (const c of changes) console.log(`  ${c}`);
    return;
  }
  throw new Error('give --worklist or --apply');
}

if (require.main === module) run(main);
