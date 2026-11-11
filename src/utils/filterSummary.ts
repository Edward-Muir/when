import { Category, Difficulty, Era, ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ERA_DEFINITIONS } from './eras';
import { ALL_REGIONS } from './regions';
import type { DeckSettings } from './customDeck';

/**
 * What a folded filter row on the Custom tab says, and whether it says something other than
 * the default. Also the source of the Last deck tile's label, so the tile and the rows name a
 * setting the same way.
 */
export interface GroupSummary {
  text: string;
  /** The group differs from the Custom tab's default, so the row shows it in teal. */
  changed: boolean;
  /** How many of the group's options are on. */
  onCount: number;
}

export const DIFFICULTY_NAMES = new Map<Difficulty, string>([
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['very-hard', 'Expert'],
]);

const ERA_NAMES = new Map<Era, string>(ERA_DEFINITIONS.map((e) => [e.id, e.name]));

/** A category id is lowercase ("science"); its chip is capitalised by CSS, a label here. */
export const categoryName = (category: Category): string =>
  category.charAt(0).toUpperCase() + category.slice(1);

export const difficultyName = (d: Difficulty): string => DIFFICULTY_NAMES.get(d) ?? d;
export const eraName = (era: Era): string => ERA_NAMES.get(era) ?? era;

/**
 * One group's summary: "None" when empty, "All N" when every option is on, the option's name
 * when one is, otherwise "n of N". Every group's default is every option on, which is what
 * `changed` compares against.
 */
export function summariseGroup<T>(
  selected: readonly T[],
  all: readonly T[],
  nameOf: (option: T) => string
): GroupSummary {
  const on = all.filter((option) => selected.includes(option));
  const onCount = on.length;
  const changed = onCount !== all.length;
  const text =
    onCount === 0
      ? 'None'
      : !changed
        ? `All ${all.length}`
        : onCount === 1
          ? nameOf(on[0])
          : `${onCount} of ${all.length}`;
  return { text, changed, onCount };
}

export const difficultySummary = (selected: readonly Difficulty[]) =>
  summariseGroup(selected, ALL_DIFFICULTIES, difficultyName);
export const categorySummary = (selected: readonly Category[]) =>
  summariseGroup(selected, ALL_CATEGORIES, categoryName);
export const eraSummary = (selected: readonly Era[]) =>
  summariseGroup(
    selected,
    ERA_DEFINITIONS.map((e) => e.id),
    eraName
  );
export const regionSummary = (selected: readonly string[]) =>
  summariseGroup(selected, ALL_REGIONS, (r) => r);

/**
 * A short name for a deck: the groups that differ from the default, in the order a player
 * thinks of them (what, when, how hard, where), each as its one option or a count
 * ("Science", "Ancient · Easy", "3 categories · Renaissance"). "Custom" when only the
 * countries differ, or nothing does.
 */
export function deckLabel(settings: DeckSettings): string {
  const parts = [
    [categorySummary(settings.selectedCategories), 'categories'],
    [eraSummary(settings.selectedEras), 'eras'],
    [difficultySummary(settings.selectedDifficulties), 'difficulties'],
    [regionSummary(settings.selectedRegions), 'regions'],
  ] as const;
  const named = parts
    .filter(([summary]) => summary.changed)
    .map(([summary, plural]) =>
      summary.onCount > 1 ? `${summary.onCount} ${plural}` : summary.text
    );
  return named.length > 0 ? named.join(' · ') : 'Custom';
}
