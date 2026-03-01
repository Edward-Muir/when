import { Difficulty, Category, Era, GameConfig, ALL_DIFFICULTIES, ALL_CATEGORIES } from '../types';
import { ALL_ERAS } from './eras';
import { WORDLIST_A, WORDLIST_B, WORDLIST_C } from './wordlists';

/**
 * Challenge code encoding/decoding for shareable seeded custom games.
 *
 * A challenge code is a 3-word string (e.g., "bright-falcon-ember") that encodes
 * all game settings + a random seed into 33 bits (3 × 11-bit word indices).
 *
 * Bit layout (33 bits total):
 *   Bit 0:      Game mode (0=suddenDeath, 1=freeplay)
 *   Bits 1-3:   Hand size (value - 1, range 0-7)
 *   Bits 4-6:   Player count (value - 1, range 0-5)
 *   Bits 7-10:  Difficulties bitmask (4 bits: easy, medium, hard, very-hard)
 *   Bits 11-16: Categories bitmask (6 bits: conflict, disasters, exploration, cultural, infrastructure, diplomatic)
 *   Bits 17-24: Eras bitmask (8 bits: prehistory, ancient, medieval, earlyModern, industrial, worldWars, coldWar, modern)
 *   Bits 25-32: Random seed (8 bits, 0-255)
 */

export interface ChallengeConfig {
  mode: 'suddenDeath' | 'freeplay';
  handSize: number; // 1-8
  playerCount: number; // 1-6
  difficulties: Difficulty[];
  categories: Category[];
  eras: Era[];
  seed: number; // 0-255
}

// Build reverse lookup maps for fast decoding
const wordMapA = new Map<string, number>();
const wordMapB = new Map<string, number>();
const wordMapC = new Map<string, number>();
WORDLIST_A.forEach((w, i) => wordMapA.set(w, i));
WORDLIST_B.forEach((w, i) => wordMapB.set(w, i));
WORDLIST_C.forEach((w, i) => wordMapC.set(w, i));

function arrayToBitmask<T>(selected: T[], all: readonly T[]): number {
  let mask = 0;
  for (const item of selected) {
    const idx = all.indexOf(item);
    if (idx >= 0) mask |= 1 << idx;
  }
  return mask;
}

function bitmaskToArray<T>(mask: number, all: readonly T[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < all.length; i++) {
    if (mask & (1 << i)) result.push(all[i]);
  }
  return result;
}

/**
 * Encode a challenge config into a 3-word hyphenated string.
 */
export function encodeChallengeCode(config: ChallengeConfig): string {
  const modeBit = config.mode === 'freeplay' ? 1 : 0;
  const handBits = (config.handSize - 1) & 0x7; // 3 bits
  const playerBits = (config.playerCount - 1) & 0x7; // 3 bits
  const diffBits = arrayToBitmask(config.difficulties, ALL_DIFFICULTIES) & 0xf; // 4 bits
  const catBits = arrayToBitmask(config.categories, ALL_CATEGORIES) & 0x3f; // 6 bits
  const eraBits = arrayToBitmask(config.eras, ALL_ERAS) & 0xff; // 8 bits
  const seedBits = config.seed & 0xff; // 8 bits

  // Pack into 33 bits using regular number arithmetic (safe up to 53 bits)
  let packed = 0;
  packed += modeBit;
  packed += handBits * 2; // << 1
  packed += playerBits * 16; // << 4
  packed += diffBits * 128; // << 7
  packed += catBits * 2048; // << 11
  packed += eraBits * 131072; // << 17
  packed += seedBits * 33554432; // << 25

  // Split into 3 × 11-bit indices
  const idx0 = packed & 0x7ff; // bits 0-10
  const idx1 = Math.floor(packed / 2048) & 0x7ff; // bits 11-21
  const idx2 = Math.floor(packed / 4194304) & 0x7ff; // bits 22-32

  return `${WORDLIST_A[idx0]}-${WORDLIST_B[idx1]}-${WORDLIST_C[idx2]}`;
}

/**
 * Decode a 3-word challenge code into a config, or null if invalid.
 */
export function decodeChallengeCode(code: string): ChallengeConfig | null {
  const parts = code.toLowerCase().split('-');
  if (parts.length !== 3) return null;

  const idx0 = wordMapA.get(parts[0]);
  const idx1 = wordMapB.get(parts[1]);
  const idx2 = wordMapC.get(parts[2]);

  if (idx0 === undefined || idx1 === undefined || idx2 === undefined) return null;

  // Reconstruct 33-bit packed value using regular arithmetic
  const packed = idx0 + idx1 * 2048 + idx2 * 4194304;

  const modeBit = packed & 1;
  const handBits = Math.floor(packed / 2) & 0x7;
  const playerBits = Math.floor(packed / 16) & 0x7;
  const diffBits = Math.floor(packed / 128) & 0xf;
  const catBits = Math.floor(packed / 2048) & 0x3f;
  const eraBits = Math.floor(packed / 131072) & 0xff;
  const seedBits = Math.floor(packed / 33554432) & 0xff;

  const mode = modeBit === 1 ? 'freeplay' : 'suddenDeath';
  const handSize = handBits + 1;
  const playerCount = playerBits + 1;
  const difficulties = bitmaskToArray(diffBits, ALL_DIFFICULTIES);
  const categories = bitmaskToArray(catBits, ALL_CATEGORIES);
  const eras = bitmaskToArray(eraBits, ALL_ERAS);

  // Validate
  if (handSize < 1 || handSize > 8) return null;
  if (playerCount < 1 || playerCount > 6) return null;
  if (difficulties.length === 0) return null;
  if (categories.length === 0) return null;
  if (eras.length === 0) return null;

  return { mode, handSize, playerCount, difficulties, categories, eras, seed: seedBits };
}

/**
 * Generate a random 8-bit seed (0-255).
 */
export function generateChallengeSeed(): number {
  return Math.floor(Math.random() * 256);
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
