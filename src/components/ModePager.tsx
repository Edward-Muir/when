import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

interface ModePagerProps {
  /** Short labels for each page, shown in the indicator (e.g. ['Daily', 'Custom']). */
  labels: string[];
  /** One child element per page, in order. */
  children: React.ReactNode;
  /** localStorage key guarding the one-time first-launch swipe hint. */
  hintKey?: string;
  /**
   * Tailwind classes for the active indicator (pill + label), one entry per page, so each
   * page's indicator can match its own accent. Defaults to gold (`accent`) for every page.
   */
  activeColors?: { dot: string; text: string }[];
  /** Reports the active page index back to the parent as the scroll position changes. */
  onIndexChange?: (index: number) => void;
  /** Page to open on, instantly, before first paint. Defaults to the first. */
  initialIndex?: number;
}

/** Imperative handle: lets a parent (the top-nav buttons) scroll the pager to a page. */
export interface ModePagerHandle {
  scrollToPage: (index: number) => void;
}

/**
 * Horizontal scroll-snap pager for the mode-select screen. Each page is ~90% wide so a
 * sliver of the neighbour peeks (swipe affordance). Below the pages sits a tappable
 * page indicator, and on first visit a subtle nudge animation hints that you can swipe.
 *
 * The active page is a pure function of the scroll position (reported via `onIndexChange`).
 * Buttons scroll via the imperative `scrollToPage` handle rather than setting the highlight
 * directly, so the highlight only ever tracks the scroll — no instant-then-walk flashing.
 */
const ModePager = React.forwardRef<ModePagerHandle, ModePagerProps>(function ModePager(
  { labels, children, hintKey, activeColors, onIndexChange, initialIndex = 0 },
  ref
) {
  const trackRef = useRef<HTMLDivElement>(null);
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

  // One-time first-launch hint: nudge slightly right, then snap back. Not when the page
  // opened on another tab — the nudge would drag it back toward Daily.
  const openedOnFirstPage = initialIndex <= 0;
  useEffect(() => {
    if (!hintKey || !openedOnFirstPage) return;
    if (pages.length < 2) return;
    try {
      if (localStorage.getItem(hintKey)) return;
      localStorage.setItem(hintKey, '1');
    } catch {
      // localStorage unavailable (private mode) — skip the hint, no harm.
      return;
    }
    const track = trackRef.current;
    if (!track) return;
    const nudge = window.setTimeout(() => {
      track.scrollTo({ left: 56, behavior: 'smooth' });
    }, 700);
    const back = window.setTimeout(() => {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    }, 1250);
    return () => {
      window.clearTimeout(nudge);
      window.clearTimeout(back);
    };
  }, [hintKey, pages.length, openedOnFirstPage]);

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
