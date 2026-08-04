import { scaleFreqs, tierOf, ladderIndex, gameOverKind, SOUND_PARAMS } from './soundEngine';

describe('scaleFreqs (A major pentatonic ladder)', () => {
  it('starts on the 220 Hz root (A3) at index 0', () => {
    expect(scaleFreqs(220, 1)[0]).toBeCloseTo(220, 5);
  });

  it('matches the documented Hz table for the first 11 degrees', () => {
    // From docs/gameplay-feel/soundscape-design.md palette table.
    const expected = [220, 247, 277, 330, 370, 440, 494, 554, 659, 740, 880];
    const freqs = scaleFreqs(220, expected.length).map((f) => Math.round(f));
    expect(freqs).toEqual(expected);
  });

  it('climbs a clean octave every five pentatonic degrees', () => {
    const f = scaleFreqs(220, 6);
    expect(f[5]).toBeCloseTo(f[0] * 2, 5); // A3 -> A4
  });
});

describe('tierOf (mirrors getStreakFeedback tiers)', () => {
  it('maps streak boundaries to tiers 0/1/2/3', () => {
    expect(tierOf(0)).toBe(0);
    expect(tierOf(1)).toBe(0);
    expect(tierOf(2)).toBe(1);
    expect(tierOf(3)).toBe(1);
    expect(tierOf(4)).toBe(2);
    expect(tierOf(5)).toBe(2);
    expect(tierOf(6)).toBe(3);
    expect(tierOf(20)).toBe(3);
  });
});

describe('ladderIndex', () => {
  it('places streak 1 on the root (index 0)', () => {
    expect(ladderIndex(1)).toBe(0);
  });

  it('climbs one degree per consecutive correct placement', () => {
    expect(ladderIndex(2)).toBe(1);
    expect(ladderIndex(3)).toBe(2);
  });

  it('clamps at or below zero to the root', () => {
    expect(ladderIndex(0)).toBe(0);
    expect(ladderIndex(-5)).toBe(0);
  });

  it('saturates at the ladder cap rather than climbing into piercing territory', () => {
    const top = SOUND_PARAMS.ladderCap - 1;
    expect(ladderIndex(SOUND_PARAMS.ladderCap)).toBe(top);
    expect(ladderIndex(SOUND_PARAMS.ladderCap + 50)).toBe(top);
  });
});

describe('gameOverKind (aligned with getEncouragingMessage thresholds)', () => {
  it('is weak below 5 correct', () => {
    expect(gameOverKind(0)).toBe('weak');
    expect(gameOverKind(4)).toBe('weak');
  });

  it('is strong from 5 to 11 correct', () => {
    expect(gameOverKind(5)).toBe('strong');
    expect(gameOverKind(11)).toBe('strong');
  });

  it('is legendary at 12+ correct', () => {
    expect(gameOverKind(12)).toBe('legendary');
    expect(gameOverKind(30)).toBe('legendary');
  });
});
