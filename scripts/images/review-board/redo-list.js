/**
 * The redo list: the card images Edward marked on the review board for regeneration
 * (docs/events-images/review-board.md has the format and the rules for its consumer).
 *
 * The board writes it and a later regeneration step reads it and stamps what it did, so both
 * go through `updateRedoList`: it takes a short lock, re-reads the file, applies the change and
 * writes it atomically, so neither side can lose the other's write or leave half a file.
 */

const fs = require('fs');
const path = require('path');

const { IMAGES_DIR } = require('../../factory/config');
const { writeJson } = require('../../factory/cli');

const DATA_DIR = process.env.REVIEW_BOARD_DIR
  ? path.resolve(process.env.REVIEW_BOARD_DIR)
  : path.join(IMAGES_DIR, 'review-board');
const REDO_FILE = path.join(DATA_DIR, 'redo-list.json');

const FORMAT = 1;
const MAX_NOTE = 300;
const LOCK_WAIT_MS = 3000;
const LOCK_STALE_MS = 30 * 1000;

function emptyList() {
  return { format: FORMAT, updated_at: null, entries: [] };
}

function readRedoList(file = REDO_FILE) {
  if (!fs.existsSync(file)) return emptyList();
  const list = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (list.format !== FORMAT || !Array.isArray(list.entries)) {
    throw new Error(`${file} is not a format-${FORMAT} redo list`);
  }
  return list;
}

/* global Atomics, SharedArrayBuffer */
function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** An exclusive lockfile beside the list, taken for the length of one read-modify-write. */
function withLock(file, fn) {
  const lock = `${file}.lock`;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const deadline = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      fs.writeFileSync(lock, `${process.pid}\n`, { flag: 'wx' });
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let age = 0;
      try {
        age = Date.now() - fs.statSync(lock).mtimeMs;
      } catch {
        continue;
      }
      if (age > LOCK_STALE_MS) fs.rmSync(lock, { force: true });
      else if (Date.now() > deadline) throw new Error(`${lock} is held; try again`);
      else sleep(50);
    }
  }
  try {
    return fn();
  } finally {
    fs.rmSync(lock, { force: true });
  }
}

/**
 * Re-read the list, let `mutator(list)` change it in place, and write it back atomically.
 * Returns whatever the mutator returns.
 */
function updateRedoList(mutator, file = REDO_FILE) {
  return withLock(file, () => {
    const list = readRedoList(file);
    const result = mutator(list);
    list.updated_at = new Date().toISOString();
    writeJson(file, list);
    return result;
  });
}

/** Open means the consumer has neither applied nor skipped it yet. */
function isOpen(entry) {
  return !entry.applied_at && !entry.skipped;
}

/** The slug's open entry, if any. There is never more than one. */
function openEntry(list, slug) {
  return list.entries.find((e) => e.slug === slug && isOpen(e)) || null;
}

function cleanNote(note) {
  return String(note || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NOTE);
}

/** A new open entry describing exactly the image Edward saw on `card`. */
function entryFor(card, note, now = new Date().toISOString()) {
  return {
    id: `${card.slug}@${now}`,
    slug: card.slug,
    friendly_name: card.friendly_name,
    source: card.source,
    deck: card.deck ? card.deck.id : null,
    deck_stage: card.deck ? card.deck.stage : null,
    factory_state: card.factory_state || null,
    live: Boolean(card.live),
    public_id: card.public_id || null,
    cloudinary_version: card.cloudinary_version || null,
    image: {
      kind: card.image.kind,
      file: card.image.file || null,
      sha256: card.image.sha256 || null,
    },
    note: cleanNote(note),
    marked_at: now,
    note_updated_at: null,
    applied_at: null,
    skipped: null,
  };
}

/** Marks `card`, or returns the existing open entry unchanged. */
function mark(list, card, note) {
  const existing = openEntry(list, card.slug);
  if (existing) return existing;
  const entry = entryFor(card, note);
  list.entries.push(entry);
  return entry;
}

function setNote(list, slug, note) {
  const entry = openEntry(list, slug);
  if (!entry) throw new Error(`${slug} is not marked`);
  entry.note = cleanNote(note);
  entry.note_updated_at = new Date().toISOString();
  return entry;
}

/** Removes the slug's open entry only; applied and skipped entries stay as history. */
function unmark(list, slug) {
  const entry = openEntry(list, slug);
  if (entry) list.entries.splice(list.entries.indexOf(entry), 1);
  return entry;
}

/**
 * True when `card` (from `resolveCard`) still shows the image the entry was marked on. The
 * consumer skips an entry for which this is false. A local image is compared by its bytes; a
 * Cloudinary-only image, whose bytes the board never saw, by its public_id and version.
 */
function isStillCurrent(entry, card) {
  if (!card || !card.image) return false;
  if (entry.image.kind !== card.image.kind) return false;
  if ((entry.public_id || null) !== (card.public_id || null)) return false;
  if (entry.image.kind === 'cloudinary') {
    return entry.cloudinary_version === (card.cloudinary_version || null);
  }
  return Boolean(entry.image.sha256) && entry.image.sha256 === card.image.sha256;
}

module.exports = {
  DATA_DIR,
  REDO_FILE,
  FORMAT,
  readRedoList,
  updateRedoList,
  isOpen,
  openEntry,
  entryFor,
  mark,
  setNote,
  unmark,
  isStillCurrent,
};
