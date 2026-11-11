import { ACHIEVEMENTS, AchievementDef, AchievementTier } from './achievements';
import { TIER_RANK, TIER_STYLES, leadAchievement } from './achievementTiers';

const byId = (id: string): AchievementDef => {
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) throw new Error(`no achievement ${id}`);
  return def;
};

/** A badge of the given tier, placed in the catalogue order by `id`. */
const firstOfTier = (tier: AchievementTier): AchievementDef => {
  const def = ACHIEVEMENTS.find((a) => a.tier === tier);
  if (!def) throw new Error(`no ${tier} badge`);
  return def;
};

describe('TIER_RANK', () => {
  it('ranks every tier, in the agreed order', () => {
    const order = Object.keys(TIER_STYLES).sort(
      (a, b) => TIER_RANK[a as AchievementTier] - TIER_RANK[b as AchievementTier]
    );
    expect(order).toEqual([
      'none',
      'bronze',
      'verdigris',
      'copper',
      'silver',
      'steel',
      'gold',
      'platinum',
      'diamond',
      'obsidian',
    ]);
  });
});

describe('leadAchievement', () => {
  it('is undefined for no badges', () => {
    expect(leadAchievement([])).toBeUndefined();
  });

  it('picks the highest tier, wherever it sits in the unlock order', () => {
    const steel = firstOfTier('steel');
    const bronze = firstOfTier('bronze');
    const none = firstOfTier('none');
    expect(leadAchievement([none, steel, bronze])).toBe(steel);
  });

  it('ranks steel over silver and verdigris over bronze, not the catalogue order of the styles', () => {
    expect(leadAchievement([firstOfTier('steel'), firstOfTier('silver')])?.tier).toBe('steel');
    expect(leadAchievement([firstOfTier('verdigris'), firstOfTier('bronze')])?.tier).toBe(
      'verdigris'
    );
  });

  it('breaks a tie in favour of the badge later in ACHIEVEMENTS', () => {
    const steels = ACHIEVEMENTS.filter((a) => a.tier === 'steel');
    const early = steels[0];
    const late = steels[steels.length - 1];
    expect(leadAchievement([late, early])).toBe(late);
    expect(leadAchievement([early, late])).toBe(late);
  });

  it('leads a typical first game with its rarest badge', () => {
    // First Steps (none), a category badge (steel) and Regular (bronze).
    expect(leadAchievement([byId('01'), byId('02'), byId('cat-empires')])?.id).toBe('cat-empires');
  });
});
