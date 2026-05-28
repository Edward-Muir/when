import React, { useCallback, useEffect, useRef, useState } from 'react';

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
}

/**
 * Horizontal scroll-snap pager for the mode-select screen. Each page is ~90% wide so a
 * sliver of the neighbour peeks (swipe affordance). Below the pages sits a tappable
 * page indicator, and on first visit a subtle nudge animation hints that you can swipe.
 */
const ModePager: React.FC<ModePagerProps> = ({ labels, children, hintKey, activeColors }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pages = React.Children.toArray(children);
  const colors = activeColors ?? labels.map(() => ({ dot: 'bg-accent', text: 'text-accent' }));
  // activeIndex is clamped to a valid page index in handleScroll.
  // eslint-disable-next-line security/detect-object-injection
  const activeColor = colors[activeIndex] ?? { dot: 'bg-accent', text: 'text-accent' };

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const panelWidth = track.firstElementChild?.clientWidth ?? track.clientWidth;
    if (!panelWidth) return;
    const index = Math.round(track.scrollLeft / panelWidth);
    setActiveIndex(Math.max(0, Math.min(pages.length - 1, index)));
  }, [pages.length]);

  const goToPage = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const left = index <= 0 ? 0 : track.scrollWidth - track.clientWidth;
    track.scrollTo({ left, behavior: 'smooth' });
  }, []);

  // One-time first-launch hint: nudge slightly right, then snap back.
  useEffect(() => {
    if (!hintKey) return;
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
  }, [hintKey, pages.length]);

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

      {/* Page indicator (tappable fallback for the swipe gesture) */}
      <div className="flex items-center justify-center gap-3 py-3">
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
        <div className="text-[11px] font-body font-semibold uppercase tracking-[0.15em] text-text-muted">
          {labels.map((label, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="mx-1.5 text-border">·</span>}
              <button
                onClick={() => goToPage(i)}
                className={`align-middle transition-colors ${
                  i === activeIndex ? activeColor.text : 'text-border'
                }`}
              >
                {label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModePager;
