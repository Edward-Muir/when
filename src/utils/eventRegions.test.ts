import fs from 'fs';
import path from 'path';
import taxonomy from '../data/regions.json';
import { ALL_REGIONS, GLOBAL_REGION, eventRegionSet } from './regions';

/* eslint-disable @typescript-eslint/no-var-requires */
const spec = require('../../scripts/events/region-spec.js');
/* eslint-enable @typescript-eslint/no-var-requires */

/**
 * Region tags on the catalogue, and the taxonomy they come from.
 *
 * The rules come from `scripts/events/region-spec.js`, the same module the apply script
 * validates against, so the corpus and the tool that writes it cannot drift apart. The rules
 * for *choosing* tags are prose, in docs/regions/tagging-spec.md, and no test can hold them.
 *
 * **`REQUIRE_REGIONS` flips to true once the catalogue sweep lands.** Until then an untagged
 * event is simply not done yet; after it, an untagged event is one that `add-events` let
 * through, and a region filter would silently never deal it.
 */
const REQUIRE_REGIONS = false;

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const MANIFEST_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;

interface TaggedEvent {
  name: string;
  regions?: string[];
}

const events: TaggedEvent[] = MANIFEST_FILES.flatMap((file) =>
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- manifest-derived allowlist
  JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'))
);
const tagged = events.filter((e) => e.regions !== undefined);

const event = { name: 'x' };
const problemsFor = (regions: unknown, note?: string): string[] =>
  spec.entryProblems('x', note === undefined ? { regions } : { regions, note }, event);

describe('region taxonomy', () => {
  it('lists Global last, and fits the 12-bit challenge-code word the filter will use', () => {
    expect(ALL_REGIONS[ALL_REGIONS.length - 1]).toBe(GLOBAL_REGION);
    expect(ALL_REGIONS.length).toBeLessThanOrEqual(12);
  });

  it('rolls every country up to a real region, or names the regions it spans', () => {
    const bad: string[] = [];
    for (const [name, entry] of Object.entries(taxonomy.countries)) {
      const e = entry as { region?: string; spans?: string[] };
      const targets = e.region ? [e.region] : (e.spans ?? []);
      if (e.region && e.spans) bad.push(`${name}: has both region and spans`);
      for (const t of targets) {
        if (!ALL_REGIONS.includes(t) || t === GLOBAL_REGION) bad.push(`${name}: ${t}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('gives every country a distinct ISO code and never reuses a region name', () => {
    const isos = Object.values(taxonomy.countries).map((c) => c.iso);
    expect(new Set(isos).size).toBe(isos.length);
    expect(Object.keys(taxonomy.countries).filter((c) => ALL_REGIONS.includes(c))).toEqual([]);
  });
});

describe('region tag validator', () => {
  it('accepts the shapes the spec calls for', () => {
    expect(problemsFor(['Bahamas', 'Spain'])).toEqual([]);
    expect(problemsFor(['Turkey', 'Europe'])).toEqual([]);
    expect(problemsFor(['China', 'Global'])).toEqual([]);
    expect(problemsFor(['Europe'])).toEqual([]);
    expect(problemsFor(['Antarctica', 'Norway'])).toEqual([]);
    expect(problemsFor(['Global'], 'planet-wide glaciation')).toEqual([]);
  });

  it('rejects abbreviations and points at the readable name', () => {
    expect(problemsFor(['USA'])).toEqual(['x: unknown tag "USA" (did you mean "United States"?)']);
    expect(problemsFor(['UK'])[0]).toContain('did you mean "United Kingdom"');
    expect(problemsFor(['europe'])[0]).toContain('did you mean "Europe"');
    expect(problemsFor(['Atlantis'])[0]).toContain('not in src/data/regions.json');
  });

  it('makes a transcontinental country say which side the event is on', () => {
    expect(problemsFor(['Russia'])[0]).toContain('must be tagged explicitly');
    expect(problemsFor(['Russia', 'Europe'])).toEqual([]);
    expect(problemsFor(['Russia', 'East Asia'])[0]).toContain('must be tagged explicitly');
  });

  it('requires a note on Global alone, and only there', () => {
    expect(problemsFor(['Global'])[0]).toContain('needs a "note"');
    expect(problemsFor(['United States', 'Global'])).toEqual([]);
    expect(spec.entryProblems('x', { regions: ['Global'] }, event, { requireNote: false })).toEqual(
      []
    );
  });

  it('pushes a wide footprint towards region tags and then Global', () => {
    const seven = ['France', 'Germany', 'Italy', 'Spain', 'Poland', 'Austria', 'Belgium'];
    expect(problemsFor(seven)[0]).toContain('7 countries');
    const five = ['Europe', 'East Asia', 'South Asia', 'North America', 'Oceania'];
    expect(problemsFor(five)[0]).toContain('spans 5 regions');
    expect(problemsFor(['Antarctica'])[0]).toContain('resolves to no region');
  });

  it('rejects malformed entries', () => {
    expect(problemsFor([])[0]).toContain('non-empty array');
    expect(problemsFor(['Italy', 'Italy'])).toContain('x: duplicate tag');
    expect(spec.entryProblems('x', { regions: ['Italy'], year: 1 }, event)).toContain(
      'x: may not set "year"'
    );
    expect(spec.entryProblems('x', { regions: ['Italy'] }, undefined)[0]).toContain(
      'no such event'
    );
  });

  it('canonicalises order and drops a region a country already implies', () => {
    expect(spec.canonicalRegions(['Global', 'Spain', 'Europe', 'Bahamas'])).toEqual([
      'Bahamas',
      'Spain',
      'Global',
    ]);
    // Turkey spans two regions, so the explicit side stays.
    expect(spec.canonicalRegions(['Europe', 'Turkey'])).toEqual(['Turkey', 'Europe']);
  });
});

describe('event region tags', () => {
  it('every stored tag list passes the validator the apply script uses', () => {
    const problems = tagged.flatMap((e) =>
      spec.entryProblems(e.name, { regions: e.regions }, e, { requireNote: false })
    );
    expect(problems).toEqual([]);
  });

  it('every stored tag list is in canonical form', () => {
    const bad = tagged
      .filter((e) => JSON.stringify(spec.canonicalRegions(e.regions)) !== JSON.stringify(e.regions))
      .map((e) => `${e.name}: ${JSON.stringify(e.regions)}`);
    expect(bad).toEqual([]);
  });

  it('the app and the scripts resolve every event to the same regions', () => {
    const bad = tagged
      .filter(
        (e) =>
          JSON.stringify([...eventRegionSet(e)].sort()) !==
          JSON.stringify([...spec.regionSetOf(e.regions)].sort())
      )
      .map((e) => e.name);
    expect(bad).toEqual([]);
  });

  (REQUIRE_REGIONS ? it : it.skip)('every live event is tagged', () => {
    expect(events.filter((e) => !e.regions).map((e) => e.name)).toEqual([]);
  });
});
