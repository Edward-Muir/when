import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z_LAYERS } from './zLayers';

export type ModalSize = 'compact' | 'standard' | 'wide';
export type ModalDismissMode = 'backdrop' | 'tap-advance' | 'locked';
export type ModalBackdrop = 'standard' | 'celebration' | 'scrim';
export type ModalLayer = 'modal' | 'reveal';

export interface ModalProps {
  open: boolean;
  /** Called on user dismissal gesture (backdrop/ESC in 'backdrop' mode; any tap/ESC in
      'tap-advance'). Never called in 'locked' — the caller must provide its own way out. */
  onDismiss?: () => void;
  dismiss?: ModalDismissMode;
  size?: ModalSize;
  backdrop?: ModalBackdrop;
  layer?: ModalLayer;
  /** string → standard header block; ReactNode → raw node in the same bordered block. */
  header?: React.ReactNode;
  /** 'card': whole card scrolls. 'body': card becomes a max-height flex column and the
      content manages its own scroll region (e.g. Leaderboard's entries div). */
  scroll?: 'card' | 'body';
  maxHeightClass?: string;
  rounded?: 'lg' | '2xl';
  bordered?: boolean;
  /** Event-color passthrough (GamePopup getEventColorStyle). */
  cardStyle?: React.CSSProperties;
  /** Padding/layout additions only — shell classes are fixed. */
  cardClassName?: string;
  children: React.ReactNode;
}

// Semantic maps hold literal Tailwind strings so JIT sees them.
const SIZE_CLASSES: Record<ModalSize, string> = {
  compact: 'w-[85vw] max-w-[320px]',
  standard: 'w-[85vw] max-w-[340px] sm:max-w-[400px]',
  wide: 'w-[90vw] max-w-[400px]',
};

// standard: informational/content modals. celebration: reveal-chain celebrations +
// badge inspection. scrim: destructive confirms only.
const BACKDROP_CLASSES: Record<ModalBackdrop, string> = {
  standard: 'bg-black/25',
  celebration: 'bg-black/40',
  scrim: 'bg-black/50',
};

const LAYER_CLASSES: Record<ModalLayer, string> = {
  modal: Z_LAYERS.modal,
  reveal: Z_LAYERS.reveal,
};

const DEFAULT_MAX_HEIGHT: Record<'card' | 'body', string> = {
  card: 'max-h-[90vh]',
  body: 'max-h-[80vh]',
};

function buildCardClasses(args: {
  size: ModalSize;
  scroll?: 'card' | 'body';
  maxHeightClass?: string;
  rounded: 'lg' | '2xl';
  bordered: boolean;
  cardClassName?: string;
}): string {
  const { size, scroll, maxHeightClass, rounded, bordered, cardClassName } = args;
  // eslint-disable-next-line security/detect-object-injection -- union-typed key into const map
  const maxHeight = scroll ? (maxHeightClass ?? DEFAULT_MAX_HEIGHT[scroll]) : undefined;
  const scrollClasses =
    scroll === 'card'
      ? `${maxHeight} overflow-y-auto`
      : scroll === 'body'
        ? `${maxHeight} flex flex-col overflow-hidden`
        : 'overflow-hidden';

  return [
    // eslint-disable-next-line security/detect-object-injection -- union-typed key into const map
    SIZE_CLASSES[size],
    rounded === '2xl' ? 'rounded-2xl' : 'rounded-lg',
    bordered ? 'border border-border' : '',
    'bg-surface shadow-sm transition-colors',
    scrollClasses,
    cardClassName ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * The one popup shell: backdrop, centered card, enter/exit animation, ESC, and
 * dismissal semantics. Every fullscreen overlay except the Menu drawer renders
 * its content inside this.
 *
 * Contract: callers keep the component ALWAYS MOUNTED and drive `open` —
 * a conditional render (`{show && <Modal/>}`) silently loses the exit animation.
 * No portal: stacking relies on DOM order versus in-page z-50 chrome.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onDismiss,
  dismiss = 'backdrop',
  size = 'standard',
  backdrop = 'standard',
  layer = 'modal',
  header,
  scroll,
  maxHeightClass,
  rounded = 'lg',
  bordered = true,
  cardStyle,
  cardClassName,
  children,
}) => {
  // Backdrop and ESC are the same decision — gating one without the other is how a popup ends
  // up escapable by keyboard but not by tap.
  const dismissible = dismiss !== 'locked';

  useEffect(() => {
    if (!open || !dismissible || !onDismiss) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, dismissible, onDismiss]);

  const cardClasses = buildCardClasses({
    size,
    scroll,
    maxHeightClass,
    rounded,
    bordered,
    cardClassName,
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Backdrop and card carry test ids because they are unlabelled structural nodes —
          // there is no accessible query that reaches them (cf. `leaderboard-backdrop`).
          data-testid="modal-backdrop"
          // eslint-disable-next-line security/detect-object-injection -- union-typed keys into const maps
          className={`fixed inset-0 ${LAYER_CLASSES[layer]} flex items-center justify-center p-4 ${BACKDROP_CLASSES[backdrop]}`}
          onClick={dismissible ? onDismiss : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            data-testid="modal-card"
            className={cardClasses}
            style={cardStyle}
            onClick={dismiss === 'tap-advance' ? undefined : (e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {header !== undefined && header !== null && (
              <div className="px-4 py-3 border-b border-border shrink-0">
                {typeof header === 'string' ? (
                  <h2 className="text-lg font-display font-semibold text-text">{header}</h2>
                ) : (
                  header
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
