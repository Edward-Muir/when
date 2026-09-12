#!/usr/bin/env node
/**
 * Applies long-form detail prose to the catalogue.
 *
 * Usage:
 *   node scripts/events/detail-apply.js                       # all maps in untracked_data/event-detail
 *   node scripts/events/detail-apply.js batch-001.json ...    # only these maps
 *   node scripts/events/detail-apply.js --dry-run
 *
 * Input is one or more `slug -> { paragraphs: [...] }` maps in `untracked_data/event-detail/`
 * (gitignored). This is the house pattern from `date-clues-apply.js` and `shorten-names-apply.js`,
 * and it exists because parallel agents editing a shared 600 KB JSON array corrupt it: sub-agents
 * write maps, one deterministic pass writes the catalogue.
 *
 * Everything is validated before anything is written. A single bad entry aborts the whole run,
 * so a half-applied batch is not a state you can reach.
 *
 * Two things are written together, and that pairing is the point:
 *   - the prose, into `public/events/detail/<source file>`
 *   - `has_detail: true`, onto the event record in `public/events/<source file>`
 * The flag is what the info button keys off. Writing prose without it shows no button; writing it
 * without prose shows a button that opens nothing. Never set it by hand.
 */

const fs = require('fs');
const path = require('path');
const { entryProblems } = require('./detail-spec');
const {
  manifestFiles,
  readEvents,
  writeEvents,
  readDetailShard,
  writeDetailShard,
  sourceFileBySlug,
} = require('./detail-catalogue');

const MAPS_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-detail');

function loadMaps(argv) {
  if (!fs.existsSync(MAPS_DIR)) {
    console.error(`No map directory at ${MAPS_DIR}`);
    console.error('Write batches there as slug -> { "paragraphs": [...] } JSON objects.');
    process.exit(1);
  }
  const named = argv.filter((a) => !a.startsWith('--'));
  const files = named.length
    ? named
    : fs.readdirSync(MAPS_DIR).filter((f) => f.endsWith('.json')).sort();

  if (!files.length) {
    console.error(`No .json map files found in ${MAPS_DIR}`);
    process.exit(1);
  }

  const merged = new Map();
  const problems = [];
  for (const file of files) {
    const full = path.join(MAPS_DIR, file);
    let parsed;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-supplied map file
      parsed = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (error) {
      problems.push(`${file}: not valid JSON — ${error.message}`);
      continue;
    }
    for (const [slug, entry] of Object.entries(parsed)) {
      // Two batches disagreeing about one event is a mistake worth stopping for, not a merge
      // to resolve silently by last-write-wins.
      if (merged.has(slug)) problems.push(`${slug}: appears in more than one map file`);
      merged.set(slug, entry);
    }
  }
  return { merged, files, problems };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const { merged, files, problems } = loadMaps(argv);

  const bySlug = sourceFileBySlug();

  // Validate everything up front.
  for (const [slug, entry] of merged) {
    if (!bySlug.has(slug)) {
      problems.push(`${slug}: not an event in the manifest catalogue (renamed or misspelled?)`);
      continue;
    }
    problems.push(...entryProblems(slug, entry));
  }

  if (problems.length) {
    console.error(`Refusing to write — ${problems.length} problem(s):\n`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
  }

  // Group by destination shard, then write each touched file exactly once.
  const byFile = new Map();
  for (const [slug, entry] of merged) {
    const file = bySlug.get(slug);
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push([slug, entry]);
  }

  let written = 0;
  for (const file of manifestFiles()) {
    const entries = byFile.get(file);
    if (!entries) continue;

    const shard = readDetailShard(file);
    for (const [slug, entry] of entries) {
      shard[slug] = { paragraphs: entry.paragraphs };
    }

    const events = readEvents(file);
    const slugs = new Set(entries.map(([slug]) => slug));
    for (const event of events) {
      if (slugs.has(event.name)) event.has_detail = true;
    }

    if (!dryRun) {
      writeDetailShard(file, shard);
      writeEvents(file, events);
    }
    written += entries.length;
    console.log(`${dryRun ? 'would write' : 'wrote'} ${entries.length} -> ${file}`);
  }

  console.log(
    `\n${dryRun ? 'Dry run: ' : ''}${written} entries from ${files.length} map file(s) across ${byFile.size} shard(s).`
  );
}

main();
