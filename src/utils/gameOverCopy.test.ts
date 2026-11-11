import { GameConfig, Player, WhenGameState } from '../types';
import { __setCuratedThemesForTest, CuratedTheme } from './curatedThemes';
import { getGameOverEyebrow, getGameOverTitle } from './gameOverCopy';

const player = (id: number, name: string, placementHistory: boolean[] = []): Player => ({
  id,
  name,
  hand: [],
  hasWon: false,
  placementHistory,
});

const state = (overrides: Partial<WhenGameState>): WhenGameState =>
  ({
    gameMode: 'suddenDeath',
    lastConfig: { mode: 'suddenDeath', suddenDeathHandSize: 5 } as GameConfig,
    players: [player(0, 'Player 1')],
    winners: [],
    placementHistory: [],
    ...overrides,
  }) as WhenGameState;

const theme: CuratedTheme = {
  id: 'money',
  name: 'Hard Currency',
  dates: ['2026-11-02'],
  eventNames: [],
};

afterEach(() => __setCuratedThemesForTest(null));

describe('getGameOverTitle', () => {
  const themed = { mode: 'suddenDeath', suddenDeathHandSize: 5, curatedThemeId: 'money' };

  it('is Game Over when misses emptied the hand', () => {
    const history = [true, false, false, false, false, false];
    expect(getGameOverTitle(state({ placementHistory: history }))).toBe('Game Over');
  });

  it('is a clear when a curated deck ran dry, and perfect without a miss', () => {
    const lastConfig = themed as GameConfig;
    expect(getGameOverTitle(state({ lastConfig, placementHistory: [true, false, true] }))).toBe(
      'Theme Cleared!'
    );
    expect(getGameOverTitle(state({ lastConfig, placementHistory: [true, true] }))).toBe(
      'Perfect Clear!'
    );
  });

  it('names one winner, or several', () => {
    const sam = player(0, 'Sam');
    const priya = player(1, 'Priya');
    const kofi = player(2, 'Kofi');
    const players = [sam, priya, kofi];
    expect(getGameOverTitle(state({ players, winners: [sam] }))).toBe('Sam Wins!');
    expect(getGameOverTitle(state({ players, winners: [sam, priya] }))).toBe('Sam & Priya Win!');
    expect(getGameOverTitle(state({ players, winners: players }))).toBe('Sam, Priya & Kofi Win!');
    expect(getGameOverTitle(state({ players, winners: [] }))).toBe('Game Over');
  });
});

describe('getGameOverEyebrow', () => {
  it('counts the players in a multiplayer game', () => {
    const players = [player(0, 'Sam'), player(1, 'Priya')];
    expect(getGameOverEyebrow(state({ players }))).toBe('2 players');
  });

  it('calls a filtered deck a Custom game', () => {
    expect(getGameOverEyebrow(state({}))).toBe('Custom game');
  });

  it('names the theme of the daily', () => {
    __setCuratedThemesForTest([theme]);
    const lastConfig = { mode: 'daily', dailySeed: '2026-11-02' } as GameConfig;
    expect(getGameOverEyebrow(state({ gameMode: 'daily', lastConfig }))).toBe(
      'Daily · Hard Currency'
    );
  });

  it('dates a day played from the Archive, without re-parsing the date', () => {
    __setCuratedThemesForTest([theme]);
    const lastConfig = {
      mode: 'suddenDeath',
      dailyReplayDate: '2026-11-02',
      curatedThemeId: 'money',
    } as GameConfig;
    expect(getGameOverEyebrow(state({ lastConfig }))).toBe('Hard Currency · Nov 2');
  });

  it('names a replayed deck that has no day attached', () => {
    __setCuratedThemesForTest([theme]);
    const lastConfig = { mode: 'suddenDeath', curatedThemeId: 'money' } as GameConfig;
    expect(getGameOverEyebrow(state({ lastConfig }))).toBe('Hard Currency');
  });
});
