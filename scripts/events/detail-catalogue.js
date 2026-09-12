/**
 * Shared disk access for the long-form detail sidecar: where the files are, how they are
 * written, and how a slug maps to its shard.
 *
 * CommonJS with no dependencies, same arrangement as `date-clues.js` and `themes/catalogue.js`,
 * so the maintainer scripts and the Jest corpus test both consume one definition.
 */

const fs = require('fs');
const path = require('path');
const { DETAIL_DIR } = require('./detail-spec');

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const DETAIL_PATH = path.join(EVENTS_DIR, DETAIL_DIR);

/**
 * The manifest file list. Read rather than hardcoded so a new event file is covered
 * automatically; `deprecated.json` is excluded for free by being absent from the manifest.
 */
function manifestFiles() {
  return JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')).files;
}

/** Every file round-trips byte-identically under this, and .prettierignore covers public/events. */
function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n');
}

function readEvents(file) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  return JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
}

function writeEvents(file, events) {
  writeJson(path.join(EVENTS_DIR, file), events);
}

/** A shard's contents, or {} when it has not been written yet. */
function readDetailShard(file) {
  const shardPath = path.join(DETAIL_PATH, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  if (!fs.existsSync(shardPath)) return {};
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  return JSON.parse(fs.readFileSync(shardPath, 'utf8'));
}

function writeDetailShard(file, shard) {
  fs.mkdirSync(DETAIL_PATH, { recursive: true });
  // Keys sorted so a re-run of the same content produces no diff, and batches merge cleanly.
  const sorted = {};
  for (const slug of Object.keys(shard).sort()) sorted[slug] = shard[slug];
  writeJson(path.join(DETAIL_PATH, file), sorted);
}

function deleteDetailShard(file) {
  const shardPath = path.join(DETAIL_PATH, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  if (fs.existsSync(shardPath)) fs.unlinkSync(shardPath);
}

/**
 * slug -> manifest file, across the whole catalogue. This is the server-side twin of
 * `getSourceFile` in src/utils/eventLoader.ts: the sidecar is sharded by source file, so this
 * is what decides where an entry is written.
 */
function sourceFileBySlug() {
  const bySlug = new Map();
  for (const file of manifestFiles()) {
    for (const event of readEvents(file)) {
      if (event && event.name) bySlug.set(event.name, file);
    }
  }
  return bySlug;
}

module.exports = {
  EVENTS_DIR,
  DETAIL_PATH,
  manifestFiles,
  readEvents,
  writeEvents,
  readDetailShard,
  writeDetailShard,
  deleteDetailShard,
  sourceFileBySlug,
  writeJson,
};
