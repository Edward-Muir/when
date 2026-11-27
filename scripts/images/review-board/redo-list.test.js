/**
 * node --test scripts/images/review-board/redo-list.test.js
 */

const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');

const redo = require('./redo-list');
const { RUNGS, rungUrl } = require('./cards');

const tmpFile = () =>
  path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'redo-list-')), 'redo-list.json');

const card = (over = {}) => ({
  slug: 'davy-safety-lamp',
  friendly_name: 'Davy Safety Lamp',
  source: 'factory',
  deck: { id: 'in-your-pocket', stage: 'art-in-progress' },
  factory_state: 'downloaded',
  live: false,
  public_id: null,
  cloudinary_version: null,
  image: { kind: 'inbox', file: 'inbox/in-your-pocket/davy-safety-lamp.jpeg', sha256: 'aaa' },
  ...over,
});

test('a slug has at most one open entry', () => {
  const file = tmpFile();
  redo.updateRedoList((list) => redo.mark(list, card(), 'too dark'), file);
  redo.updateRedoList((list) => redo.mark(list, card(), 'second click'), file);
  const list = redo.readRedoList(file);
  assert.equal(list.entries.length, 1);
  assert.equal(list.entries[0].note, 'too dark');
  assert.equal(list.entries[0].image.sha256, 'aaa');
  assert.equal(list.entries[0].deck, 'in-your-pocket');
});

test('unmark removes only the open entry and keeps history', () => {
  const file = tmpFile();
  redo.updateRedoList((list) => {
    const first = redo.mark(list, card(), 'old');
    first.applied_at = '2026-11-02T00:00:00.000Z';
    redo.mark(list, card(), 'new');
  }, file);
  assert.equal(redo.readRedoList(file).entries.length, 2);
  redo.updateRedoList((list) => redo.unmark(list, 'davy-safety-lamp'), file);
  const left = redo.readRedoList(file).entries;
  assert.equal(left.length, 1);
  assert.equal(left[0].note, 'old');
  assert.equal(redo.openEntry({ entries: left }, 'davy-safety-lamp'), null);
});

test('notes are trimmed, collapsed and capped', () => {
  const file = tmpFile();
  redo.updateRedoList((list) => redo.mark(list, card(), 'x'), file);
  redo.updateRedoList(
    (list) => redo.setNote(list, 'davy-safety-lamp', `  a\n\n b ${'c'.repeat(400)}`),
    file
  );
  const [entry] = redo.readRedoList(file).entries;
  assert.ok(entry.note.startsWith('a b c'));
  assert.equal(entry.note.length, 300);
  assert.ok(entry.note_updated_at);
});

test('isStillCurrent compares bytes, or public_id and version for Cloudinary images', () => {
  const entry = redo.entryFor(card(), '');
  assert.equal(redo.isStillCurrent(entry, card()), true);
  assert.equal(
    redo.isStillCurrent(entry, card({ image: { ...card().image, sha256: 'bbb' } })),
    false
  );
  assert.equal(redo.isStillCurrent(entry, card({ public_id: 'davy-safety-lamp_abc123' })), false);
  assert.equal(redo.isStillCurrent(entry, null), false);

  const cloud = card({
    public_id: 'x_abc123',
    cloudinary_version: 1,
    image: { kind: 'cloudinary', file: null, sha256: null },
  });
  const cloudEntry = redo.entryFor(cloud, '');
  assert.equal(redo.isStillCurrent(cloudEntry, cloud), true);
  assert.equal(redo.isStillCurrent(cloudEntry, { ...cloud, cloudinary_version: 2 }), false);
});

test('a write leaves no temp or lock file behind', () => {
  const file = tmpFile();
  redo.updateRedoList((list) => redo.mark(list, card(), ''), file);
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['redo-list.json']);
});

test('a held lock blocks a write', () => {
  const file = tmpFile();
  fs.writeFileSync(`${file}.lock`, '1\n');
  assert.throws(() => redo.updateRedoList(() => {}, file), /is held/);
});

test('the board asks Cloudinary for exactly the rungs the webapp uses', () => {
  const ts = fs.readFileSync(
    path.join(__dirname, '..', '..', '..', 'src', 'utils', 'cloudinaryImage.ts'),
    'utf8'
  );
  assert.ok(ts.includes(`thumbnail: '${RUNGS.thumbnail}'`));
  assert.ok(ts.includes(`detail: '${RUNGS.detail}'`));
  assert.equal(
    rungUrl(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/a-b_x1y2z3?_a=BAMAMikS0',
      'thumbnail'
    ),
    `https://res.cloudinary.com/dscb8inz1/image/upload/${RUNGS.thumbnail}/a-b_x1y2z3?_a=BAMAMikS0`
  );
});
