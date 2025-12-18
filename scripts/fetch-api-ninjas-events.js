#!/usr/bin/env node

/**
 * Fetch Historical Events from API Ninjas
 *
 * Queries the API Ninjas Historical Events API and outputs new events
 * that don't already exist in the game's event files.
 *
 * Usage:
 *   API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-events.js --year=1776
 *   API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-events.js --text="world war"
 *   API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-events.js --year=1900 --year=2000
 *   API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-events.js --range=1900-1950
 *
 * Get your free API key at: https://api-ninjas.com/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const API_BASE = 'https://api.api-ninjas.com/v1/historicalevents';

// Category keywords for auto-classification
const CATEGORY_KEYWORDS = {
  conflict: [
    'war', 'battle', 'invasion', 'siege', 'attack', 'military', 'army', 'navy',
    'revolution', 'rebellion', 'uprising', 'coup', 'assassination', 'bombing',
    'troops', 'soldier', 'fought', 'victory', 'defeat', 'surrender', 'combat',
    'conflict', 'offensive', 'campaign', 'conquered', 'capture'
  ],
  diplomatic: [
    'treaty', 'alliance', 'agreement', 'peace', 'diplomatic', 'ambassador',
    'negotiation', 'summit', 'conference', 'united nations', 'signed', 'pact',
    'declaration', 'independence', 'constitution', 'law', 'act', 'congress',
    'parliament', 'president', 'king', 'queen', 'emperor', 'government',
    'election', 'vote', 'political', 'reform', 'rights'
  ],
  disasters: [
    'earthquake', 'tsunami', 'hurricane', 'tornado', 'flood', 'fire', 'famine',
    'plague', 'epidemic', 'pandemic', 'disaster', 'explosion', 'crash', 'sinking',
    'accident', 'killed', 'died', 'death toll', 'victims', 'eruption', 'volcano',
    'drought', 'storm', 'cyclone', 'catastrophe'
  ],
  exploration: [
    'discover', 'exploration', 'explorer', 'expedition', 'voyage', 'landed',
    'reached', 'first', 'moon', 'space', 'astronaut', 'nasa', 'orbit', 'rocket',
    'satellite', 'mission', 'pioneer', 'circumnavigate', 'arctic', 'antarctic',
    'ocean', 'mountain', 'everest', 'deep sea'
  ],
  infrastructure: [
    'built', 'construction', 'bridge', 'railway', 'railroad', 'canal', 'dam',
    'building', 'skyscraper', 'tower', 'opened', 'completed', 'inaugurated',
    'invention', 'invented', 'patent', 'telephone', 'telegraph', 'radio',
    'television', 'internet', 'computer', 'engine', 'electricity', 'power',
    'factory', 'industry', 'company', 'founded', 'established', 'airline',
    'airport', 'highway', 'tunnel', 'subway', 'metro'
  ],
  cultural: [
    'art', 'artist', 'painting', 'music', 'composer', 'symphony', 'opera',
    'theater', 'theatre', 'film', 'movie', 'book', 'novel', 'author', 'poet',
    'literature', 'published', 'wrote', 'university', 'school', 'education',
    'science', 'scientist', 'theory', 'nobel', 'prize', 'award', 'olympics',
    'sport', 'championship', 'world cup', 'record', 'museum', 'exhibition',
    'religion', 'church', 'pope', 'cathedral'
  ]
};

// Load all existing events
function loadExistingEvents() {
  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
  const events = new Map();

  for (const file of files) {
    const filePath = path.join(EVENTS_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const event of content) {
      // Store by normalized name and by year for duplicate detection
      events.set(event.name, event);

      // Also store a normalized version of friendly_name for fuzzy matching
      const normalizedName = normalize(event.friendly_name);
      events.set(`friendly:${normalizedName}`, event);
    }
  }

  return events;
}

// Normalize text for comparison
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Generate a slug from event text
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/-+$/, '');
}

// Classify event into a category
function classifyEvent(eventText) {
  const text = eventText.toLowerCase();
  const scores = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        scores[category]++;
      }
    }
  }

  // Find highest scoring category
  let maxScore = 0;
  let bestCategory = 'cultural'; // Default

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Estimate difficulty based on year and obscurity
function estimateDifficulty(year, eventText) {
  const text = eventText.toLowerCase();

  // Famous events are easier
  const famousKeywords = [
    'world war', 'declaration of independence', 'moon landing', 'titanic',
    'columbus', 'napoleon', 'civil war', 'french revolution', 'pearl harbor',
    'berlin wall', 'd-day', 'hiroshima', 'magna carta', 'renaissance'
  ];

  for (const keyword of famousKeywords) {
    if (text.includes(keyword)) {
      return 'easy';
    }
  }

  // Very old or very recent events are harder
  if (year < -500 || (year > 0 && year < 500)) {
    return 'hard';
  }

  // Modern events (post-1900) that people might know
  if (year >= 1900 && year <= 2000) {
    return 'medium';
  }

  return 'medium';
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

// Check if event is likely a duplicate (fuzzy match within ±5 years)
function isDuplicate(eventText, year, existingEvents) {
  const normalized = normalize(eventText);
  const YEAR_WINDOW = 5;
  const SIMILARITY_THRESHOLD = 0.6;

  // Check exact friendly name match
  if (existingEvents.has(`friendly:${normalized}`)) {
    return { isDup: true, reason: 'exact name match' };
  }

  // Check for similar events within ±5 years
  for (const [key, existing] of existingEvents) {
    if (key.startsWith('friendly:')) continue;

    // Check if within year window
    const yearDiff = Math.abs(existing.year - year);
    if (yearDiff > YEAR_WINDOW) continue;

    const existingNorm = normalize(existing.friendly_name);

    // Check if one contains the other
    if (normalized.includes(existingNorm) || existingNorm.includes(normalized)) {
      if (existingNorm.length > 5 || normalized.length > 5) {
        return {
          isDup: true,
          reason: `contains match (year diff: ${yearDiff})`,
          existing: existing.friendly_name
        };
      }
    }

    // Check fuzzy similarity using Levenshtein
    const sim = similarity(eventText, existing.friendly_name);
    if (sim >= SIMILARITY_THRESHOLD) {
      return {
        isDup: true,
        reason: `fuzzy match ${(sim * 100).toFixed(0)}% (year diff: ${yearDiff})`,
        existing: existing.friendly_name
      };
    }

    // Check word overlap for longer texts
    const words1 = new Set(normalized.split(' ').filter(w => w.length > 3));
    const words2 = new Set(existingNorm.split(' ').filter(w => w.length > 3));
    const overlap = [...words1].filter(w => words2.has(w)).length;

    if (overlap >= 3 && overlap >= Math.min(words1.size, words2.size) * 0.5) {
      return {
        isDup: true,
        reason: `word overlap ${overlap} words (year diff: ${yearDiff})`,
        existing: existing.friendly_name
      };
    }
  }

  return { isDup: false };
}

// Make API request
function fetchEvents(params, apiKey) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Convert API response to game event format
function convertToGameEvent(apiEvent, existingEvents, verbose = false) {
  const year = parseInt(apiEvent.year);
  const eventText = apiEvent.event;

  // Skip if duplicate
  const dupCheck = isDuplicate(eventText, year, existingEvents);
  if (dupCheck.isDup) {
    if (verbose) {
      console.log(`    SKIP: "${eventText.substring(0, 50)}..." - ${dupCheck.reason}`);
      if (dupCheck.existing) {
        console.log(`          Matches: "${dupCheck.existing}"`);
      }
    }
    return null;
  }

  // Create a friendly name (first ~60 chars, ending at word boundary)
  let friendlyName = eventText;
  if (friendlyName.length > 60) {
    friendlyName = friendlyName.substring(0, 60);
    const lastSpace = friendlyName.lastIndexOf(' ');
    if (lastSpace > 30) {
      friendlyName = friendlyName.substring(0, lastSpace);
    }
  }

  const category = classifyEvent(eventText);
  const difficulty = estimateDifficulty(year, eventText);
  const slug = generateSlug(friendlyName);

  return {
    name: slug,
    friendly_name: friendlyName,
    year: year,
    category: category,
    description: eventText,
    difficulty: difficulty
  };
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    years: [],
    text: null,
    range: null,
    offset: 0,
    verbose: false,
    output: null,
    add: false
  };

  for (const arg of args) {
    if (arg.startsWith('--year=')) {
      params.years.push(parseInt(arg.split('=')[1]));
    } else if (arg.startsWith('--text=')) {
      params.text = arg.split('=')[1];
    } else if (arg.startsWith('--range=')) {
      const [start, end] = arg.split('=')[1].split('-').map(Number);
      params.range = { start, end };
    } else if (arg.startsWith('--offset=')) {
      params.offset = parseInt(arg.split('=')[1]);
    } else if (arg === '--verbose' || arg === '-v') {
      params.verbose = true;
    } else if (arg.startsWith('--output=') || arg.startsWith('-o=')) {
      params.output = arg.split('=')[1];
    } else if (arg === '--add') {
      params.add = true;
    }
  }

  return params;
}

// Add events to category files
function addEventsToFiles(byCategory) {
  for (const [category, newEvents] of Object.entries(byCategory)) {
    const filePath = path.join(EVENTS_DIR, `${category}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`  Creating new file: ${category}.json`);
      fs.writeFileSync(filePath, JSON.stringify(newEvents, null, 2));
    } else {
      const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const merged = [...existing, ...newEvents];
      // Sort by year
      merged.sort((a, b) => a.year - b.year);
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
      console.log(`  Added ${newEvents.length} events to ${category}.json (total: ${merged.length})`);
    }
  }
}

// Main
async function main() {
  const apiKey = process.env.API_NINJAS_KEY;

  if (!apiKey) {
    console.error('Error: API_NINJAS_KEY environment variable is required');
    console.error('Get your free API key at: https://api-ninjas.com/');
    console.error('\nUsage: API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-events.js --year=1776');
    process.exit(1);
  }

  const args = parseArgs();

  if (args.years.length === 0 && !args.text && !args.range) {
    console.error('Error: Please specify --year=YYYY, --text="search term", or --range=START-END');
    console.error('\nExamples:');
    console.error('  node scripts/fetch-api-ninjas-events.js --year=1776');
    console.error('  node scripts/fetch-api-ninjas-events.js --text="world war"');
    console.error('  node scripts/fetch-api-ninjas-events.js --range=1900-1950');
    console.error('  node scripts/fetch-api-ninjas-events.js --year=1776 --offset=10');
    process.exit(1);
  }

  console.log('Loading existing events...');
  const existingEvents = loadExistingEvents();
  console.log(`Loaded ${existingEvents.size / 2} existing events\n`);

  const allNewEvents = [];

  // Build list of queries
  const queries = [];

  if (args.range) {
    // Generate years in range (sample every 10 years for larger ranges)
    const { start, end } = args.range;
    const step = (end - start) > 100 ? 10 : (end - start) > 50 ? 5 : 1;
    for (let year = start; year <= end; year += step) {
      queries.push({ year: year.toString() });
    }
  } else if (args.years.length > 0) {
    for (const year of args.years) {
      queries.push({ year: year.toString() });
    }
  }

  if (args.text) {
    queries.push({ text: args.text, offset: args.offset });
  }

  // Execute queries
  for (const query of queries) {
    const queryDesc = query.year ? `year ${query.year}` : `text "${query.text}"`;
    console.log(`Fetching events for ${queryDesc}...`);

    try {
      const results = await fetchEvents(query, apiKey);

      if (results.length === 0) {
        console.log(`  No results found\n`);
        continue;
      }

      console.log(`  Found ${results.length} events from API`);

      let newCount = 0;
      for (const apiEvent of results) {
        const gameEvent = convertToGameEvent(apiEvent, existingEvents, args.verbose);
        if (gameEvent) {
          allNewEvents.push(gameEvent);
          // Add to existing to prevent duplicates within this run
          existingEvents.set(gameEvent.name, gameEvent);
          existingEvents.set(`friendly:${normalize(gameEvent.friendly_name)}`, gameEvent);
          newCount++;
        }
      }

      console.log(`  ${newCount} new events (${results.length - newCount} duplicates skipped)\n`);

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
    }
  }

  // Output results
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`FOUND ${allNewEvents.length} NEW EVENTS`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (allNewEvents.length === 0) {
    console.log('No new events found. Try different search parameters.');
    return;
  }

  // Group by category
  const byCategory = {};
  for (const event of allNewEvents) {
    if (!byCategory[event.category]) {
      byCategory[event.category] = [];
    }
    byCategory[event.category].push(event);
  }

  // If --add flag, add events directly to category files
  if (args.add) {
    console.log('Adding events to category files...\n');
    addEventsToFiles(byCategory);
    console.log('\nDone! Events have been added to the game.');
    return;
  }

  // If --output flag, save to file
  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.writeFileSync(outputPath, JSON.stringify(allNewEvents, null, 2));
    console.log(`Saved ${allNewEvents.length} events to ${outputPath}`);

    // Also save by category
    for (const [category, events] of Object.entries(byCategory)) {
      const categoryPath = outputPath.replace('.json', `-${category}.json`);
      fs.writeFileSync(categoryPath, JSON.stringify(events, null, 2));
      console.log(`  ${category}: ${events.length} events → ${categoryPath}`);
    }
    return;
  }

  // Print events grouped by category
  for (const [category, events] of Object.entries(byCategory)) {
    console.log(`\n📁 ${category.toUpperCase()} (${events.length} events)`);
    console.log('─'.repeat(60));

    for (const event of events) {
      console.log(`\n  ${event.friendly_name} (${event.year})`);
      console.log(`  Difficulty: ${event.difficulty}`);
      console.log(`  ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`);
    }
  }

  // Output JSON for easy copy-paste
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('JSON OUTPUT (copy to appropriate category file)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  for (const [category, events] of Object.entries(byCategory)) {
    console.log(`\n// Add to ${category}.json:`);
    console.log(JSON.stringify(events, null, 2));
  }
}

main().catch(console.error);