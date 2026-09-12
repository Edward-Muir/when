import { CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Keeps a two-faced card from resizing when it is turned over.
 *
 * The card face's height is content-driven — a fixed-height image plus a description of whatever
 * length — so pinning both faces to a guessed constant would leave dead space under a short
 * description. Instead this measures the card face while it is up and reports that height back
 * as a style for the reading face, which then scrolls inside a card that never moves.
 *
 * **Attach `ref` to the faces themselves, never to a wrapper that holds both.** That is not a
 * style preference, it is the bug this hook was rewritten to fix: with the ref on the wrapper, the
 * moment the reading face was dismissed the pin was released while `AnimatePresence mode="wait"`
 * still had that face mounted and animating out — so the measurement caught the prose at its full
 * unclipped height, and the next open pinned the card to that instead. Open, close, open and the
 * card blew past the viewport (606px → 724px at phone width, and far worse with real prose).
 *
 * The hook then ignores whatever arrives while `pinned` is true, so it is safe to hand the same
 * ref to both faces: only the unpinned one is ever measured.
 *
 * The ref is a callback ref for the same reason: it fires exactly when the measured face mounts
 * and unmounts, so a height is only ever taken from the node the caller nominated, and never
 * while that node is absent. A layout effect alone cannot express that — it runs on a schedule
 * that has no idea which face is currently in the DOM.
 *
 * Extracted rather than inlined because `EventPopupContent` sits on ESLint's `complexity`
 * ceiling of 15 — the same reason `Game.tsx` keeps its hint logic in `useOnboardingHints`.
 */
export function usePinnedFaceHeight(
  pinned: boolean,
  deps: unknown[]
): { ref: (node: HTMLDivElement | null) => void; style: CSSProperties | undefined } {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  // Read by the ref callback at commit time, so the callback can stay a single stable identity
  // instead of being swapped per face — swapping it would churn React's attach/detach and put the
  // branch back in the caller, which sits on the complexity ceiling.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const ref = useCallback((node: HTMLDivElement | null) => {
    // Refuse to measure while pinned: the node arriving then is the reading face, whose height is
    // exactly what must not be recorded. On unmount React passes null and the last good height is
    // deliberately kept — it is what the other face is about to be pinned to.
    if (!node || pinnedRef.current) {
      nodeRef.current = null;
      return;
    }
    nodeRef.current = node;
    setHeight(node.offsetHeight);
  }, []);

  // Re-measure when the content changes underneath a face that stays mounted — a different
  // event's description is a different number of lines, and that does not remount the node.
  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (node) setHeight(node.offsetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns what invalidates the measurement
  }, deps);

  return { ref, style: pinned && height ? { height } : undefined };
}
