import { ANIMALS as BOT_ANIMALS } from '../../lib/leaderboard/botGeneration';
import { MAX_DISPLAY_NAME_LENGTH } from '../../lib/leaderboard/nameFilter';
import { sanitizeAvatar } from '../../lib/leaderboard/avatar';
import { ACHIEVEMENTS } from '../data/achievements';
import {
  AVATAR_ANIMALS,
  EARNED_PORTRAITS,
  MAX_NAME_LENGTH,
  avatarForName,
  earnedPortraitFor,
  generateRandomName,
  ownedEarnedPortraits,
  parseAvatar,
  portraitArtUrl,
  resolveAvatar,
} from './avatar';

const animalIds = AVATAR_ANIMALS.map((a) => a.id);
const earnedIds = EARNED_PORTRAITS.map((p) => p.id);

describe('the avatar list', () => {
  it('has 62 unique animals', () => {
    expect(new Set(animalIds).size).toBe(62);
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
    for (const animal of animalIds) expect(sanitizeAvatar(animal)).toBe(animal);
  });

  it('mirrors the server name cap', () => {
    expect(MAX_NAME_LENGTH).toBe(MAX_DISPLAY_NAME_LENGTH);
  });
});

describe('avatarForName', () => {
  it('takes the portrait from the last word', () => {
    expect(avatarForName('Linguistic Platypus')).toBe('platypus');
    expect(avatarForName('  golden   GOLDFISH ')).toBe('goldfish');
  });

  it('is deterministic for names outside the list', () => {
    const bob = avatarForName('Bob');
    expect(avatarForName('Bob')).toBe(bob);
    expect(animalIds).toContain(bob);
    expect(avatarForName('Linguistic Aardwolf')).toBe(avatarForName('Linguistic Aardwolf'));
  });

  it('copes with an empty name', () => {
    expect(animalIds).toContain(avatarForName(''));
  });
});

describe('parseAvatar / resolveAvatar', () => {
  it('accepts a known animal id', () => {
    expect(parseAvatar('platypus')).toBe('platypus');
  });

  // Earned portraits are pick-only, but others must see one on the board, so they parse.
  it('accepts an earned portrait id', () => {
    expect(parseAvatar('unicorn')).toBe('unicorn');
    expect(resolveAvatar({ displayName: 'Brave Otter', avatar: 'unicorn' })).toBe('unicorn');
  });

  it.each([undefined, null, 42, '', 'manticore', 'Platypus', 'platypus.scholar'])(
    'rejects %p',
    (value) => {
      expect(parseAvatar(value)).toBeNull();
    }
  );

  it('prefers a valid pick and falls back to the name otherwise', () => {
    expect(resolveAvatar({ displayName: 'Brave Otter', avatar: 'koala' })).toBe('koala');
    expect(resolveAvatar({ displayName: 'Brave Otter', avatar: 'manticore' })).toBe('otter');
    expect(resolveAvatar({ displayName: 'Brave Otter' })).toBe('otter');
  });
});

describe('generateRandomName', () => {
  it('always fits the cap and resolves to its own animal', () => {
    for (let i = 0; i < 500; i++) {
      const name = generateRandomName();
      expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH);
      const last = name.split(' ').at(-1)?.toLowerCase();
      expect(avatarForName(name)).toBe(last);
    }
  });
});

describe('sanitizeAvatar (server)', () => {
  it('keeps well-formed values and drops everything else', () => {
    expect(sanitizeAvatar('platypus')).toBe('platypus');
    expect(sanitizeAvatar('sea-otter')).toBe('sea-otter');
    expect(sanitizeAvatar('Platypus')).toBeUndefined();
    expect(sanitizeAvatar('platypus.scholar')).toBeUndefined();
    expect(sanitizeAvatar('<script>')).toBeUndefined();
    expect(sanitizeAvatar('a'.repeat(25))).toBeUndefined();
    expect(sanitizeAvatar(7)).toBeUndefined();
    expect(sanitizeAvatar(undefined)).toBeUndefined();
  });
});

describe('portraitArtUrl', () => {
  // Every animal was uploaded to Cloudinary as avatars/<id>; the URL is built, not stored.
  it('serves every animal from Cloudinary through the square thumbnail rung', () => {
    for (const id of animalIds) {
      expect(portraitArtUrl(id)).toBe(
        `https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_400,q_auto:good,w_400/avatars/${id}`
      );
    }
  });

  it('returns null for an id that is not in the list', () => {
    expect(portraitArtUrl('manticore')).toBeNull();
  });

  // Until its art is uploaded, an earned portrait draws its emoji or initial instead.
  // A preview is art under review, committed under public/ until it reaches Cloudinary.
  it('returns null for a placeholder, the local file for a preview, else Cloudinary', () => {
    for (const portrait of EARNED_PORTRAITS) {
      expect(portraitArtUrl(portrait.id)).toBe(
        portrait.placeholder
          ? null
          : portrait.preview
            ? `/avatars/preview/${portrait.id}.jpg`
            : `https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_400,q_auto:good,w_400/avatars/${portrait.id}`
      );
    }
  });
});

describe('earned portraits', () => {
  it('gives every achievement exactly one portrait, in catalogue order', () => {
    expect(EARNED_PORTRAITS.map((p) => p.achievementId)).toEqual(ACHIEVEMENTS.map((a) => a.id));
  });

  it('uses unique ids that never clash with the 62 and pass the server format check', () => {
    expect(new Set(earnedIds).size).toBe(earnedIds.length);
    for (const id of earnedIds) {
      expect(animalIds).not.toContain(id);
      expect(sanitizeAvatar(id)).toBe(id);
    }
  });

  // A name never implies an earned portrait: the generator and the hash only reach the 62.
  it('is never drawn by a name', () => {
    for (const portrait of EARNED_PORTRAITS) {
      expect(animalIds).toContain(avatarForName(`Brave ${portrait.label}`));
    }
    for (let i = 0; i < 2000; i++) {
      expect(animalIds).toContain(avatarForName(`Player ${i}`));
      expect(earnedIds).not.toContain(avatarForName(generateRandomName()));
    }
  });

  it('is owned once its badge is unlocked', () => {
    expect(earnedPortraitFor('cat-art')?.id).toBe('chameleon');
    expect(earnedPortraitFor('nope')).toBeUndefined();
    expect(ownedEarnedPortraits({})).toEqual(new Set());
    expect(ownedEarnedPortraits({ 'cat-art': '2026-10-01', '27': '2026-10-02' })).toEqual(
      new Set(['chameleon', 'unicorn'])
    );
  });
});
