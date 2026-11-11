import React from 'react';

/**
 * The way forward on every end-of-game screen: one 52px accent button, full width, "Continue".
 * It replaced a muted "Tap to continue" line, a hint where the other exits are buttons.
 *
 * It stops its own click. Several of these screens are `tap-advance`, where a click anywhere
 * bubbles to the backdrop and advances; letting this click bubble too would advance twice and
 * skip a step.
 */
const ContinueButton: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className = '',
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`w-full h-[52px] rounded-xl bg-accent text-white font-body font-semibold text-base shadow-sm transition-transform active:scale-[0.98] ${className}`}
  >
    Continue
  </button>
);

export default ContinueButton;
