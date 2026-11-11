import { TABS, indexForTabKey, navForPath, pathForNav, tabKeyForIndex } from './homeTabs';

describe('tab paths', () => {
  it('round-trip every tab and reject anything else', () => {
    (['home', 'archive', 'custom', 'stats', 'timeline'] as const).forEach((key) => {
      expect(navForPath(pathForNav(key))).toBe(key);
    });
    expect(pathForNav('home')).toBe('/');
    expect(navForPath('/daily')).toBeNull();
    expect(navForPath('/nonsense')).toBeNull();
  });

  it('opens the Settings tab at /settings, and still at /stats from when it was Stats', () => {
    expect(pathForNav('stats')).toBe('/settings');
    expect(navForPath('/settings')).toBe('stats');
    expect(navForPath('/stats')).toBe('stats');
  });
});

describe('tab order', () => {
  it('ends on Settings, and maps index to key both ways', () => {
    expect(TABS.map((tab) => tab.label)).toEqual([
      'Daily',
      'Archive',
      'Custom',
      'Timeline',
      'Settings',
    ]);
    TABS.forEach((tab, i) => {
      expect(tabKeyForIndex(i)).toBe(tab.key);
      expect(indexForTabKey(tab.key)).toBe(i);
    });
  });
});
