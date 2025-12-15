#!/usr/bin/env node

/**
 * Remove Duplicate Events Script
 *
 * Removes duplicate events from the event JSON files.
 * Strategy:
 * - For exact name duplicates: Keep the version in the most appropriate category
 * - For similar names (different IDs): Keep both but flag for manual review
 *
 * Usage: node scripts/remove-duplicate-events.js
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');

// Category priority - when an event exists in multiple categories,
// keep it in the most appropriate one based on event type
const CATEGORY_PRIORITY = {
  // Conflicts/Wars belong in conflict
  'conflict': ['war', 'battle', 'siege', 'attack', 'bombing', 'revolution', 'rebellion', 'invasion', 'assassination'],
  // Treaties/Political agreements belong in diplomatic
  'diplomatic': ['treaty', 'agreement', 'founded', 'independence', 'act', 'constitution', 'charter', 'declaration', 'rights'],
  // Disasters belong in disasters
  'disasters': ['disaster', 'earthquake', 'tsunami', 'eruption', 'fire', 'crash', 'pandemic', 'plague', 'hurricane', 'flood', 'explosion', 'accident', 'sinking'],
  // Scientific discoveries belong in exploration
  'exploration': ['discovered', 'invented', 'publishes', 'theory', 'vaccine', 'landing', 'flight', 'voyage', 'expedition'],
  // Cultural/artistic achievements belong in cultural
  'cultural': ['published', 'born', 'dies', 'founded', 'opens', 'released', 'premiered', 'awarded'],
  // Buildings/Infrastructure belong in infrastructure
  'infrastructure': ['completed', 'built', 'opened', 'constructed', 'bridge', 'tower', 'canal', 'railroad', 'highway']
};

// Load all events from all JSON files
function loadAllEvents() {
  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const eventsByFile = {};

  for (const file of files) {
    const filePath = path.join(EVENTS_DIR, file);
    eventsByFile[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  return eventsByFile;
}

// Determine the best category for an event based on its content
function getBestCategory(event, categories) {
  const searchText = `${event.friendly_name} ${event.description || ''}`.toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_PRIORITY)) {
    if (categories.includes(`${category}.json`)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          return `${category}.json`;
        }
      }
    }
  }

  // Default: return the first category (alphabetically)
  return categories.sort()[0];
}

// Normalize text for comparison
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two strings
function similarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  if (longer.includes(shorter) && shorter.length > 5) {
    return shorter.length / longer.length + 0.3;
  }

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1[i - 1] !== s2[j - 1]) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }

  return (longer.length - costs[s2.length]) / longer.length;
}

// Find and remove duplicates
function removeDuplicates(eventsByFile) {
  const stats = {
    exactDuplicatesRemoved: 0,
    similarDuplicatesRemoved: 0,
    totalEventsRemoved: 0
  };

  // Build a map of all events by name
  const eventsByName = new Map();
  for (const [file, events] of Object.entries(eventsByFile)) {
    for (const event of events) {
      if (!eventsByName.has(event.name)) {
        eventsByName.set(event.name, []);
      }
      eventsByName.get(event.name).push({ ...event, sourceFile: file });
    }
  }

  // Find exact duplicates and decide which to remove
  const toRemove = new Map(); // file -> Set of event names to remove

  for (const [name, eventList] of eventsByName) {
    if (eventList.length > 1) {
      const files = eventList.map(e => e.sourceFile);
      const bestFile = getBestCategory(eventList[0], files);

      for (const event of eventList) {
        if (event.sourceFile !== bestFile) {
          if (!toRemove.has(event.sourceFile)) {
            toRemove.set(event.sourceFile, new Set());
          }
          toRemove.get(event.sourceFile).add(name);
          stats.exactDuplicatesRemoved++;
        }
      }
    }
  }

  // Now find similar names (different IDs) - events that are likely the same thing
  // Group by similar friendly names
  const allEvents = [];
  for (const [file, events] of Object.entries(eventsByFile)) {
    for (const event of events) {
      allEvents.push({ ...event, sourceFile: file });
    }
  }

  // Find very similar events (>85% similarity) with different IDs
  const similarGroups = [];
  const processed = new Set();

  for (let i = 0; i < allEvents.length; i++) {
    if (processed.has(i)) continue;

    const group = [i];
    for (let j = i + 1; j < allEvents.length; j++) {
      if (processed.has(j)) continue;

      const e1 = allEvents[i];
      const e2 = allEvents[j];

      // Skip if same name (already handled above)
      if (e1.name === e2.name) continue;

      // Check for very high similarity in friendly name
      const nameSim = similarity(e1.friendly_name, e2.friendly_name);

      // Also check if same year and similar description
      const sameYear = e1.year === e2.year;
      const descSim = similarity(e1.description || '', e2.description || '');

      if (nameSim > 0.85 || (sameYear && descSim > 0.7 && nameSim > 0.6)) {
        group.push(j);
        processed.add(j);
      }
    }

    if (group.length > 1) {
      similarGroups.push(group.map(idx => allEvents[idx]));
    }
    processed.add(i);
  }

  // For similar groups, keep the one with the best data (longest description, has image)
  for (const group of similarGroups) {
    // Sort by quality: prefer events with images and longer descriptions
    group.sort((a, b) => {
      const aScore = (a.image_url ? 10 : 0) + (a.description?.length || 0);
      const bScore = (b.image_url ? 10 : 0) + (b.description?.length || 0);
      return bScore - aScore;
    });

    // Keep the first one, remove the rest
    for (let i = 1; i < group.length; i++) {
      const event = group[i];
      if (!toRemove.has(event.sourceFile)) {
        toRemove.set(event.sourceFile, new Set());
      }
      // Only remove if not already being removed and not the same as keeper
      if (!toRemove.get(event.sourceFile).has(event.name)) {
        toRemove.get(event.sourceFile).add(event.name);
        stats.similarDuplicatesRemoved++;
        console.log(`  Removing similar: "${event.friendly_name}" (${event.name}) from ${event.sourceFile}`);
        console.log(`    Keeping: "${group[0].friendly_name}" (${group[0].name}) in ${group[0].sourceFile}`);
      }
    }
  }

  // Apply removals
  for (const [file, events] of Object.entries(eventsByFile)) {
    const namesToRemove = toRemove.get(file) || new Set();
    const originalCount = events.length;
    eventsByFile[file] = events.filter(e => !namesToRemove.has(e.name));
    const removed = originalCount - eventsByFile[file].length;
    if (removed > 0) {
      console.log(`Removed ${removed} events from ${file}`);
    }
  }

  stats.totalEventsRemoved = stats.exactDuplicatesRemoved + stats.similarDuplicatesRemoved;
  return stats;
}

// Save events back to files
function saveEvents(eventsByFile) {
  for (const [file, events] of Object.entries(eventsByFile)) {
    const filePath = path.join(EVENTS_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
    console.log(`Saved ${events.length} events to ${file}`);
  }
}

// Main
function main() {
  console.log('🧹 Removing duplicate events...\n');

  const eventsByFile = loadAllEvents();

  let totalBefore = 0;
  for (const events of Object.values(eventsByFile)) {
    totalBefore += events.length;
  }
  console.log(`📊 Total events before: ${totalBefore}\n`);

  console.log('Analyzing duplicates...\n');
  const stats = removeDuplicates(eventsByFile);

  console.log('\n💾 Saving cleaned files...\n');
  saveEvents(eventsByFile);

  let totalAfter = 0;
  for (const events of Object.values(eventsByFile)) {
    totalAfter += events.length;
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📋 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Events before: ${totalBefore}`);
  console.log(`  Events after: ${totalAfter}`);
  console.log(`  Exact duplicates removed: ${stats.exactDuplicatesRemoved}`);
  console.log(`  Similar duplicates removed: ${stats.similarDuplicatesRemoved}`);
  console.log(`  Total removed: ${stats.totalEventsRemoved}`);
  console.log('\n✅ Done! Run npm run find-duplicates to verify.');
}

main();
