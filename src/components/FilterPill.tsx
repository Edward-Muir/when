import React from 'react';
import { Check, Minus } from 'lucide-react';

// The shared filter chip, for every Custom, Timeline and country-picker group. Selected = a
// blue tint with a tick; partial = a lighter tint with a dash, for a region with some of its
// countries switched off; off = white outline. Selected is deliberately not the solid blue of
// the Play button: a page of solid chips read as a page of buttons that start something, and
// with every chip on there was nothing to compare against to tell what "filled" meant.
export type PillState = boolean | 'partial';

const PILL_COLOURS = {
  on: 'bg-pill-on text-text border-accent-secondary',
  partial: 'bg-pill-partial text-text border-accent-secondary',
  off: 'bg-surface text-text border-border',
};

// A chip is the same width in every state, so toggling never reflows the wrapped rows and
// moves a chip out from under the finger (which would also land a double-tap's second tap on
// a different chip). The off padding is the on padding plus the icon and its gap:
// md 6 + 12 + 2 + 8 = 14 + 14; sm 8 + 12 + 4 + 10 = 17 + 17. md is kept tight so the four
// difficulty chips still share one row on a 375px phone (measured in Inter, 2026-10).
const PILL_SIZES = {
  md: {
    on: 'pl-1.5 pr-2 gap-0.5',
    off: 'px-3.5',
    text: 'py-1.5 text-sm capitalize',
    icon: 'h-3 w-3',
  },
  // One step smaller for the country chips, uncapitalized so "Bosnia and Herzegovina" keeps
  // its lower-case "and".
  sm: { on: 'pl-2 pr-2.5 gap-1', off: 'px-[17px]', text: 'py-1 text-xs', icon: 'h-3 w-3' },
};

interface FilterPillProps {
  state: PillState;
  size?: 'md' | 'sm';
  onClick: () => void;
  children: React.ReactNode;
}

const FilterPill: React.FC<FilterPillProps> = ({ state, size = 'md', onClick, children }) => {
  const sizes = size === 'sm' ? PILL_SIZES.sm : PILL_SIZES.md;
  const colours =
    state === 'partial' ? PILL_COLOURS.partial : state ? PILL_COLOURS.on : PILL_COLOURS.off;
  const Icon = state === 'partial' ? Minus : state ? Check : null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state === 'partial' ? 'mixed' : state}
      className={`inline-flex items-center rounded-full border font-medium font-body transition-all active:scale-95 ${sizes.text} ${Icon ? sizes.on : sizes.off} ${colours}`}
    >
      {Icon && <Icon className={`${sizes.icon} shrink-0 text-accent-secondary`} aria-hidden />}
      {children}
    </button>
  );
};

export default FilterPill;
