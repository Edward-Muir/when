import { renderHook, act } from '@testing-library/react';
import { usePinnedFaceHeight } from './usePinnedFaceHeight';

/**
 * The regression this pins is the one that shipped: the detail card grew every time it was
 * turned over and back. The pin was released the instant the reading face was dismissed, but
 * `AnimatePresence mode="wait"` still had that face mounted and animating out — so the height
 * recorded was the prose at full unclipped height, and the next open pinned the card to it.
 * At phone width the card went 606px -> 724px, and further with longer prose, until it ran off
 * the screen.
 *
 * jsdom has no layout, so `offsetHeight` is stubbed per node. That is enough: the invariant here
 * is *which* node gets measured and when, not what the browser computes.
 */

/** A stand-in for a mounted face of a given height. */
function face(offsetHeight: number): HTMLDivElement {
  const node = document.createElement('div');
  Object.defineProperty(node, 'offsetHeight', { value: offsetHeight, configurable: true });
  return node;
}

const CARD_FACE = 606;
const READING_FACE_UNPINNED = 1400;

describe('usePinnedFaceHeight', () => {
  it('pins to the height of the face measured while unpinned', () => {
    const { result, rerender } = renderHook(({ pinned }) => usePinnedFaceHeight(pinned, []), {
      initialProps: { pinned: false },
    });

    expect(result.current.style).toBeUndefined();
    act(() => result.current.ref(face(CARD_FACE)));

    rerender({ pinned: true });
    expect(result.current.style).toEqual({ height: CARD_FACE });
  });

  it('ignores a node handed to it while pinned — the regression', () => {
    const { result, rerender } = renderHook(({ pinned }) => usePinnedFaceHeight(pinned, []), {
      initialProps: { pinned: false },
    });
    act(() => result.current.ref(face(CARD_FACE)));
    rerender({ pinned: true });

    // What the reading face's own node would report once the pin is released around it.
    act(() => result.current.ref(face(READING_FACE_UNPINNED)));

    expect(result.current.style).toEqual({ height: CARD_FACE });
  });

  it('survives turning the card over and back repeatedly', () => {
    const { result, rerender } = renderHook(({ pinned }) => usePinnedFaceHeight(pinned, []), {
      initialProps: { pinned: false },
    });
    act(() => result.current.ref(face(CARD_FACE)));

    for (let i = 0; i < 5; i++) {
      // Turn over: the card face unmounts, the reading face mounts under the pin.
      rerender({ pinned: true });
      act(() => result.current.ref(null));
      act(() => result.current.ref(face(READING_FACE_UNPINNED)));
      expect(result.current.style).toEqual({ height: CARD_FACE });

      // Turn back: the reading face unmounts, the card face mounts unpinned.
      rerender({ pinned: false });
      act(() => result.current.ref(null));
      act(() => result.current.ref(face(CARD_FACE)));
      expect(result.current.style).toBeUndefined();
    }

    rerender({ pinned: true });
    expect(result.current.style).toEqual({ height: CARD_FACE });
  });

  it('keeps the last good height while no face is mounted', () => {
    const { result, rerender } = renderHook(({ pinned }) => usePinnedFaceHeight(pinned, []), {
      initialProps: { pinned: false },
    });
    act(() => result.current.ref(face(CARD_FACE)));

    // React passes null on unmount; that must not clear the height the other face is about to use.
    act(() => result.current.ref(null));
    rerender({ pinned: true });

    expect(result.current.style).toEqual({ height: CARD_FACE });
  });

  it('re-measures the mounted face when the caller says the content changed', () => {
    const shortCard = face(CARD_FACE);
    const { result, rerender } = renderHook(
      ({ pinned, dep }) => usePinnedFaceHeight(pinned, [dep]),
      { initialProps: { pinned: false, dep: 'jefferson' } }
    );
    act(() => result.current.ref(shortCard));

    // A longer description grows the same node without remounting it.
    Object.defineProperty(shortCard, 'offsetHeight', { value: 680, configurable: true });
    rerender({ pinned: false, dep: 'megiddo' });
    rerender({ pinned: true, dep: 'megiddo' });

    expect(result.current.style).toEqual({ height: 680 });
  });
});
