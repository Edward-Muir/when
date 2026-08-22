/**
 * Applies `slug -> { description?, friendly_name? }` rewrite maps to the event JSON.
 *
 *   node scripts/events/date-clues-apply.js            # dry run, validates only
 *   node scripts/events/date-clues-apply.js --apply    # write the files
 *
 * Maps are read from untracked_data/date-clues/rewrite-*.json (gitignored), so rewrites
 * can be authored in parallel across disjoint files while a single deterministic pass
 * touches the catalogue. This is the arrangement that kept the 2026-04 bulk rename clean
 * (scripts/shorten-names-apply.js) — agents editing a shared 186KB array corrupt it.
 *
 * Every check runs across the whole merged map BEFORE any file is written, so a bad
 * entry aborts the run rather than leaving the catalogue half-rewritten. Application is
 * keyed by slug and idempotent, so a partial run is safe to repeat.
 *
 * One-off in intent, but kept: the next bulk import will want it.
 */
const fs = require('fs');
const path = require('path');
const { eventDateClues, formatOffender } = require('./date-clues');

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const MAP_DIR = path.join(__dirname, '..', '..', 'untracked_data', 'date-clues');
const MAX_FRIENDLY_NAME_LENGTH = 35; // mirrors src/utils/eventNameLength.ts
const EDITABLE = ['description', 'friendly_name'];

const apply = process.argv.includes('--apply');
const die = (msg, lines) => {
  console.error(`ABORT: ${msg}`);
  (lines || []).forEach((l) => console.error(`  ${l}`));
  process.exit(1);
};

// ---- merge maps -------------------------------------------------------------
const mapFiles = fs.existsSync(MAP_DIR)
  ? fs.readdirSync(MAP_DIR).filter((f) => /^rewrite-.*\.json$/.test(f)).sort()
  : [];
if (!mapFiles.length) die(`no rewrite-*.json maps in ${path.relative(process.cwd(), MAP_DIR)}`);

const merged = {};
for (const f of mapFiles) {
  const m = JSON.parse(fs.readFileSync(path.join(MAP_DIR, f), 'utf8'));
  for (const [slug, patch] of Object.entries(m)) {
    if (merged[slug]) die(`slug appears in two maps: ${slug}`);
    merged[slug] = patch;
  }
}
console.log(`Merged ${Object.keys(merged).length} rewrites from ${mapFiles.length} map(s).`);

// ---- load catalogue ---------------------------------------------------------
const files = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')).files;
const catalogue = new Map(); // slug -> [{ file, event }]
const nameOwners = new Map(); // friendly_name -> [slug]
const loaded = {};
for (const file of files) {
  const events = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
  loaded[file] = events;
  for (const event of events) {
    // Slugs are globally unique and pinned by src/utils/eventSlugUniqueness.test.ts,
    // but don't assume it here: a collision is only fatal when a rewrite actually
    // targets an ambiguous slug, and warning is more useful than crashing.
    const entries = catalogue.get(event.name) || [];
    entries.push({ file, event });
    catalogue.set(event.name, entries);
    const owners = nameOwners.get(event.friendly_name) || [];
    owners.push(event.name);
    nameOwners.set(event.friendly_name, owners);
  }
}
for (const [slug, entries] of catalogue) {
  if (entries.length > 1) {
    console.warn(`! catalogue has ${entries.length} events with slug "${slug}" (${entries.map((e) => e.file).join(', ')})`);
  }
}

// ---- validate everything before writing anything ----------------------------
const errors = [];
for (const [slug, patch] of Object.entries(merged)) {
  const entries = catalogue.get(slug);
  if (!entries) {
    errors.push(`${slug}: no such event`);
    continue;
  }
  if (entries.length > 1) {
    errors.push(`${slug}: ambiguous — ${entries.length} events share this slug`);
    continue;
  }
  const entry = entries[0];
  const keys = Object.keys(patch);
  const illegal = keys.filter((k) => !EDITABLE.includes(k));
  if (illegal.length) errors.push(`${slug}: may only patch ${EDITABLE.join('/')}, got ${illegal.join('/')}`);
  if (!keys.length) errors.push(`${slug}: empty patch`);

  const proposed = { ...entry.event, ...patch };

  // The applier re-runs the guard on its own input: a rewrite that reintroduces a clue
  // must never reach the catalogue.
  const clues = eventDateClues(proposed);
  if (clues.length) errors.push(`${slug}: rewrite still has a date clue -> ${formatOffender(proposed, clues)}`);

  if (patch.friendly_name !== undefined) {
    const n = patch.friendly_name;
    if (n.length > MAX_FRIENDLY_NAME_LENGTH) {
      errors.push(`${slug}: friendly_name is ${n.length} chars, limit ${MAX_FRIENDLY_NAME_LENGTH} -> "${n}"`);
    }
    const owners = (nameOwners.get(n) || []).filter((s) => s !== slug);
    if (owners.length) errors.push(`${slug}: friendly_name "${n}" already used by ${owners.join(', ')}`);
  }
  if (patch.description !== undefined && !patch.description.trim()) {
    errors.push(`${slug}: empty description`);
  }
}
if (errors.length) die(`${errors.length} problem(s) in the rewrite maps:`, errors);
console.log('All rewrites validated.');

// ---- apply ------------------------------------------------------------------
const touched = new Set();
let changed = 0;
for (const [slug, patch] of Object.entries(merged)) {
  const { file, event } = catalogue.get(slug)[0];
  let dirty = false;
  for (const key of EDITABLE) {
    if (patch[key] !== undefined && event[key] !== patch[key]) {
      if (!apply) console.log(`  ${slug}.${key}\n    - ${event[key]}\n    + ${patch[key]}`);
      event[key] = patch[key];
      dirty = true;
    }
  }
  if (dirty) {
    changed += 1;
    touched.add(file);
  }
}

if (!apply) {
  console.log(`\nDry run: ${changed} event(s) would change across ${touched.size} file(s). Re-run with --apply.`);
  process.exit(0);
}

for (const file of touched) {
  // json.dumps(indent=2)+'\n' round-trips every event file byte-identically, and
  // .prettierignore covers public/events/, so the diff is exactly the edited lines.
  fs.writeFileSync(
    path.join(EVENTS_DIR, file),
    JSON.stringify(loaded[file], null, 2) + '\n',
    'utf8'
  );
  console.log(`  wrote ${file}`);
}
console.log(`Applied ${changed} rewrite(s) across ${touched.size} file(s).`);
