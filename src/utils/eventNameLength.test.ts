import fs from 'fs';
import path from 'path';
import { MAX_FRIENDLY_NAME_LENGTH } from './eventNameLength';

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
const CATEGORIES = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
];

describe('event friendly_name length', () => {
  it.each(CATEGORIES)('%s.json has no friendly_name over the display limit', (category) => {
    const events = JSON.parse(
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- category is from a fixed allowlist
      fs.readFileSync(path.join(EVENTS_DIR, `${category}.json`), 'utf8')
    ) as Array<{ name: string; friendly_name: string }>;

    const offenders = events
      .filter((e) => (e.friendly_name || '').length > MAX_FRIENDLY_NAME_LENGTH)
      .map((e) => `[${e.friendly_name.length}] ${e.name}: ${e.friendly_name}`);

    expect(offenders).toEqual([]);
  });
});
