#!/usr/bin/env node
/**
 * Applies `year_end` upper bounds to the catalogue.
 *
 * Usage:
 *   node scripts/events/year-range-apply.js                      # all maps in untracked_data/event-ranges
 *   node scripts/events/year-range-apply.js batch-001.json ...   # only these maps
 *   node scripts/events/year-range-apply.js --dry-run
 *   node scripts/events/year-range-apply.js --allow-year-change  # see below
 *   node scripts/events/year-range-apply.js --allow-wide         # waive the span ceiling
 *
 * Input is one or more `slug -> { year_end, note? }` maps in `untracked_data/event-ranges/`
 * (gitignored). This is the house pattern from `detail-apply.js` and `date-clues-apply.js`,
 * and it exists because parallel agents editing a shared 600 KB JSON array corrupt it:
 * sub-agents write maps, one deterministic pass writes the catalogue.
 *
 * Everything is validated before anything is written. A single bad entry aborts the whole run,
 * so a half-applied batch is not a state you can reach.
 *
 * **`year` is not writable by default, and that is the most important thing here.** Changing a
 * year re-scores its neighbours through `difficultyScore.ts`, which feeds `deckBuilder.ts` —
 * correcting one event (`chickens-domesticated`) previously moved a bound in
 * `deckBuilder.test.ts` from 9 to 11. Keeping `year` unwritable makes "this batch cannot have
 * moved a daily deck" a checked property rather than a promise. Where the record's window
 * genuinely starts after the stored year, pass `--allow-year-change` and give each such entry
 * a `reason`; the run then prints every moved year so it can go in the commit message and in
 * docs/events-images/catalogue-error-backlog.md. Land those in their own commit and re-run
 * deckBuilder.test.ts afterwards, re-measuring its bound rather than just widening it.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, writeEvents } = require('./detail-catalogue');
const { entryProblems, rangeOf, maxSpanFor } = require('./year-range');

const MAPS_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-ranges');

const die = (msg, lines) => {
  console.error(`ABORT: ${msg}`);
  (lines || []).forEach((l) => console.error(`  ${l}`));
  process.exit(1);
};

function loadMaps(argv) {
  if (!fs.existsSync(MAPS_DIR)) {
    die(`No map directory at ${path.relative(process.cwd(), MAPS_DIR)}`, [
      'Write batches there as slug -> { "year_end": <number> } JSON objects.',
    ]);
  }
  const named = argv.filter((a) => !a.startsWith('--'));
  const files = named.length
    ? named
    : fs
        .readdirSync(MAPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();
  if (!files.length) die(`no .json maps in ${path.relative(process.cwd(), MAPS_DIR)}`);

  const merged = {};
  const seenIn = new Map();
  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-supplied map path
    const map = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, file), 'utf8'));
    for (const [slug, entry] of Object.entries(map)) {
      if (seenIn.has(slug)) {
        die(`${slug} appears in more than one map file`, [`${seenIn.get(slug)} and ${file}`]);
      }
      seenIn.set(slug, file);
      merged[slug] = entry;
    }
  }
  return { merged, files };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const allowYearChange = argv.includes('--allow-year-change');
  const allowWide = argv.includes('--allow-wide');

  const { merged, files } = loadMaps(argv);

  // Index the catalogue once, remembering which shard each slug lives in.
  const byFile = new Map();
  const locate = new Map();
  for (const file of manifestFiles()) {
    const events = readEvents(file);
    byFile.set(file, events);
    for (const event of events) {
      if (!event || !event.name) continue;
      if (locate.has(event.name)) {
        die(`${event.name} is in two shards`, [`${locate.get(event.name).file} and ${file}`]);
      }
      locate.set(event.name, { file, event });
    }
  }

  // ---- validate everything before writing anything ------------------------
  const problems = [];
  for (const [slug, entry] of Object.entries(merged)) {
    const found = locate.get(slug);
    problems.push(
      ...entryProblems(slug, entry, found && found.event, { allowYearChange, allowWide })
    );
  }
  if (problems.length) {
    die(
      `${problems.length} problem(s) across ${files.length} map file(s); nothing written`,
      problems
    );
  }

  // ---- apply --------------------------------------------------------------
  const touchedFiles = new Set();
  const yearMoves = [];
  const preimages = new Map();
  let applied = 0;
  let skipped = 0;

  for (const [slug, entry] of Object.entries(merged)) {
    const { file, event } = locate.get(slug);
    const before = { ...event };
    const targetYear = Object.prototype.hasOwnProperty.call(entry, 'year')
      ? entry.year
      : event.year;

    if (event.year_end === entry.year_end && event.year === targetYear) {
      skipped += 1;
      continue;
    }
    preimages.set(slug, before);

    if (targetYear !== event.year) {
      yearMoves.push({ slug, from: event.year, to: targetYear, reason: entry.reason });
      // Mutated in place, so JSON.stringify keeps the original key order.
      event.year = targetYear;
    }
    // Appends `year_end` last, after `has_detail` — same as every other apply script. Placing
    // it beside `year` would mean rebuilding all 5,460 records and burying the real change.
    event.year_end = entry.year_end;

    touchedFiles.add(file);
    applied += 1;
  }

  // ---- prove nothing else moved -------------------------------------------
  const drift = [];
  for (const [slug, before] of preimages) {
    const { event } = locate.get(slug);
    const keys = new Set([...Object.keys(before), ...Object.keys(event)]);
    for (const key of keys) {
      if (key === 'year_end' || key === 'year') continue;
      if (JSON.stringify(before[key]) !== JSON.stringify(event[key])) {
        drift.push(`${slug}: "${key}" changed but only year_end should have`);
      }
    }
  }
  if (drift.length) die('unexpected field drift; nothing written', drift);

  if (dryRun) {
    console.log(`[dry run] would apply ${applied}, skip ${skipped} already-current`);
  } else {
    for (const file of touchedFiles) writeEvents(file, byFile.get(file));
    console.log(
      `Applied ${applied} range(s) across ${touchedFiles.size} shard(s); skipped ${skipped}.`
    );
  }

  if (yearMoves.length) {
    console.log(`\n${yearMoves.length} year(s) moved — these belong in their own commit:`);
    for (const m of yearMoves) console.log(`  ${m.slug}: ${m.from} -> ${m.to} (${m.reason})`);
    console.log('  Re-run deckBuilder.test.ts and re-measure its bound rather than widening it.');
  }

  // ---- post-apply sweep: warnings, never aborts ---------------------------
  const all = [];
  for (const events of byFile.values()) all.push(...events);
  const ranged = all.filter((e) => rangeOf(e).end > e.year);

  const widest = [...ranged]
    .sort((a, b) => b.year_end - b.year - (a.year_end - a.year))
    .slice(0, 5);
  if (widest.length) {
    console.log('\nWidest ranges in the catalogue, for eyeballing:');
    for (const e of widest) {
      console.log(
        `  ${String(e.year_end - e.year).padStart(6)}y  ${e.name} (${e.year} to ${e.year_end}, ceiling ${maxSpanFor(e.year)})`
      );
    }
  }

  // A card whose window sits wholly inside another's is placeable on either side of it, which
  // is where the running-bound maths surprises people. Worth seeing, not worth blocking.
  const nested = [];
  for (const a of ranged) {
    for (const b of ranged) {
      if (a === b) continue;
      if (a.year > b.year && a.year_end < b.year_end) {
        nested.push(
          `${a.name} (${a.year}-${a.year_end}) sits inside ${b.name} (${b.year}-${b.year_end})`
        );
      }
    }
  }
  if (nested.length) {
    console.log(`\n${nested.length} fully nested pair(s):`);
    for (const line of nested.slice(0, 10)) console.log(`  ${line}`);
  }
}

main();
