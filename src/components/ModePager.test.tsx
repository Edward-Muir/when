import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModePager from './ModePager';

const LABELS = ['Daily', 'Archive', 'Custom', 'Stats', 'Timeline'];

const renderPager = (initialIndex?: number, onSwipePastEnd?: () => void) => {
  const view = render(
    <ModePager labels={LABELS} initialIndex={initialIndex} onSwipePastEnd={onSwipePastEnd}>
      {LABELS.map((label) => (
        <div key={label}>{label} page</div>
      ))}
    </ModePager>
  );
  return { ...view, track: screen.getByTestId('mode-pager-track') as HTMLDivElement };
};

/**
 * jsdom lays nothing out, so the track's scroll metrics have to be stated. `scrollLeft` is
 * writable already; the two widths are prototype getters, hence the defineProperty.
 */
const setScrollMetrics = (track: HTMLDivElement, scrollLeft: number, atEnd: boolean) => {
  Object.defineProperty(track, 'clientWidth', { value: 300, configurable: true });
  Object.defineProperty(track, 'scrollWidth', {
    value: atEnd ? scrollLeft + 300 : 1500,
    configurable: true,
  });
  track.scrollLeft = scrollLeft;
};

const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });

describe('ModePager initialIndex', () => {
  it('marks the first page active by default', () => {
    renderPager();
    expect(screen.getByText('Daily')).not.toHaveClass('invisible');
    expect(screen.getByText('Timeline')).toHaveClass('invisible');
  });

  it('opens on the requested page', () => {
    renderPager(4);
    expect(screen.getByText('Timeline')).not.toHaveClass('invisible');
    expect(screen.getByText('Daily')).toHaveClass('invisible');
  });
});

describe('ModePager swipe past the last page', () => {
  it('fires onSwipePastEnd on a left swipe that starts on the last page', () => {
    const onSwipePastEnd = jest.fn();
    const { track } = renderPager(4, onSwipePastEnd);
    setScrollMetrics(track, 1200, true);

    fireEvent.touchStart(track, touch(280, 400));
    fireEvent.touchMove(track, touch(200, 410));

    expect(onSwipePastEnd).toHaveBeenCalledTimes(1);
  });

  it('fires once per gesture, however far the finger travels', () => {
    const onSwipePastEnd = jest.fn();
    const { track } = renderPager(4, onSwipePastEnd);
    setScrollMetrics(track, 1200, true);

    fireEvent.touchStart(track, touch(280, 400));
    fireEvent.touchMove(track, touch(200, 400));
    fireEvent.touchMove(track, touch(120, 400));
    fireEvent.touchMove(track, touch(40, 400));

    expect(onSwipePastEnd).toHaveBeenCalledTimes(1);
  });

  it('ignores a swipe that only arrives at the last page', () => {
    const onSwipePastEnd = jest.fn();
    const { track } = renderPager(3, onSwipePastEnd);
    // Starts on Stats (mid-track), lands on Timeline mid-gesture: the drawer must stay shut.
    setScrollMetrics(track, 900, false);

    fireEvent.touchStart(track, touch(280, 400));
    setScrollMetrics(track, 1200, true);
    fireEvent.touchMove(track, touch(120, 400));

    expect(onSwipePastEnd).not.toHaveBeenCalled();
  });

  it('ignores a right swipe and a vertical drag', () => {
    const onSwipePastEnd = jest.fn();
    const { track } = renderPager(4, onSwipePastEnd);
    setScrollMetrics(track, 1200, true);

    fireEvent.touchStart(track, touch(60, 400));
    fireEvent.touchMove(track, touch(200, 400));
    fireEvent.touchEnd(track, { touches: [] });

    fireEvent.touchStart(track, touch(280, 400));
    fireEvent.touchMove(track, touch(240, 600));
    fireEvent.touchEnd(track, { touches: [] });

    expect(onSwipePastEnd).not.toHaveBeenCalled();
  });

  it('ignores a nudge shorter than the swipe threshold', () => {
    const onSwipePastEnd = jest.fn();
    const { track } = renderPager(4, onSwipePastEnd);
    setScrollMetrics(track, 1200, true);

    fireEvent.touchStart(track, touch(280, 400));
    fireEvent.touchMove(track, touch(250, 400));

    expect(onSwipePastEnd).not.toHaveBeenCalled();
  });
});
