import {
  MAX_DISPLAY_NAME_LENGTH,
  isNameAllowed,
  normalizeDisplayName,
  safeDisplayName,
} from '../../lib/leaderboard/nameFilter';

// Tested from src/ because CRA's Jest only roots there — same arrangement as
// adminAuth.test.ts, which imports api/card-reports/reportSchema.

const DEVICE = 'a'.repeat(32);
const OTHER_DEVICE = 'b'.repeat(32);

describe('normalizeDisplayName', () => {
  it('trims, collapses whitespace and strips markup characters', () => {
    expect(normalizeDisplayName('  Ed   Muir  ')).toBe('Ed Muir');
    expect(normalizeDisplayName('<script>Ed')).toBe('scriptEd');
  });

  it('caps at the length the client input allows', () => {
    expect(normalizeDisplayName('x'.repeat(50))).toHaveLength(MAX_DISPLAY_NAME_LENGTH);
  });

  it('strips zero-width and control characters used to split words', () => {
    expect(normalizeDisplayName('n\u200Big')).toBe('nig');
    expect(normalizeDisplayName('E\u0001d')).toBe('Ed');
  });

  it('handles missing input', () => {
    expect(normalizeDisplayName(undefined)).toBe('');
    expect(normalizeDisplayName(null)).toBe('');
  });
});

describe('isNameAllowed', () => {
  it.each([
    'Ed',
    'Farto',
    'Linguistic Platypus',
    'Preliminary Ferret',
    'Slight Jay',
    'Motionless Jay',
  ])('allows the ordinary name %p', (name) => {
    expect(isNameAllowed(name)).toBe(true);
  });

  // The Scunthorpe problem: these must survive, or real players get renamed. The
  // second row is history-flavoured names the shipped dataset flags on its own.
  it.each([
    'Scunthorpe',
    'Cockburn',
    'Assassin',
    'Analog',
    'Bass',
    'Hancock',
    'Montenegro',
    'Cumberland',
    'Dickinson',
    'Assyria',
    'Assyrian',
    'Penistone',
    'Fagan',
    'Retardant',
  ])('does not flag the innocent name %p', (name) => {
    expect(isNameAllowed(name)).toBe(true);
  });

  it('neutralises an allowed word without letting it shield a slur', () => {
    expect(isNameAllowed('Dickinson Nig')).toBe(false);
    expect(isNameAllowed('Assyria fuck')).toBe(false);
  });

  // The name that prompted this work, plus the obfuscations to expect next.
  it.each([
    'Motionless Nig',
    'Nig',
    'NIGGER',
    'n1gger',
    'niiigger',
    'n.i.g.g.e.r',
    'N I G',
    'Motionless N I G',
    'ni gg er',
  ])('blocks the slur %p', (name) => {
    expect(isNameAllowed(normalizeDisplayName(name))).toBe(false);
  });

  it.each(['fuck', 'Cunt Face', 'F U C K'])('blocks the strong profanity %p', (name) => {
    expect(isNameAllowed(normalizeDisplayName(name))).toBe(false);
  });

  it.each(['spic', 'Paki', 'wetback', 'Hitler'])('blocks the supplemental term %p', (name) => {
    expect(isNameAllowed(name)).toBe(false);
  });

  // These survive collapseDuplicates only because they bypass obscenity entirely;
  // if this regresses, someone has moved them back into the pattern dataset.
  it.each(['kkk', 'KKK', 'K.K.K.', '1488', 'Squad 1488'])(
    'blocks the literal hate term %p',
    (name) => {
      expect(isNameAllowed(name)).toBe(false);
    }
  );

  it('leaves ordinary words that contain a supplemental term alone', () => {
    expect(isNameAllowed('Raccoon')).toBe(true);
    expect(isNameAllowed('Pakistan')).toBe(true);
    expect(isNameAllowed('Spice Trader')).toBe(true);
  });

  // "Numb Digger" reached #1 on the live board. It is a spoonerism — swap the leading
  // consonants and it reads as a slur — so every character is innocent and no transformer
  // can see it. First row is the name itself and the spellings it folds onto; second row is
  // the carrier family, which is why a blocklist of one name was not enough.
  it.each([
    'Numb Digger',
    'numb digger',
    'NumbDigger',
    'Numb-Digger',
    'Numb  Digger',
    'Numb D1gger',
    'Numb Diqqer',
    'Numb Diggerrr',
  ])('blocks the known troll name %p', (name) => {
    expect(isNameAllowed(normalizeDisplayName(name))).toBe(false);
  });

  it.each([
    'Nice Digger',
    'New Digger',
    'Noble Digger',
    'Numb Diggers',
    'Numb Bigger',
    'Nasty Trigger',
    'Nice Jigger',
    'N Digger',
  ])('blocks the onset-swap variant %p', (name) => {
    expect(isNameAllowed(normalizeDisplayName(name))).toBe(false);
  });

  // The guard rail, and the more important half. `tiger` is the only innocent word in the
  // app's vocabulary carrying the -iger rime; `Noble Tiger` is a bot name, so flagging it
  // would mean safeDisplayName could hand out a replacement that is itself blocked. `Numb`
  // and `Digger` alone must pass — whole-name matching is the safety property.
  it.each([
    'Noble Tiger',
    'Nice Tiger',
    'Numb Tiger',
    'Tiny Tiger',
    'Numb',
    'Digger',
    'Nigeria',
    'Niger Delta',
    'Clever Leopard',
    'Silver Badger',
    'Fancy Duck',
    'Golden Fox',
    'Clever Condor',
    'Calm Loon',
    'Casual Pike',
  ])('does not flag the fold-adjacent name %p', (name) => {
    expect(isNameAllowed(normalizeDisplayName(name))).toBe(true);
  });
});

describe('safeDisplayName', () => {
  it('passes a clean name through normalized', () => {
    expect(safeDisplayName('  Farto ', DEVICE)).toBe('Farto');
  });

  it('replaces a blocked name rather than rejecting it', () => {
    const result = safeDisplayName('Motionless Nig', DEVICE);
    expect(result).not.toMatch(/nig/i);
    expect(isNameAllowed(result)).toBe(true);
  });

  it('generates a name for empty input instead of falling back to "Anonymous"', () => {
    expect(safeDisplayName('   ', DEVICE)).toMatch(/^\w+ \w+$/);
    expect(safeDisplayName(undefined, DEVICE)).toMatch(/^\w+ \w+$/);
  });

  // The leaderboard polls every 15s and submit/read both call this, so the
  // replacement has to be stable for a device and distinct between devices.
  it('is deterministic per device', () => {
    expect(safeDisplayName('Nig', DEVICE)).toBe(safeDisplayName('Nig', DEVICE));
    expect(safeDisplayName('', DEVICE)).toBe(safeDisplayName('Nig', DEVICE));
    expect(safeDisplayName('Nig', DEVICE)).not.toBe(safeDisplayName('Nig', OTHER_DEVICE));
  });

  it('never returns a name that would itself be filtered', () => {
    for (let i = 0; i < 200; i++) {
      const generated = safeDisplayName('', `device-${i}`);
      expect(isNameAllowed(generated)).toBe(true);
      expect(generated.length).toBeLessThanOrEqual(MAX_DISPLAY_NAME_LENGTH);
    }
  });
});
