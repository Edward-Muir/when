// Synthesis-only soundscape for "When" — no audio files, every cue is Web Audio.
// Ported verbatim from the approved warm-variant prototype
// (docs/gameplay-feel/soundscape-demo.html; palette approved by ear 2026-07-25).
// Design + locked values: docs/gameplay-feel/soundscape-design.md.
//
// The aesthetic is "felt, not heard": one struck-mallet instrument on an
// A-major-pentatonic scale, low master gain, short envelopes, rolled off by a
// warm 900 Hz lowpass. Audio always rides on top of the existing visual + haptic
// feedback (see streakFeedback.ts / useHaptics.ts); the game is fully playable muted.

/** Locked palette — approved warm variant. */
export const SOUND_PARAMS = {
  baseFreq: 220, // A3 root
  attack: 5, // ms
  decay: 250, // ms
  masterGain: 0.55,
  // Warm: rolls off the octave partial + upper harmonics for a mellow tone.
  // Escape lever (per design doc): raise toward ~1200–1500 Hz if top-streak notes
  // feel too dull once in the app. Nothing else changes.
  lowpass: 900,
  ladderCap: 11, // climb 11 pentatonic degrees, then hold at the top
} as const;

// A major pentatonic — semitone offsets within an octave (A B C# E F#).
const PENTA = [0, 2, 4, 7, 9];

/**
 * Read a numeric array at a controlled, in-range index. Centralizes the one
 * `security/detect-object-injection` exception so the rest of the file stays clean.
 */
function at(arr: readonly number[], i: number): number {
  // eslint-disable-next-line security/detect-object-injection
  return arr[i] ?? 0;
}

/** Pentatonic degree index -> frequency in Hz, climbing through octaves. */
export function scaleFreqs(root: number, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const oct = Math.floor(i / PENTA.length);
    const deg = at(PENTA, i % PENTA.length);
    out.push(root * Math.pow(2, (oct * 12 + deg) / 12));
  }
  return out;
}

/** Streak -> feedback tier. Mirrors getStreakFeedback in streakFeedback.ts exactly. */
export function tierOf(streak: number): 0 | 1 | 2 | 3 {
  if (streak >= 6) return 3;
  if (streak >= 4) return 2;
  if (streak >= 2) return 1;
  return 0;
}

/** Ladder note index for a streak (streak 1 -> root), saturating at the cap. */
export function ladderIndex(streak: number, cap: number = SOUND_PARAMS.ladderCap): number {
  return Math.min(Math.max(streak - 1, 0), cap - 1);
}

export type GameOverKind = 'weak' | 'strong' | 'legendary';

/**
 * Game-over score -> cadence kind. Aligned with getEncouragingMessage's thresholds
 * in GamePopup.tsx (weak <5, legendary >=12) so the sound and on-screen title agree.
 */
export function gameOverKind(correctCount: number): GameOverKind {
  if (correctCount >= 12) return 'legendary';
  if (correctCount < 5) return 'weak';
  return 'strong';
}

// ---- Audio graph (lazy, module-scoped singleton) ----

type AudioCtxCtor = typeof AudioContext;

function getAudioContextCtor(): AudioCtxCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioCtxCtor;
    webkitAudioContext?: AudioCtxCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let comp: DynamicsCompressorNode | null = null;
let muted = false;

const P = SOUND_PARAMS;

/** Monotonic-ish ms clock for debounce / ducking bookkeeping. */
function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function ensureCtx(): boolean {
  if (ctx) return true;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return false;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : P.masterGain;
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 24;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    master.connect(comp);
    comp.connect(ctx.destination);
    return true;
  } catch {
    ctx = null;
    master = null;
    comp = null;
    return false;
  }
}

// ---- Anti-noise: debounce + soft voice cap + whisper ducking ----

const lastFired: Record<string, number> = {};

/** Suppress a duplicate cue of the same type within `ms`. */
function debounced(type: string, ms: number): boolean {
  const t = nowMs();
  // eslint-disable-next-line security/detect-object-injection
  const prev = lastFired[type];
  if (prev !== undefined && t - prev < ms) return true;
  // eslint-disable-next-line security/detect-object-injection
  lastFired[type] = t;
  return false;
}

interface ActiveVoice {
  oscs: OscillatorNode[];
  stopAt: number; // AudioContext time
}
// Soft cap mirroring the prototype: we track recent voices and let the master
// compressor guard the level, rather than hard-stopping scheduled notes (which
// would cut the multi-note game-over / personal-best arpeggios mid-flight).
let activeVoices: ActiveVoice[] = [];

// Heavy cues (miss / game over / personal best) briefly attenuate the whisper-tier
// pickup cue so it never pokes through them. Tracked as a timestamp, not a gain
// automation on master, to avoid artifacts on scheduled arpeggios.
let duckWhisperUntil = 0;
function duckWhisper(ms: number): void {
  duckWhisperUntil = nowMs() + ms;
}

interface VoiceOpts {
  attack?: number; // ms
  decay?: number; // ms
  gain?: number;
  partial?: number; // octave-partial gain, x fundamental
  type?: OscillatorType;
  when?: number; // seconds offset from now
  glideTo?: number; // exponential pitch glide target (Hz)
  glideTime?: number; // seconds
}

/** A single mallet voice: sine fundamental + quiet octave partial -> lowpass -> master. */
function voice(freq: number, opt: VoiceOpts = {}): void {
  if (!ctx || !master) return;
  const attack = (opt.attack ?? P.attack) / 1000;
  const decay = (opt.decay ?? P.decay) / 1000;
  const gain = opt.gain ?? 0.35;
  const partial = opt.partial ?? 0.3;
  const type: OscillatorType = opt.type ?? 'sine';
  const t0 = ctx.currentTime + (opt.when ?? 0);
  const glideTime = opt.glideTime ?? 0.15;

  const env = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = P.lowpass;
  env.connect(lp);
  lp.connect(master);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (opt.glideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opt.glideTo), t0 + glideTime);
  }
  osc.connect(env);

  const oscs: OscillatorNode[] = [osc];
  if (partial > 0) {
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t0);
    if (opt.glideTo) {
      osc2.frequency.exponentialRampToValueAtTime(Math.max(20, opt.glideTo * 2), t0 + glideTime);
    }
    const pg = ctx.createGain();
    pg.gain.value = partial;
    osc2.connect(pg);
    pg.connect(env);
    oscs.push(osc2);
  }

  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

  const stopAt = t0 + attack + decay + 0.05;
  oscs.forEach((o) => {
    o.start(t0);
    o.stop(stopAt);
  });

  activeVoices.push({ oscs, stopAt });
  activeVoices = activeVoices.filter((v) => v.stopAt > ctx!.currentTime);
  if (activeVoices.length > 8) activeVoices.shift();
}

/** Lowpassed white-noise burst — the "body" under the miss thud. */
function noiseBody(gain: number, dur: number, cutoff: number): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    // eslint-disable-next-line security/detect-object-injection
    d[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = cutoff;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(lp);
  lp.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

// ---- Public cues ----

function unlock(): void {
  if (!ensureCtx() || !ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
}

function setMuted(next: boolean): void {
  muted = next;
  if (master && ctx) {
    // Ramp so an in-flight tail doesn't click when muting mid-note.
    master.gain.setTargetAtTime(next ? 0 : P.masterGain, ctx.currentTime, 0.02);
  }
}

function isMuted(): boolean {
  return muted;
}

function playPickup(): void {
  if (muted || debounced('pickup', 60)) return;
  if (!ensureCtx()) return;
  const gain = nowMs() < duckWhisperUntil ? 0.02 : 0.05;
  voice(P.baseFreq * 4, { gain, attack: 6, decay: 70, partial: 0.15 });
}

/** Correct placement: pentatonic note that climbs one degree per consecutive hit. */
function playCorrect(streak: number): void {
  if (muted || debounced('correct', 45)) return;
  if (!ensureCtx()) return;
  const scale = scaleFreqs(P.baseFreq, 28);
  const f = at(scale, ladderIndex(streak, P.ladderCap));
  const tier = tierOf(streak);
  voice(f, { gain: 0.35 });
  if (tier === 1) voice(f * Math.pow(2, 7 / 12), { gain: 0.1, decay: P.decay * 0.9 }); // + fifth
  if (tier >= 2) voice(f * 2, { gain: 0.12, decay: P.decay * 1.15, partial: 0.2 }); // octave shimmer
  if (tier >= 3) voice(f * 4, { gain: 0.06, attack: 4, decay: 170, when: 0.06, partial: 0 }); // sparkle
}

function playMiss(): void {
  if (muted || debounced('miss', 60)) return;
  if (!ensureCtx()) return;
  duckWhisper(250);
  voice(P.baseFreq * 0.68, {
    gain: 0.5,
    attack: 4,
    decay: 400,
    partial: 0.15,
    type: 'triangle',
    glideTo: P.baseFreq * 0.36,
    glideTime: 0.18,
  });
  noiseBody(0.16, 0.22, 300);
}

function playGameOver(correctCount: number): void {
  if (muted || debounced('gameOver', 100)) return;
  if (!ensureCtx()) return;
  duckWhisper(400);
  const s = scaleFreqs(P.baseFreq, 14);
  const play = (degrees: number[], each: (k: number) => VoiceOpts) =>
    degrees.forEach((deg, k) => voice(at(s, deg), each(k)));
  const kind = gameOverKind(correctCount);
  if (kind === 'legendary') {
    play([0, 2, 4, 5, 7], (k) => ({ when: k * 0.11, gain: 0.45, decay: k === 4 ? 700 : 320 }));
  } else if (kind === 'strong') {
    play([0, 2, 4, 5], (k) => ({ when: k * 0.13, gain: 0.4, decay: k === 3 ? 600 : 300 }));
  } else {
    // weak — gentle low fall, never punishing
    play([3, 1, 0], (k) => ({ when: k * 0.16, gain: 0.3, decay: 500, partial: 0.35 }));
  }
}

/** Brightest, rarest cue — reserved for a personal best / #1 leaderboard rank. */
function playPersonalBest(): void {
  if (muted || debounced('personalBest', 100)) return;
  if (!ensureCtx()) return;
  duckWhisper(500);
  const s = scaleFreqs(P.baseFreq, 18);
  [5, 7, 9, 10].forEach((deg, k) => {
    voice(at(s, deg), { when: k * 0.09, gain: 0.5 });
    voice(at(s, deg) * 2, { when: k * 0.09 + 0.02, gain: 0.12, partial: 0, decay: 300 });
  });
  voice(at(s, 12) * 2, { when: 0.42, gain: 0.08, decay: 320, partial: 0 }); // top sparkle
}

export interface SoundEngine {
  unlock(): void;
  setMuted(next: boolean): void;
  isMuted(): boolean;
  playPickup(): void;
  playCorrect(streak: number): void;
  playMiss(): void;
  playGameOver(correctCount: number): void;
  playPersonalBest(): void;
}

export const soundEngine: SoundEngine = {
  unlock,
  setMuted,
  isMuted,
  playPickup,
  playCorrect,
  playMiss,
  playGameOver,
  playPersonalBest,
};
