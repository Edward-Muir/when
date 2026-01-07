#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const OUTPUT_FILE = path.join(__dirname, 'outputs/failing-images.json');

const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');

const failing = [];

for (const file of files) {
  const events = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'));
  for (const event of events) {
    if (event.image_url && (!event.image_width || !event.image_height)) {
      failing.push({
        file: file.replace('.json', ''),
        name: event.name,
        friendly_name: event.friendly_name,
        image_url: event.image_url
      });
    }
  }
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(failing, null, 2) + '\n');
console.log(`Found ${failing.length} events with images but no dimensions`);
console.log(`Output written to: ${OUTPUT_FILE}`);
