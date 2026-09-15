import React, { CSSProperties, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Card from '../../components/Card';
import TimelineEvent from '../../components/Timeline/TimelineEvent';
import TimelineRail, { RailExtension } from '../../components/Timeline/TimelineRail';
import type { HistoricalEvent } from '../../types';
import { compactYears, type LabBoard as Board, type LabRow } from './board';
import type { LabLayers } from './variants';

/*
 * The board surface for /timeline-lab: the shipping row anatomy (the real TimelineEvent, so
 * cards are pixel-identical to the game) with the paper ramp and the rail composed around it.
 *
 * Deliberately NOT a fork of Timeline.tsx — the drag, ripple, wake and miss-reveal machinery
 * is absent, because none of this touches it, and Timeline's body sits ~12 lines under the
 * `max-lines-per-function` ceiling. The rail itself is a real component
 * (components/Timeline/TimelineRail) so the port is an import, not a rewrite.
 */

type Box = React.RefObject<HTMLDivElement | null>;

const noop = () => {};

/** Per-row CSS vars the `.tl-paper*` utilities read. */
function toneVars(tone: number, prevTone: number): CSSProperties {
  return {
    '--tone': `color-mix(in oklab, var(--paper-late) ${tone * 100}%, var(--paper-early))`,
    '--tone-prev': `color-mix(in oklab, var(--paper-late) ${prevTone * 100}%, var(--paper-early))`,
  } as CSSProperties;
}

interface LabBoardProps {
  board: Board;
  layers: LabLayers;
  /** Strength of the paper ramp, 0-100 — mixed toward --color-bg by the `.tl-paper*` rules. */
  paperPct: number;
  /** Scale the whole board down so all of it fits the frame ("what have I built" view). */
  fit: boolean;
  /** Row to centre in the viewport when scrolling; defaults to the median row. */
  focusRow?: number;
  /** Force the drag-preview state at one end of the board (the lab has no real drag). */
  ghost?: RailExtension | null;
  ghostEvent?: HistoricalEvent | null;
  /** Stretch the rail extension in time. 1 in the game; the screenshot rig asks for more. */
  timeScale?: number;
}

/** The drag ghost, same anatomy as Timeline.tsx's. */
const GhostRow: React.FC<{ event: HistoricalEvent }> = ({ event }) => (
  <div className="flex w-full items-center py-1 opacity-ghost">
    <div className="flex w-24 shrink-0 items-center justify-end">
      <span className="pr-2 font-mono text-xs font-bold text-text-muted sm:text-sm">?</span>
      <div className="h-1 w-3 shrink-0 bg-accent" />
    </div>
    <div className="flex-1 pl-3">
      <Card event={event} size="landscape" />
    </div>
  </div>
);

const Row: React.FC<{
  row: LabRow;
  layers: LabLayers;
  railFirst: boolean;
  railLast: boolean;
}> = ({ row, layers, railFirst, railLast }) => (
  <div
    className={`relative w-full ${layers.paper ? 'tl-paper' : ''}`}
    style={toneVars(row.tone, row.prevTone)}
  >
    <div className="relative w-full">
      {layers.rail && <TimelineRail first={railFirst} last={railLast} />}
      <TimelineEvent event={row.event} onTap={noop} index={row.index} priority={row.index < 4} />
    </div>
  </div>
);

/** Fit mode: shrink the board until all of it is in frame. Measured, not computed. */
function useFitScale(fit: boolean, deps: unknown[], refs: { box: Box; content: Box }): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    if (!fit) {
      setScale(1);
      return;
    }
    const measure = () => {
      const box = refs.box.current;
      const content = refs.content.current;
      if (!box || !content) return;
      const h = content.scrollHeight;
      setScale(h > 0 ? Math.min(1, (box.clientHeight - 16) / h) : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (refs.box.current) ro.observe(refs.box.current);
    if (refs.content.current) ro.observe(refs.content.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit, ...deps]);
  return scale;
}

/** Scroll mode: open centred on `idx`, so a shot shows board rather than empty runway. */
function useCentreRow(active: boolean, idx: number, box: Box, deps: unknown[]): void {
  useLayoutEffect(() => {
    const el = box.current;
    if (!active || !el) return;
    const centre = () => {
      const target = el.querySelector(`[data-timeline-index="${idx}"]`) as HTMLElement | null;
      if (!target) return;
      const bRect = el.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();
      const mid = tRect.top - bRect.top + el.scrollTop + tRect.height / 2;
      el.scrollTop = mid - el.clientHeight / 2;
    };
    centre();
    // Images settle late; re-centre once they have.
    const t = window.setTimeout(centre, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, idx, ...deps]);
}

/** The years covered, as one figure. The optional extra — never on by default. */
const SpanFigure: React.FC<{ board: Board }> = ({ board }) => (
  <div aria-hidden className="flex w-full items-baseline pb-3 pt-1">
    <div className="flex w-24 shrink-0 flex-col items-end pr-2 text-right">
      <span className="font-display text-xl font-bold leading-none text-text">
        {compactYears(board.spanYears)}
      </span>
      <span className="pt-0.5 font-body text-[10px] leading-none text-text-muted">
        years covered
      </span>
    </div>
  </div>
);

/** The "↑ Earlier" / "Later ↓" wayfinding. The gradient behind it only works against a flat
 *  page, so tinted paper keeps the label and drops the fade (the scroller masks its own edges
 *  instead — see `.tl-edge-mask`). */
const EdgeBand: React.FC<{ edge: 'top' | 'bottom'; fade: boolean }> = ({ edge, fade }) => {
  const top = edge === 'top';
  return (
    <div className={`pointer-events-none absolute inset-x-0 z-30 ${top ? 'top-0' : 'bottom-0'}`}>
      {fade && (
        <div
          className={`h-12 ${top ? 'bg-gradient-to-b' : 'bg-gradient-to-t'} from-bg to-transparent`}
        />
      )}
      <div
        className={`absolute inset-x-0 ${top ? 'top-2' : 'bottom-2'} text-center font-body text-sm font-medium text-text-muted`}
      >
        {top ? '↑ Earlier' : 'Later ↓'}
      </div>
    </div>
  );
};

/** The drag ghost's row, carrying the rail segment that is springing out to meet it. */
const GhostBand: React.FC<{
  event: HistoricalEvent;
  ghost: RailExtension;
  layers: LabLayers;
  tone: number;
  timeScale: number;
}> = ({ event, ghost, layers, tone, timeScale }) => (
  // A motion component so AnimatePresence holds the row on the way out and the rail's own exit
  // gets to run; a plain div would unmount at once and the rail would snap back.
  <motion.div
    className={`relative w-full ${layers.paper ? 'tl-paper' : ''}`}
    style={toneVars(tone, tone)}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 * timeScale }}
  >
    <div className="relative w-full">
      {layers.rail && (
        <TimelineRail
          first={ghost === 'earlier'}
          last={ghost === 'later'}
          extending={ghost}
          timeScale={timeScale}
        />
      )}
      <GhostRow event={event} />
    </div>
  </motion.div>
);

/** The 50vh runway above the first card / below the last, carrying that end's flat tone. */
const Runway: React.FC<{ paper: boolean; tone: number }> = ({ paper, tone }) => (
  <div
    aria-hidden
    className={`w-full shrink-0 ${paper ? 'tl-paper-flat' : ''}`}
    style={{ height: '50vh', ...toneVars(tone, tone) }}
  />
);

interface ContentProps {
  board: Board;
  layers: LabLayers;
  fit: boolean;
  scale: number;
  ghost: RailExtension | null;
  ghostEvent: HistoricalEvent | null;
  timeScale: number;
}

/** Everything inside the scroller: the runways, the rows, and the ghost at whichever end. */
const BoardContent = React.forwardRef<HTMLDivElement, ContentProps>(
  ({ board, layers, fit, scale, ghost, ghostEvent, timeScale }, ref) => {
    const rows = board.rows;
    const firstTone = rows.at(0)?.tone ?? 1;
    const lastTone = rows.at(-1)?.tone ?? 1;
    // The ghost's card is face-down — its year is the puzzle — so its row inherits the tone of
    // the card it is sitting beside. The paper must never leak the answer.
    const ghostTone = ghost === 'earlier' ? firstTone : lastTone;
    const ghostRow =
      ghost && ghostEvent ? (
        <GhostBand
          key={`ghost-${ghost}`}
          event={ghostEvent}
          ghost={ghost}
          layers={layers}
          tone={ghostTone}
          timeScale={timeScale}
        />
      ) : null;

    return (
      <div
        ref={ref}
        className="relative flex w-full flex-col items-start"
        style={fit ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}
      >
        {!fit && <Runway paper={layers.paper} tone={firstTone} />}
        {layers.span && <SpanFigure board={board} />}
        <AnimatePresence initial={false}>{ghost === 'earlier' && ghostRow}</AnimatePresence>
        {rows.map((row) => (
          <Row
            key={row.event.name}
            row={row}
            layers={layers}
            railFirst={row.index === 0 && ghost !== 'earlier'}
            railLast={row.index === rows.length - 1 && ghost !== 'later'}
          />
        ))}
        <AnimatePresence initial={false}>{ghost === 'later' && ghostRow}</AnimatePresence>
        {!fit && <Runway paper={layers.paper} tone={lastTone} />}
      </div>
    );
  }
);
BoardContent.displayName = 'BoardContent';

const LabBoard: React.FC<LabBoardProps> = ({
  board,
  layers,
  paperPct,
  fit,
  focusRow,
  ghost = null,
  ghostEvent = null,
  timeScale = 1,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rows = board.rows;

  const scale = useFitScale(fit, [rows.length, layers], { box: scrollRef, content: contentRef });
  const medianRow = Math.floor((rows.length - 1) / 2);
  const endRow = ghost === 'earlier' ? 0 : rows.length - 1;
  const defaultFocus = ghost === null ? medianRow : endRow;
  useCentreRow(!fit && rows.length > 0, focusRow ?? defaultFocus, scrollRef, [rows.length, layers]);

  const paperVar = { '--paper-pct': `${paperPct}%` } as CSSProperties;

  return (
    <div className="relative h-full" style={paperVar}>
      {!fit && <EdgeBand edge="top" fade={!layers.paper} />}

      {/* The shipping rail: one full-height bar, page furniture. Gone when the rail grows. */}
      {!layers.rail && (
        <div className="board-rail absolute inset-y-0 z-0 w-1 rounded-full bg-accent" />
      )}

      <div
        ref={scrollRef}
        className={`board-center relative z-10 h-full ${
          fit ? 'overflow-hidden' : 'overflow-y-auto timeline-scroll-vertical'
        } ${layers.paper && !fit ? 'tl-edge-mask' : ''}`}
      >
        <BoardContent
          ref={contentRef}
          board={board}
          layers={layers}
          fit={fit}
          scale={scale}
          ghost={ghost}
          ghostEvent={ghostEvent}
          timeScale={timeScale}
        />
      </div>

      {!fit && <EdgeBand edge="bottom" fade={!layers.paper} />}
    </div>
  );
};

export default LabBoard;
