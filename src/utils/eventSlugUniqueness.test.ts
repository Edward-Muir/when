import fs from 'fs';
import path from 'path';

/**
 * `name` is the event's global id: the collection stores it (`placedEventIds` in
 * statsStorage), curated themes pin it, card reports key on it, and
 * `buildEventsByName` builds a Map from it.
 *
 * That Map is last-write-wins, so a duplicate slug does not error — it silently makes
 * one of the two events unreachable, and the collection then shows the wrong card for
 * it. Two pairs had drifted in this way (`human-genome-completed` was the same event
 * filed twice; `first-pharmacopoeia` was two different events 1,481 years apart), which
 * is what this test exists to prevent.
 *
 * deprecated.json is checked too. It is excluded from the manifest, so nothing in it
 * reaches the game — but a retired event that still carries a live event's slug would
 * make any future "is this id known?" lookup ambiguous.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');

const MANIFEST_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;
const ALL_FILES = [...MANIFEST_FILES, 'deprecated.json'];

function readEvents(file: string): Array<{ name: string; friendly_name: string; year: number }> {
  return JSON.parse(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- manifest-derived allowlist
    fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8')
  );
}

describe('event slug uniqueness', () => {
  it('every `name` is unique across every event file', () => {
    const seen = new Map<string, string[]>();
    for (const file of ALL_FILES) {
      for (const event of readEvents(file)) {
        const where = `${file} (${event.year}) ${event.friendly_name}`;
        seen.set(event.name, [...(seen.get(event.name) || []), where]);
      }
    }

    const offenders = [...seen.entries()]
      .filter(([, places]) => places.length > 1)
      .map(([name, places]) => `${name}: ${places.join(' | ')}`);

    expect(offenders).toEqual([]);
  });

  it('every event has a non-empty `name`', () => {
    const offenders: string[] = [];
    for (const file of ALL_FILES) {
      for (const event of readEvents(file)) {
        if (!event.name || !event.name.trim()) offenders.push(`${file}: ${event.friendly_name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
