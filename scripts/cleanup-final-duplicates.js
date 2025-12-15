#!/usr/bin/env node

/**
 * Final cleanup - remove remaining true duplicates identified by same year + similar description
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');

// True duplicates to remove (keeping the one with better data/name)
const REMOVALS = {
  'conflict.json': [
    'berlin-wall-fall' // Keep berlin-wall-falls in diplomatic
  ],
  'exploration.json': [
    'bell-telephone',      // Keep telephone-invented
    'copernicus',          // Keep copernicus-heliocentric (more descriptive)
    'vaccination',         // Keep vaccination-invented
    'wheel-invented'       // Keep wheel-invention in infrastructure
  ],
  'cultural.json': [
    'origin-of-species'    // Keep darwin-evolution in exploration
  ],
  'disasters.json': [
    'santorini-eruption',  // Keep thera-eruption (Thera is the ancient name, more commonly known)
    'wall-street-crash'    // Keep stock-crash (more generic/recognizable)
  ]
};

// Also handle phonograph and luther's theses - these are borderline but let's clean them
const ADDITIONAL_REMOVALS = {
  'exploration.json': [
    'edison-phonograph'    // Keep phonograph-invented in cultural
  ],
  'cultural.json': [
    'luther-theses'        // Keep protestant-reformation (same event, broader name)
  ]
};

function cleanup() {
  console.log('🧹 Final duplicate cleanup...\n');

  const allRemovals = {};
  for (const [file, names] of Object.entries(REMOVALS)) {
    allRemovals[file] = [...(allRemovals[file] || []), ...names];
  }
  for (const [file, names] of Object.entries(ADDITIONAL_REMOVALS)) {
    allRemovals[file] = [...(allRemovals[file] || []), ...names];
  }

  let totalRemoved = 0;

  for (const [file, namesToRemove] of Object.entries(allRemovals)) {
    const filePath = path.join(EVENTS_DIR, file);
    let events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const originalCount = events.length;

    events = events.filter(e => {
      if (namesToRemove.includes(e.name)) {
        console.log(`  Removing: "${e.friendly_name}" (${e.name}) from ${file}`);
        return false;
      }
      return true;
    });

    const removed = originalCount - events.length;
    if (removed > 0) {
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
      totalRemoved += removed;
    }
  }

  console.log(`\n✅ Removed ${totalRemoved} duplicate events!`);
}

cleanup();
