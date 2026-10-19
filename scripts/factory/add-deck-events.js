#!/usr/bin/env node
/**
 * Appends a deck's new events to the catalogue, after checking every rule a hand author would
 * (the add-events skill). The reconciler writes the records to
 * factory/decks/<id>/new-events.json; nothing writes event files by hand.
 *
 *   node scripts/factory/add-deck-events.js --deck <id> [--dry-run]
 *
 * New events go to the end of public/events/themes.json, the shard for curated-theme events.
 * Only the seven hand-written fields are accepted: name, friendly_name, year, category,
 * description, difficulty, and regions if already known. Everything else (regions via the
 * tagger, year_end via the range writer, has_detail, image_url, colours) is written later by its
 * own script. Running it twice is harmless: a record already present unchanged is skipped.
 */

const fs = require('fs');
const path = require('path');

const { DECKS_DIR, EVENTS_DIR, REPO_ROOT } = require('./config');
const { eventDateClues } = require('../events/date-clues');
const { anchorsIn } = require('./difficulty');
const { parseArgs, readJson, run, writeJson } = require('./cli');

const TARGET_FILE = 'themes.json';
const MAX_FRIENDLY_NAME_LENGTH = 35; // src/utils/eventNameLength.ts
const DESCRIPTION = [80, 150]; // the add-events skill
const DIFFICULTIES = ['easy', 'medium', 'hard', 'very-hard'];
const FIELDS = [
  'name',
  'friendly_name',
  'year',
  'category',
  'description',
  'difficulty',
  'regions',
];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function allCategories() {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'src', 'types', 'index.ts'), 'utf8');
  const block = src.match(/ALL_CATEGORIES:\s*Category\[\]\s*=\s*\[([^\]]*)\]/);
  if (!block) throw new Error('could not read ALL_CATEGORIES from src/types/index.ts');
  return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

function catalogue() {
  const files = [...readJson(path.join(EVENTS_DIR, 'manifest.json')).files, 'deprecated.json'];
  const byName = new Map();
  for (const file of files) {
    const full = path.join(EVENTS_DIR, file);
    if (!fs.existsSync(full)) continue;
    for (const event of readJson(full)) byName.set(event.name, { event, file });
  }
  return byName;
}

function problemsWith(record, categories, existing, thisYear) {
  const p = [];
  const extra = Object.keys(record).filter((k) => !FIELDS.includes(k));
  if (extra.length) p.push(`fields not allowed here: ${extra.join(', ')}`);
  if (!SLUG_RE.test(record.name || '')) p.push('name must be a kebab-case slug');
  if (!record.friendly_name || record.friendly_name.length > MAX_FRIENDLY_NAME_LENGTH) {
    p.push(`friendly_name must be 1-${MAX_FRIENDLY_NAME_LENGTH} characters`);
  }
  if (!Number.isInteger(record.year) || record.year > thisYear)
    p.push('year must be a past integer');
  if (!categories.has(record.category))
    p.push(`category "${record.category}" is not in ALL_CATEGORIES`);
  if (!DIFFICULTIES.includes(record.difficulty))
    p.push(`difficulty must be one of ${DIFFICULTIES.join(', ')}`);
  const len = (record.description || '').length;
  if (len < DESCRIPTION[0] || len > DESCRIPTION[1]) {
    p.push(`description is ${len} characters; want ${DESCRIPTION[0]}-${DESCRIPTION[1]}`);
  }
  const anchors = anchorsIn(record);
  if (anchors.length && (record.difficulty === 'hard' || record.difficulty === 'very-hard')) {
    p.push(
      `graded ${record.difficulty}, but its text names ${anchors.join(', ')}, which places its era; ` +
        'under the placement-first grid that is easy or medium'
    );
  }
  const clues = eventDateClues(record);
  if (clues.length) p.push(`states a date: ${clues.map((c) => `"${c.match}"`).join(', ')}`);
  if (record.regions !== undefined && !Array.isArray(record.regions))
    p.push('regions must be an array');
  const prior = existing.get(record.name);
  if (prior && JSON.stringify(prior.event) !== JSON.stringify(record)) {
    p.push(`slug already used in ${prior.file}`);
  }
  return p;
}

function main() {
  const args = parseArgs(process.argv.slice(2), ['dry-run']);
  if (!args.deck) throw new Error('--deck <id> is required');
  const records = readJson(path.join(DECKS_DIR, args.deck, 'new-events.json'));
  if (!Array.isArray(records)) throw new Error('new-events.json must be an array of event records');

  const categories = allCategories();
  const existing = catalogue();
  const thisYear = new Date().getFullYear();
  const seen = new Set();
  const problems = [];
  for (const record of records) {
    if (seen.has(record.name)) problems.push(`${record.name}: listed twice`);
    seen.add(record.name);
    for (const p of problemsWith(record, categories, existing, thisYear)) {
      problems.push(`${record.name}: ${p}`);
    }
  }
  if (problems.length)
    throw new Error(`${problems.length} problem(s):\n  ${problems.join('\n  ')}`);

  const fresh = records.filter((r) => !existing.has(r.name));
  console.log(
    `${records.length} new event(s); ${fresh.length} to append, ${records.length - fresh.length} already present`
  );
  if (args['dry-run'] || !fresh.length) return;

  const target = path.join(EVENTS_DIR, TARGET_FILE);
  const events = readJson(target);
  // Key order as the add-events skill lists it, so the records read like hand-written ones.
  for (const r of fresh)
    events.push(Object.fromEntries(FIELDS.filter((k) => k in r).map((k) => [k, r[k]])));
  writeJson(target, events);
  console.log(`Appended to public/events/${TARGET_FILE}: ${fresh.map((r) => r.name).join(', ')}`);
}

if (require.main === module) run(main);

module.exports = { problemsWith };
