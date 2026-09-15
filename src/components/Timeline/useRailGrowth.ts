import { useEffect, useRef } from 'react';
import type { RailExtension } from './TimelineRail';

/**
 * Whether the rail extension at `extension` still owes its growth animation.
 *
 * Each end grows once per drag. The ghost row is rendered in flow, so moving off an end unmounts
 * it and moving back mounts a fresh one — and framer applies `initial` on every mount, which
 * replayed the growth from zero each time the pointer crossed the boundary. Per END rather than
 * per drag: visiting the *other* end for the first time is an extension the player has not seen
 * yet, and suppressing that would read as broken rather than calm.
 */
export function useRailGrowth(isDragging: boolean, extension: RailExtension | null): boolean {
  const grown = useRef<Set<RailExtension>>(new Set());

  useEffect(() => {
    if (!isDragging) grown.current.clear();
  }, [isDragging]);

  useEffect(() => {
    if (extension) grown.current.add(extension);
  }, [extension]);

  // Read during render on purpose: this is consumed only at the child's mount, so it must not be
  // state and must not force a re-render.
  return extension !== null && !grown.current.has(extension);
}
