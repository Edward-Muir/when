import { renderHook } from '@testing-library/react';
import { useRailExtension } from './useRailExtension';

/**
 * The rail's length is the whole memory behind "it reaches once, and reaches again when you come
 * back". Nothing about it is visible in a render, and the elements that draw it mount and unmount
 * underneath it, so this is where the rules are pinned.
 *
 * These assert the length and which end is retracting, never a tweened number: jsdom has no real
 * rAF clock, so framer's springs do not advance here. `scale.get()` is therefore the value the
 * spring STARTED from, which is exactly what matters — 0 means a growth will be seen, 1 means one
 * will not.
 */
type Ext = 'earlier' | 'later' | null;

const setup = () =>
  renderHook(({ dragging, previewing, ext }) => useRailExtension(dragging, previewing, ext), {
    initialProps: { dragging: false, previewing: false, ext: null as Ext },
  });

describe('useRailExtension', () => {
  it('starts both ends at nothing', () => {
    const { result } = setup();
    expect(result.current.scale.earlier.get()).toBe(0);
    expect(result.current.scale.later.get()).toBe(0);
    expect(result.current.retracting).toBeNull();
  });

  // The reason this hook exists at all: the ghost row unmounts and remounts as the drag crosses
  // a gap boundary, and a remounted segment must not start over from zero.
  it('keeps an end at full length when the drag crosses off it and back over the board', () => {
    const { result, rerender } = setup();
    rerender({ dragging: true, previewing: true, ext: 'earlier' });
    result.current.scale.earlier.set(1); // the growth, which jsdom will not run for us
    rerender({ dragging: true, previewing: true, ext: null }); // into a middle gap
    rerender({ dragging: true, previewing: true, ext: 'earlier' }); // and back to the end
    expect(result.current.scale.earlier.get()).toBe(1);
    expect(result.current.retracting).toBeNull();
  });

  // The bug: the memory used to be keyed to the drag, so it survived the card being taken off
  // the board and the second approach arrived at full length with no animation.
  it('re-arms an end once the card leaves the board mid-drag', () => {
    const { result, rerender } = setup();
    rerender({ dragging: true, previewing: true, ext: 'earlier' });
    result.current.scale.earlier.set(1);
    rerender({ dragging: true, previewing: false, ext: null }); // over the hand, still dragging
    expect(result.current.retracting).toBe('earlier');
    rerender({ dragging: true, previewing: true, ext: 'earlier' });
    expect(result.current.retracting).toBeNull();
  });

  it('re-arms an end it grew earlier in the trip, even when it left from a middle gap', () => {
    const { result, rerender } = setup();
    rerender({ dragging: true, previewing: true, ext: 'later' });
    result.current.scale.later.set(1);
    rerender({ dragging: true, previewing: true, ext: null }); // into a middle gap
    rerender({ dragging: true, previewing: false, ext: null }); // then off the board
    // Nothing was on screen to shrink, so it is zeroed in silence rather than retracted.
    expect(result.current.retracting).toBeNull();
    expect(result.current.scale.later.get()).toBe(0);
  });

  // A drop at an end is the board genuinely getting longer — the ghost row becomes a real row and
  // keeps its segment. A stub drawn there would shrink a rail the player has just earned.
  it('never retracts when the drag ENDS at an end', () => {
    const { result, rerender } = setup();
    rerender({ dragging: true, previewing: true, ext: 'later' });
    result.current.scale.later.set(1);
    rerender({ dragging: false, previewing: false, ext: null });
    expect(result.current.retracting).toBeNull();
  });

  it('gives each end its own length, so the far end still reaches on its first visit', () => {
    const { result, rerender } = setup();
    rerender({ dragging: true, previewing: true, ext: 'earlier' });
    result.current.scale.earlier.set(1);
    rerender({ dragging: true, previewing: true, ext: 'later' });
    expect(result.current.scale.later.get()).toBe(0);
    expect(result.current.scale.earlier.get()).toBe(1);
  });
});
