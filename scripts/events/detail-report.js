#!/usr/bin/env node
/**
 * Reports which events still have no long-form prose, and emits the Phase 3 worklist.
 *
 * Usage:
 *   node scripts/events/detail-report.js                 # summary per shard
 *   node scripts/events/detail-report.js --chunks        # also write worklist chunks
 *   node scripts/events/detail-report.js --file people.json
 *
 * Exits non-zero while any event is unwritten, so it doubles as the progress meter and the merge
 * gate: **do not merge this branch while this script exits non-zero.** It is deliberately not part
 * of `npm test` — the suite would then be red for the whole of Phase 3, which just teaches
 * everyone to ignore it. Chunks land in `untracked_data/event-detail/worklist/` (gitignored)
 * as `<shard>-NNN.json`, each holding the slugs, titles, years and existing short descriptions
 * for one sub-agent batch.
 */

const fs = require('fs');
const path = require('path');
const { manifestFiles, readEvents, readDetailShard, writeJson } = require('./detail-catalogue');

const CHUNK_SIZE = 40;
const WORKLIST_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'event-detail', 'worklist');

function main() {
  const argv = process.argv.slice(2);
  const wantChunks = argv.includes('--chunks');
  const fileArgIndex = argv.indexOf('--file');
  const onlyFile = fileArgIndex !== -1 ? argv[fileArgIndex + 1] : null;

  const files = onlyFile ? [onlyFile] : manifestFiles();
  let totalMissing = 0;
  let totalEvents = 0;
  let chunksWritten = 0;

  if (wantChunks) fs.mkdirSync(WORKLIST_DIR, { recursive: true });

  // Smallest shard first: prove the pipeline on a cheap file before spending a big one.
  const ordered = files
    .map((file) => ({ file, events: readEvents(file) }))
    .sort((a, b) => a.events.length - b.events.length);

  for (const { file, events } of ordered) {
    const shard = readDetailShard(file);
    // A placeholder entry is not written prose: the whole corpus is committed as placeholder so
    // the branch's preview deploy is testable, and counting those as done would report 5,460/5,460
    // and emit no worklist at all. `detail-apply.js` replaces an entry wholesale, so real prose
    // drops the flag and is counted from then on.
    const missing = events.filter((event) => {
      const entry = shard[event.name];
      return !entry || entry.placeholder;
    });
    totalEvents += events.length;
    totalMissing += missing.length;

    const done = events.length - missing.length;
    console.log(
      `${file.padEnd(22)} ${String(done).padStart(5)}/${String(events.length).padEnd(5)} written` +
        (missing.length ? `  (${missing.length} to go)` : '  ✓')
    );

    if (!wantChunks || !missing.length) continue;

    for (let i = 0; i < missing.length; i += CHUNK_SIZE) {
      const chunk = missing.slice(i, i + CHUNK_SIZE).map((event) => ({
        name: event.name,
        friendly_name: event.friendly_name,
        year: event.year,
        category: event.category,
        difficulty: event.difficulty,
        description: event.description,
      }));
      const index = String(Math.floor(i / CHUNK_SIZE) + 1).padStart(3, '0');
      writeJson(path.join(WORKLIST_DIR, `${file.replace('.json', '')}-${index}.json`), chunk);
      chunksWritten++;
    }
  }

  console.log(
    `\n${totalEvents - totalMissing}/${totalEvents} events written, ${totalMissing} remaining.`
  );
  if (chunksWritten) console.log(`${chunksWritten} worklist chunk(s) in ${WORKLIST_DIR}`);

  process.exit(totalMissing ? 1 : 0);
}

main();
