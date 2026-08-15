/**
 * Overlay stacking registry. Literal class strings so Tailwind JIT sees them.
 *
 * Full stack (see docs/architecture-reference.md): timeline content z-10,
 * timeline fades z-30, hand zone z-40, in-page chrome (cycle button, confetti,
 * toasts) z-50. The modal layer shares z-50 with in-page chrome and wins by
 * DOM order — do not portal modals.
 */
export const Z_LAYERS = {
  /** Modals opened from the page. */
  modal: 'z-50',
  /** Menu.tsx drawer (documented here, not consumed by Modal). */
  menuBackdrop: 'z-[55]',
  menuDrawer: 'z-[56]',
  /** Modals that must sit above another modal or the menu drawer. */
  reveal: 'z-[60]',
} as const;
