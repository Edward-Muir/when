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
        <p className="font-body text-text leading-relaxed">{theme?.intro?.blurb ?? ''}</p>
        <h3 className="mt-4 mb-1 text-xs font-medium uppercase tracking-wide text-text-muted font-body">
          Did you know?
        </h3>
        <p className="text-sm font-body text-text-muted leading-relaxed">
          {theme?.intro?.fact ?? ''}
        </p>
      </div>

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={dismiss}
          className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 active:scale-95 transition-all"
        >
          Let&apos;s go
        </button>
      </div>
    </Modal>
  );
}

export default ThemeIntroPopup;
