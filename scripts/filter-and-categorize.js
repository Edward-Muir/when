const fs = require('fs');
const path = require('path');

// Read existing events
const existingEventsFile = '/tmp/existing_events.txt';
const existingEvents = fs.readFileSync(existingEventsFile, 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map(name => name.toLowerCase().trim());

// Read suggested additions
const suggestedFile = '/Users/emuir/Downloads/suggested_additions.txt';
const suggestedLines = fs.readFileSync(suggestedFile, 'utf-8')
  .split('\n')
  .filter(Boolean);

// Parse suggested events
const suggestedEvents = suggestedLines.map(line => {
  const match = line.match(/^(-?\d+),\s*(.+)$/);
  if (match) {
    return { year: parseInt(match[1]), friendly_name: match[2].trim() };
  }
  return null;
}).filter(Boolean);

console.log(`Total suggested events: ${suggestedEvents.length}`);
console.log(`Total existing events: ${existingEvents.length}`);

// Normalize function for comparison
function normalize(str) {
  return str.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check for duplicates
const duplicates = [];
const nonDuplicates = [];

for (const event of suggestedEvents) {
  const normalizedName = normalize(event.friendly_name);

  // Check exact match
  const exactMatch = existingEvents.some(existing =>
    normalize(existing) === normalizedName
  );

  // Check partial match (one contains the other significantly)
  const partialMatch = existingEvents.some(existing => {
    const normExisting = normalize(existing);
    // If one is a substring of the other and they're both reasonably long
    if (normalizedName.length > 10 && normExisting.length > 10) {
      if (normalizedName.includes(normExisting) || normExisting.includes(normalizedName)) {
        return true;
      }
    }
    // Check if they share significant words (for battles, treaties, etc.)
    const wordsNew = normalizedName.split(' ');
    const wordsExisting = normExisting.split(' ');
    const commonWords = wordsNew.filter(w => w.length > 3 && wordsExisting.includes(w));
    if (commonWords.length >= 2 && commonWords.length >= Math.min(wordsNew.length, wordsExisting.length) * 0.6) {
      return true;
    }
    return false;
  });

  if (exactMatch || partialMatch) {
    duplicates.push(event);
  } else {
    nonDuplicates.push(event);
  }
}

console.log(`\nDuplicates found: ${duplicates.length}`);
console.log(`Non-duplicates: ${nonDuplicates.length}`);

// Categorization keywords - ORDER MATTERS, more specific categories first
const categoryKeywords = {
  // Check disasters early - climate, extinction, etc.
  disasters: ['earthquake', 'tsunami', 'eruption', 'volcano', 'flood', 'famine', 'plague', 'pandemic', 'disaster', 'fire', 'hurricane', 'cyclone', 'drought', 'collapse', 'crash', 'sinks', 'explosion', 'extinction', 'climate', 'dryas'],
  // Check exploration early for scientific/discovery events
  exploration: ['discovers', 'discovered', 'invention', 'invented', 'theory', 'proposes', 'develops', 'explores', 'expedition', 'voyage', 'reaches', 'lands on', 'vaccine', 'scientific', 'nuclear', 'atom', 'dna', 'gene', 'space', 'moon', 'mars', 'telescope', 'domestication', 'domesticated', 'emerges', 'principle', 'creates', 'alphabet', 'formula', 'smelting', 'printing', 'first recorded', 'hydrogen', 'nitrogen', 'oxygen', 'introduced'],
  // Check infrastructure for buildings/constructions
  infrastructure: ['built', 'completed', 'constructed', 'bridge', 'canal', 'railway', 'railroad', 'tunnel', 'dam', 'tower', 'building', 'palace', 'wall', 'road', 'airport', 'metro', 'subway', 'museum', 'library'],
  // Check conflict for battles/wars
  conflict: ['battle', 'war', 'revolt', 'rebellion', 'siege', 'invasion', 'massacre', 'uprising', 'coup', 'assassination', 'assassinated', 'military', 'army', 'attack', 'bombing', 'shot down', 'kills', 'killed', 'executed', 'murder', 'riot', 'crusade', 'conquers', 'conquest', 'defeats', 'captures', 'sack', 'civil war', 'fitna', 'genocide', 'pogrom', 'mutiny', 'hostage'],
  // Check cultural for people/art/religion
  cultural: ['birth', 'born', 'death', 'dies', 'writes', 'publishes', 'published', 'paints', 'painted', 'composes', 'premieres', 'art', 'literature', 'philosophy', 'religion', 'pope', 'buddha', 'confucius', 'muhammad', 'jesus', 'church', 'cathedral', 'temple', 'mosque', 'olympic', 'movement', 'tutors', 'arrives', 'begins teaching', 'caliph', 'iconoclasm', 'persecution', 'revival', 'pagan', 'christians', 'jews', 'expulsion', 'inquisition'],
  // Diplomatic is the fallback for political events
  diplomatic: ['treaty', 'accord', 'agreement', 'independence', 'constitution', 'act', 'law', 'reform', 'abolish', 'ratified', 'signed', 'established', 'founded', 'empire', 'kingdom', 'republic', 'dynasty', 'crowned', 'becomes king', 'becomes queen', 'becomes emperor', 'becomes pm', 'becomes president', 'elected', 'summit', 'conference', 'partition', 'unification', 'annexes', 'caliphate', 'settles', 'era begins', 'era ends', 'expansion', 'peak', 'thrive', 'civilization', 'pax', 'good emperors']
};

// Categorize events
const categorized = {
  conflict: [],
  cultural: [],
  diplomatic: [],
  disasters: [],
  exploration: [],
  infrastructure: []
};

function categorize(event) {
  const nameLower = event.friendly_name.toLowerCase();

  // Check each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
  }

  // Default fallback based on common patterns
  if (nameLower.includes('birth') || nameLower.includes('death')) return 'cultural';
  if (nameLower.includes('battle') || nameLower.includes('war')) return 'conflict';

  // Default to diplomatic for political events
  return 'diplomatic';
}

for (const event of nonDuplicates) {
  const category = categorize(event);
  categorized[category].push(event);
}

// Print summary
console.log('\nCategorization summary:');
for (const [category, events] of Object.entries(categorized)) {
  console.log(`  ${category}: ${events.length} events`);
}

// Write categorized files
const scriptsDir = path.join(__dirname);
for (const [category, events] of Object.entries(categorized)) {
  const filename = path.join(scriptsDir, `input-${category}.json`);
  fs.writeFileSync(filename, JSON.stringify(events, null, 2));
  console.log(`Wrote ${filename}`);
}

// Also write duplicates for reference
fs.writeFileSync(path.join(scriptsDir, 'duplicates.json'), JSON.stringify(duplicates, null, 2));
console.log(`\nWrote duplicates.json for reference`);

// Print some example duplicates
console.log('\nSample duplicates found:');
duplicates.slice(0, 20).forEach(d => console.log(`  - ${d.year}: ${d.friendly_name}`));
