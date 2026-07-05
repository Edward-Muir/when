import { AnimationTuning, DEFAULT_TUNING } from '../../components/Timeline/animationTuning';

/**
 * Declarative slider schema for the /anim-jig control panel. Every tunable
 * number in AnimationTuning appears here once; the panel renders itself from
 * this list and localStorage merging applies only these known paths.
 */

export interface TuningField {
  /** Dot path into AnimationTuning, e.g. 'success.rippleReturnSpring.damping'. */
  path: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface TuningGroup {
  title: string;
  fields: TuningField[];
}

const spring = (base: string, label: string, withMass = false): TuningField[] => [
  { path: `${base}.stiffness`, label: `${label} stiffness`, min: 50, max: 800, step: 10 },
  { path: `${base}.damping`, label: `${label} damping`, min: 1, max: 60, step: 1 },
  ...(withMass
    ? [{ path: `${base}.mass`, label: `${label} mass`, min: 0.5, max: 3, step: 0.1 }]
    : []),
];

export const TUNING_SCHEMA: TuningGroup[] = [
  {
    title: 'Success — ripple wave',
    fields: [
      {
        path: 'success.rippleStaggerS',
        label: 'Stagger per card',
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: 's',
      },
      {
        path: 'success.rippleBaseYOffsetPx',
        label: 'Base amplitude',
        min: 0,
        max: 30,
        step: 1,
        unit: 'px',
      },
      {
        path: 'success.rippleHalfLifeCards',
        label: 'Half-life',
        min: 0.25,
        max: 4,
        step: 0.25,
        unit: 'cards',
      },
      {
        path: 'success.ripplePushDurationS',
        label: 'Push-down duration',
        min: 0.05,
        max: 0.5,
        step: 0.01,
        unit: 's',
      },
      ...spring('success.rippleReturnSpring', 'Return spring', true),
      {
        path: 'success.rippleCleanupMs',
        label: 'Cleanup after',
        min: 500,
        max: 5000,
        step: 100,
        unit: 'ms',
      },
    ],
  },
  {
    title: 'Success — placed card',
    fields: [
      ...spring('success.bounceSpring', 'Bounce spring'),
      {
        path: 'success.yearPopDurationS',
        label: 'Year pop duration',
        min: 0.1,
        max: 1.5,
        step: 0.05,
        unit: 's',
      },
      {
        path: 'success.yearPopPeakScale',
        label: 'Year pop peak scale',
        min: 1,
        max: 2,
        step: 0.05,
        unit: '×',
      },
      {
        path: 'success.flashMs',
        label: 'Flash phase (input lock)',
        min: 100,
        max: 1500,
        step: 50,
        unit: 'ms',
      },
      { path: 'success.glowDurS', label: 'Glow duration', min: 0.2, max: 2, step: 0.05, unit: 's' },
    ],
  },
  {
    title: 'Miss — flash & travel',
    fields: [
      { path: 'miss.flashMs', label: 'Red flash', min: 100, max: 1500, step: 50, unit: 'ms' },
      {
        path: 'miss.errorPulseDurS',
        label: 'Error pulse duration',
        min: 0.2,
        max: 2,
        step: 0.05,
        unit: 's',
      },
      {
        path: 'miss.travelBaseMs',
        label: 'Travel base',
        min: 200,
        max: 1200,
        step: 25,
        unit: 'ms',
      },
      {
        path: 'miss.travelPerRowMs',
        label: 'Travel per row',
        min: 0,
        max: 400,
        step: 10,
        unit: 'ms',
      },
      { path: 'miss.travelMinMs', label: 'Travel min', min: 200, max: 3000, step: 50, unit: 'ms' },
      { path: 'miss.travelMaxMs', label: 'Travel max', min: 400, max: 3000, step: 50, unit: 'ms' },
      {
        path: 'miss.settleMarginMs',
        label: 'Settle margin (input lock)',
        min: 0,
        max: 1000,
        step: 50,
        unit: 'ms',
      },
    ],
  },
  {
    title: 'Miss — springs',
    fields: [
      ...spring('miss.restSpring', 'Tombstone rest spring'),
      ...spring('miss.rejectionSpring', 'Rejection exit spring'),
    ],
  },
  {
    title: 'Miss — wake',
    fields: [
      { path: 'wake.amplitudePx', label: 'Bump amplitude', min: 0, max: 30, step: 1, unit: 'px' },
      {
        path: 'wake.bumpOffsetS',
        label: 'Bump offset after passage',
        min: 0,
        max: 0.3,
        step: 0.01,
        unit: 's',
      },
      { path: 'wake.runOutBumps', label: 'Run-out rows', min: 0, max: 4, step: 1 },
      {
        path: 'wake.runOutBaseDelayS',
        label: 'Run-out first delay',
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: 's',
      },
      { path: 'wake.runOutStepS', label: 'Run-out step', min: 0, max: 0.5, step: 0.01, unit: 's' },
      { path: 'wake.runOutDecay', label: 'Run-out decay', min: 0, max: 1, step: 0.05, unit: '×' },
      {
        path: 'wake.layoutShiftLeadS',
        label: 'Row-shift lead time',
        min: 0,
        max: 0.5,
        step: 0.01,
        unit: 's',
      },
      ...spring('wake.layoutShiftSpring', 'Row-shift spring'),
    ],
  },
];

type AnyRecord = Record<string, unknown>;

export function getAtPath(tuning: AnimationTuning, path: string): number {
  let node: unknown = tuning;
  for (const key of path.split('.')) {
    // eslint-disable-next-line security/detect-object-injection -- keys come from the static TUNING_SCHEMA, not user input
    node = (node as AnyRecord)[key];
  }
  return node as number;
}

/** Immutable set: returns a new tuning object with `path` replaced by `value`. */
export function setAtPath(tuning: AnimationTuning, path: string, value: number): AnimationTuning {
  const keys = path.split('.');
  const clone = (node: unknown, depth: number): unknown => {
    if (depth === keys.length) return value;
    const record = node as AnyRecord;
    // eslint-disable-next-line security/detect-object-injection -- keys come from the static TUNING_SCHEMA, not user input
    return { ...record, [keys[depth]]: clone(record[keys[depth]], depth + 1) };
  };
  return clone(tuning, 0) as AnimationTuning;
}

export const TUNING_STORAGE_KEY = 'when-anim-jig-tuning-v1';

/** Merge stored numbers over the defaults, applying only known schema paths. */
export function mergeStoredTuning(stored: unknown): AnimationTuning {
  let merged = DEFAULT_TUNING;
  if (typeof stored !== 'object' || stored === null) return merged;
  for (const group of TUNING_SCHEMA) {
    for (const field of group.fields) {
      try {
        const value = getAtPath(stored as AnimationTuning, field.path);
        if (typeof value === 'number' && Number.isFinite(value)) {
          merged = setAtPath(merged, field.path, value);
        }
      } catch {
        // stored shape drifted — keep the default for this field
      }
    }
  }
  return merged;
}

export function loadStoredTuning(): AnimationTuning {
  try {
    const raw = localStorage.getItem(TUNING_STORAGE_KEY);
    if (!raw) return DEFAULT_TUNING;
    return mergeStoredTuning(JSON.parse(raw));
  } catch {
    return DEFAULT_TUNING;
  }
}

export function saveStoredTuning(tuning: AnimationTuning): void {
  try {
    localStorage.setItem(TUNING_STORAGE_KEY, JSON.stringify(tuning));
  } catch {
    // storage full/unavailable — jig still works, just doesn't persist
  }
}

export function clearStoredTuning(): void {
  try {
    localStorage.removeItem(TUNING_STORAGE_KEY);
  } catch {
    // ignore
  }
}
