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

// Module-level cache. Events are static for a session, so the first successful load is
// reused for the lifetime of the SPA — this is what lets a remount (e.g. navigating Home
// from /stats or /achievements) start instantly instead of re-fetching and flashing the
// loading screen. Only non-empty results are cached so a failed/empty load can still retry.
let cachedEvents: HistoricalEvent[] | null = null;
let inflight: Promise<HistoricalEvent[]> | null = null;

/** Synchronous peek at the cache (null until the first successful load). */
export function getCachedEvents(): HistoricalEvent[] | null {
  return cachedEvents;
}

export async function loadAllEvents(): Promise<HistoricalEvent[]> {
  if (cachedEvents) return cachedEvents;
  if (inflight) return inflight;

  inflight = (async () => {
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
      const events = deduplicatedEvents.filter((event) => isCloudinaryImage(event.image_url));
      if (events.length > 0) cachedEvents = events;
      return events;
    } catch (error) {
      console.error('Failed to load events:', error);
      return [];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** An event annotated with the source file (without `.json`) it was loaded from. */
export type EventWithSource = HistoricalEvent & { sourceFile: string };

/**
 * Load every event from every file WITHOUT the play-time filters (no Cloudinary-image
 * requirement, no name-dedup), each tagged with its source file. Used by dev tooling —
 * e.g. the `/admin/dedup` review page — that needs to see hidden/no-image events too and
 * know which JSON file each lives in. Not cached: dev-only, called rarely.
 */
export async function loadAllEventsUnfiltered(): Promise<EventWithSource[]> {
  try {
    const manifestResponse = await fetch('/events/manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load events manifest');
    }
    const manifest: EventManifest = await manifestResponse.json();
    const eventArrays = await Promise.all(
      manifest.files.map(async (file) => {
        const events = await loadEventFile(file);
        const sourceFile = file.replace(/\.json$/, '');
        return events.map((event) => ({ ...event, sourceFile }));
      })
    );
    return eventArrays.flat();
  } catch (error) {
    console.error('Failed to load events (unfiltered):', error);
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
