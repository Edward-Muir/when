import fs from 'fs';
import path from 'path';
import { adjectives, animals } from 'unique-names-generator';
import { ADJECTIVES, ANIMALS } from '../../lib/leaderboard/botGeneration';
import {
  isKnownTrollName,
  isNameAllowed,
  normalizeDisplayName,
} from '../../lib/leaderboard/nameFilter';

/**
 * The false-positive budget for the display-name filter, enforced rather than documented.
 *
 * nameFilter's blocklist and onset-swap check both invent candidate strings, so the risk is
 * not that they miss a troll — it is that they rename a real player. This runs them over
 * every name the app can put on screen: the client's prefill dictionaries, the bot names
 * safeDisplayName falls back to, and every event card. All three must come back clean.
 *
 * This is the test to re-run when adding to TROLL_NAMES. If a new entry costs a false
 * positive, this is what says so.
 *
 * Kept out of nameFilter.test.ts because the cross products take a couple of seconds.
 */

const EVENTS_DIR = path.join(__dirname, '..', '..', 'public', 'events');
// The content event files loaded by the app (mirrors public/events/manifest.json).
const EVENT_FILES = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
  'people',
  'clothing',
  'communication',
  'earth-life',
  'food',
  'games-sport',
  'law',
  'medicine',
  'migration',
  'money',
  'candidates',
];

/**
 * Prefill pairs the whole filter blocks, and should.
 *
 * These are not false positives — MAX_DISPLAY_NAME_LENGTH cuts them mid-word and what is
 * left really is profane on the card: "Straightforward Cockroach" displays as
 * "Straightforward Cock". The filter is reading the truncated string, correctly. Listed
 * explicitly so the set is visible; the fix, if one is wanted, belongs in
 * normalizeDisplayName (truncate on a word boundary), not here.
 */
const EXPECTED_PREFILL_BLOCKS = [
  'Administrative Cuckoo',
  'Characteristic Cuckoo',
  'Constitutional Cuckoo',
  'Organisational Cuckoo',
  'Quintessential Cuckoo',
  'Representative Cuckoo',
  'Straightforward Booby',
  'Straightforward Cockroach',
  'Straightforward Cuckoo',
];

function blockedAmong(names: Iterable<string>): string[] {
  const offenders: string[] = [];
  for (const name of names) {
    if (!isNameAllowed(normalizeDisplayName(name))) offenders.push(name);
  }
  return offenders;
}

function trollFlaggedAmong(names: Iterable<string>): string[] {
  const offenders: string[] = [];
  for (const name of names) {
    if (isKnownTrollName(normalizeDisplayName(name))) offenders.push(name);
  }
  return offenders;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

describe('display-name filter false positives', () => {
  // A dependency bump that reshapes the dictionaries would silently shrink the corpus the
  // assertions below claim to cover, so pin the sizes and fail loudly instead.
  it('the client name dictionaries are the size this corpus assumes', () => {
    expect(adjectives).toHaveLength(1202);
    expect(animals).toHaveLength(355);
  });

  // LeaderboardSubmit's generateRandomName() prefills the input from these two dictionaries.
  // A false positive here is worse than a filter miss: the app would show a player a name in
  // the box and then silently replace it on submit.
  it('never flags a name the client can prefill', () => {
    const names: string[] = [];
    for (const adjective of adjectives) {
      for (const animal of animals) {
        names.push(`${capitalize(adjective)} ${capitalize(animal)}`);
      }
    }
    expect(names).toHaveLength(adjectives.length * animals.length);
    expect(blockedAmong(names).sort()).toEqual([...EXPECTED_PREFILL_BLOCKS].sort());
  });

  // safeDisplayName draws replacements from these, so a hit here means a blocked name gets
  // swapped for another blocked name. nameFilter.test.ts samples 200; this is exhaustive.
  it('never flags a generated bot name', () => {
    const names: string[] = [];
    for (const adjective of ADJECTIVES) {
      for (const animal of ANIMALS) names.push(`${adjective} ${animal}`);
    }
    expect(blockedAmong(names)).toEqual([]);
  });

  // Event names are never display names — they are here as a large corpus of ordinary
  // historical English, which is exactly the register a plausible player name sits in. Only
  // the two word-level checks are measured: the shipped obscenity dataset flags a couple of
  // dozen event titles on its own (Dickinson, Fukushima, Rape of Nanking), which predates
  // this file and is irrelevant to names.
  it('never flags event prose as a troll name', () => {
    const names = EVENT_FILES.flatMap((file) => {
      const events = JSON.parse(
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- file is from a fixed allowlist
        fs.readFileSync(path.join(EVENTS_DIR, `${file}.json`), 'utf8')
      ) as Array<{ name: string; friendly_name: string }>;
      return events.flatMap((e) => [e.name, e.friendly_name].filter(Boolean));
    });

    expect(names.length).toBeGreaterThan(1000);
    expect(trollFlaggedAmong(names)).toEqual([]);
  });

  // Same measurement, isolated, for the two corpora above: whatever the shipped dataset
  // does, the checks added for "Numb Digger" must contribute no blocks of their own.
  it('the word-level checks flag nothing the app generates', () => {
    const prefill: string[] = [];
    for (const adjective of adjectives) {
      for (const animal of animals) prefill.push(`${capitalize(adjective)} ${capitalize(animal)}`);
    }
    expect(trollFlaggedAmong(prefill)).toEqual([]);

    const bots: string[] = [];
    for (const adjective of ADJECTIVES) {
      for (const animal of ANIMALS) bots.push(`${adjective} ${animal}`);
    }
    expect(trollFlaggedAmong(bots)).toEqual([]);
  });
});
