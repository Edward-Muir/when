import React from 'react';
import Modal from './ui/Modal';
import Portrait from './ui/Portrait';
import ProfileBanner from './ui/ProfileBanner';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { AVATAR_ANIMALS, AVATAR_THEMES, avatarForName } from '../utils/avatar';

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

/**
 * Choose your portrait and background, after Wingspan's two pickers. Each tap saves at once
 * and the banner on top previews it. "Match my name" drops the pick, so the avatar follows
 * the name again.
 *
 * On `ui/Modal`: keep it mounted and drive `open`. `reveal` layer so it clears the menu
 * drawer it opens from.
 */
const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ open, onDismiss }) => {
  const { name, avatar, chosen, setAvatar } = usePlayerProfile();
  const fromName = avatarForName(name);

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      header="Your Avatar"
      size="wide"
      layer="reveal"
      scroll="card"
    >
      <div className="p-4 space-y-5">
        <ProfileBanner name={name} avatar={avatar} />

        <section>
          <h3 className={SECTION_HEADING}>Portrait</h3>
          <div
            className="grid grid-cols-4 min-[380px]:grid-cols-5 gap-2"
            role="radiogroup"
            aria-label="Portrait"
          >
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
          <h3 className={SECTION_HEADING}>Background</h3>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Background">
            {AVATAR_THEMES.map((theme) => {
              const selected = theme.id === avatar.theme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${theme.label}, ${theme.place}`}
                  onClick={() => setAvatar({ ...avatar, theme: theme.id })}
                  className={`relative flex flex-col justify-end h-14 rounded-lg overflow-hidden px-2 py-1 text-left ${selected ? SELECTED : ''}`}
                  style={{
                    background: `linear-gradient(135deg, ${theme.color}, color-mix(in srgb, ${theme.color} 55%, #000))`,
                  }}
                >
                  <span className="text-xs font-semibold text-white font-body leading-tight">
                    {theme.label}
                  </span>
                  <span className="text-[10px] text-white font-body leading-tight opacity-80 truncate">
                    {theme.place}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setAvatar(null)}
            disabled={!chosen}
            className="w-full py-2 rounded-lg border border-border text-text font-body text-sm disabled:opacity-50"
          >
            Match my name
            {chosen && (
              <span className="text-text-muted">
                {' '}
                ({AVATAR_ANIMALS.find((a) => a.id === fromName.animal)?.label})
              </span>
            )}
          </button>
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
      </div>
    </Modal>
  );
};

export default AvatarPickerModal;
