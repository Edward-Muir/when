import { encodeChallengeCode, decodeChallengeCode, ChallengeConfig } from './challengeCode';
import { ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ALL_ERAS } from './eras';

const baseConfig: ChallengeConfig = {
  mode: 'suddenDeath',
  handSize: 5,
  playerCount: 1,
  difficulties: ['easy', 'medium', 'hard'],
  categories: ['empires', 'warfare', 'art'],
  eras: [...ALL_ERAS],
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

  it('round-trips freeplay mode and all difficulties', () => {
    const config: ChallengeConfig = {
      ...baseConfig,
      mode: 'freeplay',
      difficulties: [...ALL_DIFFICULTIES],
      seed: 2_097_151,
    };
    expect(decodeChallengeCode(encodeChallengeCode(config))).toEqual(config);
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
});
