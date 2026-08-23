#!/usr/bin/env node

/**
 * Apply Dedup Deletions
 *
 * Consumes the delete-list exported from the `/admin/dedup` review tool
 * (`docs/dedup/dedup-delete-list.json`) and removes those events from the category
 * files in `public/events/`.
 *
 * Nothing is hard-deleted: every removed event is appended to `public/events/deprecated.json`
 * with `_originalCategory` and `_deprecatedAt`, matching what the event-editor's
 * `deprecateEvent()` does. That keeps the removal reversible.
 *
 * An id can legitimately appear in more than one category file, so every occurrence is
 * removed and each one is recorded separately in deprecated.json.
 *
 * Usage: node scripts/apply-dedup-deletions.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const DELETE_LIST = path.join(__dirname, '../docs/dedup/dedup-delete-list.json');
const DEPRECATED = 'deprecated.json';
const DRY_RUN = process.argv.includes('--dry-run');

// Fixed so re-running the script produces a stable diff rather than churning timestamps.
const DEPRECATED_AT = '2026-07-31T00:00:00.000Z';

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, filename), 'utf-8'));
}

function writeJson(filename, data) {
  if (DRY_RUN) return;
  fs.writeFileSync(path.join(EVENTS_DIR, filename), `${JSON.stringify(data, null, 2)}\n`);
}

function main() {
  const deleteList = JSON.parse(fs.readFileSync(DELETE_LIST, 'utf-8'));
  const doomed = new Set(deleteList.map((e) => e.name));

  const categoryFiles = fs
    .readdirSync(EVENTS_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json' && f !== DEPRECATED)
    .sort();

  const deprecated = readJson(DEPRECATED);
  const removed = [];

  for (const filename of categoryFiles) {
    const events = readJson(filename);
    if (!Array.isArray(events)) continue;

    const kept = events.filter((event) => !doomed.has(event.name));
    if (kept.length === events.length) continue;

    for (const event of events) {
      if (!doomed.has(event.name)) continue;
      removed.push(event.name);
      deprecated.push({
        ...event,
        _originalCategory: filename.replace(/\.json$/, ''),
        _deprecatedAt: DEPRECATED_AT,
      });
    }

    console.log(`${filename}: ${events.length} -> ${kept.length} (-${events.length - kept.length})`);
    writeJson(filename, kept);
  }

  writeJson(DEPRECATED, deprecated);

  const notFound = [...doomed].filter((name) => !removed.includes(name));
  console.log(`\nremoved ${removed.length} event records for ${doomed.size - notFound.length} ids`);
  console.log(`deprecated.json: ${deprecated.length} entries`);
  if (notFound.length) {
    console.log(`\n${notFound.length} id(s) in the delete-list were not in any category file:`);
    notFound.forEach((name) => console.log(`  - ${name}`));
  }
  if (DRY_RUN) console.log('\n(dry run — nothing written)');
}

main();
