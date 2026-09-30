import {
  hasSeenHint,
  markHintSeen,
  resetHintsSeen,
  subscribeHintsReset,
  HintKey,
  getCustomSettings,
  saveCustomSettings,
} from './playerStorage';

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
});
