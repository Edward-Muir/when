import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const spec = require('../../scripts/events/detail-spec.js');

/**
 * The Phase 3 quality gate for long-form event prose.
 *
 * `scripts/events/detail-spec.js` holds the shape rules in plain CommonJS so the maintainer
 * scripts can run them under a bare `node`; this test is what points them at the real catalogue.
 * Same arrangement as `eventDateClues.test.ts` and `scripts/events/date-clues.js`.
 *
 * The invariant worth the most here is the two-way pairing between `has_detail` and the sidecar.
 * `has_detail` alone decides whether the info button renders, and the sidecar alone holds what
 * the button opens, so either one without the other is a live defect a player would meet:
 * a flag with no prose is a button that opens nothing, and prose with no flag is writing
 * nobody can reach.
 *
 * Everything here passes trivially while the sidecar is empty — that is the Phase 1 state.
 */

interface EventRecord {
  name: string;
  friendly_name: string;
  has_detail?: boolean;
}

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const DETAIL_DIR = path.join(EVENTS_DIR, spec.DETAIL_DIR);

// Read the manifest rather than hardcoding the file list, so a new event file is not silently
// unguarded. deprecated.json is excluded for free by being absent from it.
const EVENT_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;

function readEvents(file: string): EventRecord[] {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  return JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
}

function readShard(file: string): Record<string, { paragraphs?: unknown }> {
  const shardPath = path.join(DETAIL_DIR, file);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  if (!fs.existsSync(shardPath)) return {};
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- file comes from the manifest
  return JSON.parse(fs.readFileSync(shardPath, 'utf8'));
}

describe('event detail sidecar', () => {
  it.each(EVENT_FILES)('%s: every entry meets the shape spec', (file) => {
    const shard = readShard(file);
    const problems = Object.entries(shard).flatMap(([slug, entry]) =>
      spec.entryProblems(slug, entry)
    );
    expect(problems).toEqual([]);
  });

  it.each(EVENT_FILES)('%s: every entry belongs to an event in this file', (file) => {
    const known = new Set(readEvents(file).map((e) => e.name));
    // Slugs have been re-issued before (see docs/events-images/index.md), and a sidecar keyed by
    // a slug that no longer exists is prose nothing can ever open.
    const orphans = Object.keys(readShard(file)).filter((slug) => !known.has(slug));
    expect(orphans).toEqual([]);
  });

  it.each(EVENT_FILES)('%s: has_detail is set exactly where prose exists', (file) => {
    const shard = readShard(file);
    const flaggedWithoutProse: string[] = [];
    const proseWithoutFlag: string[] = [];

    for (const event of readEvents(file)) {
      const hasProse = Boolean(shard[event.name]);
      if (event.has_detail && !hasProse) flaggedWithoutProse.push(event.name);
      if (hasProse && !event.has_detail) proseWithoutFlag.push(event.name);
    }

    expect({ flaggedWithoutProse, proseWithoutFlag }).toEqual({
      flaggedWithoutProse: [],
      proseWithoutFlag: [],
    });
  });

  it('rejects the shapes Phase 3 is most likely to produce by accident', () => {
    const long = 'x'.repeat(spec.MAX_PARAGRAPH_CHARS + 1);
    const ok = 'y'.repeat(spec.MIN_PARAGRAPH_CHARS);

    expect(spec.entryProblems('s', { paragraphs: [ok] })).not.toEqual([]); // too few
    expect(spec.entryProblems('s', { paragraphs: [ok, ok, ok, ok] })).not.toEqual([]); // too many
    expect(spec.entryProblems('s', { paragraphs: [ok, long] })).not.toEqual([]); // overlong
    expect(spec.entryProblems('s', { paragraphs: [ok, ' padded '] })).not.toEqual([]); // whitespace
    expect(spec.entryProblems('s', { paragraphs: [ok, `${ok}\n${ok}`] })).not.toEqual([]); // newline
    expect(spec.entryProblems('s', { paragraphs: 'not an array' })).not.toEqual([]);
    expect(spec.entryProblems('s', undefined)).not.toEqual([]);

    expect(spec.entryProblems('s', { paragraphs: [ok, ok] })).toEqual([]);
  });
});
