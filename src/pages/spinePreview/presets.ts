import { DECOR_OFF, TimelineDecor } from '../../components/Timeline/timelineDecor';
import type { FailedPlacement, HistoricalEvent } from '../../types';
import { ALL_ERAS } from '../../utils/eras';
import { filterByEra } from '../../utils/eventLoader';

/** The curated combinations the /spine-preview screenshots walk through. */
export interface SpinePreset {
  id: string;
  label: string;
  decor: TimelineDecor;
}

export const PRESETS: SpinePreset[] = [
  { id: 'off', label: 'Today', decor: DECOR_OFF },
  {
    id: 'tinted',
    label: 'Era-tinted rail',
    decor: { ...DECOR_OFF, eraRail: true, baseRail: 'muted' },
  },
  {
    id: 'evolving',
    label: 'Evolving stroke',
    decor: { ...DECOR_OFF, eraRail: true, eraStroke: true, baseRail: 'muted' },
  },
  {
    id: 'ruler',
    label: 'Time-gap ruler',
    decor: { ...DECOR_OFF, eraRail: true, gapRuler: true, gapLabels: true, baseRail: 'muted' },
  },
  {
    id: 'everything',
    label: 'All three',
    decor: { eraRail: true, eraStroke: true, gapRuler: true, gapLabels: true, baseRail: 'muted' },
  },
];

export const LAYER_KEYS = ['eraRail', 'eraStroke', 'gapRuler', 'gapLabels'] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];

export interface LayerChip {
  key: LayerKey;
  label: string;
  on: boolean;
  /** The decor with just this layer flipped. */
  next: TimelineDecor;
}

/** One chip per layer, spelled out (no `decor[key]` — the object-injection lint rule). */
export function layerChips(d: TimelineDecor): LayerChip[] {
  return [
    {
      key: 'eraRail',
      label: 'Era-tinted rail',
      on: d.eraRail,
      next: { ...d, eraRail: !d.eraRail },
    },
    {
      key: 'eraStroke',
      label: 'Evolving stroke',
      on: d.eraStroke,
      next: { ...d, eraStroke: !d.eraStroke },
    },
    { key: 'gapRuler', label: 'Gap ruler', on: d.gapRuler, next: { ...d, gapRuler: !d.gapRuler } },
    {
      key: 'gapLabels',
      label: 'Gap labels',
      on: d.gapLabels,
      next: { ...d, gapLabels: !d.gapLabels },
    },
  ];
}

const BASE_RAILS: TimelineDecor['baseRail'][] = ['accent', 'muted', 'none'];

function isLayerKey(k: string): k is LayerKey {
  return (LAYER_KEYS as readonly string[]).includes(k);
}

function isBaseRail(k: string | null): k is TimelineDecor['baseRail'] {
  return k !== null && (BASE_RAILS as string[]).includes(k);
}

/**
 * URL → decor. `?layers=eraRail,gapRuler&base=muted` wins over `?preset=…`; with neither
 * it is today's look. Explicit layers default the base rail to muted (the presets' choice).
 */
export function decorFromParams(params: URLSearchParams): TimelineDecor {
  const layersParam = params.get('layers');
  const base = params.get('base');
  if (layersParam !== null || base !== null) {
    const on = new Set((layersParam ?? '').split(',').filter(isLayerKey));
    return {
      eraRail: on.has('eraRail'),
      eraStroke: on.has('eraStroke'),
      gapRuler: on.has('gapRuler'),
      gapLabels: on.has('gapLabels'),
      baseRail: isBaseRail(base) ? base : on.size > 0 ? 'muted' : 'accent',
    };
  }
  const preset = PRESETS.find((p) => p.id === params.get('preset'));
  return preset?.decor ?? DECOR_OFF;
}

export function layersOf(decor: TimelineDecor): LayerKey[] {
  return layerChips(decor)
    .filter((c) => c.on)
    .map((c) => c.key);
}

/** Evenly spaced picks from a year-sorted list (first and last always included). */
function spread<T>(sorted: T[], count: number): T[] {
  if (sorted.length <= count) return sorted;
  const out: T[] = [];
  for (let i = 0; i < count; i++) {
    const item = sorted.at(Math.round((i * (sorted.length - 1)) / (count - 1)));
    if (item) out.push(item);
  }
  return out;
}

/**
 * A deterministic My-Timeline-shaped sample: `perEra` events from every era, evenly
 * spread through it by year, preferring events with art. ~40 rows across all of history.
 */
export function pickSpineSample(all: HistoricalEvent[], perEra = 5): HistoricalEvent[] {
  const picked = new Map<string, HistoricalEvent>();
  for (const era of ALL_ERAS) {
    const inEra = filterByEra(all, [era]).sort(
      (a, b) => a.year - b.year || a.name.localeCompare(b.name)
    );
    const withArt = inEra.filter((e) => e.image_url);
    const pool = withArt.length >= perEra ? withArt : inEra;
    for (const e of spread(pool, perEra)) picked.set(e.name, e);
  }
  return [...picked.values()].sort((a, b) => a.year - b.year || a.name.localeCompare(b.name));
}

export interface GameSample {
  board: HistoricalEvent[];
  failed: FailedPlacement[];
  hand: HistoricalEvent;
}

/** A mid-game board cut from the sample: six placed cards, two tombstones, one in hand. */
export function pickGameSample(sample: HistoricalEvent[]): GameSample | null {
  if (sample.length < 12) return null;
  const board = sample.filter((_, i) => i % 7 === 0);
  const boardNames = new Set(board.map((e) => e.name));
  const rest = sample.filter((e) => !boardNames.has(e.name));
  const [hand, ...others] = rest;
  const failed: FailedPlacement[] = spread(others, 2).map((event, seq) => ({
    event,
    attemptedPosition: 0,
    seq,
  }));
  return hand ? { board, failed, hand } : null;
}
