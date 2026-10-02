import React from 'react';
import { Check, Minus, X } from 'lucide-react';

// The shared filter chip, for every Custom, Timeline and country-picker group. Selected = a
// blue tint with a tick; partial = a lighter tint with a dash, for a region with some of its
// countries switched off; off = white outline with a red cross. Selected is deliberately not
// the solid blue of the Play button: a page of solid chips read as a page of buttons that start
// something, and with every chip on there was nothing to compare against to tell what "filled"
// meant.
export type PillState = boolean | 'partial';

const PILL_STYLES = {
  on: {
    colours: 'bg-pill-on text-text border-accent-secondary',
    Icon: Check,
    tint: 'text-accent-secondary',
  },
  partial: {
    colours: 'bg-pill-partial text-text border-accent-secondary',
    Icon: Minus,
    tint: 'text-accent-secondary',
  },
  off: { colours: 'bg-surface text-text border-border', Icon: X, tint: 'text-error' },
};

// Every state carries an icon in the same slot with the same padding, so a toggle changes
// neither the chip's width nor where its label sits. The maintainer found the first version,
// which dropped the icon when off and padded the gap instead, too jumpy: the label shifted
// sideways under the finger on every tap. md is kept tight (6 + 12 + 2 + text + 8) so the four
// difficulty chips still share one row on a 375px phone (measured in Inter, 2026-10).
const PILL_SIZES = {
  md: { box: 'pl-1.5 pr-2 gap-0.5 py-1.5 text-sm capitalize', icon: 'h-3 w-3' },
  // One step smaller for the country chips, uncapitalized so "Bosnia and Herzegovina" keeps
  // its lower-case "and".
  sm: { box: 'pl-2 pr-2.5 gap-1 py-1 text-xs', icon: 'h-3 w-3' },
};

interface FilterPillProps {
  state: PillState;
  size?: 'md' | 'sm';
  onClick: () => void;
  children: React.ReactNode;
}

const FilterPill: React.FC<FilterPillProps> = ({ state, size = 'md', onClick, children }) => {
  const sizes = size === 'sm' ? PILL_SIZES.sm : PILL_SIZES.md;
  const { colours, Icon, tint } =
    state === 'partial' ? PILL_STYLES.partial : state ? PILL_STYLES.on : PILL_STYLES.off;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={state === 'partial' ? 'mixed' : state}
      className={`inline-flex items-center rounded-full border font-medium font-body transition-all active:scale-95 ${sizes.box} ${colours}`}
    >
      <Icon className={`${sizes.icon} shrink-0 ${tint}`} aria-hidden data-testid="pill-icon" />
      {children}
    </button>
  );
};

export default FilterPill;
