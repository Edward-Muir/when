import { Difficulty, Category, Era, GameConfig, ALL_DIFFICULTIES, ALL_CATEGORIES } from '../types';
import { ALL_ERAS } from './eras';
import { WORDLIST, wordMap } from './wordlists';

/**
 * Shareable-game encoding for custom games.
 *
 * A game is encoded as a hyphenated word-string (the "token") embedded in a share URL
 * (`/challenge/<token>`). Because a URL has no length budget, the token carries the FULL
 * game state — including an arbitrary multiselect of up to 32 categories — rather than the
 * old space-constrained 3-word code.
 *
 * Bit layout (72 bits total = 6 × 12-bit WORDLIST indices):
 *   offset  0, width  1:  Game mode (0=suddenDeath, 1=freeplay)
 *   offset  1, width  3:  Hand size (value - 1, range 0-7)
 *   offset  4, width  3:  Player count (value - 1, range 0-7)
 *   offset  7, width  4:  Difficulties bitmask (easy, medium, hard, very-hard)
 *   offset 11, width  8:  Eras bitmask (8 eras)
 *   offset 19, width 32:  Categories bitmask (up to 32 categories — fixed width so the
 *                         layout stays stable as the category list grows)
 *   offset 51, width 21:  Random seed (0 - 2,097,151)
 */

const WORD_COUNT = 6;

// BigInt is used for the 72-bit packed value (exceeds JS's 53-bit safe-integer range).
// Literals (`12n`) require an ES2020 target, so the sanctioned `BigInt()` form is used.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const WORD_BITS = BigInt(12);
const WORD_MASK = BigInt(0xfff);

const OFFSET_MODE = BigInt(0);
const OFFSET_HAND = BigInt(1);
const OFFSET_PLAYER = BigInt(4);
const OFFSET_DIFF = BigInt(7);
const OFFSET_ERA = BigInt(11);
const OFFSET_CATEGORIES = BigInt(19);
const OFFSET_SEED = BigInt(51);

const MASK_3 = BigInt(0x7);
const MASK_DIFF = BigInt(0xf); // 4 bits
const MASK_ERA = BigInt(0xff); // 8 bits
const MASK_CATEGORIES = BigInt(0xffffffff); // 32 bits
const MASK_SEED = BigInt(0x1fffff); // 21 bits

const SEED_RANGE = 2_097_152; // 2^21

export interface ChallengeConfig {
  mode: 'suddenDeath' | 'freeplay';
  handSize: number; // 1-8
  playerCount: number; // 1-6
  difficulties: Difficulty[];
  categories: Category[];
  eras: Era[];
  seed: number; // 0 - 2,097,151
}

function arrayToBitmask<T>(selected: T[], all: readonly T[]): bigint {
  let mask = ZERO;
  for (const item of selected) {
    const idx = all.indexOf(item);
    if (idx >= 0) mask |= ONE << BigInt(idx);
  }
  return mask;
}

function bitmaskToArray<T>(mask: bigint, all: readonly T[]): T[] {
  return all.filter((_, i) => ((mask >> BigInt(i)) & ONE) === ONE);
}

/**
 * Encode a challenge config into a hyphenated word-string token.
 */
export function encodeChallengeCode(config: ChallengeConfig): string {
  const modeBit = config.mode === 'freeplay' ? ONE : ZERO;
  const handBits = BigInt((config.handSize - 1) & 0x7);
  const playerBits = BigInt((config.playerCount - 1) & 0x7);
  const diffBits = arrayToBitmask(config.difficulties, ALL_DIFFICULTIES) & MASK_DIFF;
  const eraBits = arrayToBitmask(config.eras, ALL_ERAS) & MASK_ERA;
  const catBits = arrayToBitmask(config.categories, ALL_CATEGORIES) & MASK_CATEGORIES;
  const seedBits = BigInt(config.seed & (SEED_RANGE - 1));

  let packed = ZERO;
  packed |= modeBit << OFFSET_MODE;
  packed |= handBits << OFFSET_HAND;
  packed |= playerBits << OFFSET_PLAYER;
  packed |= diffBits << OFFSET_DIFF;
  packed |= eraBits << OFFSET_ERA;
  packed |= catBits << OFFSET_CATEGORIES;
  packed |= seedBits << OFFSET_SEED;

  const words: string[] = [];
  let shift = ZERO;
  for (let i = 0; i < WORD_COUNT; i++) {
    const idx = Number((packed >> shift) & WORD_MASK);
    words.push(WORDLIST.at(idx) ?? '');
    shift += WORD_BITS;
  }
  return words.join('-');
}

/**
 * Decode a token (or a full share URL containing one) into a config, or null if invalid.
 */
export function decodeChallengeCode(code: string): ChallengeConfig | null {
  // Accept a pasted full URL (".../challenge/<token>") as well as a bare token.
  const afterChallenge = code.includes('/challenge/') ? code.split('/challenge/')[1] : code;
  const token = afterChallenge.split(/[/?#]/)[0].trim().toLowerCase();

  const parts = token.split('-');
  if (parts.length !== WORD_COUNT) return null;

  let packed = ZERO;
  let shift = ZERO;
  for (const part of parts) {
    const idx = wordMap.get(part);
    if (idx === undefined) return null;
    packed |= BigInt(idx) << shift;
    shift += WORD_BITS;
  }

  const mode = ((packed >> OFFSET_MODE) & ONE) === ONE ? 'freeplay' : 'suddenDeath';
  const handSize = Number((packed >> OFFSET_HAND) & MASK_3) + 1;
  const playerCount = Number((packed >> OFFSET_PLAYER) & MASK_3) + 1;
  const difficulties = bitmaskToArray((packed >> OFFSET_DIFF) & MASK_DIFF, ALL_DIFFICULTIES);
  const eras = bitmaskToArray((packed >> OFFSET_ERA) & MASK_ERA, ALL_ERAS);
  const categories = bitmaskToArray(
    (packed >> OFFSET_CATEGORIES) & MASK_CATEGORIES,
    ALL_CATEGORIES
  );
  const seed = Number((packed >> OFFSET_SEED) & MASK_SEED);

  // Validate
  if (handSize < 1 || handSize > 8) return null;
  if (playerCount < 1 || playerCount > 6) return null;
  if (difficulties.length === 0) return null;
  if (categories.length === 0) return null;
  if (eras.length === 0) return null;

  return { mode, handSize, playerCount, difficulties, categories, eras, seed };
}

/**
 * Generate a random 21-bit seed (0 - 2,097,151).
 */
export function generateChallengeSeed(): number {
  return Math.floor(Math.random() * SEED_RANGE);
}

/**
 * Convert a decoded ChallengeConfig into a GameConfig ready for startGame().
 */
export function challengeConfigToGameConfig(config: ChallengeConfig): GameConfig {
  const isSuddenDeath = config.mode === 'suddenDeath';
  return {
    mode: config.mode,
    totalTurns: isSuddenDeath ? config.handSize : config.handSize,
    selectedDifficulties: config.difficulties,
    selectedCategories: config.categories,
    selectedEras: config.eras,
    playerCount: config.playerCount,
    playerNames: Array.from({ length: config.playerCount }, (_, i) => `Player ${i + 1}`),
    cardsPerHand: isSuddenDeath ? 5 : config.handSize,
    suddenDeathHandSize: isSuddenDeath ? config.handSize : 5,
  };
}
