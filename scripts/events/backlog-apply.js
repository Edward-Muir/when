#!/usr/bin/env node
/**
 * Applies category changes and duplicate retirements from the catalogue-error backlog.
 *
 * Usage:
 *   node scripts/events/backlog-apply.js                     # all maps in untracked_data/backlog-fixes
 *   node scripts/events/backlog-apply.js fixes-001.json ...  # only these maps
 *   node scripts/events/backlog-apply.js --dry-run
 *
 * Input is one or more `slug -> { category?, retire?: { keep, reason } }` maps in
 * `untracked_data/backlog-fixes/` (gitignored). Same map-then-apply pattern as
 * `date-clues-apply.js` (names and descriptions), `detail-apply.js` (prose) and
 * `year-range-apply.js` (years), which cover the backlog's other fix types; this covers the two
 * they don't.
 *
 * **A category must be in `ALL_CATEGORIES`.** Nothing else checks it at runtime: a bad value
 * silently drops the card from every pool. The list is read from `src/types/index.ts`, the
 * source of truth, rather than copied here.
 *
 * **Retiring is never a delete.** The event moves to `deprecated.json` with `_originalCategory`,
 * `_deprecatedAt` and `_deprecatedReason`, as `apply-dedup-deletions.js` does, and its two
 * satellites go with it: the detail-prose entry (an orphan fails `eventDetailCorpus.test.ts`)
 * and its line in `year-range-decided.json` (a ledger slug outside the manifest fails
 * `eventYearRange.test.ts`). `keep` names the twin that stays; it must be live and not itself
 * retired, so a cluster can never lose every copy. A slug that a badge draws its art from
 * (`src/data/achievements.ts`) is refused outright.
 *
 * Everything is validated before anything is written; one bad entry aborts the run.
 */

const fs = require('fs');
const path = require('path');
const {
  EVENTS_DIR,
  manifestFiles,
  readEvents,
  writeEvents,
  readDetailShard,
  writeDetailShard,
  writeJson,
} = require('./detail-catalogue');

const ROOT = path.join(__dirname, '..', '..');
const MAPS_DIR = path.join(ROOT, 'untracked_data', 'backlog-fixes');
const LEDGER = path.join(__dirname, 'year-range-decided.json');
const DEPRECATED = path.join(EVENTS_DIR, 'deprecated.json');
const DEPRECATED_AT = '2026-10-10T00:00:00.000Z';

const die = (msg, lines) => {
  console.error(`ABORT: ${msg}`);
  (lines || []).forEach((l) => console.error(`  ${l}`));
  process.exit(1);
};

function allCategories() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'types', 'index.ts'), 'utf8');
  const block = src.match(/ALL_CATEGORIES:\s*Category\[\]\s*=\s*\[([^\]]*)\]/);
  if (!block) die('could not read ALL_CATEGORIES from src/types/index.ts');
  return new Set([...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]));
}

function badgeSlugs() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'data', 'achievements.ts'), 'utf8');
  return new Set([...src.matchAll(/eventName:\s*'([^']+)'/g)].map((m) => m[1]));
}

function loadMaps(argv) {
  if (!fs.existsSync(MAPS_DIR)) die(`No map directory at ${path.relative(ROOT, MAPS_DIR)}`);
  const named = argv.filter((a) => !a.startsWith('--')).map((a) => path.basename(a));
  const files = named.length
    ? named
    : fs
        .readdirSync(MAPS_DIR)
        .filter((f) => f.endsWith('.json'))
        .sort();
  if (!files.length) die(`no .json maps in ${path.relative(ROOT, MAPS_DIR)}`);
  const merged = {};
  for (const file of files) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- operator-supplied map name
    const map = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, file), 'utf8'));
    for (const [slug, entry] of Object.entries(map)) {
      if (merged[slug]) die(`${slug} appears in more than one map file`, [file]);
      merged[slug] = entry;
    }
  }
  return merged;
}

function retireProblems(slug, entry, ctx) {
  const problems = [];
  const { keep, reason } = entry.retire || {};
  if (entry.category !== undefined) problems.push(`${slug}: retire and category together`);
  if (typeof reason !== 'string' || reason.trim().length < 10) {
    problems.push(`${slug}: retire needs a reason`);
  }
  if (!ctx.live.has(keep)) problems.push(`${slug}: keep "${keep}" is not a live event`);
  else if (ctx.retiring.has(keep)) problems.push(`${slug}: keep "${keep}" is itself retired`);
  if (keep === slug) problems.push(`${slug}: cannot keep itself`);
  if (ctx.badges.has(slug)) problems.push(`${slug}: a badge draws its art from this card`);
  return problems;
}

function entryProblems(slug, entry, ctx) {
  const keys = Object.keys(entry || {});
  if (!keys.length) return [`${slug}: empty entry`];
  const problems = keys
    .filter((k) => k !== 'category' && k !== 'retire')
    .map((k) => `${slug}: may not set "${k}"`);
  if (!ctx.live.has(slug)) problems.push(`${slug}: not a live event`);
  if (entry.category !== undefined && !ctx.categories.has(entry.category)) {
    problems.push(`${slug}: category "${entry.category}" is not in ALL_CATEGORIES`);
  }
  if (entry.retire !== undefined) problems.push(...retireProblems(slug, entry, ctx));
  return problems;
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const merged = loadMaps(argv);

  const byFile = new Map();
  const live = new Map();
  for (const file of manifestFiles()) {
    const events = readEvents(file);
    byFile.set(file, events);
    for (const e of events) live.set(e.name, file);
  }
  const retiring = new Set(
    Object.entries(merged)
      .filter(([, e]) => e && e.retire)
      .map(([slug]) => slug)
  );
  const ctx = { live, retiring, categories: allCategories(), badges: badgeSlugs() };

  const problems = Object.entries(merged).flatMap(([slug, e]) => entryProblems(slug, e, ctx));
  if (problems.length) die(`${problems.length} problem(s); nothing written`, problems);

  const deprecated = JSON.parse(fs.readFileSync(DEPRECATED, 'utf8'));
  const ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
  const touched = new Set();
  const detailTouched = new Map();
  const recategorised = [];
  const retired = [];

  for (const [slug, entry] of Object.entries(merged)) {
    const file = live.get(slug);
    const events = byFile.get(file);
    const index = events.findIndex((e) => e.name === slug);
    if (entry.category !== undefined && events[index].category !== entry.category) {
      recategorised.push(`${slug}: ${events[index].category} -> ${entry.category}`);
      events[index] = { ...events[index], category: entry.category };
      touched.add(file);
    }
    if (entry.retire) {
      const [event] = events.splice(index, 1);
      deprecated.push({
        ...event,
        _originalCategory: event.category,
        _deprecatedAt: DEPRECATED_AT,
        _deprecatedReason: `Duplicate of ${entry.retire.keep}: ${entry.retire.reason}`,
      });
      touched.add(file);
      if (!detailTouched.has(file)) detailTouched.set(file, readDetailShard(file));
      delete detailTouched.get(file)[slug];
      delete ledger[slug];
      retired.push(`${slug} (keep ${entry.retire.keep})`);
    }
  }

  if (!dryRun) {
    for (const file of touched) writeEvents(file, byFile.get(file));
    for (const [file, shard] of detailTouched) writeDetailShard(file, shard);
    if (retired.length) {
      writeJson(DEPRECATED, deprecated);
      const sorted = {};
      for (const k of Object.keys(ledger).sort()) sorted[k] = ledger[k];
      writeJson(LEDGER, sorted);
    }
  }

  const verb = dryRun ? '[dry run] would' : 'Did';
  console.log(`${verb} recategorise ${recategorised.length}, retire ${retired.length}`);
  recategorised.forEach((l) => console.log(`  category  ${l}`));
  retired.forEach((l) => console.log(`  retire    ${l}`));
}

main();
