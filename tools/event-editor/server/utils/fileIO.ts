import fs from 'fs/promises';
import path from 'path';
import { markSelfWrite } from './fileWatcher.js';
import { EVENTS_DIR, DEPRECATED_FILE } from './paths.js';

export { EVENTS_DIR, DEPRECATED_FILE };

export interface HistoricalEvent {
  name: string;
  friendly_name: string;
  year: number;
  category: string;
  description: string;
  difficulty: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  wikipedia_views?: number;
  wikipedia_url?: string;
}

export interface DeprecatedEvent extends HistoricalEvent {
  _originalCategory: string;
  _deprecatedAt: string;
}

/**
 * Read events from a JSON file
 */
export async function readEventFile(filename: string): Promise<HistoricalEvent[]> {
  const filepath = path.join(EVENTS_DIR, filename);
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

/**
 * Write events to a JSON file with automatic backup
 */
export async function writeEventFile(
  filename: string,
  events: HistoricalEvent[],
  createBackup = true
): Promise<void> {
  const filepath = path.join(EVENTS_DIR, filename);

  // Create backup before writing
  if (createBackup) {
    try {
      await fs.access(filepath);
      const backupDir = path.join(EVENTS_DIR, 'backups');
      await fs.mkdir(backupDir, { recursive: true });
      const backupFilename = filename.replace('.json', `.backup-${Date.now()}.json`);
      await fs.copyFile(filepath, path.join(backupDir, backupFilename));
    } catch {
      // File doesn't exist yet, no backup needed
    }
  }

  // Mark as self-triggered so the file watcher ignores this change
  markSelfWrite();

  // Write with pretty printing
  await fs.writeFile(filepath, JSON.stringify(events, null, 2) + '\n');
}

/**
 * Get all category files from manifest
 */
export async function getCategoryFiles(): Promise<string[]> {
  const manifestPath = path.join(EVENTS_DIR, 'manifest.json');
  const content = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  const files: string[] = [];
  for (const cat of manifest.categories) {
    files.push(...cat.files);
  }
  return files;
}

/**
 * Read all events from all category files
 */
export async function readAllEvents(): Promise<Record<string, HistoricalEvent[]>> {
  const categoryFiles = await getCategoryFiles();

  const result: Record<string, HistoricalEvent[]> = {};

  for (const file of categoryFiles) {
    const category = file.replace('.json', '');
    result[category] = await readEventFile(file);
  }

  // Also read deprecated events
  result.deprecated = await readEventFile('deprecated.json');

  return result;
}

/**
 * Move event to deprecated file
 */
export async function deprecateEvent(
  event: HistoricalEvent,
  originalCategory: string
): Promise<void> {
  const deprecated = (await readEventFile('deprecated.json')) as DeprecatedEvent[];

  const deprecatedEvent: DeprecatedEvent = {
    ...event,
    _originalCategory: originalCategory,
    _deprecatedAt: new Date().toISOString(),
  };

  deprecated.push(deprecatedEvent);
  await writeEventFile('deprecated.json', deprecated);
}

/**
 * Remove event from a category file
 */
export async function removeEventFromCategory(category: string, eventName: string): Promise<void> {
  const filename = `${category}.json`;
  const events = await readEventFile(filename);
  const filtered = events.filter((e) => e.name !== eventName);
  await writeEventFile(filename, filtered);
}

/**
 * Find event in a category
 */
export async function findEventInCategory(
  category: string,
  eventName: string
): Promise<HistoricalEvent | null> {
  const filename = `${category}.json`;
  const events = await readEventFile(filename);
  return events.find((e) => e.name === eventName) || null;
}

/**
 * Update event in a category
 */
export async function updateEventInCategory(
  category: string,
  eventName: string,
  updates: HistoricalEvent
): Promise<void> {
  const filename = `${category}.json`;
  const events = await readEventFile(filename);

  const index = events.findIndex((e) => e.name === eventName);
  if (index === -1) {
    throw new Error(`Event "${eventName}" not found in category "${category}"`);
  }

  events[index] = updates;
  await writeEventFile(filename, events);
}

/**
 * Add event to a category
 */
export async function addEventToCategory(category: string, event: HistoricalEvent): Promise<void> {
  const filename = `${category}.json`;
  const events = await readEventFile(filename);

  // Check for duplicate name
  if (events.some((e) => e.name === event.name)) {
    throw new Error(`Event with name "${event.name}" already exists in "${category}"`);
  }

  events.push(event);

  // Sort by year for consistency
  events.sort((a, b) => a.year - b.year);

  await writeEventFile(filename, events);
}

/**
 * Move event between categories
 */
export async function moveEventBetweenCategories(
  eventName: string,
  fromCategory: string,
  toCategory: string
): Promise<void> {
  // Find event in source category
  const event = await findEventInCategory(fromCategory, eventName);
  if (!event) {
    throw new Error(`Event "${eventName}" not found in category "${fromCategory}"`);
  }

  // Update category field
  const updatedEvent = { ...event, category: toCategory };

  // Remove from source
  await removeEventFromCategory(fromCategory, eventName);

  // Add to target
  await addEventToCategory(toCategory, updatedEvent);
}
