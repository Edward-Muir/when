#!/usr/bin/env node
/**
 * Applies evidence windows (`year` + `year_end`) to the catalogue.
 *
 * Usage:
 *   node scripts/events/year-range-apply.js                      # all maps in untracked_data/event-ranges
 *   node scripts/events/year-range-apply.js batch-001.json ...   # only these maps
 *   node scripts/events/year-range-apply.js --dry-run
 *
 * Input is one or more `slug -> { year_end, year?, reason?, note? }` maps in
 * `untracked_data/event-ranges/` (gitignored). This is the house pattern from
 * `detail-apply.js` and `date-clues-apply.js`, and it exists because parallel agents editing a
 * shared 600 KB JSON array corrupt it: sub-agents write maps, one deterministic pass writes
 * the catalogue.
 *
 * **`year_end: null` is a rejection, and it is written too** — to `year-range-decided.json`
 * rather than to the catalogue. Most events are moments and will never carry a window, so
 * "reviewed and left alone" is the commonest outcome of a sweep and needs somewhere durable to
 * live; without it `year-range-report.js` cannot tell an event nobody has looked at from one
 * four agents have each looked at and dismissed. The ledger is committed for the same reason:
 * a gitignored one is lost on the first fresh checkout and the sweep restarts from zero.
 *
 * Everything is validated before anything is written. A single bad entry aborts the whole run,
 * so a half-applied batch is not a state you can reach.
 *
 * **Moving `year` is allowed and needs a `reason`.** It is also the one thing here with
 * consequences beyond the record it touches: a year re-scores its neighbours through
 * `difficultyScore.ts`, which feeds `deckBuilder.ts` — re-dating a single event
 * (`chickens-domesticated`) once moved a bound in `deckBuilder.test.ts` from 9 to 11. So the
 * run prints every move as a table for the commit message and for
 * docs/events-images/catalogue-error-backlog.md.
 *
 * The working discipline that replaces the old hard block: **apply range-only entries first**
 * and confirm the deck tests are untouched, then land the year moves in their own commit and
 * re-measure that bound rather than widening it. If the deck tests move on what was supposed
 * to be a range-only batch, a year change leaked in.
 *
 * There is no cap on how wide a window may be — see the header of `year-range.js`. The widest
 * ranges and any fully nested pairs are printed after every run, because with nothing
 * rejecting a mis-keyed digit that printout is the only thing between a typo and a card
 * placeable anywhere.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, writeEvents } = require('./detail-catalogue');
const {
  entryProblems,
  isRejection,
  rangeOf,
  readDecided,
  writeDecided,
  DECIDED_PATH,
} = require('./year-range');

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

/**
 * Mutates the indexed catalogue and the decided ledger in one pass, and reports what it did.
 * Split out of `main` because the one thing this file must never do is become hard to read:
 * everything here has already been validated, so a surprise in this loop is a silent wrong
 * answer rather than an abort.
 */
function applyEntries(merged, locate, decided) {
  const touchedFiles = new Set();
  const yearMoves = [];
  const preimages = new Map();
  let applied = 0;
  let skipped = 0;
  let rejected = 0;

  for (const [slug, entry] of Object.entries(merged)) {
    const { file, event } = locate.get(slug);
    const before = { ...event };
    const rejection = isRejection(entry);
    const targetYear = Object.prototype.hasOwnProperty.call(entry, 'year')
      ? entry.year
      : event.year;

    // A rejection touches no catalogue field. Its whole record is the ledger line, which is why
    // the `note` is mandatory — see the header of `year-range.js`.
    if (rejection) {
      decided[slug] = entry.note;
      rejected += 1;
    }

    const movesYear = targetYear !== event.year;
    const movesEnd = !rejection && event.year_end !== entry.year_end;
    if (!movesYear && !movesEnd) {
      if (!rejection) skipped += 1;
      continue;
    }
    preimages.set(slug, before);

    if (movesYear) {
      yearMoves.push({ slug, from: event.year, to: targetYear, reason: entry.reason });
      // Mutated in place, so JSON.stringify keeps the original key order.
      event.year = targetYear;
    }
    if (movesEnd) {
      // Appends `year_end` last, after `has_detail` — same as every other apply script. Placing
      // it beside `year` would mean rebuilding all 5,460 records and burying the real change.
      event.year_end = entry.year_end;
    }

    touchedFiles.add(file);
    applied += 1;
  }

  return { touchedFiles, yearMoves, preimages, applied, skipped, rejected };
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');

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
    problems.push(...entryProblems(slug, entry, found && found.event));
  }
  if (problems.length) {
    die(
      `${problems.length} problem(s) across ${files.length} map file(s); nothing written`,
      problems
    );
  }

  // ---- apply --------------------------------------------------------------
  const decided = readDecided();
  const decidedBefore = JSON.stringify(decided);
  const { touchedFiles, yearMoves, preimages, applied, skipped, rejected } = applyEntries(
    merged,
    locate,
    decided
  );

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

  const decidedChanged = JSON.stringify(decided) !== decidedBefore;
  const ledgerName = path.relative(process.cwd(), DECIDED_PATH);

  if (dryRun) {
    console.log(
      `[dry run] would apply ${applied}, skip ${skipped} already-current, ` +
        `record ${rejected} rejection(s)`
    );
  } else {
    for (const file of touchedFiles) writeEvents(file, byFile.get(file));
    if (decidedChanged) writeDecided(decided);
    console.log(
      `Applied ${applied} range(s) across ${touchedFiles.size} shard(s); skipped ${skipped}.`
    );
    console.log(
      `Recorded ${rejected} rejection(s); ${ledgerName} now holds ${Object.keys(decided).length}.`
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
        `  ${String(e.year_end - e.year).padStart(11)}y  ${e.name} (${e.year} to ${e.year_end})`
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
