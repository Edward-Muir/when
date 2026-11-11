import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * The Settings tab's building blocks: a card of rows with hairlines between them, in the
 * stats cards' own surface so the page reads as one. A row is at least 52px tall, over the
 * 44px touch-target floor.
 */

export const rowClass =
  'flex w-full items-center gap-3 px-4 min-h-[52px] text-left font-body text-text transition-colors active:bg-border';

export const rowIconClass = 'h-5 w-5 shrink-0 text-text-muted';

export const RowCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
    {children}
  </div>
);

/** The heading over a group of cards, in the stats cards' own heading style. */
export const GroupHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-2 px-1 font-body text-[11px] font-semibold uppercase tracking-wider text-text-muted">
    {children}
  </h2>
);

/** The mark at a row's right edge that says it opens something. */
export const RowChevron: React.FC = () => (
  <ChevronRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-text-muted" />
);

/**
 * An on/off switch drawn at a row's right edge. Decoration only: the row itself is the
 * `role="switch"` button, so the whole row is the target.
 */
export const RowSwitch: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    className={`ml-auto flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors ${
      on ? 'bg-accent' : 'bg-border'
    }`}
  >
    <span
      className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
        on ? 'translate-x-[18px]' : ''
      }`}
    />
  </span>
);
