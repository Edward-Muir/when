import type { PortraitSize } from './ui/Portrait';

/** A row's portrait size, padding and type, by place (LeaderboardRow, LeaderboardSkeleton). */
export interface PodiumStyle {
  portrait: PortraitSize;
  /** Vertical padding: the podium rows are a little taller. */
  pad: string;
  name: string;
  score: string;
}

/**
 * First place's tile. Every row paints its portrait at this size and crops it to its own tile
 * (`Portrait`'s `paintedAt`), so smaller tiles show a tighter head-and-shoulders view instead of
 * a tiny whole figure, and first place shows the most.
 */
export const PAINTED_AT: PortraitSize = 60;

/**
 * Every row's portrait sits flush against its rank number in a slot as wide as first place's
 * tile, so all the names start on one line however the portraits step down. A literal string
 * for Tailwind's JIT.
 */
export const PORTRAIT_SLOT = 'w-[60px] shrink-0 flex justify-start';

// Literal strings so Tailwind's JIT sees them. The steps are deliberately gentle (60, 52, 48,
// then 44px): enough to lead the eye to first place without the podium shouting over the rest.
const PODIUM: readonly PodiumStyle[] = [
  { portrait: 60, pad: 'py-2.5', name: 'font-semibold', score: 'text-2xl' },
  { portrait: 52, pad: 'py-2.5', name: '', score: 'text-xl' },
  { portrait: 48, pad: 'py-2', name: '', score: 'text-xl' },
];
const FIELD: PodiumStyle = { portrait: 44, pad: 'py-2', name: '', score: 'text-lg' };

/** First place is the largest, then second, then third; everyone else shares one size. */
export function podiumStyle(place: number): PodiumStyle {
  return (place >= 1 ? PODIUM.at(place - 1) : undefined) ?? FIELD;
}
