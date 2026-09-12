import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import Plates from './timelineConcepts/Plates';
import type { PlateVariant } from './timelineConcepts/Plate';
import { GameFrame, TabFrame } from './timelineConcepts/Frame';
import { buildRows, pickGame, pickSample } from './timelineConcepts/shared';

/**
 * Dev-only harness (route: /timeline-concepts): the "plates" redesign of the timeline
 * surface — no spine or gutter, photographic plates with the year set large, a sticky
 * year readout that rolls as you scroll — as a mockup on real data, before it is ported
 * into Timeline.tsx.
 *
 *   ?plate=light|photo  ?view=tab|game  ?theme=light|dark  ?bare=1 (no controls)
 *
 * Not linked from the game UI and has no vercel.json rewrite: local dev only.
 */

type View = 'tab' | 'game';

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-surface text-text hover:bg-border'
  }`;

const TimelineConcepts: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const [all, setAll] = useState<HistoricalEvent[]>();
  useEffect(() => {
    loadAllEvents().then(setAll);
  }, []);

  const sample = useMemo(() => (all ? pickSample(all) : []), [all]);
  const tabRows = useMemo(() => buildRows(sample), [sample]);
  const game = useMemo(() => pickGame(sample), [sample]);
  const gameRows = useMemo(() => (game ? buildRows(game.board, game.tombstones) : []), [game]);

  const variant: PlateVariant = params.get('plate') === 'photo' ? 'photo' : 'light';
  const view: View = params.get('view') === 'game' ? 'game' : 'tab';
  const bare = params.get('bare') === '1';

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

  const phone = !all ? (
    <div className="flex h-full items-center justify-center font-body text-text-muted">
      Loading events…
    </div>
  ) : view === 'game' && game ? (
    <GameFrame game={game} variant={variant}>
      <Plates rows={gameRows} variant={variant} startRow={Math.floor(gameRows.length / 2)} />
    </GameFrame>
  ) : (
    <TabFrame placed={sample.length} total={all.length}>
      <Plates rows={tabRows} variant={variant} startRow={Math.floor(tabRows.length / 2)} />
    </TabFrame>
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
            <h1 className="font-display text-2xl font-bold">Timeline — Plates</h1>
            <button
              onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
              className="rounded-xl border border-border bg-surface p-2 hover:bg-border active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">Plate</h2>
            <div className="flex gap-2">
              <button
                className={chip(variant === 'light')}
                onClick={() => update({ plate: 'light' })}
              >
                Light
              </button>
              <button
                className={chip(variant === 'photo')}
                onClick={() => update({ plate: 'photo' })}
              >
                Photographic
              </button>
            </div>
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">View</h2>
            <div className="flex gap-2">
              <button className={chip(view === 'tab')} onClick={() => update({ view: 'tab' })}>
                My Timeline
              </button>
              <button className={chip(view === 'game')} onClick={() => update({ view: 'game' })}>
                In game
              </button>
            </div>
          </section>
        </aside>
      )}
    </div>
  );
};

export default TimelineConcepts;
