// Shared pill button shape for the filter groups. Selected = blue (accent-secondary);
// unselected = white outline. `size` sm is the country chips' one-step-smaller variant, left
// uncapitalized so "Bosnia and Herzegovina" keeps its lower-case "and".
export const pillClass = (isSelected: boolean, size: 'md' | 'sm' = 'md'): string =>
  `${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm capitalize'} rounded-full font-medium font-body transition-all active:scale-95 border ${
    isSelected
      ? 'bg-accent-secondary text-white border-transparent'
      : 'bg-surface text-text border-border hover:border-accent-secondary/50'
  }`;
