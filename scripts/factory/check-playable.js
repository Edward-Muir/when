#!/usr/bin/env node
/**
 * The ship stage's gate: a deck reaches Edward only when every card in it can be dealt
 * (factory.md, C3, "The playable gate").
 *
 *   node scripts/factory/check-playable.js --deck <id>
 *
 * Fails (exit 1, naming the cards) when any new card is `needs-human`, or when any of the
 * deck's cards isn't playable (no Cloudinary art, so the game hides it). No test can catch this:
 * every new card starts without art, so the tests allow artless cards on purpose. Only publishing
 * would refuse it, after the PR had already been reviewed and merged.
 */

const path = require('path');

const { DECKS_DIR } = require('./config');
const { loadEligibleEvents } = require('../themes/catalogue');
const { parseArgs, readJson, run } = require('./cli');

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.deck) throw new Error('--deck <id> is required');
  const dir = path.join(DECKS_DIR, args.deck);
  const deck = readJson(path.join(dir, 'deck.json'));
  const status = readJson(path.join(dir, 'status.json'));

  const human = Object.entries(status.slugs)
    .filter(([, s]) => s.state === 'needs-human')
    .map(([slug, s]) => `${slug} (${s.reason})`);
  const playable = new Set(loadEligibleEvents().map((e) => e.name));
  const artless = deck.eventNames.filter((slug) => !playable.has(slug));

  const problems = [];
  if (human.length) problems.push(`needs a human: ${human.join('; ')}`);
  if (artless.length) problems.push(`not playable yet (no Cloudinary art): ${artless.join(', ')}`);
  if (problems.length) {
    throw new Error(`${args.deck} isn't complete, so it doesn't ship:\n  ${problems.join('\n  ')}`);
  }
  console.log(`${args.deck}: all ${deck.eventNames.length} cards are playable`);
}

if (require.main === module) run(main);
