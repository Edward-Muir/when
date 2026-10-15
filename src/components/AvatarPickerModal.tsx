import React from 'react';
import Modal from './ui/Modal';
import Portrait, { tintStyle } from './ui/Portrait';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { AVATAR_ANIMALS, AVATAR_THEMES, getTheme } from '../utils/avatar';

interface AvatarPickerModalProps {
  open: boolean;
  onDismiss: () => void;
}

const SECTION_HEADING =
  'text-xs font-medium uppercase tracking-wide text-text-muted font-body mb-2';
// Every tile is a button, and index.css forces `min-height: 44px` on buttons, so the tiles
// are sized at or above that rather than fighting it.
const TILE = 'flex flex-col items-center gap-1 rounded-lg p-1 transition-colors';
const SELECTED = 'ring-2 ring-accent';
const GRID = 'grid grid-cols-4 min-[380px]:grid-cols-5 gap-2';
// The cap follows the *visible* viewport: `--vh` is `1dvh` where supported (App.tsx). Plain
// `vh` is the large viewport on iOS browsers, so with their toolbars showing a 90vh card ran
// off both ends of the screen, header and Done button with it.
const MAX_HEIGHT = 'max-h-[calc(var(--vh,1vh)*80)]';

/**
 * Choose your portrait and its tint. Each tap saves at once and the tile at the top previews
 * it. Until a first pick, the avatar follows the name.
 *
 * Opened from the menu's "Your Avatar" row only: avatars are a quiet touch, not a profile
 * page. On `ui/Modal`: keep it mounted and drive `open`. `reveal` layer so it clears the menu
 * drawer it opens from. The preview and the footer are pinned and only the grids scroll, so
 * the way out is always on screen.
 */
const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ open, onDismiss }) => {
  const { name, avatar, setAvatar } = usePlayerProfile();

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      header="Your Avatar"
      size="wide"
      layer="reveal"
      scroll="body"
      maxHeightClass={MAX_HEIGHT}
    >
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Portrait avatar={avatar} size="xl" />
          <div className="min-w-0">
            <div className="font-display font-semibold text-xl text-text truncate">{name}</div>
            <div className="text-xs text-text-muted font-body">{getTheme(avatar.theme)?.label}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5" data-testid="avatar-grids">
        <section>
          <h3 className={SECTION_HEADING}>Portrait</h3>
          <div className={GRID} role="radiogroup" aria-label="Portrait">
            {AVATAR_ANIMALS.map((animal) => {
              const selected = animal.id === avatar.animal;
              return (
                <button
                  key={animal.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={animal.label}
                  onClick={() => setAvatar({ ...avatar, animal: animal.id })}
                  className={`${TILE} ${selected ? SELECTED : ''}`}
                >
                  <Portrait avatar={{ animal: animal.id, theme: avatar.theme }} size="md" />
                  <span className="text-[10px] leading-tight text-text-muted font-body truncate max-w-full">
                    {animal.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className={SECTION_HEADING}>Tint</h3>
          <div className={GRID} role="radiogroup" aria-label="Tint">
            {AVATAR_THEMES.map((theme) => {
              const selected = theme.id === avatar.theme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={theme.label}
                  onClick={() => setAvatar({ ...avatar, theme: theme.id })}
                  className={`${TILE} ${selected ? SELECTED : ''}`}
                >
                  <span
                    className="w-11 h-11 rounded-md border border-border"
                    style={tintStyle(theme.color)}
                  />
                  <span className="text-[10px] leading-tight text-text-muted font-body truncate max-w-full">
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <p className="text-xs text-text-muted font-body text-center">
          Shown with your next daily leaderboard score.
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="w-full py-3 bg-accent text-white rounded-xl font-medium font-body"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default AvatarPickerModal;
