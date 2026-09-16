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
 * `has_detail` alone decides whether a card reads its prose or its description, and the sidecar
 * alone holds that prose, so either one without the other is a live defect a player would meet:
 * a flag with no prose is a card that falls back to its description after a failed fetch, and
 * prose with no flag is writing nobody can reach.
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
    // The event record is passed so the restatement check against `description` runs too; it is
    // optional in the spec only so a one-off check can skip loading the catalogue.
    const bySlug = new Map(readEvents(file).map((e) => [e.name, e]));
    const problems = Object.entries(shard).flatMap(([slug, entry]) =>
      spec.entryProblems(slug, entry, bySlug.get(slug))
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
    // Fixtures have to be valid prose in every respect but the one under test, now that the spec
    // checks voice as well as shape — a bare run of one letter fails terminal punctuation alone.
    // Half the total floor, so a pair of them is exactly the shortest legal entry.
    const half = Math.ceil(spec.MIN_TOTAL_CHARS / spec.MIN_PARAGRAPHS);
    const ok = `${'y'.repeat(half - 1)}.`;
    const long = `${'x'.repeat(spec.MAX_PARAGRAPH_CHARS)}.`;

    expect(spec.entryProblems('s', { paragraphs: [ok, ok] })).toEqual([]);

    expect(spec.entryProblems('s', { paragraphs: [ok] })).not.toEqual([]); // too few
    expect(spec.entryProblems('s', { paragraphs: [ok, ok, ok] })).not.toEqual([]); // too many
    expect(spec.entryProblems('s', { paragraphs: [ok, long] })).not.toEqual([]); // overlong
    expect(spec.entryProblems('s', { paragraphs: [ok, ` ${ok} `] })).not.toEqual([]); // whitespace
    expect(spec.entryProblems('s', { paragraphs: [ok, `${ok}\n${ok}`] })).not.toEqual([]); // newline
    expect(spec.entryProblems('s', { paragraphs: 'not an array' })).not.toEqual([]);
    expect(spec.entryProblems('s', undefined)).not.toEqual([]);

    // Both totals bind: the per-paragraph band alone implies neither, which is the point of
    // having them. A pair at the per-paragraph floor is under MIN_TOTAL, a pair at the ceiling is
    // over MAX_TOTAL, so neither a two-stub entry nor two walls of text can pass.
    expect(spec.MIN_PARAGRAPH_CHARS * spec.MAX_PARAGRAPHS).toBeLessThan(spec.MIN_TOTAL_CHARS);
    expect(spec.MAX_PARAGRAPH_CHARS * spec.MAX_PARAGRAPHS).toBeGreaterThan(spec.MAX_TOTAL_CHARS);
    const stub = `${'z'.repeat(spec.MIN_PARAGRAPH_CHARS - 1)}.`;
    expect(spec.entryProblems('s', { paragraphs: [stub, stub] })).not.toEqual([]); // under total
    const wide = `${'w'.repeat(spec.MAX_PARAGRAPH_CHARS - 1)}.`;
    expect(spec.entryProblems('s', { paragraphs: [wide, wide] })).not.toEqual([]); // over total
  });

  // A paragraph of exactly the minimum length, opening with `lead`. Fixtures have to be valid in
  // every respect but the one under test, now that the spec checks voice as well as shape.
  const para = (lead: string) =>
    `${lead}. ${'y'.repeat(Math.max(1, Math.ceil(spec.MIN_TOTAL_CHARS / spec.MIN_PARAGRAPHS) - lead.length - 3))}.`;
  // A pair of those is exactly the shortest legal entry, so only the rule under test can fail it.
  const entryWith = (lead: string) => ({
    paragraphs: [para(lead), para('The second paragraph')],
  });

  it('rejects the voice Phase 3 is most likely to produce by accident', () => {
    // Every one of these is a real machine tell catalogued in docs/event-detail/writing-spec.md.
    // The rules they enforce are the thing a sub-agent cannot be trusted to remember 137 times.
    expect(spec.entryProblems('s', entryWith('The fleet sailed at dawn'))).toEqual([]);

    const banned = [
      'It was not just a battle, but a statement of intent',
      'The fort served as the northern anchor of the frontier',
      'The charter was a testament to the stubbornness of the barons',
      'The voyage paved the way for a century of Atlantic crossing',
      'The design was meticulous and the result groundbreaking',
      'Experts say the count was higher than the official record',
      'The city fell in autumn, cementing his hold on the north',
      'Notably, the siege lasted through a second winter',
      'The reforms were arguably the most sweeping of the reign',
      'The rules are load-bearing for everything that followed',
      'The fleet sailed \u2014 and was lost',
      'The fleet sailed \u2013 and was lost',
      'The king\u2019s fleet sailed at dawn',
      'What did the fleet find?',
      'If you had stood on the quay',
      'The ship is pictured under full sail',
      'PLACEHOLDER: the fleet sailed',
    ];
    for (const lead of banned) {
      expect(spec.entryProblems(lead, entryWith(lead))).not.toEqual([]);
    }

    // The placeholder corpus is exempt from voice rules: it is lorem, and detail-report.js
    // already refuses to call it done.
    expect(
      spec.entryProblems('s', { ...entryWith('PLACEHOLDER: the fleet sailed'), placeholder: true })
    ).toEqual([]);
  });

  it('rejects prose that restates the description it replaced', () => {
    const event = {
      name: 's',
      friendly_name: 'S',
      description:
        'Athenian forces defeated the Persian invasion, inspiring the marathon race legend.',
    };

    const restates = entryWith('Athenian forces defeated the Persian invasion, inspiring a legend');
    expect(spec.entryProblems('s', restates, event)).not.toEqual([]);
    // Without the event record the check cannot run, and must not crash or false-positive.
    expect(spec.entryProblems('s', restates)).toEqual([]);

    const extendsIt = entryWith(
      'The runner who carried the news is a later invention, absent from Herodotus'
    );
    expect(spec.entryProblems('s', extendsIt, event)).toEqual([]);
  });
});
