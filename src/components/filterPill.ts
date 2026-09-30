// Shared pill button shape for the filter groups. Selected = blue (accent-secondary);
// unselected = white outline; partial = a light blue with the selected border, for a region
// with some of its countries switched off. `size` sm is the country chips' one-step-smaller
// variant, left uncapitalized so "Bosnia and Herzegovina" keeps its lower-case "and".
export type PillState = boolean | 'partial';

const PILL_COLOURS = {
  on: 'bg-accent-secondary text-white border-transparent',
  partial: 'bg-pill-partial text-text border-accent-secondary',
  off: 'bg-surface text-text border-border hover:border-accent-secondary/50',
};

export const pillClass = (state: PillState, size: 'md' | 'sm' = 'md'): string => {
  const colours =
    state === 'partial' ? PILL_COLOURS.partial : state ? PILL_COLOURS.on : PILL_COLOURS.off;
  return `${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm capitalize'} rounded-full font-medium font-body transition-all active:scale-95 border ${colours}`;
};
