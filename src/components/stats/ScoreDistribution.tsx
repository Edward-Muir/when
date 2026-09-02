import React, { Fragment, useEffect, useState } from 'react';
import { ScoreBucket } from '../../utils/statsDerived';

interface Props {
  buckets: ScoreBucket[];
  /** Today's daily, once played. */
  todayCorrect?: number;
  average: number | null;
}

/**
 * Wordle-style bars: one per score tier, length by how many dailies landed there, the
 * count at the bar's end, today's tier in the full accent and the rest tinted. The bars grow
 * from zero on first paint; `motion-reduce` turns that off.
 */
const ScoreDistribution: React.FC<Props> = ({ buckets, todayCorrect, average }) => {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const max = Math.max(0, ...buckets.map((b) => b.count));

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1.5 font-body text-xs text-text-muted">
        {buckets.map((bucket) => (
          <Fragment key={bucket.label}>
            <span className="w-8">{bucket.label}</span>
            <div
              className="h-3.5"
              role="img"
              aria-label={`${bucket.label}: ${bucket.count}${bucket.isToday ? ', today' : ''}`}
            >
              <div
                className={`h-full rounded-[3px] transition-[width] duration-500 ease-out motion-reduce:transition-none ${
                  bucket.isToday ? 'bg-accent' : 'bar-muted'
                }`}
                style={{
                  width: grown && max > 0 ? `${(bucket.count / max) * 100}%` : 0,
                  minWidth: bucket.count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="min-w-[2ch] text-right font-mono text-xs tabular-nums text-text">
              {bucket.count}
            </span>
          </Fragment>
        ))}
      </div>
      {average !== null && (
        <p className="mt-2 font-body text-xs text-text-muted">
          {todayCorrect !== undefined && (
            <>
              Today: <span className="font-mono text-text">{todayCorrect}</span> events ·{' '}
            </>
          )}
          average <span className="font-mono text-text">{average.toFixed(1)}</span>
        </p>
      )}
    </div>
  );
};

export default ScoreDistribution;
