// Apply slug -> new friendly_name maps (output-*.json) to the event JSON files.
// Only friendly_name changes; every other field is left untouched. Reports any
// unmatched slug and any event still over the limit.
const fs = require('fs');
const path = require('path');

const LIMIT = 35;
const CATEGORIES = [
  'conflict',
  'cultural',
  'diplomatic',
  'disasters',
  'exploration',
  'infrastructure',
];

const eventsDir = path.join(__dirname, '..', 'public', 'events');
const mapDir = path.join(__dirname, '..', 'untracked_data', 'name-shortening');

// Merge all output-*.json maps.
const merged = {};
for (const f of fs.readdirSync(mapDir).filter((f) => /^output-\d+\.json$/.test(f))) {
  const m = JSON.parse(fs.readFileSync(path.join(mapDir, f), 'utf8'));
  for (const [slug, name] of Object.entries(m)) {
    if (merged[slug] && merged[slug] !== name) {
      console.warn(`! duplicate slug across maps: ${slug}`);
    }
    merged[slug] = name;
  }
}
console.log(`Merged ${Object.keys(merged).length} renames from maps.`);

// Validate every new name fits the limit before touching any file.
const tooLong = Object.entries(merged).filter(([, n]) => n.length > LIMIT);
if (tooLong.length) {
  console.error(`ABORT: ${tooLong.length} proposed names exceed ${LIMIT} chars:`);
  tooLong.forEach(([s, n]) => console.error(`  [${n.length}] ${s}: ${n}`));
  process.exit(1);
}

const seen = new Set();
let totalApplied = 0;
for (const cat of CATEGORIES) {
  const file = path.join(eventsDir, `${cat}.json`);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  let applied = 0;
  for (const e of arr) {
    if (Object.prototype.hasOwnProperty.call(merged, e.name)) {
      e.friendly_name = merged[e.name];
      seen.add(e.name);
      applied++;
    }
  }
  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
  totalApplied += applied;
  const stillLong = arr.filter((e) => (e.friendly_name || '').length > LIMIT);
  console.log(
    `${cat}.json: applied ${applied}, still > ${LIMIT}: ${stillLong.length}`
  );
  stillLong.forEach((e) => console.log(`   [${e.friendly_name.length}] ${e.name}: ${e.friendly_name}`));
}

const unmatched = Object.keys(merged).filter((s) => !seen.has(s));
console.log(`\nTotal applied: ${totalApplied}`);
if (unmatched.length) {
  console.log(`Unmatched slugs (in maps but not found in any file): ${unmatched.length}`);
  unmatched.forEach((s) => console.log(`   ${s}`));
}
