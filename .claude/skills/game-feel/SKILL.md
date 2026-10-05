---
name: game-feel
description: Best practices for adding "juice" and game feel to React/TypeScript web games. Use when implementing animations, feedback systems, sound effects, or improving user experience in games.
---

# Web Game Feel Best Practices

"Juice" is constant and bountiful user feedback. A juicy game element bounces, wiggles, and makes noise when you interact with it. It's every visual and auditory improvement that makes a game feel alive.

## In this project

The reference files below are general guidance. What already exists here:

- **No audio.** There is no sound code and no Howler dependency, so [audio.md](audio.md) describes
  something to build, not a system to extend.
- **Haptics:** `src/hooks/useHaptics.ts` (`haptics.light/medium/heavy/success/error/warning/impact/drop/select`,
  plus `vibrate(pattern)`). It calls `@capacitor/haptics` on the native apps and the Vibration API
  on the web. Use it rather than calling `navigator.vibrate` directly.
- **Screen shake:** `src/hooks/useScreenShake.ts` (`triggerShake('light' | 'medium' | 'heavy')`,
  skipped under reduced motion) applies the `animate-shake-{light,medium,heavy}` classes defined
  in `src/index.css`. The `animate-shake` and `animate-screen-shake` entries in
  `tailwind.config.js` are unused.
- **Placement drag is `@dnd-kit`, not Framer Motion drag:** `src/hooks/useDragAndDrop.ts` and the
  sensors in `src/utils/dndSensors.ts`. Framer Motion drives the animations, not the drag.
- **Placement animation tuning** (success ripple, miss flash/travel/wake) lives in
  `src/components/Timeline/animationTuning.ts`; the `/anim-jig` dev page tweaks it live.
- **Confetti** is `react-confetti-explosion`.

## Core Principles

1. **Prioritize frequent interactions** - Actions players perform most should feel most impactful
2. **Match the game's tone** - Fast-paced games need dynamic animations; story-driven games need subtlety
3. **Solid mechanics first** - Ensure core gameplay works before adding juice
4. **Don't over-juice** - Flashy effects can't compensate for poor controls

## Reference Files

| Topic               | File                                     | Use When                                    |
| ------------------- | ---------------------------------------- | ------------------------------------------- |
| **Animation**       | [animation.md](animation.md)             | Implementing easing, squash/stretch, timing |
| **Visual Feedback** | [visual-feedback.md](visual-feedback.md) | Adding screen shake, flashes, particles     |
| **Audio**           | [audio.md](audio.md)                     | Adding sound (the game has none), Howler.js |
| **Haptics**         | [haptics.md](haptics.md)                 | Adding mobile vibration feedback            |
| **Framer Motion**   | [framer-motion.md](framer-motion.md)     | React animation patterns, gestures, springs |
| **Mobile Design**   | [mobile-design.md](mobile-design.md)     | Touch targets, thumb zones, typography, nav |
| **Performance**     | [performance.md](performance.md)         | Optimizing animations, reducing re-renders  |
| **Accessibility**   | [accessibility.md](accessibility.md)     | Reduced motion, audio controls, a11y        |

## Quick Reference

### Feedback Priority (What to Juice First)

1. Primary player actions (most frequent interactions)
2. Success/failure states
3. State transitions
4. Secondary interactions
5. Ambient/environmental effects

### Timing Guidelines

| Interaction        | Duration  |
| ------------------ | --------- |
| Micro (hover, tap) | 100-150ms |
| Quick feedback     | 150-250ms |
| UI transitions     | 200-400ms |
| Page transitions   | 300-600ms |

### Multi-Sensory Feedback

For important interactions, combine:

- Visual feedback (animation, color, particles)
- Audio feedback (sound effect)
- Haptic feedback (vibration on mobile)

### GPU-Accelerated Properties

Always animate these (fast):

- `transform` (translate, scale, rotate)
- `opacity`

Avoid animating (slow):

- `width`, `height`, `top`, `left`, `margin`, `padding`
