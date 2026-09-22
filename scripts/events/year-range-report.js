#!/usr/bin/env node
/**
 * Reports which events look like they name a period rather than a moment, and emits the
 * worklist chunks for adding `year_end` to them.
 *
 * Usage:
 *   node scripts/events/year-range-report.js                 # summary per shard
 *   node scripts/events/year-range-report.js --chunks        # also write worklist chunks
 *   node scripts/events/year-range-report.js --file people.json
 *   node scripts/events/year-range-report.js --all           # every un-ranged event, not just
 *                                                            # the ones a heuristic flagged
 *   node scripts/events/year-range-report.js --chunk-size 60
 *
 * **This script always exits 0**, deliberately unlike `detail-report.js`, whose non-zero exit
 * is a merge gate. `year_end` is optional and most events will never have one, so "candidates
 * remaining" is not a defect and must not become a gate — copy that behaviour here and CI is
 * wedged forever.
 *
 * Chunks land in `untracked_data/event-ranges/worklist/` (gitignored) as `<shard>-NNN.json`.
 * Each record carries the signals that selected it, so a writer can reject a false positive
 * instead of inventing a range. Under `--all` a record with `signals: []` is one no heuristic
 * flagged at all, which is itself the strongest hint that the answer is no window.
 *
 * A chunk is **not** a map template, whatever an earlier version of this comment claimed: it
 * carries `friendly_name`, `category`, `difficulty`, `description` and `signals`, every one of
 * which `entryProblems` rejects as "may not set ...". The writer authors a fresh map.
 *
 * **Two things leave the remaining count**, and both are needed for it to be a progress meter:
 * an event given a window (it stops being un-ranged) and an event decided to be a moment (it
 * enters `year-range-decided.json`). Before the ledger existed, reviewing an event and leaving
 * it alone was indistinguishable from never having looked at it.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, writeJson } = require('./detail-catalogue');
const { eventRangeSignals, isRanged, readDecided } = require('./year-range');

const DEFAULT_CHUNK_SIZE = 40;
const WORKLIST_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-ranges', 'worklist');

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

/**
 * Chunks are numbered over the *current* worklist, so as events leave it the numbering shifts
 * and a stale `conflict-003.json` from an earlier wave holds different events under the same
 * name. Clearing the shard's chunks before regenerating is the only version of this that
 * survives contact with a long job; a runbook step gets missed around wave nine.
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

/** The worklist chunks for one shard, replacing whatever that shard had before. */
function writeChunks(file, remaining, chunkSize) {
  clearChunks(file);
  const written = [];
  for (let i = 0; i < remaining.length; i += chunkSize) {
    const index = String(i / chunkSize + 1).padStart(3, '0');
    const chunkName = `${file.replace(/\.json$/, '')}-${index}.json`;
    const payload = {};
    for (const { event, signals } of remaining.slice(i, i + chunkSize)) {
      payload[event.name] = {
        friendly_name: event.friendly_name,
        year: event.year,
        category: event.category,
        difficulty: event.difficulty,
        description: event.description,
        signals,
      };
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
  const wantAll = argv.includes('--all');
  const chunkSize = numericArg(argv, '--chunk-size', DEFAULT_CHUNK_SIZE);
  const fileArgIndex = argv.indexOf('--file');
  const onlyFile = fileArgIndex !== -1 ? argv[fileArgIndex + 1] : null;

  const files = manifestFiles().filter((f) => !onlyFile || f === onlyFile);
  if (onlyFile && files.length === 0) {
    console.error(`No such file in the manifest: ${onlyFile}`);
    process.exit(1);
  }

  const decided = readDecided();

  let totalEvents = 0;
  let totalRanged = 0;
  let totalDecided = 0;
  let totalRemaining = 0;
  const chunksWritten = [];

  for (const file of files) {
    const events = readEvents(file);
    const ranged = events.filter(isRanged);
    const open = events.filter((e) => !isRanged(e) && !(e.name in decided));
    const remaining = open
      .map((e) => ({ event: e, signals: eventRangeSignals(e) }))
      .filter(({ signals }) => wantAll || signals.length > 0);

    totalEvents += events.length;
    totalRanged += ranged.length;
    totalDecided += events.filter((e) => e.name in decided).length;
    totalRemaining += remaining.length;

    const pct = events.length ? ((ranged.length / events.length) * 100).toFixed(1) : '0.0';
    console.log(
      `${file.padEnd(22)} ${String(events.length).padStart(5)} events  ` +
        `${String(ranged.length).padStart(4)} ranged (${pct.padStart(5)}%)  ` +
        `${String(events.filter((e) => e.name in decided).length).padStart(5)} decided  ` +
        `${String(remaining.length).padStart(5)} remaining`
    );

    if (wantChunks) chunksWritten.push(...writeChunks(file, remaining, chunkSize));
  }

  console.log(
    `\n${totalEvents} events, ${totalRanged} with a range, ${totalDecided} decided a moment, ` +
      `${totalRemaining} ${wantAll ? 'un-reviewed' : 'candidates'} remaining.`
  );
  if (wantChunks) {
    console.log(
      `${chunksWritten.length} chunks of ${chunkSize} written to ` +
        `${path.relative(process.cwd(), WORKLIST_DIR)}`
    );
  }
  // Always 0 — see the header.
  process.exit(0);
}

main();
