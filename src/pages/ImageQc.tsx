import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, ChevronLeft, ChevronRight, Clipboard, Sun, Moon } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { loadAllEvents } from '../utils/eventLoader';
import { getImageUrl } from '../utils/cloudinaryImage';
import { getQcResults, setQcResult } from '../utils/imageQcStorage';
import { useTheme } from '../hooks/useTheme';

/**
 * Hidden dev tool (route: /image-qc, not linked from any nav) for reviewing event
 * card images one-by-one. Tick = image passes, cross = needs replacing. Verdicts
 * persist in localStorage so already-reviewed images never reappear. "Copy failed
 * codes" exports the bad events' codes (newline-separated) to seed a replacement run.
 */

/** Fisher–Yates shuffle, returns a new array. */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback for browsers without the async clipboard API.
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
}

const ImageQc: React.FC = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [allEvents, setAllEvents] = useState<HistoricalEvent[] | null>(null);
  const [pos, setPos] = useState(0);
  const [copied, setCopied] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);
  // Bump to force a re-read of localStorage-derived counts after each verdict.
  const [tick, setTick] = useState(0);

  // Snapshot of verdicts present at mount — used to build the session queue once
  // so Undo can step back through the same stable order.
  const initialResults = useRef(getQcResults());

  useEffect(() => {
    let cancelled = false;
    loadAllEvents().then((events) => {
      if (!cancelled) setAllEvents(events);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Un-judged events, shuffled once for the session.
  const queue = useMemo(() => {
    if (!allEvents) return [];
    const judged = initialResults.current;
    return shuffle(allEvents.filter((e) => !judged[e.name]));
  }, [allEvents]);

  const current = queue[pos];

  useEffect(() => {
    setImgError(false);
  }, [current?.name]);

  // Prefetch the next few images so they're warm in the browser cache by the
  // time we navigate to them — no waiting on each step forward.
  useEffect(() => {
    if (!queue.length) return;
    for (let i = pos + 1; i <= pos + 5 && i < queue.length; i++) {
      const url = getImageUrl(queue[i].image_url, 'detail');
      if (url) {
        const img = new Image();
        img.src = url;
      }
    }
  }, [pos, queue]);

  // The verdict already recorded for the event on screen (so revisiting via Back
  // shows what was chosen). Re-read on every `tick`.
  const currentVerdict = useMemo(() => {
    void tick;
    return current ? getQcResults()[current.name] : undefined;
  }, [tick, current]);

  // Live counts read from storage (re-read whenever `tick` changes).
  const counts = useMemo(() => {
    void tick;
    const results = getQcResults();
    const entries = Object.values(results);
    return {
      done: entries.length,
      failed: entries.filter((v) => v === 'fail').length,
      total: allEvents?.length ?? 0,
    };
  }, [tick, allEvents]);

  const judge = (verdict: 'pass' | 'fail') => {
    if (!current) return;
    setQcResult(current.name, verdict);
    setPos((p) => p + 1);
    setTick((t) => t + 1);
  };

  const goBack = () => setPos((p) => Math.max(0, p - 1));
  const goForward = () => setPos((p) => Math.min(queue.length, p + 1));

  const copyFailed = async () => {
    const results = getQcResults();
    const failed = Object.entries(results)
      .filter(([, v]) => v === 'fail')
      .map(([name]) => name);
    await copyToClipboard(failed.join('\n'));
    setCopied(failed.length);
    setTimeout(() => setCopied(null), 2000);
  };

  const progressLine = `${counts.done} / ${counts.total} QC'd · ${counts.failed} failed`;

  return (
    <div className="h-screen-safe overflow-y-auto bg-bg pb-safe">
      {/* Branded gradient backdrop (matches CardsPreview). */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 0%, var(--color-accent-secondary), transparent 55%), radial-gradient(120% 80% at 90% 20%, var(--color-accent), transparent 55%)',
        }}
      />

      <div className="mx-auto max-w-xl px-4 pt-safe">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
              aria-label="Back to app"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="font-display text-2xl font-bold text-text">Image QC</h1>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-xl border border-border bg-surface p-2 text-text transition-colors hover:bg-border active:scale-95"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>

        {/* Progress */}
        <p className="font-mono text-sm text-text/60">
          {allEvents ? progressLine : 'Loading events…'}
        </p>

        {/* Body */}
        {allEvents && current ? (
          <div className="mt-4">
            <div
              className={`rounded-2xl border bg-surface p-4 shadow-lg transition-colors ${
                currentVerdict === 'fail'
                  ? 'border-red-500 ring-2 ring-red-500/40'
                  : 'border-border'
              }`}
            >
              <div className="flex min-h-[40vh] items-center justify-center overflow-hidden rounded-xl bg-bg">
                {current.image_url && !imgError ? (
                  <img
                    src={getImageUrl(current.image_url, 'detail')}
                    alt={current.friendly_name}
                    onError={() => setImgError(true)}
                    className="max-h-[60vh] w-full rounded-xl object-contain"
                  />
                ) : (
                  <span className="font-mono text-sm text-text/50">no image</span>
                )}
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-text">
                    {current.friendly_name}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-text/60">
                    {current.year} · {current.name}
                  </p>
                </div>
                {currentVerdict === 'fail' && (
                  <span className="shrink-0 rounded-full bg-red-500 px-3 py-1 font-mono text-xs font-bold text-white">
                    FAILED
                  </span>
                )}
              </div>
            </div>

            {/* Verdict buttons (highlighted if this event already has that verdict) */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => judge('fail')}
                className={`flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-4 font-display text-lg font-bold text-white transition-transform active:scale-95 ${
                  currentVerdict === 'fail'
                    ? 'ring-4 ring-red-300 ring-offset-2 ring-offset-bg'
                    : ''
                }`}
              >
                <X className="h-6 w-6" /> Fail
              </button>
              <button
                onClick={() => judge('pass')}
                className={`flex items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-4 font-display text-lg font-bold text-white transition-transform active:scale-95 ${
                  currentVerdict === 'pass'
                    ? 'ring-4 ring-accent/40 ring-offset-2 ring-offset-bg'
                    : ''
                }`}
              >
                <Check className="h-6 w-6" /> Pass
              </button>
            </div>

            {/* Secondary controls */}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={goBack}
                  disabled={pos === 0}
                  className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={goForward}
                  disabled={pos >= queue.length}
                  className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95 disabled:opacity-40"
                >
                  Forward <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={copyFailed}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95"
              >
                <Clipboard className="h-4 w-4" />
                {copied !== null ? (
                  <span className="text-accent">Copied {copied} codes</span>
                ) : (
                  'Copy failed codes'
                )}
              </button>
            </div>
          </div>
        ) : allEvents ? (
          // Queue exhausted.
          <div className="mt-10 rounded-2xl border border-border bg-surface p-6 text-center shadow-lg">
            <h2 className="font-display text-xl font-bold text-text">All caught up 🎉</h2>
            <p className="mt-2 font-mono text-sm text-text/60">{progressLine}</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              {queue.length > 0 && (
                <button
                  onClick={goBack}
                  className="flex items-center gap-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                onClick={copyFailed}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-border active:scale-95"
              >
                <Clipboard className="h-4 w-4" />
                {copied !== null ? (
                  <span className="text-accent">Copied {copied} codes</span>
                ) : (
                  'Copy failed codes'
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImageQc;
