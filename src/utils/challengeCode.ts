import { Difficulty, Category, Era, GameConfig, ALL_DIFFICULTIES, ALL_CATEGORIES } from '../types';
import { ALL_ERAS } from './eras';
import { WORDLIST, wordMap } from './wordlists';
import { ALL_REGIONS, countriesInRegion, countryByIso, countryIso, countryMacros } from './regions';
import { legacyPicksToExclusions, pairKey, parsePair, pruneExclusions } from './countrySelection';

/**
 * Shareable-game encoding for custom games.
 *
 * A game is encoded as a hyphenated word-string (the "token") embedded in a share URL
 * (`/challenge/<token>`). Because a URL has no length budget, the token carries the FULL
 * game state — including an arbitrary multiselect of up to 32 categories — rather than the
 * old space-constrained 3-word code.
 *
 * Bit layout (72 bits total = 6 × 12-bit WORDLIST indices):
 *   offset  0, width  1:  Reserved — legacy game-mode bit, always written as 0 and
 *                         ignored on read (see `decodeChallengeCode`)
 *   offset  1, width  3:  Hand size (value - 1, range 0-7)
 *   offset  4, width  3:  Player count (value - 1, range 0-7)
 *   offset  7, width  4:  Difficulties bitmask (easy, medium, hard, very-hard)
 *   offset 11, width  8:  Eras bitmask (8 eras)
 *   offset 19, width 32:  Categories bitmask (up to 32 categories — fixed width so the
 *                         layout stays stable as the category list grows)
 *   offset 51, width 21:  Random seed (0 - 2,097,151)
 *
 * Optional 7th word (bits 72-83), added with the region filter once all 72 bits were taken:
 *   offset 72, width 12:  Regions bitmask (`ALL_REGIONS` order, 11 used)
 * It is written only when the regions are narrowed or a country is picked, so an all-regions
 * game still encodes to the same 6 words as before, and every 6-word code ever shared decodes
 * as all regions.
 *
 * Optional words 8 onward: countries, in one of two formats told apart by the regions word's
 * spare 12th bit (`COUNTRY_FORMAT_BIT`). Both hold a country's ISO 3166-1 alpha-2 code as
 * `(first letter) * 26 + (second letter)`, A = 0 (0-675); ISO codes are stable, so no pinned
 * country order is needed. Words are sorted, so a selection always encodes to one token.
 *
 * - Bit clear (2026-09-30 to 2026-10): one word per *picked* country, a pick narrowing every
 *   region it belongs to. Decoded through `legacyPicksToExclusions`.
 * - Bit set (the select-all picker): one word per (region, country) pair, `iso + 676 * side`
 *   where `side` is the region's index in the country's `spans` (0 for a one-region country),
 *   plus `EXCLUDE_FLAG` when the word switches the pair off rather than listing it as on. Each
 *   narrowed region is written in whichever form is shorter, all its words in one form: "only
 *   the UK" is one include word, "Europe without the UK" one exclude word.
 *
 * Builds from before a format reject codes in it.
 */

const WORD_COUNT = 6;
const WORD_COUNT_WITH_REGIONS = 7;
const ISO_LETTERS = 26;
const ISO_VALUES = ISO_LETTERS * ISO_LETTERS;
const A_CODE = 'A'.charCodeAt(0);
/** In the regions word: set when the country words are in the pair format. */
const COUNTRY_FORMAT_BIT = BigInt(1) << BigInt(11);
/** In a pair-format country word: the pair is switched off. */
const EXCLUDE_FLAG = 2048;

// BigInt is used for the 72-bit packed value (exceeds JS's 53-bit safe-integer range).
// Literals (`12n`) require an ES2020 target, so the sanctioned `BigInt()` form is used.
const ZERO = BigInt(0);
const ONE = BigInt(1);
const WORD_BITS = BigInt(12);
const WORD_MASK = BigInt(0xfff);

// Bit 0 has no constant because nothing reads or writes it: it is the retired game-mode
// bit, reserved forever. OFFSET_HAND starting at 1 rather than 0 is what holds it open.
const OFFSET_HAND = BigInt(1);
const OFFSET_PLAYER = BigInt(4);
const OFFSET_DIFF = BigInt(7);
const OFFSET_ERA = BigInt(11);
const OFFSET_CATEGORIES = BigInt(19);
const OFFSET_SEED = BigInt(51);
const OFFSET_REGIONS = BigInt(72);

const MASK_3 = BigInt(0x7);
const MASK_DIFF = BigInt(0xf); // 4 bits
const MASK_ERA = BigInt(0xff); // 8 bits
const MASK_CATEGORIES = BigInt(0xffffffff); // 32 bits
const MASK_SEED = BigInt(0x1fffff); // 21 bits

const SEED_RANGE = 2_097_152; // 2^21

export interface ChallengeConfig {
  handSize: number; // 1-8
  playerCount: number; // 1-6
  difficulties: Difficulty[];
  categories: Category[];
  eras: Era[];
  /** Macro-regions in `ALL_REGIONS`; every one of them when the code has no 7th word. */
  regions: string[];
  /** Pairs switched off within those regions (`filterByRegion`); empty with no 8th word. */
  excludedCountries: string[];
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

/** A country's ISO word value (0-675), or undefined for a name with no two-letter ISO code. */
function isoValue(name: string): number | undefined {
  const iso = countryIso(name);
  if (!iso || !/^[A-Z]{2}$/.test(iso)) return undefined;
  return (iso.charCodeAt(0) - A_CODE) * ISO_LETTERS + (iso.charCodeAt(1) - A_CODE);
}

function isoCountry(value: number): string | undefined {
  if (value >= ISO_VALUES) return undefined;
  const iso = String.fromCharCode(
    A_CODE + Math.floor(value / ISO_LETTERS),
    A_CODE + (value % ISO_LETTERS)
  );
  return countryByIso(iso);
}

/** A (region, country) pair's word, without the exclude flag. */
function pairWord(region: string, country: string): number | undefined {
  const iso = isoValue(country);
  const side = countryMacros(country).indexOf(region);
  return iso === undefined || side < 0 ? undefined : iso + ISO_VALUES * side;
}

/**
 * The pair-format words for a selection: per narrowed region, its excluded pairs or its
 * included ones, whichever is fewer. An empty region (everything off) stays in exclude form,
 * since zero include words would read as the whole region.
 */
function countryWords(regions: string[], excluded: string[]): number[] {
  const byRegion = new Map<string, Set<string>>();
  for (const key of pruneExclusions(excluded, regions)) {
    const pair = parsePair(key);
    if (!pair) continue;
    byRegion.set(pair.region, (byRegion.get(pair.region) ?? new Set()).add(pair.country));
  }
  const words: number[] = [];
  for (const [region, off] of byRegion) {
    const on = countriesInRegion(region).filter((c) => !off.has(c));
    const include = on.length > 0 && on.length < off.size;
    for (const country of include ? on : off) {
      const word = pairWord(region, country);
      if (word !== undefined) words.push(include ? word : word + EXCLUDE_FLAG);
    }
  }
  return [...new Set(words)].sort((a, b) => a - b);
}

function bitmaskToArray<T>(mask: bigint, all: readonly T[]): T[] {
  return all.filter((_, i) => ((mask >> BigInt(i)) & ONE) === ONE);
}

/**
 * Encode a challenge config into a hyphenated word-string token.
 */
export function encodeChallengeCode(config: ChallengeConfig): string {
  const handBits = BigInt((config.handSize - 1) & 0x7);
  const playerBits = BigInt((config.playerCount - 1) & 0x7);
  const diffBits = arrayToBitmask(config.difficulties, ALL_DIFFICULTIES) & MASK_DIFF;
  const eraBits = arrayToBitmask(config.eras, ALL_ERAS) & MASK_ERA;
  const catBits = arrayToBitmask(config.categories, ALL_CATEGORIES) & MASK_CATEGORIES;
  const seedBits = BigInt(config.seed & (SEED_RANGE - 1));

  // Bit 0 is left 0 — see the layout note above.
  let packed = ZERO;
  packed |= handBits << OFFSET_HAND;
  packed |= playerBits << OFFSET_PLAYER;
  packed |= diffBits << OFFSET_DIFF;
  packed |= eraBits << OFFSET_ERA;
  packed |= catBits << OFFSET_CATEGORIES;
  packed |= seedBits << OFFSET_SEED;

  const countries = countryWords(config.regions, config.excludedCountries);
  const allRegions = ALL_REGIONS.every((r) => config.regions.includes(r));
  const writeRegions = !allRegions || countries.length > 0;
  if (writeRegions) {
    let regionBits = arrayToBitmask(config.regions, ALL_REGIONS);
    if (countries.length > 0) regionBits |= COUNTRY_FORMAT_BIT;
    packed |= regionBits << OFFSET_REGIONS;
  }

  const wordCount = writeRegions ? WORD_COUNT_WITH_REGIONS : WORD_COUNT;
  const words: string[] = [];
  let shift = ZERO;
  for (let i = 0; i < wordCount; i++) {
    const idx = Number((packed >> shift) & WORD_MASK);
    words.push(WORDLIST.at(idx) ?? '');
    shift += WORD_BITS;
  }
  for (const value of countries) words.push(WORDLIST.at(value) ?? '');
  return words.join('-');
}

/**
 * The regions a token carries: every one for a 6-word code, else the 7th word's mask. A 7th
 * word with no region set, or a bit past the last region other than the format bit, is not a
 * code this app wrote (null).
 */
function decodeRegions(packed: bigint, wordCount: number): string[] | null {
  if (wordCount === WORD_COUNT) return [...ALL_REGIONS];
  const bits = (packed >> OFFSET_REGIONS) & ~COUNTRY_FORMAT_BIT;
  if (bits >> BigInt(ALL_REGIONS.length) !== ZERO) return null;
  const regions = bitmaskToArray(bits, ALL_REGIONS);
  return regions.length > 0 ? regions : null;
}

/**
 * Picks in the first country format: a value that is no known ISO code, a repeat, or a country
 * in none of the decoded regions is not a code this app wrote (null).
 */
function decodeLegacyPicks(values: number[], regions: string[]): string[] | null {
  const countries: string[] = [];
  for (const value of values) {
    const country = isoCountry(value);
    if (!country || countries.includes(country)) return null;
    if (!countryMacros(country).some((r) => regions.includes(r))) return null;
    countries.push(country);
  }
  return legacyPicksToExclusions(regions, countries);
}

/**
 * Pairs in the second format, as exclusions. Rejected (null): an unknown value or side, a
 * repeat, a pair outside the decoded regions, or one region mixing include and exclude words.
 */
function decodePairs(values: number[], regions: string[]): string[] | null {
  const modes = new Map<string, boolean>();
  const listed = new Map<string, Set<string>>();
  for (const value of values) {
    const exclude = value >= EXCLUDE_FLAG;
    const base = exclude ? value - EXCLUDE_FLAG : value;
    const country = isoCountry(base % ISO_VALUES);
    const region = country && countryMacros(country).at(Math.floor(base / ISO_VALUES));
    if (!country || !region || !regions.includes(region)) return null;
    if (modes.has(region) && modes.get(region) !== exclude) return null;
    modes.set(region, exclude);
    const countries = listed.get(region) ?? new Set<string>();
    if (countries.has(country)) return null;
    listed.set(region, countries.add(country));
  }
  const excluded: string[] = [];
  for (const [region, countries] of listed) {
    const off = modes.get(region)
      ? [...countries]
      : countriesInRegion(region).filter((c) => !countries.has(c));
    excluded.push(...off.map((c) => pairKey(region, c)));
  }
  return excluded;
}

/**
 * The exclusions a token's words 8 onward carry, in whichever format the regions word's format
 * bit names. The bit promises country words, so a code that sets it with none is not one this
 * app wrote (null), like any word the format rejects.
 */
function decodeCountryWords(packed: bigint, values: number[], regions: string[]): string[] | null {
  const countryValues = values.slice(WORD_COUNT_WITH_REGIONS);
  const pairFormat = ((packed >> OFFSET_REGIONS) & COUNTRY_FORMAT_BIT) !== ZERO;
  if (!pairFormat) return decodeLegacyPicks(countryValues, regions);
  return countryValues.length > 0 ? decodePairs(countryValues, regions) : null;
}

/**
 * A token's WORDLIST indices, or null when it is too short or has a word not in the list.
 * Accepts a pasted full URL (".../challenge/<token>") as well as a bare token.
 */
function tokenValues(code: string): number[] | null {
  const afterChallenge = code.includes('/challenge/') ? code.split('/challenge/')[1] : code;
  const token = afterChallenge.split(/[/?#]/)[0].trim().toLowerCase();

  const parts = token.split('-');
  if (parts.length < WORD_COUNT) return null;

  const values: number[] = [];
  for (const part of parts) {
    const idx = wordMap.get(part);
    if (idx === undefined) return null;
    values.push(idx);
  }
  return values;
}

/**
 * Decode a token (or a full share URL containing one) into a config, or null if invalid.
 */
export function decodeChallengeCode(code: string): ChallengeConfig | null {
  const values = tokenValues(code);
  if (!values) return null;

  // Only the first 7 words are packed: country words must not reach the regions mask.
  let packed = ZERO;
  let shift = ZERO;
  for (const value of values.slice(0, WORD_COUNT_WITH_REGIONS)) {
    packed |= BigInt(value) << shift;
    shift += WORD_BITS;
  }

  // Bit 0 is deliberately not read. It used to select the removed `freeplay` mode,
  // and roughly half of all share links ever generated set it to 1 — those links now
  // launch a normal sudden-death game rather than failing. The bit itself must stay in
  // the layout: this is a positional format, so reclaiming it would shift every field
  // after it and misdecode every link ever issued, not just the freeplay ones.
  const handSize = Number((packed >> OFFSET_HAND) & MASK_3) + 1;
  const playerCount = Number((packed >> OFFSET_PLAYER) & MASK_3) + 1;
  const difficulties = bitmaskToArray((packed >> OFFSET_DIFF) & MASK_DIFF, ALL_DIFFICULTIES);
  const eras = bitmaskToArray((packed >> OFFSET_ERA) & MASK_ERA, ALL_ERAS);
  const categories = bitmaskToArray(
    (packed >> OFFSET_CATEGORIES) & MASK_CATEGORIES,
    ALL_CATEGORIES
  );
  const seed = Number((packed >> OFFSET_SEED) & MASK_SEED);
  const regions = decodeRegions(packed, Math.min(values.length, WORD_COUNT_WITH_REGIONS));
  const excludedCountries = regions && decodeCountryWords(packed, values, regions);

  // Validate
  if (handSize < 1 || handSize > 8) return null;
  if (playerCount < 1 || playerCount > 6) return null;
  if (difficulties.length === 0) return null;
  if (categories.length === 0) return null;
  if (eras.length === 0) return null;
  if (!regions || !excludedCountries) return null;

  return {
    handSize,
    playerCount,
    difficulties,
    categories,
    eras,
    regions,
    excludedCountries,
    seed,
  };
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
  return {
    mode: 'suddenDeath',
    selectedDifficulties: config.difficulties,
    selectedCategories: config.categories,
    selectedEras: config.eras,
    selectedRegions: config.regions,
    excludedCountries: config.excludedCountries,
    playerCount: config.playerCount,
    playerNames: Array.from({ length: config.playerCount }, (_, i) => `Player ${i + 1}`),
    cardsPerHand: 5,
    suddenDeathHandSize: config.handSize,
  };
}
