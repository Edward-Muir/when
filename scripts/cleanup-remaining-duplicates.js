#!/usr/bin/env node

/**
 * Cleanup remaining duplicates - one-time script
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');

// Specific duplicates to remove
const REMOVALS = {
  'disasters.json': [
    // Remove the second bhola-cyclone (at line ~1515) - keep first one with better description
    { name: 'bhola-cyclone', description: 'A devastating cyclone killed up to 500,000 in East Pakistan.' }
  ],
  'cultural.json': [
    // Remove sistine-chapel-ceiling (keep sistine-chapel)
    { name: 'sistine-chapel-ceiling' },
    // Remove hubble-launched (keep in exploration)
    { name: 'hubble-launched' }
  ],
  'infrastructure.json': [
    // Sistine Chapel completed (1481) is actually different - chapel construction vs ceiling painting (1512)
    // Keep both - they're different events!
  ],
  'exploration.json': [
    // Keep hubble-launch here, remove from cultural
  ]
};

function cleanup() {
  console.log('🧹 Cleaning up remaining duplicates...\n');

  for (const [file, removals] of Object.entries(REMOVALS)) {
    if (removals.length === 0) continue;

    const filePath = path.join(EVENTS_DIR, file);
    let events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const originalCount = events.length;

    for (const removal of removals) {
      events = events.filter(e => {
        // Match by name, and optionally by description for exact duplicate detection
        if (e.name !== removal.name) return true;
        if (removal.description && e.description !== removal.description) return true;
        console.log(`  Removing: "${e.friendly_name}" (${e.name}) from ${file}`);
        return false;
      });
    }

    const removed = originalCount - events.length;
    if (removed > 0) {
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
      console.log(`  → Removed ${removed} event(s) from ${file}\n`);
    }
  }

  console.log('✅ Done!');
}

cleanup();
