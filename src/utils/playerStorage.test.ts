import {
  hasSeenHint,
  markHintSeen,
  resetHintsSeen,
  subscribeHintsReset,
  HintKey,
  getCustomSettings,
  saveCustomSettings,
  getDisplayName,
  saveDisplayName,
  getOrCreateDisplayName,
  getAvatarChoice,
  saveAvatarChoice,
  subscribeToProfile,
  getSeenPortraits,
  markPortraitsSeen,
  hasSeenNav,
  markNavSeen,
  markNavUnseen,
  armNavOnce,
  getLastCustomDeck,
  saveLastCustomDeck,
} from './playerStorage';
import { DEFAULT_DECK_SETTINGS } from './customDeck';

const ALL_KEYS: HintKey[] = [
  'drag',
  'wrong',
  'correct',
  'tapCard',
  'stats',
  'swap',
  'dailyTab',
  'archiveTab',
  'customTab',
  'statsTab',
  'timelineTab',
  'reviewEye',
];

beforeEach(() => {
  localStorage.clear();
});

describe('one-shot hints storage', () => {
  it('reports nothing seen on a fresh install', () => {
    ALL_KEYS.forEach((key) => expect(hasSeenHint(key)).toBe(false));
  });

  it('marks each key independently', () => {
    ALL_KEYS.forEach((key) => {
      markHintSeen(key);
      expect(hasSeenHint(key)).toBe(true);
    });
    const stored = JSON.parse(localStorage.getItem('when-hints-seen') ?? '{}');
    expect(Object.keys(stored).sort()).toEqual([...ALL_KEYS].sort());
  });

  it('marking one key leaves the others unseen', () => {
    markHintSeen('wrong');
    expect(hasSeenHint('wrong')).toBe(true);
    expect(hasSeenHint('correct')).toBe(false);
    expect(hasSeenHint('drag')).toBe(false);
  });

  it('treats the old timeline-intro flag as the Timeline tab hint', () => {
    localStorage.setItem('when-timeline-intro-seen', '1');
    expect(hasSeenHint('timelineTab')).toBe(true);
    expect(hasSeenHint('archiveTab')).toBe(false);
  });

  it('survives corrupt storage', () => {
    localStorage.setItem('when-hints-seen', '{not json');
    expect(hasSeenHint('drag')).toBe(false);
    expect(() => markHintSeen('drag')).not.toThrow();
  });

  it('broadcasts the reset, so a mounted hook can re-read on the spot', () => {
    const handler = jest.fn();
    const unsubscribe = subscribeHintsReset(handler);
    resetHintsSeen();
    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
    resetHintsSeen();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('resets everything, legacy keys included', () => {
    markHintSeen('swap');
    localStorage.setItem('when-timeline-intro-seen', '1');
    resetHintsSeen();
    ALL_KEYS.forEach((key) => expect(hasSeenHint(key)).toBe(false));
  });
});

describe('custom settings storage', () => {
  const saved = {
    selectedDifficulties: ['easy' as const],
    selectedCategories: ['empires' as const],
    selectedEras: ['modern' as const],
    playerCount: 1,
    cardsPerHand: 7,
    suddenDeathHandSize: 5,
  };

  it('restores a record saved before the region filter, with no regions (read as all)', () => {
    localStorage.setItem('when-custom-settings', JSON.stringify(saved));
    const restored = getCustomSettings();
    expect(restored).not.toBeNull();
    expect(restored?.selectedRegions).toBeUndefined();
  });

  it('round-trips a region selection', () => {
    saveCustomSettings({ ...saved, selectedRegions: ['East Asia'] });
    expect(getCustomSettings()?.selectedRegions).toEqual(['East Asia']);
  });

  it('round-trips the switched-off countries, absent from older records', () => {
    localStorage.setItem('when-custom-settings', JSON.stringify(saved));
    expect(getCustomSettings()?.excludedCountries).toBeUndefined();
    saveCustomSettings({ ...saved, excludedCountries: ['Europe|Germany'] });
    expect(getCustomSettings()?.excludedCountries).toEqual(['Europe|Germany']);
  });
});

describe('last custom deck storage', () => {
  const science = { ...DEFAULT_DECK_SETTINGS, selectedCategories: ['science' as const] };

  it('is empty on a fresh install', () => {
    expect(getLastCustomDeck()).toBeNull();
  });

  it('round-trips the settings and the starting card, under its own key', () => {
    saveLastCustomDeck({ settings: science, eventName: 'x-rays-discovered' });
    expect(getLastCustomDeck()).toEqual({ settings: science, eventName: 'x-rays-discovered' });
    expect(localStorage.getItem('when-last-custom-deck')).not.toBeNull();
    expect(getCustomSettings()).toBeNull();
  });

  it('drops values no longer offered, and the record once a group would be empty', () => {
    const stale = { ...science, selectedCategories: ['science', 'alchemy'] };
    localStorage.setItem(
      'when-last-custom-deck',
      JSON.stringify({ settings: stale, eventName: 'x-rays-discovered' })
    );
    expect(getLastCustomDeck()?.settings.selectedCategories).toEqual(['science']);

    const gone = { ...science, selectedCategories: ['alchemy'] };
    localStorage.setItem('when-last-custom-deck', JSON.stringify({ settings: gone }));
    expect(getLastCustomDeck()).toBeNull();
  });

  it('reads junk as no last deck', () => {
    localStorage.setItem('when-last-custom-deck', '"oops"');
    expect(getLastCustomDeck()).toBeNull();
    localStorage.setItem('when-last-custom-deck', '{not json');
    expect(getLastCustomDeck()).toBeNull();
  });
});

describe('display name and avatar storage', () => {
  it('generates a display name once and keeps it', () => {
    const first = getOrCreateDisplayName();
    expect(first).toMatch(/^\S+ \S+$/);
    expect(getDisplayName()).toBe(first);
    expect(getOrCreateDisplayName()).toBe(first);
  });

  it('never replaces a saved name', () => {
    saveDisplayName('Ada');
    expect(getOrCreateDisplayName()).toBe('Ada');
  });

  it('trims a saved name, and a blank one keeps the name already saved', () => {
    saveDisplayName('  Ada  ');
    expect(getDisplayName()).toBe('Ada');
    saveDisplayName('   ');
    expect(getDisplayName()).toBe('Ada');
  });

  it('round-trips the avatar pick', () => {
    expect(getAvatarChoice()).toBeNull();
    saveAvatarChoice('platypus');
    expect(getAvatarChoice()).toBe('platypus');
  });

  it('ignores a stored pick this build does not know', () => {
    localStorage.setItem('when-avatar', 'manticore');
    expect(getAvatarChoice()).toBeNull();
  });

  it('tells subscribers when the profile changes', () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToProfile(listener);
    saveAvatarChoice('koala');
    saveDisplayName('Grace');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    saveAvatarChoice('panda');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('seen achievement portraits storage', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty and accumulates what it is given', () => {
    expect(getSeenPortraits()).toEqual(new Set());
    markPortraitsSeen(['unicorn']);
    markPortraitsSeen(new Set(['unicorn', 'yeti']));
    expect(getSeenPortraits()).toEqual(new Set(['unicorn', 'yeti']));
  });

  it('drops anything that is not a list of ids', () => {
    localStorage.setItem('when-portraits-seen', JSON.stringify(['unicorn', 7, null]));
    expect(getSeenPortraits()).toEqual(new Set(['unicorn']));
    localStorage.setItem('when-portraits-seen', '{"oops":true}');
    expect(getSeenPortraits()).toEqual(new Set());
    localStorage.setItem('when-portraits-seen', 'not json');
    expect(getSeenPortraits()).toEqual(new Set());
  });
});

describe('nav "new" dot storage', () => {
  const NAV = ['archive', 'stats', 'timeline'] as const;

  it('reads every tab as seen on a fresh install', () => {
    NAV.forEach((key) => expect(hasSeenNav(key)).toBe(true));
  });

  it('reads an install that predates the armed-only dots as seen', () => {
    // Older builds wrote `true` on a visit and nothing otherwise.
    localStorage.setItem('when-nav-seen', JSON.stringify({ stats: true }));
    NAV.forEach((key) => expect(hasSeenNav(key)).toBe(true));
  });

  it('arms and clears the recurring Stats dot as often as asked', () => {
    markNavUnseen('stats');
    expect(hasSeenNav('stats')).toBe(false);
    markNavSeen('stats');
    expect(hasSeenNav('stats')).toBe(true);
    markNavUnseen('stats');
    expect(hasSeenNav('stats')).toBe(false);
    expect(hasSeenNav('archive')).toBe(true);
  });

  it('arms a one-shot dot once per install, never again after a visit', () => {
    armNavOnce('archive');
    expect(hasSeenNav('archive')).toBe(false);
    markNavSeen('archive');
    armNavOnce('archive');
    expect(hasSeenNav('archive')).toBe(true);
    // The other one-shot keeps its own flag.
    armNavOnce('timeline');
    expect(hasSeenNav('timeline')).toBe(false);
  });
});
