/**
 * Player avatars: a portrait of an animal on a small paper tile.
 *
 * An avatar is just an animal id (`"platypus"`). The fun name decides it by default (the last
 * word, so "Linguistic Platypus" is a platypus); a player can pick another in the avatar picker,
 * and that pick travels with their leaderboard score. Everyone else on the board (bots, legacy
 * entries, names the filter replaced, free-typed names) resolves from the name alone,
 * client-side. See docs/avatars/index.md.
 */
import { uniqueNamesGenerator, adjectives } from 'unique-names-generator';
import data from '../data/avatars.json';
import { getImageUrl } from './cloudinaryImage';

export interface AvatarAnimal {
  id: string;
  label: string;
  /** Drawn if the art fails to load. Absent where no emoji reads as the animal. */
  emoji?: string;
}

export const AVATAR_ANIMALS: readonly AvatarAnimal[] = data.animals;
const ANIMALS_BY_ID = new Map(AVATAR_ANIMALS.map((a) => [a.id, a]));

/**
 * The leaderboard's name cap, mirrored from MAX_DISPLAY_NAME_LENGTH in
 * lib/leaderboard/nameFilter.ts (app code cannot import from lib/; avatar.test.ts pins the
 * two together). A generated name longer than this would be cut mid-word on the board and
 * lose the animal its portrait comes from.
 */
export const MAX_NAME_LENGTH = 20;

export function getAnimal(id: string): AvatarAnimal | undefined {
  return ANIMALS_BY_ID.get(id);
}

/** FNV-1a. Stable across sessions and devices, which is all the fallback needs. */
function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * The animal a name implies: its last word, if that is one of ours. Anything else (a
 * free-typed name, "Anonymous", an animal from before the list was cut) falls back to a hash of
 * that word. Deterministic, so the board's 15s poll never reshuffles anyone.
 */
export function avatarForName(name: string): string {
  const last = name.trim().toLowerCase().split(/\s+/).at(-1) ?? '';
  if (ANIMALS_BY_ID.has(last)) return last;
  return (AVATAR_ANIMALS[hashString(last) % AVATAR_ANIMALS.length] as AvatarAnimal).id;
}

/** The animal id, or null for anything this build does not know: stale or bogus values. */
export function parseAvatar(value: unknown): string | null {
  return typeof value === 'string' && ANIMALS_BY_ID.has(value) ? value : null;
}

/** A leaderboard row's avatar: the one the player chose, else the one their name implies. */
export function resolveAvatar(entry: { displayName: string; avatar?: string }): string {
  return parseAvatar(entry.avatar) ?? avatarForName(entry.displayName);
}

/**
 * Every animal's portrait is uploaded to Cloudinary at `avatars/<animal id>` (the uploader's
 * `--avatars` mode in ../when-images), so the URL is built from the id rather than stored.
 */
const PORTRAIT_BASE = 'https://res.cloudinary.com/dscb8inz1/image/upload/avatars/';

/**
 * Portrait art for an animal, or null for an id that is not in the list. Delivered through the
 * existing square `thumbnail` rung rather than a portrait-sized one: a third rung would mint new
 * derived assets and another string to allow-list (docs/cloudinary-cost-controls.md), and 400px
 * covers the largest tile (the picker's 96px preview) at DPR 3.
 */
export function portraitArtUrl(animal: string): string | null {
  if (!ANIMALS_BY_ID.has(animal)) return null;
  return getImageUrl(`${PORTRAIT_BASE}${animal}`, 'thumbnail') ?? null;
}

/**
 * A fresh "Linguistic Platypus" name: any of the package's adjectives, but only our animals,
 * so every generated name has a portrait. Pairs that would overflow MAX_NAME_LENGTH are never
 * drawn: the board would truncate them mid-word and the animal would be lost.
 */
export function generateRandomName(): string {
  const animal = AVATAR_ANIMALS[Math.floor(Math.random() * AVATAR_ANIMALS.length)] as AvatarAnimal;
  const fitting = adjectives.filter(
    (adj) => adj.length + 1 + animal.label.length <= MAX_NAME_LENGTH
  );
  return uniqueNamesGenerator({
    dictionaries: [fitting, [animal.label]],
    separator: ' ',
    style: 'capital',
    length: 2,
  });
}
