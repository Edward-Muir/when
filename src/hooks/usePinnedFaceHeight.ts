import { CSSProperties, RefObject, useLayoutEffect, useRef, useState } from 'react';

/**
 * Keeps a two-faced card from resizing when it is turned over.
 *
 * The card face's height is content-driven — a fixed-height image plus a description of whatever
 * length — so pinning both faces to a guessed constant would leave dead space under a short
 * description. Instead this measures the card face while it is up and reports that height back
 * as a style for the reading face, which then scrolls inside a card that never moves.
 *
 * Measuring while `pinned` is false is safe for `GamePopup` because the card face is always
 * shown first (the face resets whenever the event changes), so a height is always recorded
 * before the reading face can be reached.
 *
 * Extracted rather than inlined because `EventPopupContent` sits on ESLint's `complexity`
 * ceiling of 15 — the same reason `Game.tsx` keeps its hint logic in `useOnboardingHints`.
 */
export function usePinnedFaceHeight(
  pinned: boolean,
  deps: unknown[]
): { ref: RefObject<HTMLDivElement | null>; style: CSSProperties | undefined } {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (pinned) return;
    const node = ref.current;
    if (node) setHeight(node.offsetHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns what invalidates the measurement
  }, [pinned, ...deps]);

  return { ref, style: pinned && height ? { height } : undefined };
}
