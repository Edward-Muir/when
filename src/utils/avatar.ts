/**
 * Player avatars: a portrait (an animal) over a background (a history theme).
 *
 * The fun name decides both by default: the last word picks the animal and the first word
 * picks the theme, so "Linguistic Platypus" is a platypus in the scholar's library. A player
 * can override either from the picker, and that choice travels with their leaderboard score.
 * Everyone else on the board — bots, legacy entries, names the filter replaced, free-typed
 * names — resolves from the name alone, client-side. See docs/avatars/index.md.
 *
 * The art does not exist yet: `portraitArtUrl` / `backgroundArtUrl` are the one seam it plugs
 * into, and until they return a URL every surface draws a placeholder.
 */
import { uniqueNamesGenerator, adjectives } from 'unique-names-generator';
import data from '../data/avatars.json';

export interface AvatarAnimal {
  id: string;
  label: string;
  /** Placeholder glyph until the art lands. Absent where no emoji reads as the animal. */
  emoji?: string;
}

export interface AvatarTheme {
  id: string;
  label: string;
  /** The historic place its background painting shows. */
  place: string;
  /** Placeholder fill, and a hint for the art. */
  color: string;
}

export interface Avatar {
  animal: string;
  theme: string;
}

export const AVATAR_ANIMALS: readonly AvatarAnimal[] = data.animals;
export const AVATAR_THEMES: readonly AvatarTheme[] = data.themes;
const ADJECTIVE_THEMES = new Map<string, string>(Object.entries(data.adjectiveThemes));

const ANIMALS_BY_ID = new Map(AVATAR_ANIMALS.map((a) => [a.id, a]));
const THEMES_BY_ID = new Map(AVATAR_THEMES.map((t) => [t.id, t]));

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

export function getTheme(id: string): AvatarTheme | undefined {
  return THEMES_BY_ID.get(id);
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

function pick<T>(list: readonly T[], seed: string): T {
  return list[hashString(seed) % list.length] as T;
}

/**
 * The avatar a name implies. Deterministic, so the board's 15s poll never reshuffles anyone.
 *
 * A word that is not in the lists (a free-typed name, "Anonymous", an animal from before the
 * list was cut to 60) falls back to a hash of that word, salted per list so a one-word name
 * does not tie its animal to its theme.
 */
export function avatarForName(name: string): Avatar {
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const last = words[words.length - 1] ?? '';

  const animal = ANIMALS_BY_ID.has(last) ? last : pick(AVATAR_ANIMALS, `animal:${last}`).id;
  const mapped = ADJECTIVE_THEMES.get(first);
  const theme =
    mapped && THEMES_BY_ID.has(mapped) ? mapped : pick(AVATAR_THEMES, `theme:${first}`).id;

  return { animal, theme };
}

/** The wire form sent with a score: `"platypus.scholar"`. */
export function formatAvatar(avatar: Avatar): string {
  return `${avatar.animal}.${avatar.theme}`;
}

/** Null for anything that does not name a known animal and theme — stale or bogus values. */
export function parseAvatar(value: unknown): Avatar | null {
  if (typeof value !== 'string') return null;
  const [animal, theme, extra] = value.split('.');
  if (extra !== undefined || !animal || !theme) return null;
  if (!ANIMALS_BY_ID.has(animal) || !THEMES_BY_ID.has(theme)) return null;
  return { animal, theme };
}

/** A leaderboard row's avatar: the one the player chose, else the one their name implies. */
export function resolveAvatar(entry: { displayName: string; avatar?: string }): Avatar {
  return parseAvatar(entry.avatar) ?? avatarForName(entry.displayName);
}

/** Portrait art for an animal, or null while it only has a placeholder. */
export function portraitArtUrl(_animal: string): string | null {
  return null;
}

/** Background art for a theme, or null while it only has a placeholder. */
export function backgroundArtUrl(_theme: string): string | null {
  return null;
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
