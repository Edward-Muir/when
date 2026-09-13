import React from 'react';
import { TimeGapMark } from '../../utils/boardTime';

/** Extra room a full-strength jump earns, about half a card on a phone. */
const MAX_EXTRA_PX = 48;
const MIN_HEIGHT_PX = 20;

/**
 * A big jump in time between two neighbouring cards, drawn as a taller gap with one quiet
 * line saying how long: the rail runs on through it. Only gaps `markTimeGaps` flags get one,
 * so most of the board stays evenly spaced. No measured attributes: the extra height just
 * widens the drop band of the gap it sits in.
 */
const TimeGap: React.FC<{ mark: TimeGapMark }> = ({ mark }) => (
  <div
    aria-hidden
    className="w-full flex items-center shrink-0"
    style={{ height: MIN_HEIGHT_PX + Math.round(mark.strength * MAX_EXTRA_PX) }}
  >
    <div className="w-24 shrink-0" />
    <span className="pl-3 text-text-muted text-xs font-mono opacity-70 whitespace-nowrap">
      {mark.label}
    </span>
  </div>
);

export default TimeGap;
