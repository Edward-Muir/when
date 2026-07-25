# Soundscape Design (2026-07-24)

A minimalist, synthesis-only sonic identity for "When." The app currently ships **zero
audio**; this is a greenfield design. The aesthetic target is "felt, not heard" — the
calm, elegant mood of the loading screen. Audio maps onto the **existing** feedback
tiers (streak ≥2/≥4/≥6 in `src/utils/streakFeedback.ts`) and fires as **one coordinated
cue alongside the current haptics**, never as a second competing system.

Status: **palette APPROVED by ear (2026-07-25) — warm variant.** No game code wired yet;
implementation (`useSound`/`soundEngine` + wiring) happens in a follow-up session, seeded
with the locked values below.

### Approved values (locked)

```
scale:  A major pentatonic  [0, 2, 4, 7, 9]
root:   220 Hz  (A3)
attack: 5 ms       decay: 250 ms
master: 0.55       lowpass: 900 Hz     ← warm (default was ~2600)
ladder: climb 11 degrees, reset on miss
pickup: keep the whisper tick (not silenced)
default: sound ON
```

**Warm-variant intent.** The 900 Hz lowpass is the character choice — it rolls off the
octave partial and upper harmonics for a soft, mellow, "felt not heard" tone rather than a
bright glassy one. Consequence (intended): the highest voices sit at or above the cutoff
and therefore read *very* soft — the **pickup whisper** (~880 Hz) and the **tier-3 sparkle
grace** (2 octaves up) are nearly subliminal, which suits the restraint goal. If, once in
the app, the top-streak notes feel too dull, the single lever is the lowpass cutoff (raise
toward ~1200–1500 Hz); everything else stays as locked.

---

## Research summary — what makes subtle mobile game audio work

Reference points:

- **Alto's Odyssey / Adventure** — ambient chimes on a **pentatonic scale**; you can't
  hit a dissonant note, so continuous play stays musical. Sparse, reverbed, reactive.
- **Monument Valley** — every interaction is a soft, resolved **mallet/bell tone**; warm,
  low-density, on by default, respects the silent switch.
- **Two Dots / Threes!** — gentle **marimba/glass** hits with short envelopes on the
  *most frequent* action; pitch rises with a combo, turning a streak into a phrase.
- **Duolingo** — tiny distinct correct/incorrect motifs; "wrong" is soft and
  non-punishing (never a harsh buzz); completion earns a bigger, rarer flourish.
- **Tasteful iOS system sounds** — very short, normalized, "confirmations not
  announcements," and they respect the ring/silent switch.

Principles carried into this design:

1. **Felt, not heard** — low master gain, short envelopes (50–400 ms), no music/loops.
2. **One instrument** — a single timbre + one scale so every cue sounds related.
3. **Consonance by construction** — a pentatonic scale keeps rapid/stacked play musical.
4. **Reinforce, don't replace** — audio always rides on top of the existing visual +
   haptic feedback; the game is fully playable muted (accessibility).
5. **Reward escalation musically** — pitch/voicing climbs with the streak, resolves on a miss.
6. **Restraint is design** — the most frequent, lowest-stakes actions stay silent.
7. **Respect the room** — mute toggle, silent-switch respect, never autoplay.

---

## Palette (one instrument)

- **Timbre:** soft struck-mallet / music-box voice — a **sine fundamental + one quiet
  octave partial** (partial gain ≈ 0.3× fundamental) through a **lowpass at 900 Hz**
  (approved warm setting) that rolls off the partial and upper harmonics for a mellow,
  muffled tone. No saw/square anywhere. Warm and calm — deliberately not glassy.
- **Scale / key:** **A major pentatonic** (A B C♯ E F♯). Pentatonic = every cue is
  consonant with every other, so hot streaks and rapid placements never clash.

  | Degree | A3  | B3  | C♯4 | E4  | F♯4 | A4  | B4  | C♯5 | E5  | F♯5 | A5  |
  | ------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | Hz     | 220 | 247 | 277 | 330 | 370 | 440 | 494 | 554 | 659 | 740 | 880 |

  Fundamentals sit in the 220–880 Hz band that small phone speakers actually reproduce;
  the octave partial keeps the low notes audible on tinny speakers.
- **Signal path:** `osc(+partial) → gain(envelope) → lowpass → masterGain →
  DynamicsCompressor(soft limiter) → destination`.
- **Base envelope:** fast attack (~4–6 ms), exponential decay; decay length varies per
  cue (table below).

### Rising-streak mapping (the musical core)

A correct placement plays a note whose pitch **climbs one pentatonic degree per
consecutive correct placement** and **resets to the root on a miss**:

```
noteIndex = clamp(currentStreak - 1, 0, LADDER_MAX)   // streak 1 → A3, 2 → B3, 3 → C♯4 …
```

capped near A5 so it never climbs into piercing territory (hold / gently sparkle at the
top rather than going higher). A 6-in-a-row run plays an ascending pentatonic phrase; a
miss drops the thud and returns the next correct note to the root.

The **tier-ups at ≥2 / ≥4 / ≥6 are not separate cues** — they are an *enrichment layer
on the same settle note*, keyed off `getStreakFeedback(streak).tier`:

| Tier | Streak | Added voicing on the settle note |
| ---- | ------ | -------------------------------- |
| 1    | 2–3    | faint added fifth                |
| 2    | 4–5    | soft added octave "shimmer"      |
| 3    | 6+     | octave shimmer + brief top-octave sparkle grace note |

This reuses the existing tier boundaries exactly — audio escalates in lockstep with the
confetti / glow / ripple / haptic escalation already in `streakFeedback.ts`.

---

## Per-event spec

| Event (trigger) | Character | Pitch / motif | Attack→Decay | Rel. gain | Haptic pairing (existing) | Silent? |
| --- | --- | --- | --- | --- | --- | --- |
| **Card pickup** — drag start (`useDragAndDrop.onDragStart`) | whisper "lift" tick | soft ~880 Hz blip | 6→70 ms | 0.05 | `haptics.light()` | No — *first to cut* if it grates |
| **Correct placement settle** — `lastPlacementResult.success` | warm mallet ding | pentatonic note, **rises with streak** | 5→250 ms | 0.35 | `vibrate(streak pattern)` | No |
| **Streak tier-up** — streak crosses 2/4/6 | shimmer enrichment on the settle note | added 5th / octave / octave+sparkle | rides settle | +0.10 layer | (existing tier haptic) | No — layered, not separate |
| **Wrong placement / tombstone thud** — `!success` (single-player miss) | **soft heavy thunk, given weight** | downward bend ~150→80 Hz + lowpassed noise body | 4→400 ms | 0.5 (heaviest) | `haptics.error()` + `triggerShake` | No |
| **Life lost** | *folded into the thud* | — | — | — | — | **Yes** — no lives HUD exists; the miss *is* the loss. A run-ending miss flows into Game Over below |
| **Game over — strong run** (≥5 events / high `bestStreak`) | warm resolving cadence | 2–3 note ascending resolve to tonic (A) | ~600 ms tail | 0.4 | success notification | No |
| **Game over — weak run** (<5 events) | gentle low fall | 2-note descending, minor-tinged, *not* punishing | ~500 ms | 0.3 | warning notification | No |
| **Game over — legendary** (≥12, ties `getEncouragingMessage`) | fuller flourish | 3–4 note rising pentatonic | ~700 ms | 0.45 | success | No |
| **New personal best / #1 leaderboard** — `gameMilestones` PB / rank 1 | brightest, rarest cue | 3–4 note ascending pentatonic **arpeggio + shimmer** | ~800 ms | 0.5 | success | No — reserved, allowed to be "heard" |
| Plain button taps · mode-select · cycle-hand · countdown/start transition · popup open/close · description view · backdrop dismiss | — | — | — | — | (haptics only where they already exist) | **Yes — silent by design** |

Game-over tier thresholds reuse `getEncouragingMessage` in `GamePopup.tsx` (3/5/8/12) so
the sound and the on-screen title always agree.

---

## Anti-noise rules

- **Debounce:** ignore a duplicate cue within ~50 ms of the same type.
- **Voice cap:** max ~4 concurrent voices; a new voice steals the oldest.
- **Ducking:** heavy cues (thud, game over, PB) briefly attenuate the whisper-tier cues.
- **Natural throttle:** input is locked during the placement animation (`isAnimating`),
  so correct-placement notes physically cannot stack faster than the animation; short
  (~250 ms) rising notes stay melodic, not muddy.
- **Master soft-limiter:** a `DynamicsCompressor` on the master bus prevents clipping
  when settle + shimmer + partial sum.

---

## Mute, default & platform

- **Default: sound ON.** Cues are **gesture-triggered SFX, not autoplay music** (satisfies
  "never autoplay"); they're subtle by design; on native iOS the silent switch keeps a
  muted phone quiet anyway; and the mute toggle is discoverable in the menu. Conservative
  alternative (default OFF) is a one-line change if preferred after audition.
- **Persistence:** localStorage key `when-sound-muted`, mirroring `useTheme`'s
  `when-theme` pattern. Independent of `prefers-reduced-motion` (a reduced-motion user may
  still want audio).
- **iOS AudioContext unlock:** create the context lazily and call `ctx.resume()` inside
  the **first real user gesture** (mode-select tap / first `pointerdown` / drag start) —
  reuse an existing gesture rather than adding a prompt.
- **Silent switch (respect it):** on **native iOS (Capacitor)** set the `AVAudioSession`
  category to **Ambient** (respects the ring/silent switch and mixes with other audio)
  rather than Playback. On mobile web the silent switch isn't readable, so web may play
  through; low gain + the mute toggle cover that case.

---

## Prototype (approval gate)

A self-contained Web-Audio Artifact synthesizes every cue: a button per sound, a **streak
simulator** ("Place Correct ✓" climbs + plays the rising note; "Miss ✗" thuds + resets),
and live tuning sliders (base frequency, attack, decay, master gain, lowpass cutoff,
ladder cap) so the palette can be dialed in on a phone and the final values read back.
Palette is approved by ear here **before** any game code is written.

---

## Implementation plan (Gate 2 — not yet built)

### New files
- `src/utils/soundEngine.ts` — framework-free singleton owning the lazy `AudioContext`,
  master gain and compressor; exposes `unlock()`, `setMuted()`, and pure synth functions
  (`playPickup`, `playCorrect(streak)`, `playMiss`, `playGameOver(score, bestStreak)`,
  `playPersonalBest`). All synthesis, **no audio files**. Holds the approved scale array +
  envelopes and implements debounce / voice-cap / ducking.
- `src/hooks/useSound.ts` — thin wrapper mirroring `useHaptics`; reads/persists
  `when-sound-muted` (localStorage, `useTheme` pattern); returns `{ isMuted, toggleMute,
  sounds }`; no-ops when muted.

### Wiring points (reuse the existing coordinated-cue sites)
- **Pickup + unlock:** `src/hooks/useDragAndDrop.ts` `onDragStart` (already fires
  `haptics.light()`).
- **Correct / miss:** `src/components/Game.tsx` placement effect (keyed on
  `state.lastPlacementResult`, with `state.currentStreak` in scope — the same effect that
  already fires `vibrate(...)`, `haptics.error()`, confetti, shake, vignette). Add
  `sounds.correct(state.currentStreak)` / `sounds.miss()`.
- **Game over:** `Game.tsx` game-over effect (where `showGameOverPopup` fires) →
  `sounds.gameOver(correctCount, bestStreak)`.
- **Personal best / #1:** watch `gameMilestones` / `newlyUnlockedAchievements` from
  `useGameStatsRecorder` and/or a rank-1 `LeaderboardSubmit` → `sounds.personalBest()`.
- **Mute toggle UI:** `src/components/Menu.tsx`, a row beside the theme toggle using
  `Volume2` / `VolumeX` (lucide). The Menu drawer — not a separate "SettingsPopup" — is
  this codebase's toggle home.
- **Native silent switch:** `AVAudioSession` → Ambient category (Capacitor config).

### Verification
- `npm run typecheck` / `npm run lint` / `npm test` (add a unit test for mute-persistence
  + ladder mapping, following `eventNameLength.test.ts` style).
- Playwright per `docs/driving-the-app-with-playwright.md`: hot streak climbs, miss thuds +
  resets, game-over differentiates, Menu mute silences + persists across reload.
- Real iOS device: unlock on first tap; silent switch mutes SFX in the native app.
