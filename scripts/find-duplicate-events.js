#!/usr/bin/env node

/**
 * Find Duplicate Events Script
 *
 * Scans all event JSON files and identifies potential duplicates based on:
 * 1. Exact name matches (same event ID in multiple files)
 * 2. Similar friendly names (fuzzy matching)
 * 3. Same year + similar description
 *
 * Usage: node scripts/find-duplicate-events.js
 */

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');

// Load all events from all JSON files
function loadAllEvents() {
  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const allEvents = [];

  for (const file of files) {
    const filePath = path.join(EVENTS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const event of content) {
      allEvents.push({
        ...event,
        sourceFile: file
      });
    }
  }

  return allEvents;
}

// Normalize text for comparison
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two strings (Levenshtein distance ratio)
function similarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);

  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  // Check if one contains the other
  if (longer.includes(shorter) && shorter.length > 5) {
    return shorter.length / longer.length + 0.3;
  }

  // Levenshtein distance
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

// Find duplicates
function findDuplicates(events) {
  const duplicates = {
    exactNameMatches: [],
    similarFriendlyNames: [],
    nearYearSimilarNames: [],
    sameYearSimilarDescription: []
  };

  // Group by exact name (ID)
  const byName = new Map();
  for (const event of events) {
    if (!byName.has(event.name)) {
      byName.set(event.name, []);
    }
    byName.get(event.name).push(event);
  }

  // Find exact name duplicates
  for (const [name, eventList] of byName) {
    if (eventList.length > 1) {
      duplicates.exactNameMatches.push({
        name,
        events: eventList.map(e => ({
          friendly_name: e.friendly_name,
          year: e.year,
          category: e.category,
          sourceFile: e.sourceFile
        }))
      });
    }
  }

  // Find similar friendly names
  const checked = new Set();
  const nearYearChecked = new Set();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];
      const key = `${e1.name}|${e2.name}`;

      if (checked.has(key)) continue;
      checked.add(key);

      // Skip if already found as exact match
      if (e1.name === e2.name) continue;

      const sim = similarity(e1.friendly_name, e2.friendly_name);
      if (sim > 0.7) {
        duplicates.similarFriendlyNames.push({
          similarity: (sim * 100).toFixed(1) + '%',
          event1: {
            name: e1.name,
            friendly_name: e1.friendly_name,
            year: e1.year,
            category: e1.category,
            sourceFile: e1.sourceFile
          },
          event2: {
            name: e2.name,
            friendly_name: e2.friendly_name,
            year: e2.year,
            category: e2.category,
            sourceFile: e2.sourceFile
          }
        });
      }

      // Check for near-year (within 5 years) with similar names (fuzzy match > 0.6)
      if (!nearYearChecked.has(key)) {
        nearYearChecked.add(key);
        const yearDiff = Math.abs((e1.year || 0) - (e2.year || 0));
        if (yearDiff > 0 && yearDiff <= 5 && sim > 0.6 && sim <= 0.7) {
          duplicates.nearYearSimilarNames.push({
            yearDiff,
            similarity: (sim * 100).toFixed(1) + '%',
            event1: {
              name: e1.name,
              friendly_name: e1.friendly_name,
              year: e1.year,
              category: e1.category,
              sourceFile: e1.sourceFile
            },
            event2: {
              name: e2.name,
              friendly_name: e2.friendly_name,
              year: e2.year,
              category: e2.category,
              sourceFile: e2.sourceFile
            }
          });
        }
      }
    }
  }

  // Find same year with similar description
  const byYear = new Map();
  for (const event of events) {
    if (!byYear.has(event.year)) {
      byYear.set(event.year, []);
    }
    byYear.get(event.year).push(event);
  }

  for (const [year, yearEvents] of byYear) {
    if (yearEvents.length > 1) {
      for (let i = 0; i < yearEvents.length; i++) {
        for (let j = i + 1; j < yearEvents.length; j++) {
          const e1 = yearEvents[i];
          const e2 = yearEvents[j];

          // Skip if already found as exact or similar name
          if (e1.name === e2.name) continue;
          if (similarity(e1.friendly_name, e2.friendly_name) > 0.7) continue;

          const descSim = similarity(e1.description || '', e2.description || '');
          if (descSim > 0.5) {
            duplicates.sameYearSimilarDescription.push({
              year,
              descriptionSimilarity: (descSim * 100).toFixed(1) + '%',
              event1: {
                name: e1.name,
                friendly_name: e1.friendly_name,
                category: e1.category,
                sourceFile: e1.sourceFile,
                description: e1.description
              },
              event2: {
                name: e2.name,
                friendly_name: e2.friendly_name,
                category: e2.category,
                sourceFile: e2.sourceFile,
                description: e2.description
              }
            });
          }
        }
      }
    }
  }

  // Sort similar names by similarity (descending)
  duplicates.similarFriendlyNames.sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));

  // Sort near-year similar names by similarity (descending)
  duplicates.nearYearSimilarNames.sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));

  return duplicates;
}

// Main
function main() {
  console.log('🔍 Scanning for duplicate events...\n');

  const events = loadAllEvents();
  console.log(`📊 Loaded ${events.length} events from ${new Set(events.map(e => e.sourceFile)).size} files\n`);

  const duplicates = findDuplicates(events);

  // Report exact name matches
  if (duplicates.exactNameMatches.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🚨 EXACT NAME DUPLICATES (same event ID in multiple files)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const dup of duplicates.exactNameMatches) {
      console.log(`  Name: "${dup.name}"`);
      for (const e of dup.events) {
        console.log(`    → ${e.sourceFile}: "${e.friendly_name}" (${e.year})`);
      }
      console.log();
    }
  } else {
    console.log('✅ No exact name duplicates found\n');
  }

  // Report similar friendly names
  if (duplicates.similarFriendlyNames.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  SIMILAR FRIENDLY NAMES (possible duplicates)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const dup of duplicates.similarFriendlyNames) {
      console.log(`  Similarity: ${dup.similarity}`);
      console.log(`    1. "${dup.event1.friendly_name}" (${dup.event1.year})`);
      console.log(`       ID: ${dup.event1.name}, File: ${dup.event1.sourceFile}`);
      console.log(`    2. "${dup.event2.friendly_name}" (${dup.event2.year})`);
      console.log(`       ID: ${dup.event2.name}, File: ${dup.event2.sourceFile}`);
      console.log();
    }
  } else {
    console.log('✅ No similar friendly names found\n');
  }

  // Report near-year similar names
  if (duplicates.nearYearSimilarNames.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📆 NEAR-YEAR SIMILAR NAMES (within 5 years, possible duplicates)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const dup of duplicates.nearYearSimilarNames) {
      console.log(`  Similarity: ${dup.similarity}, Year diff: ${dup.yearDiff} years`);
      console.log(`    1. "${dup.event1.friendly_name}" (${dup.event1.year})`);
      console.log(`       ID: ${dup.event1.name}, File: ${dup.event1.sourceFile}`);
      console.log(`    2. "${dup.event2.friendly_name}" (${dup.event2.year})`);
      console.log(`       ID: ${dup.event2.name}, File: ${dup.event2.sourceFile}`);
      console.log();
    }
  } else {
    console.log('✅ No near-year similar names found\n');
  }

  // Report same year similar description
  if (duplicates.sameYearSimilarDescription.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📅 SAME YEAR + SIMILAR DESCRIPTION (potential duplicates)');
    console.log('═══════════════════════════════════════════════════════════════\n');

    for (const dup of duplicates.sameYearSimilarDescription) {
      console.log(`  Year: ${dup.year}, Description similarity: ${dup.descriptionSimilarity}`);
      console.log(`    1. "${dup.event1.friendly_name}"`);
      console.log(`       ID: ${dup.event1.name}, File: ${dup.event1.sourceFile}`);
      console.log(`    2. "${dup.event2.friendly_name}"`);
      console.log(`       ID: ${dup.event2.name}, File: ${dup.event2.sourceFile}`);
      console.log();
    }
  } else {
    console.log('✅ No same-year similar-description events found\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Total events scanned: ${events.length}`);
  console.log(`  Exact name duplicates: ${duplicates.exactNameMatches.length}`);
  console.log(`  Similar friendly names: ${duplicates.similarFriendlyNames.length}`);
  console.log(`  Near-year similar names: ${duplicates.nearYearSimilarNames.length}`);
  console.log(`  Same year + similar description: ${duplicates.sameYearSimilarDescription.length}`);

  const total = duplicates.exactNameMatches.length + duplicates.similarFriendlyNames.length + duplicates.nearYearSimilarNames.length + duplicates.sameYearSimilarDescription.length;
  if (total > 0) {
    console.log(`\n⚠️  Found ${total} potential duplicate issues to review`);
    process.exit(1);
  } else {
    console.log('\n✅ No duplicates found!');
    process.exit(0);
  }
}

main();
