#!/usr/bin/env node

/**
 * Export Friendly Names
 *
 * Extracts all friendly_name values from event JSON files
 * and writes them to a single text file.
 *
 * Usage:
 *   node scripts/export-friendly-names.js
 *
 * Output:
 *   scripts/outputs/friendly-names.txt
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const OUTPUT_FILE = path.join(__dirname, 'outputs/friendly-names.txt');

function loadManifest() {
  const manifestPath = path.join(EVENTS_DIR, 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function loadEvents(filename) {
  const filePath = path.join(EVENTS_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function main() {
  const manifest = loadManifest();
  const allEvents = [];

  for (const category of manifest.categories) {
    for (const file of category.files) {
      const events = loadEvents(file);
      for (const event of events) {
        if (event.friendly_name && event.year !== undefined) {
          allEvents.push({ year: event.year, name: event.friendly_name });
        }
      }
    }
  }

  // Sort by year
  allEvents.sort((a, b) => a.year - b.year);

  // Format as "year, friendly_name"
  const lines = allEvents.map((e) => `${e.year}, ${e.name}`);

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, lines.join('\n') + '\n', 'utf-8');

  console.log(`Exported ${allEvents.length} events to ${OUTPUT_FILE}`);
}

main();