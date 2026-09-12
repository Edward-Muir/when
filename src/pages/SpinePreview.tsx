import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Moon, SlidersHorizontal, Sun } from 'lucide-react';
import Timeline from '../components/Timeline/Timeline';
import Card from '../components/Card';
import { TimelineDecor, TimelineDecorContext } from '../components/Timeline/timelineDecor';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import { ERA_DEFINITIONS } from '../utils/eras';
import { HistoricalEvent } from '../types';
import {
  decorFromParams,
  GameSample,
  layerChips,
  layersOf,
  pickGameSample,
  pickSpineSample,
  PRESETS,
} from './spinePreview/presets';

/**
 * Dev-only harness (route: /spine-preview) for iterating on the timeline spine's
 * decorations (timelineDecor.ts). Mounts the real Timeline twice — as the My Timeline
 * tab and as a mid-game board — under a TimelineDecorContext driven entirely by the URL:
 *
 *   ?preset=tinted|evolving|ruler|everything|off   a curated combination
 *   ?layers=eraRail,eraStroke,gapRuler,gapLabels    explicit layers (wins over preset)
 *   ?base=accent|muted|none                          the static outer rail
 *   ?view=tab|game|both  ?theme=light|dark  ?bare=1 (no controls)  ?fit=1 (unrolled)
 *
 * Every control writes the URL, so a screenshot script needs no clicks. Not linked from
 * the game UI and has no vercel.json rewrite: local dev only, like /anim-jig.
 */

type View = 'tab' | 'game' | 'both';

const VIEWS: View[] = ['tab', 'game', 'both'];
const BASES: TimelineDecor['baseRail'][] = ['accent', 'muted', 'none'];

const noTimelineInteraction = {
  isDragging: false,
  insertionIndex: null,
  draggedCard: null,
  isOverTimeline: false,
  lastPlacementResult: null,
  animationPhase: null,
} as const;

/** The My Timeline tab: its heading, then the full sample opened at the median. */
const TabView: React.FC<{ sample: HistoricalEvent[]; total: number }> = ({ sample, total }) => (
  <div className="flex h-full flex-col bg-bg">
    <div className="mx-auto w-full max-w-sm px-3 pt-4 text-left mb-3">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-5xl font-bold text-text font-display leading-none">My Timeline</h1>
        <button
          className="p-2 rounded-xl bg-surface border border-border"
          aria-label="Filter timeline"
        >
          <SlidersHorizontal className="w-5 h-5 text-text" />
        </button>
      </div>
      <p className="text-text-muted text-sm mt-1 font-body">
        <span className="font-mono">{sample.length}</span> of{' '}
        <span className="font-mono">{total.toLocaleString()}</span> events placed
      </p>
    </div>
    <div className="flex-1 overflow-hidden">
      <Timeline events={sample} onEventTap={() => {}} {...noTimelineInteraction} startAtMiddle />
    </div>
  </div>
);

/** A mid-game board in the game's frame: logo bar, timeline, hand bar. */
const GameView: React.FC<{ game: GameSample }> = ({ game }) => (
  <div className="flex h-full flex-col bg-bg">
    <div className="flex h-14 shrink-0 items-center border-b border-border px-4">
      <span className="font-display text-3xl font-bold text-text">
        When<span className="text-accent">?</span>
      </span>
    </div>
    <div className="relative flex-1 overflow-hidden">
      <Timeline
        events={game.board}
        failedPlacements={game.failed}
        onEventTap={() => {}}
        {...noTimelineInteraction}
        enableCentering
      />
    </div>
    <div className="flex h-[120px] shrink-0 items-center border-t border-border bg-bg sm:h-[140px]">
      <div className="flex w-24 shrink-0 flex-col items-center font-body text-text">
        <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-sm text-white">5</span>
        <span className="text-sm">cards left</span>
      </div>
      <div className="flex-1 pl-3">
        <Card event={game.hand} size="landscape" />
      </div>
    </div>
  </div>
);

const chip = (active: boolean) =>
  `rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-surface text-text hover:bg-border'
  }`;

interface ControlsProps {
  decor: TimelineDecor;
  view: View;
  fit: boolean;
  isDark: boolean;
  params: URLSearchParams;
  update: (patch: Record<string, string | null>) => void;
  setDecor: (next: TimelineDecor) => void;
}

const Controls: React.FC<ControlsProps> = ({
  decor,
  view,
  fit,
  isDark,
  params,
  update,
  setDecor,
}) => (
  <aside className="flex-1 space-y-5 overflow-y-auto border-t border-border p-4 font-body text-text md:border-l md:border-t-0">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-2xl font-bold">Spine — Preview</h1>
      <button
        onClick={() => update({ theme: isDark ? 'light' : 'dark' })}
        className="rounded-xl border border-border bg-surface p-2 transition-colors hover:bg-border active:scale-95"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </div>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-text-muted">Presets</h2>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={chip(params.get('preset') === p.id && !params.has('layers'))}
            onClick={() => update({ preset: p.id, layers: null, base: null })}
          >
            {p.label}
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-text-muted">Layers</h2>
      <div className="flex flex-wrap gap-2">
        {layerChips(decor).map((c) => (
          <button key={c.key} className={chip(c.on)} onClick={() => setDecor(c.next)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-text-muted">Base rail:</span>
        {BASES.map((b) => (
          <button
            key={b}
            className={chip(decor.baseRail === b)}
            onClick={() => setDecor({ ...decor, baseRail: b })}
          >
            {b}
          </button>
        ))}
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-text-muted">View</h2>
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button key={v} className={chip(view === v)} onClick={() => update({ view: v })}>
            {v}
          </button>
        ))}
        <button className={chip(fit)} onClick={() => update({ fit: fit ? null : '1' })}>
          unrolled
        </button>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-text-muted">Era palette</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {ERA_DEFINITIONS.map((era) => (
          <li key={era.id} className="flex items-center gap-2">
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ backgroundColor: `var(--era-${era.id})` }}
            />
            {era.name}
          </li>
        ))}
      </ul>
    </section>

    <p className="text-xs text-text-muted">
      Layers: {layersOf(decor).join(', ') || 'none'} · base {decor.baseRail}. URL carries every
      setting; add <code>bare=1</code> to hide this panel.
    </p>
  </aside>
);

const SpinePreview: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [params, setParams] = useSearchParams();

  const [all, setAll] = React.useState<HistoricalEvent[]>();
  useEffect(() => {
    loadAllEvents().then(setAll);
  }, []);
  const sample = useMemo(() => (all ? pickSpineSample(all) : []), [all]);
  const game = useMemo(() => pickGameSample(sample), [sample]);

  const decor = decorFromParams(params);
  const viewParam = params.get('view');
  const view: View = viewParam === 'game' || viewParam === 'both' ? viewParam : 'tab';
  const fit = params.get('fit') === '1';
  const bare = params.get('bare') === '1';

  // The theme follows the URL when it says so; the toggle below writes the URL, so the
  // two never fight.
  const themeParam = params.get('theme');
  useEffect(() => {
    if ((themeParam === 'dark' || themeParam === 'light') && (themeParam === 'dark') !== isDark) {
      toggleTheme();
    }
  }, [themeParam, isDark, toggleTheme]);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };
  const setDecor = (next: TimelineDecor) =>
    update({ preset: null, layers: layersOf(next).join(','), base: next.baseRail });

  const frameClass = `relative w-full shrink-0 border-border bg-bg md:w-[402px] md:border ${
    fit ? '' : 'h-full overflow-hidden'
  }`;

  const phones = !all ? (
    <div className="flex h-full items-center justify-center font-body text-text-muted">
      Loading events…
    </div>
  ) : (
    <TimelineDecorContext.Provider value={decor}>
      {(view === 'tab' || view === 'both') && (
        <div className={frameClass}>
          <TabView sample={sample} total={all.length} />
        </div>
      )}
      {(view === 'game' || view === 'both') && game && (
        <div className={frameClass}>
          <GameView game={game} />
        </div>
      )}
    </TimelineDecorContext.Provider>
  );

  return (
    <div
      className={`flex flex-col bg-bg md:flex-row ${
        fit ? 'min-h-screen overflow-y-auto' : 'h-screen-safe overflow-hidden'
      }`}
    >
      <div
        className={`flex gap-4 ${bare ? '' : 'md:p-4'} ${fit ? 'items-start' : 'h-full min-h-0'}`}
      >
        {phones}
      </div>

      {!bare && (
        <Controls
          decor={decor}
          view={view}
          fit={fit}
          isDark={isDark}
          params={params}
          update={update}
          setDecor={setDecor}
        />
      )}
    </div>
  );
};

export default SpinePreview;
