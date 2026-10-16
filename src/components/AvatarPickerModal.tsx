import React, { useState } from 'react';
import { X } from 'lucide-react';
import Modal from './ui/Modal';
import Portrait from './ui/Portrait';
import { usePlayerProfile } from '../hooks/usePlayerProfile';
import { saveDisplayName } from '../utils/playerStorage';
import { AVATAR_ANIMALS, MAX_NAME_LENGTH, avatarForName, getAnimal } from '../utils/avatar';

interface AvatarPickerModalProps {
  open: boolean;
  onDismiss: () => void;
  /** The name to preview, when it is not the saved one: the submit form passes the name as typed,
   *  so until a first pick the preview and the checked tile follow what the form shows. Without
   *  it the modal is the menu's Profile, where the name itself is edited. */
  name?: string;
  /** The line above Done. */
  note?: string;
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
 * Choose your portrait, and from the menu your leaderboard name. Each tap saves at once and the
 * tile at the top previews it. Until a first pick, the avatar follows the name.
 *
 * Opened from the menu's "Profile" row and from the portrait beside the leaderboard name box,
 * where a first-time player claims their first score before ever opening the menu. From there
 * it is portraits only: the form's own input is the name box, and two inputs for one name would
 * fight. The Profile name commits on blur, Enter, Done or dismiss rather than per keystroke, so
 * half-typed names are never broadcast. On `ui/Modal`: keep it mounted and drive `open`.
 * `reveal` layer so it clears the menu drawer or popup it opens from. The preview and the footer
 * are pinned and only the grid scrolls, so the way out is always on screen.
 */
const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  open,
  onDismiss,
  name: previewName,
  note = 'Shown with your next daily leaderboard score.',
}) => {
  const profile = usePlayerProfile();
  const editsName = previewName === undefined;
  const name = previewName ?? profile.name;
  const avatar = profile.choice ?? avatarForName(name);
  const { setAvatar } = profile;

  // The name being typed. Re-seeded from the saved name each time the modal opens, so a rename
  // made elsewhere (the submit form saves the name it sends) is what the field starts from.
  const [draft, setDraft] = useState(profile.name);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(profile.name);
  }

  const commitName = () => {
    const next = draft.trim();
    if (!next || next === profile.name) {
      setDraft(profile.name);
      return;
    }
    // Until a first pick the avatar follows the name, so renaming "Linguistic Platypus" to "Ed"
    // would silently swap the portrait for a hashed stranger. Pin the one on screen first.
    if (profile.choice === null) setAvatar(profile.avatar);
    saveDisplayName(next);
    setDraft(next);
  };

  const dismiss = () => {
    if (editsName) commitName();
    onDismiss();
  };

  return (
    <Modal
      open={open}
      onDismiss={dismiss}
      labelledBy="avatar-picker-title"
      header={
        <div className="flex items-center justify-between">
          <h2 id="avatar-picker-title" className="text-lg font-display font-semibold text-text">
            {editsName ? 'Profile' : 'Your Avatar'}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            className="p-1 rounded-lg hover:bg-border transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      }
      size="wide"
      layer="reveal"
      scroll="body"
      maxHeightClass={MAX_HEIGHT}
    >
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Portrait animal={avatar} size={96} />
          <div className="min-w-0 flex-1">
            {editsName ? (
              // 16px text: iOS zooms the page into any smaller input on focus.
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                maxLength={MAX_NAME_LENGTH}
                aria-label="Your name"
                autoComplete="off"
                autoCapitalize="words"
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-text font-body text-base focus:outline-none focus:ring-2 focus:ring-accent"
              />
            ) : (
              <div className="font-display font-semibold text-xl text-text truncate">{name}</div>
            )}
            <div className={`text-xs text-text-muted font-body ${editsName ? 'mt-1 px-1' : ''}`}>
              {getAnimal(avatar)?.label}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5" data-testid="avatar-grids">
        <section>
          <h3 className={SECTION_HEADING}>Portrait</h3>
          <div className={GRID} role="radiogroup" aria-label="Portrait">
            {AVATAR_ANIMALS.map((animal) => {
              const selected = animal.id === avatar;
              return (
                <button
                  key={animal.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={animal.label}
                  onClick={() => setAvatar(animal.id)}
                  className={`${TILE} ${selected ? SELECTED : ''}`}
                >
                  <Portrait animal={animal.id} size={44} />
                  <span className="text-[10px] leading-tight text-text-muted font-body truncate max-w-full">
                    {animal.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="shrink-0 border-t border-border p-4 space-y-2">
        <p className="text-xs text-text-muted font-body text-center">{note}</p>
        <button
          type="button"
          onClick={dismiss}
          className="w-full py-3 bg-accent text-white rounded-xl font-medium font-body"
        >
          Done
        </button>
      </div>
    </Modal>
  );
};

export default AvatarPickerModal;
