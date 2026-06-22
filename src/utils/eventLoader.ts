import { HistoricalEvent, EventManifest, Difficulty, Category, Era } from '../types';
import { ERA_DEFINITIONS } from './eras';
import { isCloudinaryImage } from './cloudinaryImage';

/**
 * Loads all historical events from JSON files in the public/events directory.
 */
async function loadEventFile(file: string): Promise<HistoricalEvent[]> {
  try {
    const response = await fetch(`/events/${file}`);
    if (!response.ok) {
      console.warn(`Failed to load ${file}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.warn(`Error loading ${file}:`, error);
    return [];
  }
}

export async function loadAllEvents(): Promise<HistoricalEvent[]> {
  try {
    const manifestResponse = await fetch('/events/manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load events manifest');
    }
    const manifest: EventManifest = await manifestResponse.json();

    // Event files each hold a mix of categories now, so the manifest is just a flat
    // file list. Each event's own `category` field is the source of truth.
    const files = manifest.files;

    // Load all files in parallel
    const eventArrays = await Promise.all(files.map(loadEventFile));
    const allEvents = eventArrays.flat();

    // Deduplicate by name
    const deduplicatedEvents = deduplicateEvents(allEvents);

    // Only show events that have a custom (Cloudinary) image. Events still backed
    // by legacy Wikimedia thumbnails or no image stay in the JSON but are hidden
    // from play until a custom image is added.
    return deduplicatedEvents.filter((event) => isCloudinaryImage(event.image_url));
  } catch (error) {
    console.error('Failed to load events:', error);
    return [];
  }
}

function deduplicateEvents(events: HistoricalEvent[]): HistoricalEvent[] {
  const seen = new Set<string>();
  const unique: HistoricalEvent[] = [];

  for (const event of events) {
    if (!seen.has(event.name)) {
      seen.add(event.name);
      unique.push(event);
    }
  }

  return unique;
}

/**
 * Filter events by difficulty
 */
export function filterByDifficulty(
  events: HistoricalEvent[],
  difficulties: Difficulty[]
): HistoricalEvent[] {
  return events.filter((e) => difficulties.includes(e.difficulty));
}

/**
 * Filter events by category
 */
export function filterByCategory(
  events: HistoricalEvent[],
  categories: Category[]
): HistoricalEvent[] {
  return events.filter((e) => categories.includes(e.category));
}

/**
 * Filter events by era (time period)
 */
export function filterByEra(events: HistoricalEvent[], eras: Era[]): HistoricalEvent[] {
  return events.filter((event) => {
    return eras.some((era) => {
      const def = ERA_DEFINITIONS.find((d) => d.id === era);
      return def && event.year >= def.startYear && event.year <= def.endYear;
    });
  });
}
