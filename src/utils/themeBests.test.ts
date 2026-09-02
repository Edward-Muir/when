import { getThemeBest, getThemeBests, recordThemeResult } from './themeBests';
import { getLocalDateString } from './puzzleDate';

const KEY = 'when-theme-bests';

beforeEach(() => {
  localStorage.clear();
});

describe('themeBests', () => {
  it('has nothing to report before any theme is played', () => {
    expect(getThemeBests()).toEqual({});
    expect(getThemeBest('kings')).toBeUndefined();
  });

  it('records a first run as the best', () => {
    const saved = recordThemeResult('kings', { correctCount: 12, cleared: false, perfect: false });
    expect(saved).toEqual({
      correctCount: 12,
      cleared: false,
      perfect: false,
      plays: 1,
      lastPlayed: getLocalDateString(),
    });
    expect(getThemeBest('kings')).toEqual(saved);
  });

  it('keeps the best score and the flags once earned, and counts every play', () => {
    recordThemeResult('kings', { correctCount: 12, cleared: false, perfect: false });
    recordThemeResult('kings', { correctCount: 30, cleared: true, perfect: true });
    recordThemeResult('kings', { correctCount: 3, cleared: false, perfect: false });
    expect(getThemeBest('kings')).toMatchObject({
      correctCount: 30,
      cleared: true,
      perfect: true,
      plays: 3,
    });
  });

  it('keeps themes apart', () => {
    recordThemeResult('kings', { correctCount: 12, cleared: false, perfect: false });
    recordThemeResult('plagues', { correctCount: 4, cleared: false, perfect: false });
    expect(getThemeBest('kings')?.correctCount).toBe(12);
    expect(getThemeBest('plagues')?.correctCount).toBe(4);
  });

  it('survives corrupt or partial storage', () => {
    localStorage.setItem(KEY, 'not-json{');
    expect(getThemeBests()).toEqual({});

    localStorage.setItem(
      KEY,
      JSON.stringify({ kings: { correctCount: 5, plays: 1 }, junk: 'nope', worse: { plays: 'x' } })
    );
    expect(getThemeBests()).toEqual({
      kings: { correctCount: 5, cleared: false, perfect: false, plays: 1, lastPlayed: '' },
    });
  });

  it('never reads inherited object keys as themes', () => {
    expect(getThemeBest('constructor')).toBeUndefined();
    expect(getThemeBest('__proto__')).toBeUndefined();
  });
});
