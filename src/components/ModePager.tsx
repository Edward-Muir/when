import React, { useCallback, useImperativeHandle, useLayoutEffect, useRef } from 'react';

interface ModePagerProps {
  /** One child element per page, in order. */
  children: React.ReactNode;
  /** Reports the active page index back to the parent as the scroll position changes. */
  onIndexChange?: (index: number) => void;
  /** Page to open on, instantly, before first paint. Defaults to the first. */
  initialIndex?: number;
}

/** Imperative handle: lets a parent (Home's tab bar) scroll the pager to a page. */
export interface ModePagerHandle {
  scrollToPage: (index: number) => void;
}

/**
 * Horizontal scroll-snap pager for the home screen: one full-width page per tab. The tabs
 * themselves are `HomeTabBar`, rendered by the parent outside the pager.
 *
 * The active page is a pure function of the scroll position (reported via `onIndexChange`).
 * The tab bar scrolls via the imperative `scrollToPage` handle rather than setting the
 * highlight directly, so the highlight only ever tracks the scroll — no instant-then-walk
 * flashing.
 */
const ModePager = React.forwardRef<ModePagerHandle, ModePagerProps>(function ModePager(
  { children, onIndexChange, initialIndex = 0 },
  ref
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pages = React.Children.toArray(children);

  const goToPage = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const panelWidth = track.firstElementChild?.clientWidth ?? track.clientWidth;
      if (!panelWidth) return;
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      track.scrollTo({ left: clamped * panelWidth, behavior: 'smooth' });
    },
    [pages.length]
  );

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const panelWidth = track.firstElementChild?.clientWidth ?? track.clientWidth;
    if (!panelWidth) return;
    const index = Math.max(
      0,
      Math.min(pages.length - 1, Math.round(track.scrollLeft / panelWidth))
    );
    onIndexChange?.(index);
  }, [pages.length, onIndexChange]);

  // Imperative scroll for the tab bar: starts a smooth scroll without touching the
  // highlight, so the active tab only changes as the scroll position crosses each page.
  useImperativeHandle(ref, () => ({ scrollToPage: goToPage }), [goToPage]);

  // Open on the requested page before first paint: a direct scrollLeft write with smooth
  // scrolling switched off for the moment, so a deep link lands on its tab without a slide.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || initialIndex <= 0) return;
    const panelWidth = track.firstElementChild?.clientWidth ?? track.clientWidth;
    if (!panelWidth) return;
    const smooth = track.style.scrollBehavior;
    track.style.scrollBehavior = 'auto';
    track.scrollLeft = Math.min(pages.length - 1, initialIndex) * panelWidth;
    track.style.scrollBehavior = smooth;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only; later scrolls are the user's
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Swipeable track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex flex-1 min-h-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {pages.map((page, i) => (
          <div
            key={i}
            className="shrink-0 w-full snap-start flex flex-col min-h-0 overflow-y-auto px-1"
          >
            {page}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ModePager;
