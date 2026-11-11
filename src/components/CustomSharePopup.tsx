import React, { useId } from 'react';
import { RefreshCw, Share2, X } from 'lucide-react';
import Modal from './ui/Modal';

interface CustomSharePopupProps {
  open: boolean;
  onClose: () => void;
  /** The link field's text: the current settings' link, or what the player pasted. */
  codeInput: string;
  isCodeValid: boolean;
  /** A pasted link is decoded and, when it parses, applied to every setting. */
  onCodeInput: (value: string) => void;
  onShuffle: () => void;
  onShare: () => void;
}

/**
 * The Custom tab's link field, opened by the Share button beside Play: the explanatory line,
 * the two-way link input (`docs/sharing-challenges/index.md`, "The Custom tab's code field"),
 * the seed shuffle and the share itself. Kept mounted and driven by `open`, like every popup.
 */
const CustomSharePopup: React.FC<CustomSharePopupProps> = ({
  open,
  onClose,
  codeInput,
  isCodeValid,
  onCodeInput,
  onShuffle,
  onShare,
}) => {
  const titleId = useId();
  return (
    <Modal open={open} onDismiss={onClose} rounded="2xl" labelledBy={titleId} cardClassName="p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id={titleId} className="text-xl font-bold text-text font-display">
          Share this game
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-border transition-colors"
        >
          <X className="h-5 w-5 text-text-muted" />
        </button>
      </div>
      <p className="mb-3 text-sm text-text-muted font-body">
        Shuffle for a fresh deck, then share this link so others play the exact same game. Paste a
        link here to load it.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={codeInput}
          onChange={(e) => onCodeInput(e.target.value)}
          aria-label="Share link"
          className={`h-11 min-w-0 flex-1 rounded-lg border bg-bg px-3 text-sm font-mono text-accent transition-colors focus:outline-none ${
            isCodeValid ? 'border-border focus:border-accent' : 'border-error'
          }`}
          placeholder="paste a share link"
        />
        <button
          type="button"
          onClick={onShuffle}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-border transition-colors active:scale-95"
          title="Shuffle seed"
          aria-label="Shuffle seed"
        >
          <RefreshCw className="h-4 w-4 text-text-muted" />
        </button>
      </div>
      <button
        type="button"
        onClick={onShare}
        disabled={!isCodeValid || codeInput === ''}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-secondary text-base font-semibold text-white transition-transform active:scale-95 font-body disabled:opacity-40"
      >
        <Share2 className="h-4 w-4" />
        Share link
      </button>
    </Modal>
  );
};

export default CustomSharePopup;
