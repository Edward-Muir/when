import React, { useCallback, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { useHaptics } from '../hooks/useHaptics';

interface ModePagerProps {
  /** Short labels for each page, shown in the indicator (e.g. ['Daily', 'Custom']). */
  labels: string[];
  /** One child element per page, in order. */
  children: React.ReactNode;
  /**
   * Tailwind classes for the active indicator (pill + label), one entry per page, so each
   * page's indicator can match its own accent. Defaults to gold (`accent`) for every page.
   */
  activeColors?: { dot: string; text: string }[];
  /** Reports the active page index back to the parent as the scroll position changes. */
  onIndexChange?: (index: number) => void;
  /** Page to open on, instantly, before first paint. Defaults to the first. */
  initialIndex?: number;
  /**
   * Fired when the player keeps swiping left on the last page — there is no page beyond it, so
   * the gesture carries on into the burger menu, which slides in from that same edge.
   */
  onSwipePastEnd?: () => void;
}

/**
 * Swipe-past-the-end thresholds. The distance is the usual drawer-peel travel; the ratio keeps
 * a diagonal flick down a vertically-scrolling panel (My Timeline is the last page) from
 * counting as a horizontal swipe.
 */
const PAST_END_DISTANCE_PX = 56;
const PAST_END_RATIO = 1.5;

/** Imperative handle: lets a parent (the top-nav buttons) scroll the pager to a page. */
export interface ModePagerHandle {
  scrollToPage: (index: number) => void;
}

/**
 * Horizontal scroll-snap pager for the mode-select screen. Each page is ~90% wide so a
 * sliver of the neighbour peeks (swipe affordance). Below the pages sits a tappable
 * page indicator.
 *
 * The active page is a pure function of the scroll position (reported via `onIndexChange`).
 * Buttons scroll via the imperative `scrollToPage` handle rather than setting the highlight
 * directly, so the highlight only ever tracks the scroll — no instant-then-walk flashing.
 *
 * Keep swiping left on the last page and `onSwipePastEnd` fires once (the burger menu, on the
 * home screen): the pager runs out of pages where the drawer's own edge begins.
 */
const ModePager = React.forwardRef<ModePagerHandle, ModePagerProps>(function ModePager(
  { labels, children, activeColors, onIndexChange, initialIndex = 0, onSwipePastEnd },
  ref
) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { haptics } = useHaptics();
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const pages = React.Children.toArray(children);
  const colors = activeColors ?? labels.map(() => ({ dot: 'bg-accent', text: 'text-accent' }));
  // activeIndex is clamped to a valid page index in handleScroll.
  // eslint-disable-next-line security/detect-object-injection
  const activeColor = colors[activeIndex] ?? { dot: 'bg-accent', text: 'text-accent' };

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
    setActiveIndex(index);
    onIndexChange?.(index);
  }, [pages.length, onIndexChange]);

  // Imperative scroll for the top-nav buttons: starts a smooth scroll without touching the
  // highlight, so the active tab only changes as the scroll position crosses each page.
  useImperativeHandle(ref, () => ({ scrollToPage: goToPage }), [goToPage]);

  // Swipe past the last page → `onSwipePastEnd`. Measured from the touch rather than from the
  // scroll position because the track simply cannot scroll further, so there is no overscroll
  // to read (iOS rubber-bands, other browsers do nothing).
  const gestureRef = useRef<{ x: number; y: number; fromEnd: boolean; fired: boolean } | null>(
    null
  );

  const isAtLastPage = useCallback(() => {
    const track = trackRef.current;
    if (!track) return false;
    return track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!onSwipePastEnd || !touch) return;
      // `fromEnd` is latched at touch-down: without it, the swipe that *arrives* at the last
      // page would run straight on into the menu, because by mid-gesture the track is at its end.
      gestureRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        fromEnd: pages.length > 1 && isAtLastPage(),
        fired: false,
      };
    },
    [onSwipePastEnd, isAtLastPage, pages.length]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const gesture = gestureRef.current;
      const touch = e.touches[0];
      if (!onSwipePastEnd || !gesture || !touch || gesture.fired || !gesture.fromEnd) return;
      const dx = touch.clientX - gesture.x;
      const dy = touch.clientY - gesture.y;
      if (dx > -PAST_END_DISTANCE_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * PAST_END_RATIO) return;
      if (!isAtLastPage()) return;
      gesture.fired = true;
      // A light tap stands in for the drag-follow a scroll-snap track cannot give the gesture:
      // the finger is still down, and nothing under it has moved.
      haptics.light();
      onSwipePastEnd();
    },
    [onSwipePastEnd, isAtLastPage, haptics]
  );

  const handleTouchEnd = useCallback(() => {
    gestureRef.current = null;
  }, []);

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
        data-testid="mode-pager-track"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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

      {/* Page indicator (tappable fallback for the swipe gesture). Two equal halves meet at
          the viewport centerline: dots right-aligned in the left half, label left-aligned in
          the right half, so the gap between them sits dead-center. */}
      <div className="flex items-center py-3">
        <div className="flex flex-1 justify-end pr-1.5">
          <div className="flex items-center gap-1.5">
            {labels.map((label, i) => (
              <button
                key={i}
                onClick={() => goToPage(i)}
                aria-label={`Go to ${label} page`}
                className="py-2 px-0.5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === activeIndex ? `w-6 ${activeColor.dot}` : 'w-1.5 bg-border'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        {/* Only the active page's label is shown, but every label is stacked in the same
            grid cell (the inactive ones invisible) so the slot is always as wide as the
            widest label — the indicator never shifts as you navigate. */}
        <div className="grid flex-1 justify-items-start pl-1.5">
          {labels.map((label, i) => (
            <span
              key={i}
              className={`[grid-area:1/1] whitespace-nowrap text-[11px] font-body font-semibold uppercase tracking-[0.15em] transition-colors ${
                i === activeIndex ? activeColor.text : 'invisible'
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

export default ModePager;
