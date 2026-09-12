import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import { HistoricalEvent } from '../types';
import Atlas from './timelineConcepts/Atlas';
import Dusk from './timelineConcepts/Dusk';
import Ledger from './timelineConcepts/Ledger';
import { GameFrame, TabFrame } from './timelineConcepts/Frame';
import { buildRows, CONCEPTS, ConceptId, pickGame, pickSample } from './timelineConcepts/shared';

/**
 * Dev-only harness (route: /timeline-concepts) showing three complete redesigns of the
 * timeline surface as mockups on real data, before one is ported into Timeline.tsx.
 *
 *   ?concept=atlas|dusk|ledger  ?view=tab|game  ?theme=light|dark  ?bare=1 (no controls)
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

const Concept: React.FC<{
  id: ConceptId;
  rows: ReturnType<typeof buildRows>;
  startRow: number;
}> = ({ id, rows, startRow }) => {
  if (id === 'dusk') return <Dusk rows={rows} startRow={startRow} />;
  if (id === 'ledger') return <Ledger rows={rows} startRow={startRow} />;
  return <Atlas rows={rows} startRow={startRow} />;
};

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

  const conceptParam = params.get('concept');
  const concept: ConceptId =
    conceptParam === 'dusk' || conceptParam === 'ledger' ? conceptParam : 'atlas';
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
    <GameFrame game={game} concept={concept}>
      <Concept id={concept} rows={gameRows} startRow={Math.floor(gameRows.length / 2)} />
    </GameFrame>
  ) : (
    <TabFrame placed={sample.length} total={all.length}>
      <Concept id={concept} rows={tabRows} startRow={Math.floor(tabRows.length / 2)} />
    </TabFrame>
  );

  return (
    <div className="flex h-screen-safe flex-col overflow-hidden bg-bg md:flex-row">
      <div
        className={`h-full min-h-0 w-full shrink-0 overflow-hidden md:w-[402px] ${bare ? '' : 'md:border-r md:border-border'}`}
      >
        {phone}
      </div>
      {!bare && (
        <aside className="flex-1 space-y-5 overflow-y-auto border-t border-border p-4 font-body text-text md:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold">Timeline — Concepts</h1>
            <button
              onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
              className="rounded-xl border border-border bg-surface p-2 hover:bg-border active:scale-95"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-text-muted">Concept</h2>
            <div className="flex flex-wrap gap-2">
              {CONCEPTS.map((c) => (
                <button
                  key={c.id}
                  className={chip(concept === c.id)}
                  onClick={() => update({ concept: c.id })}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <p className="text-sm text-text-muted">
              {CONCEPTS.find((c) => c.id === concept)?.blurb}
            </p>
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
