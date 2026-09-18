#!/usr/bin/env node
/**
 * Reports which events look like they name a period rather than a moment, and emits the
 * worklist chunks for adding `year_end` to them.
 *
 * Usage:
 *   node scripts/events/year-range-report.js                 # summary per shard
 *   node scripts/events/year-range-report.js --chunks        # also write worklist chunks
 *   node scripts/events/year-range-report.js --file people.json
 *
 * **This script always exits 0**, deliberately unlike `detail-report.js`, whose non-zero exit
 * is a merge gate. `year_end` is optional and most events will never have one, so "candidates
 * remaining" is not a defect and must not become a gate — copy that behaviour here and CI is
 * wedged forever.
 *
 * Chunks land in `untracked_data/event-ranges/worklist/` (gitignored) as `<shard>-NNN.json`.
 * Each record carries the signals that selected it, so a writer can reject a false positive
 * instead of inventing a range, and a `year_end: null` slot so the chunk doubles as its own
 * map template.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, writeJson } = require('./detail-catalogue');
const { eventRangeSignals, isRanged } = require('./year-range');

const CHUNK_SIZE = 40;
const WORKLIST_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-ranges', 'worklist');

function main() {
  const argv = process.argv.slice(2);
  const wantChunks = argv.includes('--chunks');
  const fileArgIndex = argv.indexOf('--file');
  const onlyFile = fileArgIndex !== -1 ? argv[fileArgIndex + 1] : null;

  const files = manifestFiles().filter((f) => !onlyFile || f === onlyFile);
  if (onlyFile && files.length === 0) {
    console.error(`No such file in the manifest: ${onlyFile}`);
    process.exit(1);
  }

  let totalEvents = 0;
  let totalRanged = 0;
  let totalCandidates = 0;
  const chunksWritten = [];

  for (const file of files) {
    const events = readEvents(file);
    const ranged = events.filter(isRanged);
    const candidates = events
      .filter((e) => !isRanged(e))
      .map((e) => ({ event: e, signals: eventRangeSignals(e) }))
      .filter(({ signals }) => signals.length > 0);

    totalEvents += events.length;
    totalRanged += ranged.length;
    totalCandidates += candidates.length;

    const pct = events.length ? ((ranged.length / events.length) * 100).toFixed(1) : '0.0';
    console.log(
      `${file.padEnd(22)} ${String(events.length).padStart(5)} events  ` +
        `${String(ranged.length).padStart(4)} ranged (${pct.padStart(5)}%)  ` +
        `${String(candidates.length).padStart(4)} candidates`
    );

    if (!wantChunks) continue;

    for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
      const slice = candidates.slice(i, i + CHUNK_SIZE);
      const chunkName = `${file.replace(/\.json$/, '')}-${String(i / CHUNK_SIZE + 1).padStart(3, '0')}.json`;
      const payload = {};
      for (const { event, signals } of slice) {
        payload[event.name] = {
          friendly_name: event.friendly_name,
          year: event.year,
          category: event.category,
          difficulty: event.difficulty,
          description: event.description,
          signals,
          year: event.year,
          year_end: null,
        };
      }
      fs.mkdirSync(WORKLIST_DIR, { recursive: true });
      writeJson(path.join(WORKLIST_DIR, chunkName), payload);
      chunksWritten.push(chunkName);
    }
  }

  console.log(
    `\n${totalEvents} events, ${totalRanged} with a range, ${totalCandidates} candidates without one.`
  );
  if (wantChunks) {
    console.log(
      `${chunksWritten.length} chunks written to ${path.relative(process.cwd(), WORKLIST_DIR)}`
    );
  }
  // Always 0 — see the header.
  process.exit(0);
}

main();
