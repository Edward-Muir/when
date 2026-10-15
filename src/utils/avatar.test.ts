import { ANIMALS as BOT_ANIMALS } from '../../lib/leaderboard/botGeneration';
import { MAX_DISPLAY_NAME_LENGTH } from '../../lib/leaderboard/nameFilter';
import { sanitizeAvatar } from '../../lib/leaderboard/avatar';
import {
  AVATAR_ANIMALS,
  AVATAR_THEMES,
  MAX_NAME_LENGTH,
  avatarForName,
  formatAvatar,
  generateRandomName,
  getTheme,
  parseAvatar,
  resolveAvatar,
} from './avatar';
import data from '../data/avatars.json';

const animalIds = AVATAR_ANIMALS.map((a) => a.id);
const themeIds = AVATAR_THEMES.map((t) => t.id);

describe('the avatar lists', () => {
  it('has 60 unique animals and 20 unique themes', () => {
    expect(new Set(animalIds).size).toBe(60);
    expect(new Set(themeIds).size).toBe(20);
  });

  // The two animals real players were using when the list was cut from 355 to 60.
  it('keeps the animals players already have', () => {
    expect(animalIds).toEqual(expect.arrayContaining(['platypus', 'goldfish']));
  });

  // Bots never send an avatar, so theirs comes from the name: every bot animal needs a portrait.
  it('covers every bot animal', () => {
    for (const animal of BOT_ANIMALS) expect(animalIds).toContain(animal.toLowerCase());
  });

  it('uses ids that pass the server format check', () => {
    for (const animal of animalIds) {
      for (const theme of themeIds) {
        expect(sanitizeAvatar(formatAvatar({ animal, theme }))).toBeDefined();
      }
    }
  });

  it('maps adjectives only to themes that exist', () => {
    for (const theme of Object.values(data.adjectiveThemes as Record<string, string>)) {
      expect(getTheme(theme)).toBeDefined();
    }
  });

  it('mirrors the server name cap', () => {
    expect(MAX_NAME_LENGTH).toBe(MAX_DISPLAY_NAME_LENGTH);
  });
});

describe('avatarForName', () => {
  it('takes the portrait from the last word', () => {
    expect(avatarForName('Linguistic Platypus').animal).toBe('platypus');
    expect(avatarForName('  golden   GOLDFISH ').animal).toBe('goldfish');
  });

  it('is deterministic for names outside the lists', () => {
    const bob = avatarForName('Bob');
    expect(avatarForName('Bob')).toEqual(bob);
    expect(animalIds).toContain(bob.animal);
    expect(themeIds).toContain(bob.theme);
    expect(avatarForName('Linguistic Aardwolf')).toEqual(avatarForName('Linguistic Aardwolf'));
  });

  it('gives names sharing a first word the same theme', () => {
    expect(avatarForName('Brave Otter').theme).toBe(avatarForName('Brave Lion').theme);
  });

  it('copes with an empty name', () => {
    const empty = avatarForName('');
    expect(animalIds).toContain(empty.animal);
    expect(themeIds).toContain(empty.theme);
  });
});

describe('parseAvatar / resolveAvatar', () => {
  it('round-trips the wire form', () => {
    expect(parseAvatar(formatAvatar({ animal: 'platypus', theme: 'scholar' }))).toEqual({
      animal: 'platypus',
      theme: 'scholar',
    });
  });

  it.each([undefined, null, 42, '', 'platypus', 'unicorn.scholar', 'platypus.atlantis', 'a.b.c'])(
    'rejects %p',
    (value) => {
      expect(parseAvatar(value)).toBeNull();
    }
  );

  it('prefers a valid pick and falls back to the name otherwise', () => {
    expect(resolveAvatar({ displayName: 'Brave Otter', avatar: 'koala.viking' })).toEqual({
      animal: 'koala',
      theme: 'viking',
    });
    expect(resolveAvatar({ displayName: 'Brave Otter', avatar: 'unicorn.viking' })).toEqual(
      avatarForName('Brave Otter')
    );
    expect(resolveAvatar({ displayName: 'Brave Otter' })).toEqual(avatarForName('Brave Otter'));
  });
});

describe('generateRandomName', () => {
  it('always fits the cap and resolves to its own animal', () => {
    for (let i = 0; i < 500; i++) {
      const name = generateRandomName();
      expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      const last = name.split(' ').at(-1)?.toLowerCase();
      expect(avatarForName(name).animal).toBe(last);
    }
  });
});

describe('sanitizeAvatar (server)', () => {
  it('keeps well-formed values and drops everything else', () => {
    expect(sanitizeAvatar('platypus.scholar')).toBe('platypus.scholar');
    expect(sanitizeAvatar('space-age.space-age')).toBe('space-age.space-age');
    expect(sanitizeAvatar('Platypus.scholar')).toBeUndefined();
    expect(sanitizeAvatar('<script>.x')).toBeUndefined();
    expect(sanitizeAvatar('a'.repeat(25) + '.b')).toBeUndefined();
    expect(sanitizeAvatar(7)).toBeUndefined();
    expect(sanitizeAvatar(undefined)).toBeUndefined();
  });
});
