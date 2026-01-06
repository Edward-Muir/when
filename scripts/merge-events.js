const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, '..', 'public', 'events');
const scriptsDir = __dirname;

// Merge function
function mergeEvents(mainFile, tempFiles) {
  const mainPath = path.join(eventsDir, mainFile);
  const mainEvents = JSON.parse(fs.readFileSync(mainPath, 'utf-8'));

  let newEvents = [];
  for (const tempFile of tempFiles) {
    const tempPath = path.join(scriptsDir, tempFile);
    if (fs.existsSync(tempPath)) {
      const temp = JSON.parse(fs.readFileSync(tempPath, 'utf-8'));
      newEvents = newEvents.concat(temp);
      console.log(`  Loaded ${temp.length} events from ${tempFile}`);
    }
  }

  // Check for duplicate names
  const existingNames = new Set(mainEvents.map(e => e.name));
  const uniqueNew = newEvents.filter(e => {
    if (existingNames.has(e.name)) {
      console.log(`  Skipping duplicate: ${e.name}`);
      return false;
    }
    existingNames.add(e.name);
    return true;
  });

  const merged = [...mainEvents, ...uniqueNew];
  fs.writeFileSync(mainPath, JSON.stringify(merged, null, 2));
  console.log(`  Added ${uniqueNew.length} events to ${mainFile} (total: ${merged.length})`);
  return uniqueNew.length;
}

console.log('Merging events...\n');

let totalAdded = 0;

console.log('Conflict:');
totalAdded += mergeEvents('conflict.json', ['temp-conflict.json']);

console.log('\nCultural:');
totalAdded += mergeEvents('cultural.json', ['temp-cultural.json']);

console.log('\nDiplomatic:');
totalAdded += mergeEvents('diplomatic.json', ['temp-diplomatic-1.json', 'temp-diplomatic-2.json']);

console.log('\nDisasters:');
totalAdded += mergeEvents('disasters.json', ['temp-disasters.json']);

console.log('\nExploration:');
totalAdded += mergeEvents('exploration.json', ['temp-exploration.json']);

console.log('\nInfrastructure:');
totalAdded += mergeEvents('infrastructure.json', ['temp-infrastructure.json']);

console.log(`\n=== Total events added: ${totalAdded} ===`);
