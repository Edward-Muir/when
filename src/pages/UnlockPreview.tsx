import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/achievements';
import AchievementReveal, { REVEAL_VARIANTS, RevealVariant } from '../components/AchievementReveal';
import { useTheme } from '../hooks/useTheme';
import { loadAllEvents } from '../utils/eventLoader';
import { buildEventsByName } from '../utils/statsStorage';
import type { HistoricalEvent } from '../types';

/**
 * Dev-only harness (route: /unlock-preview, unlinked) for comparing the achievement-unlock
 * reveal animations side by side without playing a full game. Renders every RevealVariant
 * for one sample badge; "Replay all" re-triggers them in sync, tapping a tile replays one.
 */

// A spread of badges so art + tier rings vary as you cycle samples.
const SAMPLES = [0, 7, 18, 30, ACHIEVEMENTS.length - 1]
  .map((i) => ACHIEVEMENTS[i]) // eslint-disable-line security/detect-object-injection -- fixed numeric indices
  .filter(Boolean);

type Keys = Record<RevealVariant, number>;
const ZERO_KEYS: Keys = { slam: 0, flip: 0, glow: 0, stagger: 0 };

const UnlockPreview: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const [eventsByName, setEventsByName] = useState<Map<string, HistoricalEvent>>();
  useEffect(() => {
    loadAllEvents().then((events) => setEventsByName(buildEventsByName(events)));
  }, []);

  const [keys, setKeys] = useState<Keys>(ZERO_KEYS);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [haptic, setHaptic] = useState(false);
  const [glowFlash, setGlowFlash] = useState(false);
  const [forceReduced, setForceReduced] = useState(false);

  const sample = SAMPLES[sampleIndex % SAMPLES.length]; // eslint-disable-line security/detect-object-injection -- modulo'd index

  const replayAll = () =>
    setKeys((k) => ({
      slam: k.slam + 1,
      flip: k.flip + 1,
      glow: k.glow + 1,
      stagger: k.stagger + 1,
    }));
  // eslint-disable-next-line security/detect-object-injection -- v is a typed RevealVariant
  const replayOne = (v: RevealVariant) => setKeys((k) => ({ ...k, [v]: k[v] + 1 }));

  const toggleBtn = (active: boolean, label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-sm transition-colors active:scale-95 ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-text hover:bg-border'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg pb-safe">
      {/* Backdrop so the frosted card shell + glows read well. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, var(--color-accent-secondary), transparent 55%), radial-gradient(120% 80% at 90% 20%, var(--color-accent), transparent 55%)',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 pt-safe">
        <div className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Unlock Reveal — Preview</h1>
            <p className="font-body text-sm text-text-muted">
              Dev only. Tap a tile to replay it. {sample ? `Sample: ${sample.name}` : ''}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {toggleBtn(false, '↻ Replay all', replayAll)}
          {toggleBtn(false, '⇆ Next badge', () => setSampleIndex((i) => i + 1))}
          <span className="mx-1 h-5 w-px bg-border" />
          {toggleBtn(haptic, 'Haptic', () => setHaptic((v) => !v))}
          {toggleBtn(glowFlash, 'Glow flash', () => setGlowFlash((v) => !v))}
          {toggleBtn(forceReduced, 'Reduced motion', () => setForceReduced((v) => !v))}
        </div>

        {/* 2×2 grid of variants */}
        <div className="grid grid-cols-1 gap-4 pb-10 sm:grid-cols-2">
          {REVEAL_VARIANTS.map(({ key, label, blurb }) => (
            <button
              key={key}
              onClick={() => replayOne(key)}
              className="flex min-h-[260px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 text-center transition-colors hover:bg-surface"
            >
              <div className="flex flex-1 items-center justify-center">
                {sample && eventsByName && (
                  <AchievementReveal
                    variant={key}
                    achievement={sample}
                    eventsByName={eventsByName}
                    replayKey={keys[key]} // eslint-disable-line security/detect-object-injection -- key is a typed RevealVariant
                    haptic={haptic}
                    glowFlash={glowFlash}
                    forceReduced={forceReduced}
                    size="lg"
                  />
                )}
              </div>
              <div>
                <div className="font-display text-base font-bold text-text">{label}</div>
                <div className="font-body text-xs text-text-muted">{blurb}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UnlockPreview;
