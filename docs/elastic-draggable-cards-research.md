# Research: Elastic, centered draggable cards for the timeline

> **Deliverable type:** Research / options document. No implementation plan, no code changes — captured so the implementation direction can be chosen later.
> **Direction assumed:** Polish the _current_ interaction model · _Subtle & refined_ feel · open to adding `@use-gesture` + `react-spring`.

---

## Context

Today the game works like this: a card sits in a bottom "hand" deck, you drag it up with `@dnd-kit` onto a vertically-scrolling timeline (`src/components/Timeline/Timeline.tsx`), a translucent **ghost card** previews the insertion slot, and on drop the insertion index is computed by comparing pointer-Y against the on-screen year-label positions (`src/hooks/useDragAndDrop.ts:53-108`). `framer-motion` already powers a spring bounce on landing, a ripple "wave" through neighbouring cards, and a year-number pop (`src/components/Timeline/TimelineEvent.tsx`). Haptics fire on grab / boundary-cross / drop.

The goal is to make it _feel_ more physical and tactile:

1. **The first card of any game should sit in the middle of the screen**, and be **draggable in an elastic way**.
2. **New cards slot in above or below that central card**, also with a **nice elastic feel**.

This document gives the precise **vocabulary** to specify that feel, and a fair **comparison of the implementation paths**.

---

## The vocabulary to specify the feel

Use these terms to describe exactly what you want; each maps to a concrete prop/parameter.

| Term                                              | What it is                                                                                                            | Knob that controls it                                                                                                                 |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Rubber-banding / elastic overscroll**           | Resistance when you drag _past_ a boundary, then a spring-back. The iOS scroll-edge effect.                           | Motion: `dragElastic` (0–1). use-gesture: `rubberband` (coefficient, default `0.15`) + `bounds`.                                      |
| **Spring physics**                                | Motion driven by a simulated spring instead of a fixed-duration easing curve.                                         | Motion: `transition={{ type:'spring', stiffness, damping, mass }}`. react-spring: `config={{ tension, friction, mass }}`.             |
| **Damping ratio / response** ("designer" springs) | Apple's friendlier two-knob model: _response_ = how fast, _damping_ = how bouncy (0 = very bouncy, 1 = no overshoot). | Conceptual — both libs let you approximate it; react-spring exposes it more directly than Motion.                                     |
| **Inertia / momentum / fling**                    | Release velocity carries the element, decelerating naturally.                                                         | Motion: `dragMomentum`, `dragTransition` (`power`, `timeConstant`). use-gesture: velocity is in the gesture state, fed to the spring. |
| **Snap points / snap-to**                         | The element settles to _discrete_ slots, not anywhere.                                                                | Motion: `dragSnapToOrigin`, custom `modifyTarget`. use-gesture: snap logic in `onDragEnd`.                                            |
| **Layout animation (FLIP)**                       | Neighbours smoothly slide to make room when an item is inserted/removed.                                              | Motion: the `layout` prop + `LayoutGroup` / `AnimatePresence`.                                                                        |
| **Lift / pickup affordance**                      | Card grows + casts a shadow the instant it's grabbed ("picked up off the table").                                     | Motion: `whileDrag={{ scale, boxShadow }}`. A static version already exists via `.dragging-card` CSS.                                 |
| **Overshoot / settle / wobble**                   | Underdamped spring overshoots the target then settles. Low damping = playful, high = calm.                            | `damping` (Motion) / `friction` (react-spring).                                                                                       |

**"Subtle & refined" in numbers:**

- Motion spring: `stiffness ≈ 300–400`, `damping ≈ 30–40`, `mass: 1` → quick settle, almost no wobble. (The existing `springBounce` is `400/25` — slightly bouncier; nudge damping up for "refined".)
- Motion `dragElastic ≈ 0.1–0.15` → a small, premium "tug" at the edges.
- react-spring: between `config.stiff` (`tension 210 / friction 20`) and `config.default` (`170 / 26`); avoid `wobbly` (`180/12`) which is the bouncy end.
- use-gesture `rubberband: 0.15` (the default) is already the iOS-like value.

---

## How each desired behaviour maps to a technique

### 1. First card centered in the viewport

A focal-card layout problem, not a physics one.

- **Padding/spacer approach:** give the scroll container top/bottom padding equal to `~50vh` (or a centering flex) so the single anchor card rests at vertical center, then `scrollIntoView({block:'center'})`. This generalises the existing centering effect at `Timeline.tsx:104-117` (which currently centers total content height, not a specific card).
- Keep the year column + axis aligned as today; only the resting scroll offset changes.

### 2. The central card draggable in an elastic way

"Draggable" here most naturally means **the timeline surface pans** with elastic resistance at the ends (placed cards stay fixed in chronological order — this is _not_ free-reordering). Two ways to get the rubber-band:

- **Motion:** wrap the scroll content in a `motion.div drag="y"` with `dragConstraints` = the content bounds and `dragElastic={0.12}`. Past the ends it tugs and springs back.
- **use-gesture + react-spring:** `useDrag` with `bounds` + `rubberband: 0.15`, driving a `useSpring` `y`. This gives the _release velocity_ for a true momentum fling into the rubber-band, which Motion's drag doesn't expose as cleanly.

### 3. Cards slotting in above/below, elastically

The **layout/insertion** animation — the most satisfying part to get right.

- **Motion `layout`:** mark each `TimelineEvent` with `layout` and wrap the list in `AnimatePresence`. When a card is inserted, every neighbour springs to its new position automatically (FLIP). Tune with `transition={{ type:'spring', stiffness:350, damping:35 }}`. This would **replace or augment the hand-built ripple wave** in `TimelineEvent.tsx:157-206` with a physics-driven equivalent — likely simpler and more robust.
- The new card itself animates in from the drag-release point with the same spring + a small `scale` overshoot for the "drop" feel.

---

## The two implementation paths, compared

### Path A — Stay on `@dnd-kit` + `framer-motion` (no new deps)

Use dnd-kit exactly as today for pick-and-place; add Motion `layout` animations for the make-room shuffle, `whileDrag` for the lift, and a Motion `drag="y"` + `dragElastic` wrapper for elastic panning/centering.

- **Pros:** zero new dependencies; smallest bundle; both libs already in use; lowest risk; Capacitor/iOS-friendly; `layout` animations are excellent out of the box.
- **Cons:** Motion's drag layer doesn't expose release-velocity or true rubber-band math as richly — the elastic _pan_ is good but not as physically precise; mixing dnd-kit's transform with a Motion `drag` wrapper on the same subtree needs care (keep them on separate elements).
- **Touch points:** `Timeline.tsx` (centering + `layout`/`AnimatePresence` on the list), `TimelineEvent.tsx` (add `layout`, retire/simplify ripple), `DraggableCard.tsx`/CSS (`whileDrag` lift).

### Path B — Add `@use-gesture/react` + `@react-spring/web` for the gesture layer

Keep dnd-kit for the _drop-target/insertion_ logic, but drive the **elastic pan and the card's drag motion** with use-gesture (`rubberband`, `bounds`, velocity) + react-spring (`tension`/`friction`). This is the toolkit pmndrs designed for this: _"useDrag hands gesture data to react-spring which sets the transforms."_

- **Pros:** the most physically accurate rubber-band and velocity-driven momentum; `rubberband` is purpose-built and its `0.15` default is already the iOS feel; per-axis elasticity; the gold standard for "satisfying" draggable demos.
- **Cons:** two new dependencies (modest size) and a new mental model; some overlap with dnd-kit and framer-motion (three animation/gesture systems in one app); you'd want clear ownership — e.g. use-gesture owns _panning/dragging_, framer-motion owns _layout/insertion_, dnd-kit owns _hit-testing/placement_. Risk of complexity if responsibilities blur.
- **Touch points:** a new gesture wrapper around the timeline scroll surface; `useDragAndDrop.ts` could stay for insertion-index math, or migrate to use-gesture's `onDragEnd`.

### Where Framer `Reorder` does **not** fit

`Reorder.Group`/`Reorder.Item` is built for **free** reordering — but the timeline must enforce _chronological_ order and validate placement. It would fight the game rules, so it's not recommended here. (Its underlying `layout` animation tech, used standalone, is exactly what Path A leverages.)

---

## Recommendation

Given **"polish the current model"** + **"subtle & refined"**, the highest value-for-risk is:

1. **Adopt `framer-motion` `layout` + `AnimatePresence`** for behaviours #1 (centering) and #3 (insertion shuffle). This alone delivers most of the "nice elastic" payoff and lets you retire hand-tuned ripple code.
2. **For behaviour #2 (elastic pan), prototype both:** start with Motion `drag="y"` + `dragElastic={0.12}` (free, fast). _If_ the edge feel isn't physical enough, **then** introduce `@use-gesture` + `react-spring` solely for the pan surface — it's the one place those libs clearly outclass Motion (velocity + `rubberband`).
3. Lock the "subtle" feel with the numeric targets above (`stiffness ~350 / damping ~35`, `dragElastic ~0.12`, `rubberband 0.15`).

This keeps dnd-kit's reliable placement logic, gets the elastic/spring feel mostly "for free" from a lib already shipped, and reserves the heavier toolkit for the single sub-problem where it earns its weight.

---

## Open questions for implementation

- Does "draggable central card" mean **panning the whole timeline**, or literally **dragging the focal card itself** out of place? (This doc assumes panning, since placed cards are order-locked.)
- Should momentum/fling be enabled on the pan, or is a tight, non-inertial drag preferred for a puzzle game?
- Keep the bottom-deck source for new cards, or have them emerge from the centered card?

## References

- Motion — Drag: https://motion.dev/docs/react-drag
- Motion — Reorder: https://motion.dev/docs/react-reorder
- Motion — Transitions (spring params): https://www.framer.com/motion/transition/
- @use-gesture — options (`rubberband`, `bounds`): https://use-gesture.netlify.app/docs/options/
- @use-gesture + react-spring integration thread: https://github.com/pmndrs/use-gesture/issues/109
- dnd-kit: https://dndkit.com/
- iOS "Building Fluid Interfaces" (spring/velocity design): https://medium.com/@nathangitter/building-fluid-interfaces-ios-swift-9732bb934bf5
- Elastic/rubber-band scrolling background: https://css-tricks.com/elastic-overflow-scrolling/
