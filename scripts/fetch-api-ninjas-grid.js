#!/usr/bin/env node

/**
 * Fetch Historical Events from API Ninjas - Grid Search
 *
 * Systematically searches across a grid of years and topics,
 * saving results to a CSV file as it progresses.
 *
 * Usage:
 *   API_NINJAS_KEY=your_key node scripts/fetch-api-ninjas-grid.js
 *
 * Output: scripts/new-events.csv (appended as it runs)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const API_BASE = 'https://api.api-ninjas.com/v1/historicalevents';
const OUTPUT_CSV = path.join(__dirname, 'new-events.csv');
const PROGRESS_FILE = path.join(__dirname, '.grid-progress.json');

// Search grid configuration
const YEAR_RANGES = [
  { start: -500, end: 0, step: 50 },      // Ancient
  { start: 0, end: 500, step: 50 },       // Late Ancient
  { start: 500, end: 1000, step: 50 },    // Early Medieval
  { start: 1000, end: 1500, step: 25 },   // Medieval
  { start: 1500, end: 1800, step: 10 },   // Early Modern
  { start: 1800, end: 1900, step: 5 },    // Industrial
  { start: 1900, end: 1950, step: 2 },    // World Wars
  { start: 1950, end: 2000, step: 2 },    // Cold War
  { start: 2000, end: 2024, step: 1 },    // Modern
];

const TEXT_SEARCHES = [
  'battle', 'war', 'invasion', 'revolution',
  'treaty', 'independence', 'constitution',
  'earthquake', 'volcano', 'tsunami', 'plague', 'famine',
  'discovery', 'invention', 'first',
  'founded', 'built', 'opened',
  'assassination', 'coronation', 'election',
];

// Category keywords for auto-classification
const CATEGORY_KEYWORDS = {
  conflict: [
    'war', 'battle', 'invasion', 'siege', 'attack', 'military', 'army', 'navy',
    'revolution', 'rebellion', 'uprising', 'coup', 'assassination', 'bombing',
    'troops', 'soldier', 'fought', 'victory', 'defeat', 'surrender', 'combat'
  ],
  diplomatic: [
    'treaty', 'alliance', 'agreement', 'peace', 'diplomatic', 'ambassador',
    'negotiation', 'summit', 'conference', 'united nations', 'signed', 'pact',
    'declaration', 'independence', 'constitution', 'law', 'act', 'congress',
    'parliament', 'president', 'king', 'queen', 'emperor', 'government'
  ],
  disasters: [
    'earthquake', 'tsunami', 'hurricane', 'tornado', 'flood', 'fire', 'famine',
    'plague', 'epidemic', 'pandemic', 'disaster', 'explosion', 'crash', 'sinking',
    'accident', 'killed', 'died', 'death toll', 'victims', 'eruption', 'volcano'
  ],
  exploration: [
    'discover', 'exploration', 'explorer', 'expedition', 'voyage', 'landed',
    'reached', 'first', 'moon', 'space', 'astronaut', 'nasa', 'orbit', 'rocket',
    'satellite', 'mission', 'pioneer', 'circumnavigate'
  ],
  infrastructure: [
    'built', 'construction', 'bridge', 'railway', 'railroad', 'canal', 'dam',
    'building', 'skyscraper', 'tower', 'opened', 'completed', 'inaugurated',
    'invention', 'invented', 'patent', 'telephone', 'telegraph', 'radio',
    'television', 'internet', 'computer', 'engine', 'electricity'
  ],
  cultural: [
    'art', 'artist', 'painting', 'music', 'composer', 'symphony', 'opera',
    'theater', 'film', 'movie', 'book', 'novel', 'author', 'poet',
    'literature', 'published', 'university', 'school', 'education',
    'science', 'scientist', 'theory', 'nobel', 'prize', 'award', 'olympics'
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
      events.set(event.name, event);
      const normalizedName = normalize(event.friendly_name);
      events.set(`friendly:${normalizedName}`, event);
    }
  }

  return events;
}

// Load events already in CSV (to avoid re-adding)
function loadCsvEvents() {
  const events = new Set();
  if (fs.existsSync(OUTPUT_CSV)) {
    const content = fs.readFileSync(OUTPUT_CSV, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    for (const line of lines) {
      if (line.trim()) {
        // Extract the slug (first column)
        const match = line.match(/^"?([^",]+)"?/);
        if (match) {
          events.add(match[1]);
        }
      }
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

  let maxScore = 0;
  let bestCategory = 'cultural';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// Estimate difficulty
function estimateDifficulty(year, eventText) {
  const text = eventText.toLowerCase();

  const famousKeywords = [
    'world war', 'declaration of independence', 'moon landing', 'titanic',
    'columbus', 'napoleon', 'civil war', 'french revolution', 'pearl harbor',
    'berlin wall', 'd-day', 'hiroshima', 'magna carta'
  ];

  for (const keyword of famousKeywords) {
    if (text.includes(keyword)) {
      return 'easy';
    }
  }

  if (year < -500 || (year > 0 && year < 500)) {
    return 'hard';
  }

  return 'medium';
}

// Check if event is a duplicate
function isDuplicate(eventText, year, existingEvents) {
  const normalized = normalize(eventText);
  const YEAR_WINDOW = 5;
  const SIMILARITY_THRESHOLD = 0.6;

  if (existingEvents.has(`friendly:${normalized}`)) {
    return true;
  }

  for (const [key, existing] of existingEvents) {
    if (key.startsWith('friendly:')) continue;

    const yearDiff = Math.abs(existing.year - year);
    if (yearDiff > YEAR_WINDOW) continue;

    const existingNorm = normalize(existing.friendly_name);

    if (normalized.includes(existingNorm) || existingNorm.includes(normalized)) {
      if (existingNorm.length > 5 || normalized.length > 5) {
        return true;
      }
    }

    const sim = similarity(eventText, existing.friendly_name);
    if (sim >= SIMILARITY_THRESHOLD) {
      return true;
    }

    const words1 = new Set(normalized.split(' ').filter(w => w.length > 3));
    const words2 = new Set(existingNorm.split(' ').filter(w => w.length > 3));
    const overlap = [...words1].filter(w => words2.has(w)).length;

    if (overlap >= 3 && overlap >= Math.min(words1.size, words2.size) * 0.5) {
      return true;
    }
  }

  return false;
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
      headers: { 'X-Api-Key': apiKey }
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

// Escape CSV field
function escapeCsv(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Append event to CSV
function appendToCsv(event) {
  const row = [
    escapeCsv(event.name),
    escapeCsv(event.friendly_name),
    escapeCsv(event.year),
    escapeCsv(event.category),
    escapeCsv(event.difficulty),
    escapeCsv(event.description)
  ].join(',');

  fs.appendFileSync(OUTPUT_CSV, row + '\n');
}

// Initialize CSV file with headers
function initCsv() {
  if (!fs.existsSync(OUTPUT_CSV)) {
    fs.writeFileSync(OUTPUT_CSV, 'name,friendly_name,year,category,difficulty,description\n');
  }
}

// Load/save progress
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { completedYears: [], completedTexts: [] };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Generate all years from ranges
function generateYears() {
  const years = [];
  for (const range of YEAR_RANGES) {
    for (let year = range.start; year <= range.end; year += range.step) {
      years.push(year);
    }
  }
  return years;
}

// Main
async function main() {
  const apiKey = process.env.API_NINJAS_KEY;

  if (!apiKey) {
    console.error('Error: API_NINJAS_KEY environment variable is required');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('API Ninjas Grid Search');
  console.log('='.repeat(60));

  // Initialize
  initCsv();
  const existingEvents = loadExistingEvents();
  const csvEvents = loadCsvEvents();
  const progress = loadProgress();

  console.log(`Loaded ${existingEvents.size / 2} existing game events`);
  console.log(`Loaded ${csvEvents.size} events already in CSV`);
  console.log(`Output: ${OUTPUT_CSV}\n`);

  // Add CSV events to existingEvents to prevent duplicates
  // (They're already in the CSV, so we don't want to add them again)

  const allYears = generateYears();
  const allQueries = [
    ...allYears.map(y => ({ type: 'year', value: y, param: { year: y.toString() } })),
    ...TEXT_SEARCHES.map(t => ({ type: 'text', value: t, param: { text: t } }))
  ];

  let totalNew = 0;
  let totalSkipped = 0;
  let queryCount = 0;

  for (const query of allQueries) {
    const queryKey = `${query.type}:${query.value}`;

    // Skip if already completed
    if (query.type === 'year' && progress.completedYears.includes(query.value)) {
      continue;
    }
    if (query.type === 'text' && progress.completedTexts.includes(query.value)) {
      continue;
    }

    queryCount++;
    const desc = query.type === 'year' ? `Year ${query.value}` : `Text "${query.value}"`;
    process.stdout.write(`[${queryCount}] ${desc}...`);

    try {
      const results = await fetchEvents(query.param, apiKey);

      let newCount = 0;
      for (const apiEvent of results) {
        const year = parseInt(apiEvent.year);
        const eventText = apiEvent.event;
        const slug = generateSlug(eventText.substring(0, 50));

        // Skip if already in CSV
        if (csvEvents.has(slug)) {
          totalSkipped++;
          continue;
        }

        // Skip if duplicate of existing game event
        if (isDuplicate(eventText, year, existingEvents)) {
          totalSkipped++;
          continue;
        }

        // Create event
        let friendlyName = eventText;
        if (friendlyName.length > 60) {
          friendlyName = friendlyName.substring(0, 60);
          const lastSpace = friendlyName.lastIndexOf(' ');
          if (lastSpace > 30) {
            friendlyName = friendlyName.substring(0, lastSpace);
          }
        }

        const event = {
          name: slug,
          friendly_name: friendlyName,
          year: year,
          category: classifyEvent(eventText),
          difficulty: estimateDifficulty(year, eventText),
          description: eventText
        };

        // Add to CSV
        appendToCsv(event);
        csvEvents.add(slug);

        // Add to existing to prevent duplicates in this run
        existingEvents.set(slug, event);
        existingEvents.set(`friendly:${normalize(friendlyName)}`, event);

        newCount++;
        totalNew++;
      }

      console.log(` ${results.length} results, ${newCount} new`);

      // Mark as completed
      if (query.type === 'year') {
        progress.completedYears.push(query.value);
      } else {
        progress.completedTexts.push(query.value);
      }
      saveProgress(progress);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      console.log(` ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('COMPLETE');
  console.log('='.repeat(60));
  console.log(`Total new events: ${totalNew}`);
  console.log(`Total skipped (duplicates): ${totalSkipped}`);
  console.log(`Output saved to: ${OUTPUT_CSV}`);
  console.log('\nTo add events to the game, review the CSV and run:');
  console.log('  node scripts/import-csv-events.js');
}

main().catch(console.error);
