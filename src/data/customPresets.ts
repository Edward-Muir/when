import { DeckSettings, DEFAULT_DECK_SETTINGS } from '../utils/customDeck';

/**
 * The Custom tab's Quick decks: settings objects a tile starts in one tap. A preset is only
 * settings, so a game from one has an ordinary challenge code and the encoding knows nothing
 * of presets. Counts are never stored here: the tile computes them from the catalogue.
 *
 * `eventName` is the one event whose painting the tile shows, always the same one, at the
 * `thumbnail` rung. A fixed event, never a draw from the catalogue, is what keeps the tiles to
 * a handful of Cloudinary images (docs/cloudinary-cost-controls.md). Each must exist, carry art
 * and sit in a manifest file; `customPresets.test.ts` checks all three.
 */
export interface CustomPreset {
  id: string;
  name: string;
  eventName: string;
  settings: DeckSettings;
}

export const CUSTOM_PRESETS: readonly CustomPreset[] = [
  {
    id: 'everything',
    name: 'Everything',
    eventName: 'antikythera-mechanism',
    settings: DEFAULT_DECK_SETTINGS,
  },
  {
    id: 'ancient',
    name: 'Ancient world',
    eventName: 'pyramids',
    settings: { ...DEFAULT_DECK_SETTINGS, selectedEras: ['ancient'] },
  },
  {
    id: 'world-wars',
    name: 'World Wars',
    eventName: 'd-day',
    settings: { ...DEFAULT_DECK_SETTINGS, selectedEras: ['worldWars'] },
  },
];
