#!/usr/bin/env node
/**
 * Applies region tags to the catalogue.
 *
 * Usage:
 *   node scripts/events/region-apply.js                      # all maps in untracked_data/event-regions
 *   node scripts/events/region-apply.js batch-001.json ...   # only these maps
 *   node scripts/events/region-apply.js --dry-run
 *
 * Input is one or more `slug -> { regions, note? }` maps in `untracked_data/event-regions/`
 * (gitignored; the `worklist/` subfolder is not read). House pattern from `year-range-apply.js`
 * and `detail-apply.js`, for the same reason: parallel agents editing a shared 600 KB JSON
 * array corrupt it, so sub-agents write maps and one deterministic pass writes the catalogue.
 *
 * Everything is validated before anything is written; a single bad entry aborts the whole run,
 * so a half-applied batch is not a state you can reach. Tags are written in canonical form
 * (see `canonicalRegions`), which also drops a region a country already implies, so a writer
 * never has to think about order or redundancy.
 *
 * **Re-tagging is allowed.** An entry for a slug that already has tags replaces them, and the
 * run lists every such change so a correction is visible rather than silent.
 *
 * The `note` on an entry is for review and is not written: it is printed for every Global-only
 * entry, the one case that requires it, because "Global" used as a measure of importance is the
 * failure this whole feature most needs a human to catch.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, writeEvents } = require('./detail-catalogue');
const { entryProblems, canonicalRegions, regionSetOf, GLOBAL } = require('./region-spec');
const { auditEntries } = require('./region-audit');

const MAPS_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-regions');

const die = (msg, lines) => {
  console.error(`ABORT: ${msg}`);
  (lines || []).forEach((l) => console.error(`  ${l}`));
  process.exit(1);
};

function loadMaps(argv) {
  if (!fs.existsSync(MAPS_DIR)) {
    die(`No map directory at ${path.relative(process.cwd(), MAPS_DIR)}`, [
      'Write batches there as slug -> { "regions": ["Germany"] } JSON objects.',
    ]);
  }
  const named = argv.filter((a) => !a.startsWith('--')).map((a) => path.basename(a));
  const files = named.length
    ? named
    : fs
        .readdirSync(MAPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();
  if (!files.length) die(`no .json maps in ${path.relative(process.cwd(), MAPS_DIR)}`);

  const merged = {};
  const fileOf = new Map();
  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-supplied map name
    const map = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, file), 'utf8'));
    for (const [slug, entry] of Object.entries(map)) {
      if (fileOf.has(slug)) {
        die(`${slug} appears in more than one map file`, [`${fileOf.get(slug)} and ${file}`]);
      }
      fileOf.set(slug, file);
      merged[slug] = entry;
    }
  }
  return { merged, files, fileOf };
}

function indexCatalogue() {
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
  return { byFile, locate };
}

/** Mutates the indexed catalogue in place and reports what changed. */
function applyEntries(merged, locate) {
  const touchedFiles = new Set();
  const retagged = [];
  const preimages = new Map();
  let applied = 0;
  let unchanged = 0;

  for (const [slug, entry] of Object.entries(merged)) {
    const { file, event } = locate.get(slug);
    const next = canonicalRegions(entry.regions);
    if (JSON.stringify(event.regions) === JSON.stringify(next)) {
      unchanged += 1;
      continue;
    }
    preimages.set(slug, { ...event });
    if (Array.isArray(event.regions)) retagged.push({ slug, from: event.regions, to: next });
    // Mutated in place, so JSON.stringify keeps the original key order and a new field lands
    // last, the same as every other apply script.
    event.regions = next;
    touchedFiles.add(file);
    applied += 1;
  }
  return { touchedFiles, retagged, preimages, applied, unchanged };
}

function printBatchSummary(merged, fileOf) {
  const perFile = new Map();
  for (const [slug, entry] of Object.entries(merged)) {
    const file = fileOf.get(slug);
    const row = perFile.get(file) || { total: 0, globalOnly: 0, regions: new Map() };
    const tags = canonicalRegions(entry.regions);
    row.total += 1;
    if (tags.length === 1 && tags[0] === GLOBAL) row.globalOnly += 1;
    for (const r of regionSetOf(tags)) row.regions.set(r, (row.regions.get(r) || 0) + 1);
    perFile.set(file, row);
  }
  console.log('\nPer map file (a batch out of line with its neighbours is worth a look):');
  for (const [file, row] of perFile) {
    const top = [...row.regions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([r, n]) => `${r} ${n}`)
      .join(', ');
    console.log(`  ${file}: ${row.total} entries, ${row.globalOnly} Global-only; ${top}`);
  }
}

function driftProblems(preimages, locate) {
  const drift = [];
  for (const [slug, before] of preimages) {
    const { event } = locate.get(slug);
    const keys = new Set([...Object.keys(before), ...Object.keys(event)]);
    for (const key of keys) {
      if (key === 'regions') continue;
      if (JSON.stringify(before[key]) !== JSON.stringify(event[key])) {
        drift.push(`${slug}: "${key}" changed but only regions should have`);
      }
    }
  }
  return drift;
}

/** The post-apply sweep: warnings for a reviewer, never an abort. */
function printWarnings(merged, fileOf, locate) {
  const globalOnly = Object.entries(merged).filter(
    ([, e]) => e.regions.length === 1 && e.regions[0] === GLOBAL
  );
  if (globalOnly.length) {
    // No share threshold: a prehistory batch can rightly be full of these, and one famous event
    // tagged Global alone is wrong. Every note is read, so every one is printed.
    const share = globalOnly.length / Object.keys(merged).length;
    console.log(
      `\n${globalOnly.length} Global-only entr(ies), ${(share * 100).toFixed(1)}%, each needs its note read:`
    );
    for (const [slug, e] of globalOnly) console.log(`  ${slug}: ${e.note}`);
  }

  printBatchSummary(merged, fileOf);

  const entries = Object.entries(merged).map(([slug, e]) => ({
    slug,
    event: locate.get(slug).event,
    tags: canonicalRegions(e.regions),
  }));
  const findings = auditEntries(entries, { withDetail: false });
  if (findings.length) {
    console.log(`\nAudit: ${findings.length} card(s) whose own text names a place the tags miss:`);
    for (const line of findings) console.log(`  ${line}`);
  }
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');

  const { merged, files, fileOf } = loadMaps(argv);
  const { byFile, locate } = indexCatalogue();

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
  const { touchedFiles, retagged, preimages, applied, unchanged } = applyEntries(merged, locate);

  // ---- prove nothing else moved -------------------------------------------
  const drift = driftProblems(preimages, locate);
  if (drift.length) die('unexpected field drift; nothing written', drift);

  if (dryRun) {
    console.log(`[dry run] would tag ${applied}, leave ${unchanged} already current`);
  } else {
    for (const file of touchedFiles) writeEvents(file, byFile.get(file));
    console.log(
      `Tagged ${applied} event(s) across ${touchedFiles.size} shard(s); ${unchanged} already current.`
    );
  }

  if (retagged.length) {
    console.log(`\n${retagged.length} event(s) re-tagged:`);
    for (const r of retagged)
      console.log(`  ${r.slug}: [${r.from.join(', ')}] -> [${r.to.join(', ')}]`);
  }

  printWarnings(merged, fileOf, locate);
}

main();
