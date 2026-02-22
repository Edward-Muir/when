export type Category = string;

export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard';

export const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'very-hard'];

export interface HistoricalEvent {
  name: string;
  friendly_name: string;
  year: number;
  category: Category;
  description: string;
  difficulty: Difficulty;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  wikipedia_views?: number;
  wikipedia_url?: string;
}

export interface DeprecatedEvent extends HistoricalEvent {
  _originalCategory: Category;
  _deprecatedAt: string;
}

export type EventsByCategory = Record<string, HistoricalEvent[]> & {
  deprecated: DeprecatedEvent[];
};

export type CategoryOrDeprecated = string;

export interface WikiSearchResult {
  title: string;
  description: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
