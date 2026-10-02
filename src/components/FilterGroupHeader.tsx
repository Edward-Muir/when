import React from 'react';

export interface FilterGroupActions {
  /** Every option in the group is on: Select all would change nothing. */
  allOn: boolean;
  /** No option in the group is on: Clear would change nothing. */
  noneOn: boolean;
  onSelectAll: () => void;
  onClear: () => void;
}

/** Select all / Clear for a plain list group, where "all" is every option and "none" is []. */
export function listGroupActions<T>(
  selected: readonly T[],
  all: readonly T[],
  onChange: (next: T[]) => void
): FilterGroupActions {
  return {
    allOn: all.every((option) => selected.includes(option)),
    noneOn: selected.length === 0,
    onSelectAll: () => onChange([...all]),
    onClear: () => onChange([]),
  };
}

interface FilterGroupHeaderProps extends FilterGroupActions {
  label: string;
  /** Shown beside the label as `All` or `n/N`. */
  count?: { selected: number; total: number };
}

const ACTION_CLASS =
  'px-2 text-sm font-medium text-accent-secondary font-body disabled:text-text-muted disabled:opacity-40';

/**
 * A filter group's header: its label and selected count on the left, Select all and Clear on
 * the right. They used to be a bare `All` / `n/N` label that looked like a control and wasn't,
 * and the only shortcut was an undiscovered double-tap. The buttons are verbs so they can't be
 * read as a status. Each is disabled when it would change nothing.
 *
 * The 44px button height (`index.css`) is pulled into the spacing around the header by `-my-2`,
 * so the header stays a line tall without shrinking the tap targets. The label wraps rather
 * than squeezing the buttons: "Middle East & North Africa" in the country picker needs to.
 */
const FilterGroupHeader: React.FC<FilterGroupHeaderProps> = ({
  label,
  count,
  allOn,
  noneOn,
  onSelectAll,
  onClear,
}) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <span className="min-w-0 text-xs font-medium uppercase tracking-wide text-text-muted font-body">
      {label}
      {count && (
        <>
          <span aria-hidden> · </span>
          <span className="normal-case tracking-normal tabular-nums">
            {count.selected === count.total ? 'All' : `${count.selected}/${count.total}`}
          </span>
        </>
      )}
    </span>
    <div className="-my-2 flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onSelectAll}
        disabled={allOn}
        aria-label={`Select all ${label}`}
        className={ACTION_CLASS}
      >
        Select all
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={noneOn}
        aria-label={`Clear ${label}`}
        className={ACTION_CLASS}
      >
        Clear
      </button>
    </div>
  </div>
);

export default FilterGroupHeader;
