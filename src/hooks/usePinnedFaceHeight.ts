import { CSSProperties, useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Keeps a box from resizing when its contents are swapped for something longer.
 *
 * The event detail card swaps a short description for several paragraphs of prose in the same
 * box. That box's height is content-driven — 32 to 169 characters of description — so pinning it
 * to a guessed constant would leave dead space under the short ones. Instead this measures the
 * box while the description is in it and reports that height back as a style for the prose, which
 * then scrolls inside a card that never moves.
 *
 * **Attach `ref` to the measured content, never to a wrapper that holds both states.** That is
 * not a style preference: a height taken from the prose is the whole text at its full unclipped
 * height, and pinning to that grows the card every time it is opened (606px → 724px at phone
 * width on the first cycle, and further with each one, until it runs off the screen). The hook
 * therefore ignores any node handed to it while `pinned` is true, so passing the same ref to both
 * states is safe — only the unpinned one is ever measured.
 *
 * The ref is a callback ref for the same reason: it fires exactly when the measured node mounts
 * and unmounts, so a height is only ever taken from the node the caller nominated, and never
 * while that node is absent. A layout effect alone cannot express that — it runs on a schedule
 * that has no idea what is currently in the DOM.
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
    // Refuse to measure while pinned: the node arriving then is the prose, whose height is
    // exactly what must not be recorded. On unmount React passes null and the last good height is
    // deliberately kept — it is what the other state is about to be pinned to.
    if (!node || pinnedRef.current) {
      nodeRef.current = null;
      return;
    }
    nodeRef.current = node;
    setHeight(node.offsetHeight);
  }, []);

  // Re-measure when the content changes underneath a node that stays mounted — a different
  // event's description is a different number of lines, and that does not remount the node.
  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (node) setHeight(node.offsetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns what invalidates the measurement
  }, deps);

  return { ref, style: pinned && height ? { height } : undefined };
}
