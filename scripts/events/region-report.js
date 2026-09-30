#!/usr/bin/env node
/**
 * Reports region-tagging progress and emits the worklist chunks for tagging what is left.
 *
 * Usage:
 *   node scripts/events/region-report.js                  # progress per shard, counts per region
 *   node scripts/events/region-report.js --chunks         # also write worklist chunks
 *   node scripts/events/region-report.js --file people.json
 *   node scripts/events/region-report.js --chunk-size 40
 *
 * The work queue is every event with no `regions`. An event leaves it by being tagged, so the
 * remaining count is the progress meter. Once the sweep is done, `REQUIRE_REGIONS` in
 * `src/utils/eventRegions.test.ts` is what gates it; this script always exits 0.
 *
 * Chunks land in `untracked_data/event-regions/worklist/` (gitignored) as `<shard>-NNN.json`.
 * Each record carries the card's text **and its detail paragraphs**: that prose was researched
 * against sources and names the places, so a tagger rarely needs to search. It never carries
 * `wikipedia_url`, which is a difficulty-scoring byproduct and wrong often enough to matter.
 *
 * A chunk is not a map template. The tagger writes a fresh `slug -> { regions, note? }` map;
 * every field in a chunk would be rejected by `entryProblems` as "may not set".
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, readDetailShard, writeJson } = require('./detail-catalogue');
const { REGIONS, GLOBAL, regionSetOf } = require('./region-spec');

const DEFAULT_CHUNK_SIZE = 60;
const WORKLIST_DIR = path.join(
  __dirname,
  '..',
  '..',
  'untracked_data',
  'event-regions',
  'worklist'
);

function numericArg(argv, flag, fallback) {
  const i = argv.indexOf(flag);
  if (i === -1) return fallback;
  const value = Number(argv[i + 1]);
  if (!Number.isInteger(value) || value < 1) {
    console.error(`${flag} needs a positive integer, got ${JSON.stringify(argv[i + 1])}`);
    process.exit(1);
  }
  return value;
}

const isTagged = (event) => Array.isArray(event.regions) && event.regions.length > 0;

/**
 * Chunk numbering is over the *current* worklist, so it shifts as events are tagged and a stale
 * `conflict-003.json` would hold different events under the same name. Clearing the shard's
 * chunks before writing is what makes a re-run between waves safe.
 */
function clearChunks(file) {
  if (!fs.existsSync(WORKLIST_DIR)) return;
  const prefix = `${file.replace(/\.json$/, '')}-`;
  for (const name of fs.readdirSync(WORKLIST_DIR)) {
    if (name.startsWith(prefix) && name.endsWith('.json')) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- name is from readdir
      fs.unlinkSync(path.join(WORKLIST_DIR, name));
    }
  }
}

function chunkRecord(event, detail) {
  const record = { friendly_name: event.friendly_name, year: event.year };
  if (event.year_end !== undefined) record.year_end = event.year_end;
  record.category = event.category;
  record.description = event.description;
  const paragraphs = detail[event.name] && detail[event.name].paragraphs;
  if (Array.isArray(paragraphs)) record.detail = paragraphs;
  return record;
}

function writeChunks(file, remaining, chunkSize) {
  clearChunks(file);
  const detail = readDetailShard(file);
  const written = [];
  for (let i = 0; i < remaining.length; i += chunkSize) {
    const index = String(i / chunkSize + 1).padStart(3, '0');
    const chunkName = `${file.replace(/\.json$/, '')}-${index}.json`;
    const payload = {};
    for (const event of remaining.slice(i, i + chunkSize)) {
      payload[event.name] = chunkRecord(event, detail);
    }
    fs.mkdirSync(WORKLIST_DIR, { recursive: true });
    writeJson(path.join(WORKLIST_DIR, chunkName), payload);
    written.push(chunkName);
  }
  return written;
}

function main() {
  const argv = process.argv.slice(2);
  const wantChunks = argv.includes('--chunks');
  const chunkSize = numericArg(argv, '--chunk-size', DEFAULT_CHUNK_SIZE);
  const fileArgIndex = argv.indexOf('--file');
  const onlyFile = fileArgIndex !== -1 ? argv[fileArgIndex + 1] : null;

  const files = manifestFiles().filter((f) => !onlyFile || f === onlyFile);
  if (onlyFile && files.length === 0) {
    console.error(`No such file in the manifest: ${onlyFile}`);
    process.exit(1);
  }

  const perRegion = new Map(REGIONS.map((r) => [r, 0]));
  let globalOnly = 0;
  let totalEvents = 0;
  let totalTagged = 0;
  const chunksWritten = [];

  console.log(
    'Shard'.padEnd(26) + 'Events'.padStart(8) + 'Tagged'.padStart(8) + 'Left'.padStart(8)
  );
  for (const file of files) {
    const events = readEvents(file).filter((e) => e && e.name);
    const tagged = events.filter(isTagged);
    const remaining = events.filter((e) => !isTagged(e));
    for (const event of tagged) {
      for (const region of regionSetOf(event.regions)) {
        perRegion.set(region, (perRegion.get(region) || 0) + 1);
      }
      if (event.regions.length === 1 && event.regions[0] === GLOBAL) globalOnly += 1;
    }
    totalEvents += events.length;
    totalTagged += tagged.length;
    console.log(
      file.padEnd(26) +
        String(events.length).padStart(8) +
        String(tagged.length).padStart(8) +
        String(remaining.length).padStart(8)
    );
    if (wantChunks) chunksWritten.push(...writeChunks(file, remaining, chunkSize));
  }

  console.log(`\n${totalTagged} of ${totalEvents} tagged, ${totalEvents - totalTagged} remaining.`);
  if (totalTagged) {
    console.log('\nEvents per region (an event counts once in every region it resolves to):');
    for (const [region, count] of perRegion) {
      console.log(`  ${region.padEnd(28)}${String(count).padStart(6)}`);
    }
    const share = ((100 * globalOnly) / totalTagged).toFixed(1);
    console.log(`  ${'Global only'.padEnd(28)}${String(globalOnly).padStart(6)}  (${share}%)`);
  }
  if (wantChunks) {
    const rel = path.relative(process.cwd(), WORKLIST_DIR);
    console.log(`\nWrote ${chunksWritten.length} chunk(s) of up to ${chunkSize} to ${rel}/`);
  }
}

main();
