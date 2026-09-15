import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import TopBar from '../components/TopBar';
import ActiveCardDisplay from '../components/ActiveCardDisplay';
import { GameInfoCompact } from '../components/PlayerInfo';
import Timeline from '../components/Timeline/Timeline';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import type { HistoricalEvent, Player } from '../types';
import { buildBoard, drawOrder, MAX_BOARD } from './timelineLab/board';

/**
 * Dev-only harness (route: /timeline-lab) for the board's paper ramp and its rail.
 *
 * It mounts the REAL Timeline with a seeded set of placed cards — there is no second
 * implementation to drift out of step. The only thing it fakes is the drag: `isDragging` +
 * `insertionIndex` are set straight onto Timeline's props, which is exactly what a real drag
 * past an end of the board does, so the rail extension shown here is the shipping one.
 *
 *   ?n=<1..30>          cards placed — the same draw order cut short, so n=5 is n=30's opening
 *   ?ghost=earlier|later|<gap>  hold a fake drag at one end, or in any gap on the board
 *   ?slowmo=<1..12>     stretch the rail's growth in time, for catching it in a still
 *   ?row=<index>        scroll this row to the middle
 *   ?theme=light|dark
 *   ?bare=1             phone only, no control panel (what the screenshot script uses)
 *
 * Not linked from the game UI and has no vercel.json rewrite: local dev only.
 */

const noop = () => {};

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-surface text-text hover:bg-border'
  }`;

const HAND_SIZE = 5;

function mockPlayer(hand: HistoricalEvent[]): Player {
  return { id: 0, name: 'You', hand, hasWon: false, placementHistory: [] };
}

/**
 * The gap a held drag is previewing: `earlier` and `later` are the two ends, and a bare number
 * is a gap index, so the harness can park the insertion marker anywhere on the board rather
 * than only where the rail extends.
 */
function readGhostGap(value: string | null, boardLength: number): number | null {
  if (value === 'earlier') return 0;
  if (value === 'later') return boardLength;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= boardLength ? n : null;
}

function clampNum(raw: string | null, fallback: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Number(raw ?? fallback) || fallback));
}

const TimelineLab: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState<HistoricalEvent[]>();

  useEffect(() => {
    loadAllEvents().then(setAll);
  }, []);

  const count = clampNum(params.get('n'), 14, 1, MAX_BOARD);
  const bare = params.get('bare') === '1';

  const timeScale = clampNum(params.get('slowmo'), 1, 1, 12);
  const rowParam = params.get('row');

  const draw = useMemo(() => (all ? drawOrder(all) : []), [all]);
  const board = useMemo(() => buildBoard(draw, count), [draw, count]);
  // The hand is drawn from beyond the placed cards, so it never duplicates the board.
  const hand = useMemo(() => draw.slice(count, count + HAND_SIZE), [draw, count]);
  const player = useMemo(() => mockPlayer(hand), [hand]);

  const themeParam = params.get('theme');
  useEffect(() => {
    if ((themeParam === 'dark' || themeParam === 'light') && (themeParam === 'dark') !== isDark) {
      toggleTheme();
    }
  }, [themeParam, isDark, toggleTheme]);

  // Timeline owns its own scrolling, so the harness steers it from outside by the same
  // attribute the drag code measures. Runs before a ghost is shown, so the frame never moves
  // mid-animation.
  useEffect(() => {
    if (rowParam === null || board.events.length === 0) return;
    const t = window.setTimeout(() => {
      document
        .querySelector(`[data-timeline-index="${Number(rowParam)}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
    }, 350);
    return () => window.clearTimeout(t);
  }, [rowParam, board.events.length]);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  const ghostGap = readGhostGap(params.get('ghost'), board.events.length);
  const dragging = ghostGap !== null;
  const dragged = dragging ? (hand[0] ?? null) : null;
  const midGap = Math.max(1, Math.floor(board.events.length / 2));

  const phone =
    !all || board.events.length === 0 ? (
      <div className="flex h-full items-center justify-center font-body text-text-muted">
        Loading events…
      </div>
    ) : (
      <div className="pt-topbar flex h-full w-full flex-col overflow-hidden bg-bg">
        <TopBar showHome showTitle onHomeClick={noop} />
        <div className="relative min-h-0 flex-1">
          <Timeline
            events={board.events}
            onEventTap={noop}
            isDragging={dragging}
            insertionIndex={ghostGap}
            draggedCard={dragged}
            isOverTimeline={dragging}
            lastPlacementResult={null}
            animationPhase={null}
            currentStreak={3}
            startAtMiddle={rowParam === null}
            railTimeScale={timeScale}
          />
        </div>
        <div className="z-40 flex h-[120px] shrink-0 items-center border-t border-border bg-bg sm:h-[140px]">
          <div className="board-center-item flex w-24 shrink-0 items-center justify-center">
            <GameInfoCompact
              currentPlayer={player}
              isMultiplayer={false}
              timelineLength={board.events.length}
              currentStreak={3}
            />
          </div>
          {hand[0] && (
            <ActiveCardDisplay
              activeCard={hand[0]}
              currentPlayer={player}
              isAnimating={false}
              isOverTimeline={dragging}
              onCycleHand={noop}
              onCardTap={noop}
            />
          )}
        </div>
      </div>
    );

  return (
    <div className="flex h-screen-safe flex-col overflow-hidden bg-bg md:flex-row">
      <div
        className={`h-full min-h-0 w-full shrink-0 overflow-hidden md:w-[402px] ${
          bare ? '' : 'md:border-r md:border-border'
        }`}
      >
        {phone}
      </div>
      {!bare && (
        <aside className="flex-1 space-y-5 overflow-y-auto border-t border-border p-4 font-body text-text md:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold">Timeline lab</h1>
            <button
              onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
              className="rounded-xl border border-border bg-surface p-2 hover:bg-border active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-text-muted">
            The real board, with a seeded set of cards already placed. The paper runs one continuous
            ramp keyed to each card’s year, and the rail exists only between the first and last card
            — drag the slider and watch both ends move.
          </p>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">
              Cards placed — <span className="font-mono">{count}</span>
            </h2>
            <input
              type="range"
              min={1}
              max={MAX_BOARD}
              value={count}
              onChange={(e) => update({ n: e.target.value })}
              className="w-full max-w-sm accent-accent"
            />
            <p className="font-mono text-xs text-text-muted">
              {board.spanYears.toLocaleString()} years covered
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">Insertion marker</h2>
            <div className="flex flex-wrap gap-2">
              <button className={chip(ghostGap === null)} onClick={() => update({ ghost: 'off' })}>
                At rest
              </button>
              <button className={chip(ghostGap === 0)} onClick={() => update({ ghost: 'earlier' })}>
                Reaching earlier
              </button>
              <button
                className={chip(ghostGap === midGap)}
                onClick={() => update({ ghost: String(midGap) })}
              >
                Mid-board
              </button>
              <button
                className={chip(ghostGap === board.events.length)}
                onClick={() => update({ ghost: 'later' })}
              >
                Reaching later
              </button>
            </div>
            <p className="max-w-prose text-sm leading-relaxed text-text-muted">
              Holds the state a real drag puts the board in. The marker travels between these, so
              click from one chip to another to watch it move; the same chip twice replays the
              arrival.
            </p>
          </section>
        </aside>
      )}
    </div>
  );
};

export default TimelineLab;
