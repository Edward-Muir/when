// One-off: collect events whose friendly_name exceeds the limit into chunked
// input files for rename subagents. Writes to untracked_data/name-shortening/.
const fs = require('fs');
const path = require('path');

const LIMIT = 35;
const CHUNK_SIZE = 80;
const CATEGORIES = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
];

const eventsDir = path.join(__dirname, '..', 'public', 'events');
const outDir = path.join(__dirname, '..', 'untracked_data', 'name-shortening');
fs.mkdirSync(outDir, { recursive: true });

// Collect long-name events, grouped by category so chunks stay thematic.
const byCategory = {};
let total = 0;
for (const cat of CATEGORIES) {
  const arr = JSON.parse(fs.readFileSync(path.join(eventsDir, `${cat}.json`), 'utf8'));
  const long = arr
    .filter((e) => (e.friendly_name || '').length > LIMIT)
    .map((e) => ({
      name: e.name,
      friendly_name: e.friendly_name,
      year: e.year,
      category: e.category,
      description: e.description,
    }));
  byCategory[cat] = long;
  total += long.length;
}

// Build chunks: never mix categories within a chunk, split big categories.
const chunks = [];
for (const cat of CATEGORIES) {
  const items = byCategory[cat];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }
}

chunks.forEach((chunk, idx) => {
  const nn = String(idx + 1).padStart(2, '0');
  fs.writeFileSync(
    path.join(outDir, `input-${nn}.json`),
    JSON.stringify(chunk, null, 2) + '\n'
  );
});

console.log(`Total events > ${LIMIT} chars: ${total}`);
console.log(`Wrote ${chunks.length} chunk files to ${outDir}`);
chunks.forEach((c, i) =>
  console.log(`  input-${String(i + 1).padStart(2, '0')}.json: ${c.length} (${c[0].category})`)
);
