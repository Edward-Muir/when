import React, { useState } from 'react';
import { Moon, RotateCcw, Sun } from 'lucide-react';
import {
  AnimationTuning,
  DEFAULT_TUNING,
  getMissTravelMs,
} from '../../components/Timeline/animationTuning';
import { getAtPath, setAtPath, TUNING_SCHEMA, TuningField, TuningGroup } from './tuningSchema';
import { TIER_LABELS } from './useAnimJigDriver';

export interface ControlsPanelProps {
  tuning: AnimationTuning;
  onTuningChange: (t: AnimationTuning) => void;
  onResetAllTuning: () => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  forceReduced: boolean;
  onForceReducedChange: (v: boolean) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  distance: number;
  onDistanceChange: (d: number) => void;
  direction: 'early' | 'late';
  onDirectionChange: (d: 'early' | 'late') => void;
  maxDistance: number;
  status: 'idle' | 'playing';
  onPlayCorrect: (tier: number) => void;
  onPlayMiss: () => void;
  onReplay: () => void;
  onResetBoard: () => void;
}

const buttonClass = (active = false) =>
  `rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
    active
      ? 'border-accent bg-accent text-white'
      : 'border-border bg-surface text-text hover:bg-border'
  }`;

const formatValue = (value: number) => (Number.isInteger(value) ? value : +value.toFixed(3));

const SliderRow: React.FC<{
  field: TuningField;
  tuning: AnimationTuning;
  onTuningChange: (t: AnimationTuning) => void;
}> = ({ field, tuning, onTuningChange }) => {
  const value = getAtPath(tuning, field.path);
  const defaultValue = getAtPath(DEFAULT_TUNING, field.path);
  const isModified = value !== defaultValue;
  const setValue = (v: number) => {
    if (Number.isFinite(v)) onTuningChange(setAtPath(tuning, field.path, v));
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
        isModified ? 'border-accent' : 'border-transparent'
      }`}
    >
      <span className="w-44 shrink-0 text-xs text-text font-body leading-tight">
        {field.label}
        <span className="block text-text-muted opacity-70">
          default {formatValue(defaultValue)}
          {field.unit ?? ''}
        </span>
      </span>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="flex-1 accent-[var(--color-accent)]"
      />
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step}
        value={formatValue(value)}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-20 shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs text-text font-mono"
      />
      <button
        onClick={() => setValue(defaultValue)}
        disabled={!isModified}
        title="Reset to default"
        className={`shrink-0 rounded-md p-1 ${
          isModified ? 'text-accent hover:bg-border' : 'text-text-muted opacity-30'
        }`}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

const GroupSection: React.FC<{
  group: TuningGroup;
  tuning: AnimationTuning;
  onTuningChange: (t: AnimationTuning) => void;
}> = ({ group, tuning, onTuningChange }) => {
  const modifiedCount = group.fields.filter(
    (f) => getAtPath(tuning, f.path) !== getAtPath(DEFAULT_TUNING, f.path)
  ).length;
  const resetGroup = () => {
    let next = tuning;
    for (const f of group.fields) {
      next = setAtPath(next, f.path, getAtPath(DEFAULT_TUNING, f.path));
    }
    onTuningChange(next);
  };

  return (
    <details open className="rounded-xl border border-border bg-surface/50">
      <summary className="flex cursor-pointer items-center justify-between px-3 py-2 font-display text-sm font-bold text-text">
        <span>
          {group.title}
          {modifiedCount > 0 && (
            <span className="ml-2 text-xs font-body font-normal text-accent">
              {modifiedCount} modified
            </span>
          )}
        </span>
        {modifiedCount > 0 && (
          <button
            onClick={(e) => {
              e.preventDefault();
              resetGroup();
            }}
            className="text-xs font-body font-normal text-text-muted hover:text-text"
          >
            reset group
          </button>
        )}
      </summary>
      <div className="flex flex-col gap-1 px-2 pb-2">
        {group.fields.map((field) => (
          <SliderRow
            key={field.path}
            field={field}
            tuning={tuning}
            onTuningChange={onTuningChange}
          />
        ))}
      </div>
    </details>
  );
};

const CopyButtons: React.FC<{ tuning: AnimationTuning }> = ({ tuning }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => copy('json', JSON.stringify(tuning, null, 2))}
        className={buttonClass()}
      >
        {copied === 'json' ? 'Copied!' : 'Copy JSON'}
      </button>
      <button
        onClick={() =>
          copy(
            'code',
            `export const DEFAULT_TUNING: AnimationTuning = ${JSON.stringify(tuning, null, 2)};`
          )
        }
        className={buttonClass()}
      >
        {copied === 'code' ? 'Copied!' : 'Copy as DEFAULT_TUNING'}
      </button>
    </div>
  );
};

const ControlsPanel: React.FC<ControlsPanelProps> = (props) => {
  const {
    tuning,
    onTuningChange,
    onResetAllTuning,
    speed,
    onSpeedChange,
    forceReduced,
    onForceReducedChange,
    isDark,
    onToggleTheme,
    distance,
    onDistanceChange,
    direction,
    onDirectionChange,
    maxDistance,
    status,
    onPlayCorrect,
    onPlayMiss,
    onReplay,
    onResetBoard,
  } = props;

  const travelMs = getMissTravelMs(distance, tuning.miss);
  const missLockMs = tuning.miss.flashMs + travelMs + tuning.miss.settleMarginMs;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-xl font-bold text-text">Animation Jig</h1>
        <div className="flex items-center gap-2">
          {[0.25, 0.5, 1].map((s) => (
            <button key={s} onClick={() => onSpeedChange(s)} className={buttonClass(speed === s)}>
              {s}×
            </button>
          ))}
          <button
            onClick={() => onForceReducedChange(!forceReduced)}
            className={buttonClass(forceReduced)}
            title="Force framer-motion reduced motion inside the phone column"
          >
            Reduced motion
          </button>
          <button onClick={onToggleTheme} className={buttonClass()} aria-label="Toggle theme">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Play controls */}
      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-text font-display">Correct</span>
          {TIER_LABELS.map((label, tier) => (
            <button key={label} onClick={() => onPlayCorrect(tier)} className={buttonClass()}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-text font-display">Miss</span>
          <button
            onClick={() => onDirectionChange('early')}
            className={buttonClass(direction === 'early')}
          >
            too early ↑
          </button>
          <button
            onClick={() => onDirectionChange('late')}
            className={buttonClass(direction === 'late')}
          >
            too late ↓
          </button>
          <label className="flex items-center gap-1 text-xs text-text-muted">
            distance
            <input
              type="number"
              min={1}
              max={maxDistance}
              value={distance}
              onChange={(e) =>
                onDistanceChange(Math.max(1, Math.min(maxDistance, Number(e.target.value) || 1)))
              }
              className="w-14 rounded-md border border-border bg-surface px-1.5 py-0.5 text-xs text-text font-mono"
            />
          </label>
          <button onClick={onPlayMiss} className={buttonClass()}>
            Play miss
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onReplay} className={buttonClass()}>
            Replay last
          </button>
          <button onClick={onResetBoard} className={buttonClass()}>
            Reset board
          </button>
          <span className="text-xs text-text-muted font-mono">
            {status === 'playing' ? 'playing…' : 'idle'} · travel {Math.round(travelMs)}ms · miss
            lock {Math.round(missLockMs)}ms · success lock {Math.round(tuning.success.flashMs)}ms
          </span>
        </div>
        <p className="text-xs text-text-muted opacity-80">
          Tweak sliders, then Replay — changing values mid-flight can cancel in-flight springs.
          Screen shake and card entrance are fixed CSS and ignore the speed / reduced-motion toggles
          (shake follows the OS setting).
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <CopyButtons tuning={tuning} />
        <button onClick={onResetAllTuning} className={buttonClass()}>
          Reset all tuning
        </button>
      </div>

      {TUNING_SCHEMA.map((group) => (
        <GroupSection
          key={group.title}
          group={group}
          tuning={tuning}
          onTuningChange={onTuningChange}
        />
      ))}
    </div>
  );
};

export default ControlsPanel;
