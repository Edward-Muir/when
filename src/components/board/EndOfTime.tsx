import React from 'react';

/**
 * The two ends of the board. Each end of the list already has half a screen of runway (room
 * to drop a card before the first or after the last, and for the native bounce). The far
 * part of that runway holds a watermark: the deep past above the first card, the future
 * below the last, in type and hairlines only. Scroll to the end and it comes into view; pull
 * past the end and `--end-pull` (set by `useBoardEdges`) stretches it a little further.
 */
export type TimeEdge = 'past' | 'future';

const EndOfTime: React.FC<{ edge: TimeEdge; show: boolean }> = ({ edge, show }) => (
  <div aria-hidden className="w-full shrink-0 relative" style={{ height: '50vh' }}>
    {show && (
      <div
        className={`end-of-time end-of-time-${edge} absolute inset-x-0 ${
          edge === 'past' ? 'top-0' : 'bottom-0'
        } h-[62%] flex flex-col ${edge === 'past' ? 'justify-start' : 'justify-end'}`}
        style={{ paddingLeft: 'calc(var(--board-gutter) + var(--board-gap))' }}
      >
        {edge === 'future' && (
          <div className="end-of-time-next w-[240px] h-[80px] sm:w-[280px] sm:h-[96px] rounded-lg mb-6 flex items-center justify-center">
            <span className="font-mono text-2xl">?</span>
          </div>
        )}
        <div className="font-display text-5xl leading-none select-none">
          {edge === 'past' ? 'Before' : 'After'}
        </div>
        <div className="font-mono text-xs mt-2 select-none">
          {edge === 'past' ? 'where the record begins' : 'not yet written'}
        </div>
      </div>
    )}
  </div>
);

export default EndOfTime;
