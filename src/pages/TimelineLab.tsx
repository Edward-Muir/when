import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import TopBar from '../components/TopBar';
import ActiveCardDisplay from '../components/ActiveCardDisplay';
import { GameInfoCompact } from '../components/PlayerInfo';
import type { RailExtension } from '../components/Timeline/TimelineRail';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import type { HistoricalEvent, Player } from '../types';
import { buildBoard, drawOrder, MAX_BOARD } from './timelineLab/board';
import LabBoard from './timelineLab/LabBoard';
import { VARIANTS, variantById } from './timelineLab/variants';

/**
 * Dev-only harness (route: /timeline-lab): does the board get more rewarding the longer it
 * gets? Two materials already on screen — the paper and the rail — on the real row anatomy
 * with real data, at whatever board length you ask for.
 *
 *   ?v=<variant id>     one of VARIANTS (default `none`)
 *   ?n=<1..30>          cards placed — the same draw order cut short, so n=5 is n=30's opening
 *   ?fit=1              scale the whole board into the frame instead of scrolling it
 *   ?paper=<0..100>     ramp strength (default 100 — the tones are already only a few percent)
 *   ?ghost=earlier|later  force the drag-preview state at one end (the lab has no real drag)
 *   ?slowmo=<1..12>     stretch the rail extension in time, for capturing it in stills
 *   ?row=<index>        centre this row instead of the median
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

function readGhost(value: string | null): RailExtension | null {
  return value === 'earlier' || value === 'later' ? value : null;
}

interface LabOptions {
  variant: ReturnType<typeof variantById>;
  count: number;
  fit: boolean;
  bare: boolean;
  paperPct: number;
  ghost: RailExtension | null;
  timeScale: number;
  focusRow: number | undefined;
}

function clampNum(raw: string | null, fallback: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Number(raw ?? fallback) || fallback));
}

/** Everything the harness is driven by, read off the query string in one place. */
function readOptions(params: URLSearchParams): LabOptions {
  const rowParam = params.get('row');
  return {
    variant: variantById(params.get('v')),
    count: clampNum(params.get('n'), 14, 1, MAX_BOARD),
    fit: params.get('fit') === '1',
    bare: params.get('bare') === '1',
    paperPct: clampNum(params.get('paper'), 100, 0, 100),
    ghost: readGhost(params.get('ghost')),
    timeScale: clampNum(params.get('slowmo'), 1, 1, 12),
    focusRow: rowParam === null ? undefined : Number(rowParam),
  };
}

const TimelineLab: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState<HistoricalEvent[]>();

  useEffect(() => {
    loadAllEvents().then(setAll);
  }, []);

  const { variant, count, fit, bare, paperPct, ghost, timeScale, focusRow } = readOptions(params);

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

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  const phone =
    !all || board.rows.length === 0 ? (
      <div className="flex h-full items-center justify-center font-body text-text-muted">
        Loading events…
      </div>
    ) : (
      <div className="pt-topbar flex h-full w-full flex-col overflow-hidden bg-bg">
        <TopBar showHome showTitle onHomeClick={noop} />
        <div className="relative min-h-0 flex-1">
          <LabBoard
            board={board}
            layers={variant}
            paperPct={paperPct}
            fit={fit}
            focusRow={focusRow}
            ghost={ghost}
            ghostEvent={hand[0] ?? null}
            timeScale={timeScale}
          />
        </div>
        <div className="z-40 flex h-[120px] shrink-0 items-center border-t border-border bg-bg sm:h-[140px]">
          <div className="board-center-item flex w-24 shrink-0 items-center justify-center">
            <GameInfoCompact
              currentPlayer={player}
              isMultiplayer={false}
              timelineLength={board.rows.length}
              currentStreak={3}
            />
          </div>
          {hand[0] && (
            <ActiveCardDisplay
              activeCard={hand[0]}
              currentPlayer={player}
              isAnimating={false}
              isOverTimeline={ghost !== null}
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

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">Direction</h2>
            <div className="flex flex-wrap gap-2">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  className={chip(v.id === variant.id)}
                  onClick={() => update({ v: v.id })}
                >
                  {v.name}
                </button>
              ))}
            </div>
            <p className="max-w-prose text-sm leading-relaxed text-text-muted">{variant.blurb}</p>
          </section>

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
            <h2 className="text-sm font-semibold text-text-muted">Rail extension preview</h2>
            <div className="flex gap-2">
              <button className={chip(ghost === null)} onClick={() => update({ ghost: 'off' })}>
                At rest
              </button>
              <button
                className={chip(ghost === 'earlier')}
                onClick={() => update({ ghost: 'earlier' })}
              >
                Reaching earlier
              </button>
              <button
                className={chip(ghost === 'later')}
                onClick={() => update({ ghost: 'later' })}
              >
                Reaching later
              </button>
            </div>
            <p className="max-w-prose text-sm leading-relaxed text-text-muted">
              Stands in for a real drag past either end: the rail springs out to meet the ghost card
              and the growing tip settles. Click the same chip twice to replay it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">View</h2>
            <div className="flex gap-2">
              <button className={chip(!fit)} onClick={() => update({ fit: '0' })}>
                Scrolled
              </button>
              <button className={chip(fit)} onClick={() => update({ fit: '1' })}>
                Whole board
              </button>
            </div>
          </section>

          {variant.paper && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-text-muted">
                Paper strength — <span className="font-mono">{paperPct}%</span>
              </h2>
              <input
                type="range"
                min={0}
                max={100}
                value={paperPct}
                onChange={(e) => update({ paper: e.target.value })}
                className="w-full max-w-sm accent-accent"
              />
            </section>
          )}
        </aside>
      )}
    </div>
  );
};

export default TimelineLab;
