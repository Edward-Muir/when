import { act, renderHook } from '@testing-library/react';
import { useThemeIntro, ThemeIntroGameState } from './useThemeIntro';
import { CuratedTheme, __setCuratedThemesForTest } from '../utils/curatedThemes';
import { getSeenThemeIntros, resetHintsSeen } from '../utils/playerStorage';
import { FailedPlacement, GameConfig } from '../types';

const intro = {
  blurb: 'Maps, charts and surveys that changed how people pictured the world.',
  fact: 'One copy survives.',
};

const slugs = Array.from({ length: 16 }, (_, i) => `event-${i}`);
const mapmakers: CuratedTheme = {
  id: 'mapmakers',
  name: 'Mapmakers',
  eventNames: slugs,
  dates: ['2030-01-04'],
  intro,
};
const plain: CuratedTheme = {
  id: 'plain',
  name: 'Plain',
  eventNames: slugs,
  dates: ['2030-01-07'],
};

const config = (overrides: Partial<GameConfig>): GameConfig => ({
  mode: 'daily',
  selectedDifficulties: [],
  selectedCategories: [],
  selectedEras: [],
  ...overrides,
});

const fresh = (lastConfig: GameConfig | null): ThemeIntroGameState => ({
  phase: 'playing',
  lastConfig,
  isReview: false,
  placementHistory: [],
  failedPlacements: [],
});

const daily = config({ dailySeed: '2030-01-04' });

const openFor = (state: ThemeIntroGameState) =>
  renderHook(() => useThemeIntro(state)).result.current.open;

beforeEach(() => {
  localStorage.clear();
  __setCuratedThemesForTest([mapmakers, plain]);
});

afterEach(() => {
  __setCuratedThemesForTest(null);
});

describe('useThemeIntro', () => {
  it('opens on a fresh daily of a curated theme with an intro', () => {
    const { result } = renderHook(() => useThemeIntro(fresh(daily)));
    expect(result.current.open).toBe(true);
    expect(result.current.theme?.name).toBe('Mapmakers');
  });

  it('opens for an Archive replay of the theme and a past curated day alike', () => {
    expect(openFor(fresh(config({ mode: 'suddenDeath', curatedThemeId: 'mapmakers' })))).toBe(true);
    expect(openFor(fresh(config({ mode: 'suddenDeath', dailyReplayDate: '2030-01-04' })))).toBe(
      true
    );
  });

  it('stays closed for a resumed game', () => {
    expect(openFor({ ...fresh(daily), placementHistory: [true] })).toBe(false);
    const missed = [{} as FailedPlacement];
    expect(openFor({ ...fresh(daily), failedPlacements: missed })).toBe(false);
  });

  it('stays closed for a review, a seeded day, a Custom game and a theme with no intro', () => {
    expect(openFor({ ...fresh(daily), isReview: true })).toBe(false);
    expect(openFor(fresh(config({ dailySeed: '2030-01-05' })))).toBe(false);
    expect(openFor(fresh(config({ mode: 'suddenDeath' })))).toBe(false);
    expect(openFor(fresh(null))).toBe(false);
    expect(openFor(fresh(config({ dailySeed: '2030-01-07' })))).toBe(false);
  });

  it('marks the theme on dismissal, so the next game of it goes straight to play', () => {
    const { result } = renderHook(() => useThemeIntro(fresh(daily)));
    expect(getSeenThemeIntros().has('mapmakers')).toBe(false);

    act(() => result.current.dismiss());
    expect(result.current.open).toBe(false);
    expect(result.current.theme?.name).toBe('Mapmakers'); // kept for the exit animation
    expect(getSeenThemeIntros().has('mapmakers')).toBe(true);

    expect(openFor(fresh(config({ mode: 'suddenDeath', curatedThemeId: 'mapmakers' })))).toBe(
      false
    );
  });

  it('comes back after Reset Hints', () => {
    const { result } = renderHook(() => useThemeIntro(fresh(daily)));
    act(() => result.current.dismiss());
    resetHintsSeen();
    expect(openFor(fresh(daily))).toBe(true);
  });
});
