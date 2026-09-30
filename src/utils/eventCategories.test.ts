import fs from 'fs';
import path from 'path';
import { ALL_CATEGORIES } from '../types';

/**
 * Every live event's category is one the app knows. Nothing checks this at runtime:
 * `filterByCategory` keeps only selected categories, so a misspelt or retired value silently
 * drops the card from every pool, Custom and daily alike, and no player ever sees it again.
 */
const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const MANIFEST_FILES: string[] = JSON.parse(
  fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8')
).files;

describe('event categories', () => {
  it('every live event has a category in ALL_CATEGORIES', () => {
    const known = new Set<string>(ALL_CATEGORIES);
    const bad = MANIFEST_FILES.flatMap((file) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- manifest-derived allowlist
      const raw = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8');
      const events: Array<{ name: string; category: string }> = JSON.parse(raw);
      return events
        .filter((e) => !known.has(e.category))
        .map((e) => `${file}: ${e.name} has "${e.category}"`);
    });
    expect(bad).toEqual([]);
  });
});
