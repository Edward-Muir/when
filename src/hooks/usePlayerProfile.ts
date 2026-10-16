import { useSyncExternalStore } from 'react';
import {
  getAvatarChoice,
  getOrCreateDisplayName,
  saveAvatarChoice,
  subscribeToProfile,
} from '../utils/playerStorage';
import { avatarForName, parseAvatar } from '../utils/avatar';

export interface PlayerProfile {
  name: string;
  /** The animal the player shows as: their pick, else what their name implies. */
  avatar: string;
  /** The explicit pick, or null while the avatar still follows the name. */
  choice: string | null;
  /** Save a pick. */
  setAvatar: (animal: string) => void;
}

// useSyncExternalStore compares snapshots with Object.is, so the snapshot is a string built
// from storage rather than a fresh object per read — that would re-render forever. The name
// goes last because it is the only part that can contain the separator.
function readSnapshot(): string {
  return `${getAvatarChoice() ?? ''}|${getOrCreateDisplayName()}`;
}

/**
 * The player's own name and avatar, live: a pick in the avatar picker updates the menu item,
 * the submit form and their own leaderboard row at once. Generates and saves a name on first use,
 * so there is always one to show.
 */
export function usePlayerProfile(): PlayerProfile {
  const snapshot = useSyncExternalStore(subscribeToProfile, readSnapshot);

  const at = snapshot.indexOf('|');
  const choice = parseAvatar(snapshot.slice(0, at));
  const name = snapshot.slice(at + 1);

  return { name, avatar: choice ?? avatarForName(name), choice, setAvatar: saveAvatarChoice };
}
