export type Category =
  | 'conflict'
  | 'disasters'
  | 'exploration'
  | 'cultural'
  | 'infrastructure'
  | 'diplomatic';

export const ALL_CATEGORIES: Category[] = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
];

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

export interface EventsByCategory {
  conflict: HistoricalEvent[];
  cultural: HistoricalEvent[];
  diplomatic: HistoricalEvent[];
  disasters: HistoricalEvent[];
  exploration: HistoricalEvent[];
  infrastructure: HistoricalEvent[];
  deprecated: DeprecatedEvent[];
}

export type CategoryOrDeprecated = Category | 'deprecated';

export interface WikiSearchResult {
  title: string;
  description: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}
