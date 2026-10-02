/**
 * Stage 3: an original music bed, synthesised sample by sample, so nothing needs licensing.
 *
 * 120 BPM in A minor. A ticking clock and a low drone under the hook, a riser into the
 * logo, then a driving four-on-the-floor groove (Am-F-C-G) under the gameplay, a breakdown
 * while a card's story is read, a snare roll into the timeline sweep, and a resolved chord
 * under the final shot. A thud lands on the miss; correct placements are left unscored.
 */

const fs = require('fs');

const SR = 48000;
const BPM = 120;
const BEAT = 60 / BPM;
const TAU = Math.PI * 2;

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// Deterministic noise, so the bed renders identically every run.
let noiseState = 0x9e3779b9;
function noise() {
  noiseState ^= noiseState << 13;
  noiseState ^= noiseState >>> 17;
  noiseState ^= noiseState << 5;
  return ((noiseState >>> 0) / 4294967296) * 2 - 1;
}

class Mix {
  constructor(duration) {
    this.n = Math.ceil(duration * SR);
    this.L = new Float32Array(this.n);
    this.R = new Float32Array(this.n);
    this.sendL = new Float32Array(this.n);
    this.sendR = new Float32Array(this.n);
  }

  /** Add a mono voice rendered by `fn(t, i)` from `start` for `len` seconds. */
  add(start, len, fn, { gain = 1, pan = 0, send = 0 } = {}) {
    const i0 = Math.max(0, Math.round(start * SR));
    const i1 = Math.min(this.n, Math.round((start + len) * SR));
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
    const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = i0; i < i1; i++) {
      const v = fn((i - i0) / SR, i);
      this.L[i] += v * gl;
      this.R[i] += v * gr;
      if (send) {
        this.sendL[i] += v * gl * send;
        this.sendR[i] += v * gr * send;
      }
    }
  }
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

// ---- Instruments --------------------------------------------------------------------------

function kick(mix, t, gain = 1) {
  mix.add(
    t,
    0.45,
    (x) => {
      const f = 45 + 110 * Math.exp(-x / 0.035);
      const ph = TAU * (45 * x + 110 * 0.035 * (1 - Math.exp(-x / 0.035)));
      return Math.sin(ph) * env(x, 0.002, 0.16) + (x < 0.004 ? noise() * 0.4 : 0) + 0 * f;
    },
    { gain: 0.9 * gain }
  );
}

function clap(mix, t, gain = 1) {
  let lp = 0;
  mix.add(
    t,
    0.3,
    (x) => {
      const n = noise();
      lp += 0.35 * (n - lp);
      const hp = n - lp;
      const bursts = x < 0.03 ? (Math.floor(x / 0.01) % 2 === 0 ? 1 : 0.4) : 1;
      return hp * env(x, 0.001, 0.07) * bursts;
    },
    { gain: 0.3 * gain, send: 0.35 }
  );
}

function hat(mix, t, gain = 1, open = false, pan = 0.25) {
  let prev = 0;
  mix.add(
    t,
    open ? 0.3 : 0.06,
    (x) => {
      const n = noise();
      const hp = n - prev;
      prev = n;
      return hp * env(x, 0.001, open ? 0.09 : 0.018);
    },
    { gain: 0.075 * gain, pan }
  );
}

function tick(mix, t, gain = 1, hi = false) {
  mix.add(
    t,
    0.05,
    (x) =>
      Math.sin(TAU * (hi ? 3200 : 2400) * x) * env(x, 0.0005, 0.008) +
      noise() * env(x, 0.0005, 0.003) * 0.3,
    { gain: 0.22 * gain, pan: hi ? 0.15 : -0.15, send: 0.2 }
  );
}

function bass(mix, t, note, len, gain = 1) {
  const f = midi(note);
  let lp = 0;
  mix.add(
    t,
    len + 0.05,
    (x) => {
      // Saw from a few harmonics, through a plucked lowpass.
      let s = 0;
      for (let h = 1; h <= 8; h++) s += Math.sin(TAU * f * h * x) / h;
      const cut = 0.04 + 0.25 * Math.exp(-x / 0.06);
      lp += cut * (s - lp);
      const rel = x > len ? Math.exp(-(x - len) / 0.015) : 1;
      return (lp * 0.8 + Math.sin(TAU * f * x) * 0.5) * Math.min(1, x / 0.004) * rel;
    },
    { gain: 0.32 * gain }
  );
}

function pluck(mix, t, note, gain = 1, pan = 0) {
  const f = midi(note);
  mix.add(
    t,
    0.6,
    (x) => {
      const e = env(x, 0.002, 0.12);
      return (
        (Math.sin(TAU * f * x + 0.8 * Math.sin(TAU * f * 2 * x) * e) * 0.8 +
          Math.sin(TAU * f * 2 * x) * 0.2) *
        e
      );
    },
    { gain: 0.13 * gain, pan, send: 0.45 }
  );
}

function pad(mix, t, notes, len, gain = 1) {
  for (const [j, n] of notes.entries()) {
    const f = midi(n);
    for (const det of [-0.11, 0.11]) {
      const ff = f * Math.pow(2, det / 12);
      mix.add(
        t,
        len,
        (x) => {
          const a = Math.min(1, x / 0.6) * Math.min(1, (len - x) / 0.5);
          return (
            (Math.sin(TAU * ff * x) +
              0.3 * Math.sin(TAU * ff * 2 * x) +
              0.12 * Math.sin(TAU * ff * 3 * x)) *
            a
          );
        },
        { gain: 0.045 * gain, pan: det < 0 ? -0.5 + j * 0.1 : 0.5 - j * 0.1, send: 0.5 }
      );
    }
  }
}

function thud(mix, t, gain = 1) {
  // A low detuned hit plus a sour minor-second buzz: the miss.
  mix.add(
    t,
    0.7,
    (x) => {
      const f = 55 + 60 * Math.exp(-x / 0.05);
      return Math.sin(TAU * f * x) * env(x, 0.002, 0.22) + noise() * env(x, 0.001, 0.03) * 0.5;
    },
    { gain: 1.0 * gain }
  );
  for (const n of [46, 47]) {
    const f = midi(n);
    let lp = 0;
    mix.add(
      t,
      0.6,
      (x) => {
        let s = 0;
        for (let h = 1; h <= 6; h++) s += Math.sin(TAU * f * h * x) / h;
        lp += 0.08 * (s - lp);
        return lp * env(x, 0.004, 0.18);
      },
      { gain: 0.25 * gain, pan: n === 46 ? -0.3 : 0.3 }
    );
  }
}

function impact(mix, t, gain = 1) {
  // Sub boom plus a long filtered-noise wash: the logo slam and the final hit.
  mix.add(
    t,
    2.5,
    (x) => {
      const ph = TAU * (38 * x + 80 * 0.08 * (1 - Math.exp(-x / 0.08)));
      return Math.sin(ph) * env(x, 0.003, 0.5);
    },
    { gain: 1.0 * gain }
  );
  let lp = 0;
  mix.add(
    t,
    2.5,
    (x) => {
      const n = noise();
      lp += (0.05 + 0.4 * Math.exp(-x / 0.3)) * (n - lp);
      return lp * env(x, 0.002, 0.6);
    },
    { gain: 0.55 * gain, send: 0.8 }
  );
}

function riser(mix, t, len, gain = 1) {
  let lp = 0;
  mix.add(
    t,
    len,
    (x) => {
      const p = x / len;
      const n = noise();
      lp += (0.01 + 0.5 * p * p) * (n - lp);
      const tone = Math.sin(TAU * (200 * x + 900 * x * p)) * 0.25;
      return (lp + tone * p) * p * p;
    },
    { gain: 0.5 * gain, send: 0.4 }
  );
}

function reverse(mix, t, len, gain = 1) {
  // A swelling reversed cymbal into a downbeat.
  let prev = 0;
  mix.add(
    t,
    len,
    (x) => {
      const n = noise();
      const hp = n - prev;
      prev = n * 0.6;
      return hp * Math.pow(x / len, 3);
    },
    { gain: 0.35 * gain, send: 0.5 }
  );
}

// ---- Reverb: four combs and two allpasses per side (Schroeder) ----------------------------

function reverb(input, sizes) {
  const out = new Float32Array(input.length);
  for (const d of sizes.combs) {
    const buf = new Float32Array(d);
    let idx = 0;
    let lp = 0;
    for (let i = 0; i < input.length; i++) {
      const y = buf[idx];
      lp = y * 0.7 + lp * 0.3;
      buf[idx] = input[i] + lp * 0.8;
      out[i] += y * 0.25;
      idx = (idx + 1) % d;
    }
  }
  for (const d of sizes.allpass) {
    const buf = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < out.length; i++) {
      const b = buf[idx];
      const y = -out[i] + b;
      buf[idx] = out[i] + b * 0.5;
      out[i] = y;
      idx = (idx + 1) % d;
    }
  }
  return out;
}

// ---- Arrangement --------------------------------------------------------------------------

// Am - F - C - G, a bar (two seconds) each: [bass root, pad voicing, arp notes]
const CHORDS = [
  [45, [57, 60, 64, 71], [69, 72, 76, 81]],
  [41, [57, 60, 65, 69], [65, 69, 72, 77]],
  [48, [55, 60, 64, 67], [67, 72, 76, 79]],
  [43, [55, 59, 62, 67], [67, 71, 74, 79]],
];

/**
 * `cue` describes the cut: { duration, logo, groove: [start, end], breakdown: [start, end],
 * build, sweepHit, end, correct: [t...], wrong: [t...] }. Times are seconds.
 */
function render(cue, outFile) {
  const mix = new Mix(cue.duration + 0.5);
  const bar = BEAT * 4;
  const chordAt = (t) => CHORDS[Math.floor(Math.max(0, t - cue.logo) / bar + 1e-6) % 4];

  // Hook: clock ticks and a drone, then a riser into the logo.
  for (let t = 0; t < cue.logo - 0.01; t += BEAT / 2)
    tick(mix, t, 0.8 + 0.4 * (t / cue.logo), Math.round(t / (BEAT / 2)) % 2 === 1);
  pad(mix, 0, [45, 52, 57], cue.logo + 0.4, 1.4);
  bass(mix, 0, 33, cue.logo - 0.1, 0.6);
  // A rising question in the arp: A, C, E, then the leading tone, climbing an octave.
  const motif = [57, 60, 64, 68, 69, 72, 76, 80];
  for (let t = 0, i = 0; t < cue.logo - 0.01; t += BEAT / 2, i++)
    pluck(
      mix,
      t,
      motif[i % 8] + (t > cue.logo / 2 ? 12 : 0),
      0.45 + 0.6 * (t / cue.logo),
      i % 2 ? 0.3 : -0.3
    );
  for (let t = 0; t < cue.logo - 0.01; t += BEAT) kick(mix, t, 0.35 + 0.25 * (t / cue.logo));
  riser(mix, cue.logo - 1.6, 1.6, 1);
  reverse(mix, cue.logo - 1.0, 1.0, 1);
  impact(mix, cue.logo, 1);
  pad(mix, cue.logo, CHORDS[0][1], 1.0, 1.2);

  // Groove, with a breakdown under the story.
  const [g0, g1] = cue.groove;
  const [b0, b1] = cue.breakdown;
  for (let t = g0; t < g1 - 0.01; t += BEAT / 4) {
    const inBreak = t >= b0 - 0.01 && t < b1 - 0.01;
    const step = Math.round((t - g0) / (BEAT / 4)) % 16;
    const [root, voicing, arp] = chordAt(t);
    if (step % 4 === 0 && !inBreak) kick(mix, t);
    if (step % 4 === 0 && inBreak && step === 0) kick(mix, t, 0.5);
    if ((step === 4 || step === 12) && !inBreak) clap(mix, t);
    if (step % 2 === 0 && !inBreak)
      hat(mix, t, step % 4 === 2 ? 1 : 0.55, step % 4 === 2 && step === 14);
    if (inBreak && step % 2 === 1) hat(mix, t, 0.25);
    if (step % 2 === 0)
      bass(mix, t, root + (step % 8 === 6 ? 12 : 0), BEAT / 2 - 0.03, inBreak ? 0.45 : 1);
    pluck(
      mix,
      t,
      arp[(step * 3) % 4] + (step % 8 >= 4 ? 0 : 0),
      inBreak ? 0.9 : 0.75,
      step % 2 ? 0.35 : -0.35
    );
    if (step === 0) pad(mix, t, voicing, bar + 0.1, inBreak ? 1.6 : 0.9);
  }
  // Snare roll and riser out of the breakdown into the sweep.
  for (let t = cue.build - bar; t < cue.build - 0.01; t += BEAT / 4) {
    const p = (t - (cue.build - bar)) / bar;
    clap(mix, t, 0.25 + 0.75 * p);
    if (p > 0.5) clap(mix, t + BEAT / 8, 0.5 * p);
  }
  riser(mix, cue.build - bar, bar, 0.8);
  impact(mix, cue.build, 0.55);
  if (cue.sweepHit) impact(mix, cue.sweepHit, 0.4);

  // Final shot: impact and a ringing resolved chord.
  reverse(mix, cue.end - 1, 1, 0.8);
  impact(mix, cue.end, 0.9);
  pad(mix, cue.end, [45, 57, 64, 71, 76], cue.duration - cue.end + 0.4, 2);
  bass(mix, cue.end, 33, cue.duration - cue.end - 0.2, 0.8);

  for (const t of cue.wrong) thud(mix, t);

  // Reverb, master fade and soft clip.
  const wetL = reverb(mix.sendL, {
    combs: [1557, 1617, 1491, 1422].map((d) => d * 2),
    allpass: [225, 556],
  });
  const wetR = reverb(mix.sendR, {
    combs: [1580, 1640, 1514, 1445].map((d) => d * 2),
    allpass: [248, 579],
  });
  const fadeOut = 1.4;
  let peak = 0;
  const L = new Float32Array(mix.n);
  const R = new Float32Array(mix.n);
  for (let i = 0; i < mix.n; i++) {
    const t = i / SR;
    const fade = clamp((cue.duration - t) / fadeOut, 0, 1) * clamp(t / 0.02, 0, 1);
    L[i] = (mix.L[i] + wetL[i] * 0.35) * fade;
    R[i] = (mix.R[i] + wetR[i] * 0.35) * fade;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const drive = 1.25 / (peak || 1);
  const out = Buffer.alloc(44 + mix.n * 4);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + mix.n * 4, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(2, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 4, 28);
  out.writeUInt16LE(4, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(mix.n * 4, 40);
  for (let i = 0; i < mix.n; i++) {
    out.writeInt16LE(Math.round(Math.tanh(L[i] * drive) * 0.89 * 32767), 44 + i * 4);
    out.writeInt16LE(Math.round(Math.tanh(R[i] * drive) * 0.89 * 32767), 46 + i * 4);
  }
  fs.writeFileSync(outFile, out);
  console.log(
    `  ✓ music: ${cue.duration.toFixed(1)}s, ${cue.wrong.length} thud`
  );
}

module.exports = { render, BEAT };
