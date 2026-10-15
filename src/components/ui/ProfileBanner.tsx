import React, { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Avatar, backgroundArtUrl, getTheme } from '../../utils/avatar';
import Portrait from './Portrait';

interface ProfileBannerProps {
  name: string;
  avatar: Avatar;
  /** The menu drawer's smaller version. */
  compact?: boolean;
  /** Makes the whole banner a button (opens the avatar picker). */
  onClick?: () => void;
  className?: string;
}

/**
 * The player's portrait over their theme's background, with their name: Wingspan's profile
 * banner. The background is a wide painted place, too detailed for anything smaller than this,
 * which is why leaderboard rows show the portrait alone.
 *
 * Until the art exists the background is a gradient of the theme's colour. Colours are inline
 * styles, never `bg-accent/20`-style modifiers, which compile to nothing on theme tokens.
 */
const ProfileBanner: React.FC<ProfileBannerProps> = ({
  name,
  avatar,
  compact = false,
  onClick,
  className = '',
}) => {
  const theme = getTheme(avatar.theme);
  const art = backgroundArtUrl(avatar.theme);
  const [artFailed, setArtFailed] = useState(false);
  const color = theme?.color ?? '#5b6770';

  const content = (
    <>
      {art && !artFailed ? (
        <img
          src={art}
          alt=""
          decoding="async"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setArtFailed(true)}
        />
      ) : null}
      {/* Keeps the name legible over whatever the painting has behind it. */}
      <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/50 to-transparent" />
      <span className={`relative flex items-end w-full ${compact ? 'gap-2 p-2' : 'gap-3 p-3'}`}>
        <Portrait avatar={avatar} size={compact ? 'lg' : 'xl'} className="shadow-md" />
        {/* Right padding clears the pencil chip when the banner is a button. */}
        <span className={`flex-1 min-w-0 pb-1 text-left ${onClick ? 'pr-8' : ''}`}>
          {theme && (
            <span className="block text-xs text-white font-body opacity-80 truncate">
              {theme.label} · {theme.place}
            </span>
          )}
          <span
            className={`block font-display font-semibold text-white truncate ${compact ? 'text-base' : 'text-xl'}`}
          >
            {name}
          </span>
        </span>
      </span>
      {onClick && (
        <span className="absolute bottom-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/40 text-white">
          <Pencil className="w-3.5 h-3.5" />
        </span>
      )}
    </>
  );

  const shell = `relative flex w-full overflow-hidden ${compact ? 'min-h-[96px]' : 'min-h-[128px] rounded-xl'} ${className}`;
  const style = {
    background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #000))`,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={shell}
        style={style}
        aria-label={`${name}. Change your avatar`}
        data-testid="profile-banner"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={shell} style={style} data-testid="profile-banner">
      {content}
    </div>
  );
};

export default ProfileBanner;
