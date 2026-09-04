import React from 'react';
import { ArrowDown, Check, RefreshCw, X } from 'lucide-react';
import Modal from './ui/Modal';
import { markHintSeen } from '../utils/playerStorage';

const textClass = 'text-sm text-text font-body leading-relaxed';

/**
 * The rules, in prose. Both game modes share one rule-set, so this is not mode-specific.
 * "Build the longest timeline!" is quoted verbatim by the share copy (`utils/share.ts`) and
 * by docs/sharing-challenges; keep the line if you reword the rest.
 */
export const GameRules: React.FC = () => (
  <div className="text-left space-y-3">
    <p className={textClass}>
      You hold a hand of cards. Each is a historical event with its date hidden.
    </p>
    <p className={textClass}>Drag a card onto the timeline where you think it happened.</p>
    <p className={textClass}>
      Right, and it stays there and you draw a new card. Wrong, and it moves to where it really
      belongs as a grey marker, and your hand is one card smaller.
    </p>
    <p className={textClass}>
      The game ends when your hand is empty. <strong>Build the longest timeline!</strong>
    </p>
    <p className="text-xs text-text-muted font-body leading-relaxed">
      Daily is one shared deck for everyone, once a day. Archive and Custom are any deck, any time.
    </p>
  </div>
);

const miniCard = 'rounded-sm border border-border bg-surface';

/**
 * The rules as three glyphs: the hand, the drag into a gap, the two outcomes. Plain divs on
 * the colour tokens so dark mode is free. No opacity modifiers on tokens (`bg-accent/20`
 * compiles to nothing here); `opacity-60` on the element instead.
 */
export const HowToPlaySteps: React.FC = () => (
  <div className="grid grid-cols-3 gap-2 mb-4" aria-hidden="true">
    {/* 1. Your hand: three fanned cards */}
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-14 w-full flex items-end justify-center">
        <div className={`absolute h-10 w-7 ${miniCard} opacity-60 -rotate-6 -translate-x-3`} />
        <div className={`absolute h-10 w-7 ${miniCard} opacity-80 rotate-3 translate-x-2`} />
        <div className={`relative h-11 w-8 ${miniCard} border-accent shadow-sm`} />
      </div>
      <span className="text-xs text-text-muted font-body text-center">Your hand</span>
    </div>

    {/* 2. Drag to the gap: spine, two placed cards, a dashed gap between them */}
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-14 w-full flex justify-center">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-accent" />
        <div className="relative flex flex-col items-center justify-between h-full py-0.5">
          <div className={`h-3 w-10 ${miniCard}`} />
          <div className="flex items-center gap-1">
            <ArrowDown className="h-3 w-3 text-accent" />
            <div className="h-3 w-10 rounded-sm border border-dashed border-accent" />
          </div>
          <div className={`h-3 w-10 ${miniCard}`} />
        </div>
      </div>
      <span className="text-xs text-text-muted font-body text-center">Drag to the gap</span>
    </div>

    {/* 3. Outcomes: a kept card and a grey tombstone */}
    <div className="flex flex-col items-center gap-2">
      <div className="h-14 w-full flex flex-col items-center justify-center gap-2">
        <div className={`flex h-5 w-14 items-center justify-center ${miniCard} border-success`}>
          <Check className="h-3.5 w-3.5 text-success" />
        </div>
        <div className="flex h-5 w-14 items-center justify-center rounded-sm border border-border bg-border opacity-60">
          <X className="h-3.5 w-3.5 text-text-muted" />
        </div>
      </div>
      <span className="text-xs text-text-muted font-body text-center">
        Right stays, wrong turns grey
      </span>
    </div>
  </div>
);

interface HowToPlayModalProps {
  open: boolean;
  onDismiss: () => void;
}

/**
 * The one How-to-Play screen: opened by the first game, the Daily tab's "How to play" link
 * and the menu. It is the rules only: the in-game hints are re-findable here, and each home
 * tab explains itself with its own subtitle and first-visit strip. On `ui/Modal`: keep it
 * mounted and drive `open`. `reveal` layer so it clears the menu drawer.
 *
 * Closing it from anywhere marks the `rules` hint seen: a player who reads the rules from
 * the home tab should not be handed the same screen again the moment their first game starts.
 */
const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ open, onDismiss }) => {
  const handleDismiss = () => {
    markHintSeen('rules');
    onDismiss();
  };

  return (
    <Modal
      open={open}
      onDismiss={handleDismiss}
      header="How to Play"
      size="standard"
      layer="reveal"
      scroll="card"
    >
      <div className="p-4">
        <HowToPlaySteps />
        <GameRules />

        <div className="mt-4 space-y-2 text-left">
          <p className="text-xs text-text-muted font-body leading-relaxed">
            Tap{' '}
            <span className="mx-0.5 inline-flex h-5 w-5 -translate-y-0.5 items-center justify-center rounded-full border border-border bg-surface align-middle">
              <RefreshCw className="h-3 w-3 text-text" />
            </span>{' '}
            on your hand to swap to a different card.
          </p>
          <p className="text-xs text-text-muted font-body leading-relaxed">
            Tap any card to read about the event.
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full mt-4 py-3 px-4 bg-accent text-white rounded-xl font-medium transition-colors hover:bg-accent/90 active:scale-95 font-body"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
};

export default HowToPlayModal;
