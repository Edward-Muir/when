import { Sparkles } from 'lucide-react';
import Modal from './ui/Modal';
import type { ThemeIntroState } from '../hooks/useThemeIntro';

interface ThemeIntroPopupProps {
  intro: ThemeIntroState;
}

/**
 * A curated theme's opening plaque: what the deck covers, then one fact. Shown by
 * `useThemeIntro` as play begins. The copy is the published theme's `intro` and states no
 * date, since nothing has been placed yet (see docs/curated-themes/index.md).
 *
 * Always mounted and driven by `open`, per the Modal contract. The text falls back to empty
 * strings because a game with no intro mounts it closed.
 */
export function ThemeIntroPopup({ intro }: ThemeIntroPopupProps) {
  const { theme, open, dismiss } = intro;

  return (
    <Modal open={open} onDismiss={dismiss} size="standard" header={theme?.name}>
      <div className="px-4 py-4">
        {/* The plaque line, set as an epigraph in the display serif. */}
        <p className="font-display italic text-[1.125rem] leading-snug text-text">
          {theme?.intro?.blurb ?? ''}
        </p>
        {/* Sparkles, not the lightbulb: the lightbulb already means "hint" (HintStrip). */}
        <div className="mt-4 rounded-lg border-l-4 border-accent bg-fact px-3 py-3">
          <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent font-body">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Did you know?
          </h3>
          <p className="text-sm font-body text-text leading-relaxed">{theme?.intro?.fact ?? ''}</p>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={dismiss}
          className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    </Modal>
  );
}

export default ThemeIntroPopup;
