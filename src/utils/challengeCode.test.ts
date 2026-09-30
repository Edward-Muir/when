import { encodeChallengeCode, decodeChallengeCode, ChallengeConfig } from './challengeCode';
import { ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ALL_ERAS } from './eras';
import { ALL_REGIONS } from './regions';
import { WORDLIST, wordMap } from './wordlists';

/**
 * Rewrite a token so bit 0 — the retired game-mode bit, once 1 for `freeplay` — is set,
 * reproducing a link generated before that mode was removed. Bit 0 is the low bit of the
 * first 12-bit word, so setting it is `idx | 1` on that word's WORDLIST index.
 */
function withLegacyModeBit(token: string): string {
  const parts = token.split('-');
  const idx = wordMap.get(parts[0]);
  if (idx === undefined) throw new Error(`unexpected token word: ${parts[0]}`);
  parts[0] = WORDLIST[idx | 1];
  return parts.join('-');
}

const baseConfig: ChallengeConfig = {
  handSize: 5,
  playerCount: 1,
  difficulties: ['easy', 'medium', 'hard'],
  categories: ['empires', 'warfare', 'art'],
  eras: [...ALL_ERAS],
  regions: [...ALL_REGIONS],
  seed: 12345,
};

describe('challengeCode encode/decode', () => {
  it('produces a 6-word token', () => {
    expect(encodeChallengeCode(baseConfig).split('-')).toHaveLength(6);
  });

  it('round-trips all fields including an arbitrary category subset', () => {
    const decoded = decodeChallengeCode(encodeChallengeCode(baseConfig));
    expect(decoded).toEqual(baseConfig);
  });

  it('round-trips when every category is selected', () => {
    const config = { ...baseConfig, categories: [...ALL_CATEGORIES] };
    const decoded = decodeChallengeCode(encodeChallengeCode(config));
    expect(decoded?.categories).toEqual([...ALL_CATEGORIES]);
  });

  it('round-trips a single category', () => {
    const config = { ...baseConfig, categories: ['nature' as const] };
    const decoded = decodeChallengeCode(encodeChallengeCode(config));
    expect(decoded?.categories).toEqual(['nature']);
  });

  it('round-trips all difficulties and the maximum seed', () => {
    const config: ChallengeConfig = {
      ...baseConfig,
      difficulties: [...ALL_DIFFICULTIES],
      seed: 2_097_151,
    };
    expect(decodeChallengeCode(encodeChallengeCode(config))).toEqual(config);
  });

  it('never sets the retired mode bit when encoding', () => {
    const token = encodeChallengeCode(baseConfig);
    expect(wordMap.get(token.split('-')[0])! & 1).toBe(0);
  });

  // Roughly half of all share links ever issued set the retired mode bit. They must still
  // launch, with every other field intact, rather than 404ing or misdecoding.
  it('still decodes a legacy link that sets the retired mode bit', () => {
    const legacy = withLegacyModeBit(encodeChallengeCode(baseConfig));
    expect(legacy).not.toBe(encodeChallengeCode(baseConfig));
    expect(decodeChallengeCode(legacy)).toEqual(baseConfig);
  });

  it('decodes a legacy link with non-default settings intact', () => {
    const config: ChallengeConfig = {
      ...baseConfig,
      handSize: 7,
      playerCount: 3,
      difficulties: [...ALL_DIFFICULTIES],
      categories: ['nature'],
      seed: 2_097_151,
    };
    const legacy = withLegacyModeBit(encodeChallengeCode(config));
    expect(decodeChallengeCode(legacy)).toEqual(config);
  });

  it('decodes a full share URL, not just a bare token', () => {
    const token = encodeChallengeCode(baseConfig);
    const fromUrl = decodeChallengeCode(`https://www.play-when.com/challenge/${token}`);
    expect(fromUrl).toEqual(baseConfig);
  });

  it('rejects malformed input', () => {
    expect(decodeChallengeCode('not-a-real-token')).toBeNull();
    expect(decodeChallengeCode('one-two-three')).toBeNull();
    expect(decodeChallengeCode('')).toBeNull();
  });

  it('different seeds yield different tokens (distinct shuffles)', () => {
    const a = encodeChallengeCode({ ...baseConfig, seed: 1 });
    const b = encodeChallengeCode({ ...baseConfig, seed: 2 });
    expect(a).not.toEqual(b);
  });

  describe('the optional 7th word: regions', () => {
    const narrowed: ChallengeConfig = { ...baseConfig, regions: ['East Asia', 'Global'] };

    it('pins the region order, because the word is positional', () => {
      // Reordering or inserting a region re-maps every region link already shared.
      expect(ALL_REGIONS).toEqual([
        'Europe',
        'Middle East & North Africa',
        'Sub-Saharan Africa',
        'North & Central Asia',
        'South Asia',
        'East Asia',
        'Southeast Asia',
        'North America',
        'South America',
        'Oceania',
        'Global',
      ]);
    });

    it('stays 6 words, byte-identical, when every region is selected', () => {
      // What the encoder produced for this config before the region word existed.
      expect(encodeChallengeCode(baseConfig)).toBe(
        'realize-atheism-athlete-abacus-blonde-abstract'
      );
    });

    it('adds a 7th word when regions are narrowed, and round-trips it', () => {
      const token = encodeChallengeCode(narrowed);
      expect(token.split('-')).toHaveLength(7);
      expect(decodeChallengeCode(token)).toEqual(narrowed);
      // The first six words are exactly the all-regions code: no existing field moved.
      expect(token.split('-').slice(0, 6).join('-')).toBe(encodeChallengeCode(baseConfig));
    });

    it('decodes every 6-word code already shared as all regions', () => {
      const decoded = decodeChallengeCode(encodeChallengeCode(baseConfig));
      expect(decoded?.regions).toEqual([...ALL_REGIONS]);
    });

    it('rejects a 7th word with no region, or a bit past the last region', () => {
      const six = encodeChallengeCode(baseConfig);
      expect(decodeChallengeCode(`${six}-${WORDLIST[0]}`)).toBeNull();
      expect(decodeChallengeCode(`${six}-${WORDLIST[1 << ALL_REGIONS.length]}`)).toBeNull();
      expect(decodeChallengeCode(`${six}-${WORDLIST[1]}`)?.regions).toEqual(['Europe']);
    });

    it('rejects an 8-word token', () => {
      expect(decodeChallengeCode(`${encodeChallengeCode(narrowed)}-${WORDLIST[1]}`)).toBeNull();
    });
  });
});
