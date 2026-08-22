/**
 * Audits every event the app loads for date clues in player-visible text, and writes
 * chunked worklists for the rewrite pass.
 *
 *   node scripts/events/date-clues-report.js           # summary + offender list
 *   node scripts/events/date-clues-report.js --write   # also write worklist chunks
 *
 * Chunks are grouped by source file and never mixed, so rewrites for one file stay in
 * one place. Output goes to untracked_data/date-clues/ (gitignored).
 *
 * Exit code is 1 when offenders remain, so this doubles as a pre-commit sanity check.
 */
const fs = require('fs');
const path = require('path');
const { eventDateClues, formatOffender } = require('./date-clues');

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const OUT_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'date-clues');
const CHUNK_SIZE = 25;

const files = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')).files;
const write = process.argv.includes('--write');

let total = 0;
const perFile = [];

for (const file of files) {
  const events = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
  const offenders = [];
  for (const event of events) {
    const clues = eventDateClues(event);
    if (clues.length) offenders.push({ event, clues });
  }
  if (!offenders.length) continue;
  total += offenders.length;
  perFile.push({ file, offenders });

  console.log(`\n${file} — ${offenders.length} event(s)`);
  for (const { event, clues } of offenders) console.log(`  ${formatOffender(event, clues)}`);
}

console.log(`\n${total} event(s) with date clues across ${perFile.length} file(s).`);

if (write) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let n = 0;
  for (const { file, offenders } of perFile) {
    const stem = file.replace(/\.json$/, '');
    for (let i = 0; i < offenders.length; i += CHUNK_SIZE) {
      const slice = offenders.slice(i, i + CHUNK_SIZE).map(({ event, clues }) => ({
        name: event.name,
        year: event.year,
        category: event.category,
        friendly_name: event.friendly_name,
        description: event.description,
        clues: clues.map((c) => `${c.field}:${c.kind} "${c.match}"`),
      }));
      const out = path.join(OUT_DIR, `worklist-${stem}-${i / CHUNK_SIZE + 1}.json`);
      fs.writeFileSync(out, JSON.stringify(slice, null, 2) + '\n', 'utf8');
      console.log(`  wrote ${path.relative(process.cwd(), out)} (${slice.length})`);
      n += slice.length;
    }
  }
  console.log(`Wrote ${n} entries.`);
}

process.exit(total ? 1 : 0);
