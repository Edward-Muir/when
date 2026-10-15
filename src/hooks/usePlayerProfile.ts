import { useCallback, useSyncExternalStore } from 'react';
import {
  getAvatarChoice,
  getOrCreateDisplayName,
  saveAvatarChoice,
  subscribeToProfile,
} from '../utils/playerStorage';
import { Avatar, avatarForName, formatAvatar, parseAvatar } from '../utils/avatar';

export interface PlayerProfile {
  name: string;
  /** What the player looks like: their pick, else what their name implies. */
  avatar: Avatar;
  /** True when `avatar` is an explicit pick rather than derived from the name. */
  chosen: boolean;
  /** Save a pick, or null to follow the name again. */
  setAvatar: (avatar: Avatar | null) => void;
}

// useSyncExternalStore compares snapshots with Object.is, so the snapshot is a string built
// from storage rather than a fresh object per read — that would re-render forever. The name
// goes last because it is the only part that can contain the separator.
function readSnapshot(): string {
  const choice = getAvatarChoice();
  return `${choice ? formatAvatar(choice) : ''}|${getOrCreateDisplayName()}`;
}

/**
 * The player's own name and avatar, live: a pick in the avatar picker updates the menu, the
 * Stats banner and their own leaderboard row at once. Generates and saves a name on first use,
 * so there is always one to show.
 */
export function usePlayerProfile(): PlayerProfile {
  const snapshot = useSyncExternalStore(subscribeToProfile, readSnapshot);
  const setAvatar = useCallback((avatar: Avatar | null) => saveAvatarChoice(avatar), []);

  const at = snapshot.indexOf('|');
  const choice = parseAvatar(snapshot.slice(0, at));
  const name = snapshot.slice(at + 1);

  return { name, avatar: choice ?? avatarForName(name), chosen: choice !== null, setAvatar };
}
