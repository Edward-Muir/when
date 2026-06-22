import type { AchievementTier } from './achievements';

/**
 * Per-tier visual treatment for the achievement badge ring.
 *
 * The "nice trick": a conic-gradient drawn behind the circular art fakes a swept,
 * brushed/struck-metal sheen. Tier picks the metal (and, for premium tiers, a soft
 * outer glow + a slow rotating shimmer) so rarer badges read as more impressive
 * without any custom artwork.
 */
export interface TierStyle {
  /** Display label, e.g. 'Gold'. Empty for the base tier (no chip shown). */
  label: string;
  /** CSS background value for the ring (a conic-gradient metal sheen). */
  ring: string;
  /** Optional outer box-shadow glow for premium tiers. */
  glow?: string;
  /** When true, the ring slowly rotates for a living shimmer (top tier only). */
  shimmer?: boolean;
  /** Subtle tint for the small tier-label chip text. */
  labelColor: string;
}

const SWEEP = 'from 135deg';

export const TIER_STYLES: Record<AchievementTier, TierStyle> = {
  none: {
    label: '',
    ring: `conic-gradient(${SWEEP}, #c4c4c4, #ececec, #f7f7f7, #d2d2d2, #c4c4c4, #e4e4e4, #c4c4c4)`,
    labelColor: '#9aa0a6',
  },
  bronze: {
    label: 'Bronze',
    ring: `conic-gradient(${SWEEP}, #8c5a2b, #d9a066, #f0c89a, #a8682f, #8c5a2b, #cf9a5e, #8c5a2b)`,
    labelColor: '#b07b45',
  },
  copper: {
    label: 'Copper',
    ring: `conic-gradient(${SWEEP}, #7a3b1d, #c87f4a, #f0b48a, #a85a32, #7a3b1d, #bd784a, #7a3b1d)`,
    labelColor: '#c07a4c',
  },
  silver: {
    label: 'Silver',
    ring: `conic-gradient(${SWEEP}, #8a929b, #e8edf2, #ffffff, #aab2bb, #8a929b, #dfe5ec, #8a929b)`,
    labelColor: '#9ba3ac',
  },
  gold: {
    label: 'Gold',
    ring: `conic-gradient(${SWEEP}, #9a7212, #e6c44d, #fff3b0, #c89b25, #9a7212, #f0d469, #9a7212)`,
    glow: '0 0 12px rgba(230, 196, 77, 0.45)',
    labelColor: '#c9a23a',
  },
  steel: {
    label: 'Steel',
    ring: `conic-gradient(${SWEEP}, #36424f, #7c8aa0, #aeb9c8, #4a5666, #36424f, #8591a4, #36424f)`,
    labelColor: '#8591a4',
  },
  platinum: {
    label: 'Platinum',
    ring: `conic-gradient(${SWEEP}, #b8bcc2, #f4f6f9, #ffffff, #cfd4da, #b8bcc2, #eef0f3, #b8bcc2)`,
    glow: '0 0 14px rgba(244, 246, 249, 0.55)',
    labelColor: '#c2c7cf',
  },
  diamond: {
    label: 'Diamond',
    ring: 'conic-gradient(from 0deg, #a0e9ff, #ffd6f5, #d6ffe0, #fff7c2, #c2d4ff, #ffd6f5, #a0e9ff)',
    glow: '0 0 18px rgba(160, 233, 255, 0.6)',
    shimmer: true,
    labelColor: '#7fc7e0',
  },
  obsidian: {
    label: 'Obsidian',
    ring: `conic-gradient(${SWEEP}, #15151a, #3a3a44, #c9a44a, #1c1c22, #15151a, #2a2a31, #15151a)`,
    glow: '0 0 12px rgba(201, 164, 74, 0.35)',
    labelColor: '#b9985a',
  },
  verdigris: {
    label: 'Verdigris',
    ring: `conic-gradient(${SWEEP}, #2f6e5e, #6cae9a, #a7d8c4, #3f8472, #2f6e5e, #7bbfa8, #2f6e5e)`,
    labelColor: '#5aa18d',
  },
};

/** Muted, tier-agnostic ring used for locked badges. */
export const LOCKED_RING =
  'conic-gradient(from 135deg, #5b5b5b, #7d7d7d, #909090, #6a6a6a, #5b5b5b, #7d7d7d, #5b5b5b)';
