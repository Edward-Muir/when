import { HistoricalEvent, EventManifest } from '../types';

/**
 * Loads all historical events from JSON files in the public/events directory.
 */
export async function loadAllEvents(): Promise<HistoricalEvent[]> {
  try {
    const manifestResponse = await fetch('/events/manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load events manifest');
    }
    const manifest: EventManifest = await manifestResponse.json();

    const allEvents: HistoricalEvent[] = [];

    for (const category of manifest.categories) {
      for (const file of category.files) {
        try {
          const response = await fetch(`/events/${file}`);
          if (response.ok) {
            const events: HistoricalEvent[] = await response.json();
            allEvents.push(...events);
          } else {
            console.warn(`Failed to load ${file}`);
          }
        } catch (error) {
          console.warn(`Error loading ${file}:`, error);
        }
      }
    }

    // Deduplicate by name
    const deduplicatedEvents = deduplicateEvents(allEvents);
    console.log(`Loaded ${deduplicatedEvents.length} unique events`);
    return deduplicatedEvents;
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
