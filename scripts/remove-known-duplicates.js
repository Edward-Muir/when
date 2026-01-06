const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, '..', 'public', 'events');

// Duplicates to remove (keep the first occurrence, remove from second file)
const duplicatesToRemove = [
  // Exact duplicates
  { file: 'diplomatic.json', name: 'sargon-akkad-empire' },

  // Same event, different IDs - remove the less appropriate one
  { file: 'disasters.json', name: 'babylonian-captivity-begins' }, // Keep conflict version
  { file: 'cultural.json', name: 'exodus-egypt' }, // Keep exodus-biblical
  { file: 'exploration.json', name: 'x-ray' }, // Keep x-rays-discovered
  { file: 'diplomatic.json', name: 'korean-armistice' }, // Keep conflict version
  { file: 'diplomatic.json', name: 'berlin-wall-falls' }, // Keep conflict fall-of-the-berlin-wall
  { file: 'conflict.json', name: 'rfk-assassinated' }, // Keep rfk-assassination
  { file: 'exploration.json', name: 'relativity' }, // Keep special-relativity
  { file: 'cultural.json', name: 'ur-nammu-code' }, // Keep code-ur-nammu
  { file: 'exploration.json', name: 'antarctica-discovered-russia' }, // Keep antarctica-sighted
  { file: 'disasters.json', name: 'wall-street-crash' }, // Keep stock-crash
  { file: 'infrastructure.json', name: 'wheel-invention' }, // Keep wheel-invented in exploration
  { file: 'exploration.json', name: 'vaccination' }, // Keep vaccination-invented
  { file: 'exploration.json', name: 'compass-invention-china' }, // Keep compass-invented
  { file: 'diplomatic.json', name: 'dien-bien-phu-falls' }, // Keep battle-dien-bien-phu in conflict
  { file: 'diplomatic.json', name: 'limited-test-ban-treaty' }, // Keep test-ban-treaty
  { file: 'diplomatic.json', name: 'ussr-dissolved' }, // Keep soviet-collapse in conflict
  { file: 'exploration.json', name: 'darwin-evolution' }, // Keep origin-of-species in cultural
  { file: 'disasters.json', name: 'santorini-eruption' }, // Keep thera-eruption
  { file: 'diplomatic.json', name: 'collapse-umayyad-spain' }, // Keep caliphate-cordoba-falls in cultural
  { file: 'exploration.json', name: 'rutherford-atomic-model' }, // Keep atomic-nucleus
];

for (const dup of duplicatesToRemove) {
  const filePath = path.join(eventsDir, dup.file);
  const events = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const originalCount = events.length;

  const filtered = events.filter(e => e.name !== dup.name);

  if (filtered.length < originalCount) {
    fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
    console.log(`Removed "${dup.name}" from ${dup.file}`);
  } else {
    console.log(`Warning: "${dup.name}" not found in ${dup.file}`);
  }
}

console.log('\nDone removing duplicates');
