#!/usr/bin/env node

/**
 * Script to fetch Cloudinary images and update event JSON files with image URLs.
 *
 * Setup:
 * 1. npm install cloudinary
 * 2. Set environment variables:
 *    export CLOUDINARY_CLOUD_NAME=dscb8inz1
 *    export CLOUDINARY_API_KEY=your_api_key
 *    export CLOUDINARY_API_SECRET=your_api_secret
 *
 * Or use the CLOUDINARY_URL format:
 *    export CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 *
 * Usage: node scripts/update-cloudinary-urls.js
 */

const fs = require('fs');
const path = require('path');

// Try to load cloudinary
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  console.error('Please install cloudinary: npm install cloudinary');
  process.exit(1);
}

const EVENTS_DIR = path.join(__dirname, '../public/events');
const CLOUDINARY_FOLDER = ''; // Empty string = root folder, or set to 'when' etc.

// Configure cloudinary (uses CLOUDINARY_URL env var or individual vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dscb8inz1',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Fetch all images from Cloudinary folder
 */
async function fetchCloudinaryImages() {
  console.log(`Fetching images from Cloudinary folder: ${CLOUDINARY_FOLDER}/`);

  const images = [];
  let nextCursor = null;

  do {
    const options = {
      type: 'upload',
      max_results: 500,
    };

    // Only add prefix if folder is specified
    if (CLOUDINARY_FOLDER) {
      options.prefix = `${CLOUDINARY_FOLDER}/`;
    }

    if (nextCursor) {
      options.next_cursor = nextCursor;
    }

    const result = await cloudinary.api.resources(options);
    images.push(...result.resources);
    nextCursor = result.next_cursor;

    console.log(`  Fetched ${images.length} images so far...`);
  } while (nextCursor);

  console.log(`Found ${images.length} total images in Cloudinary\n`);
  return images;
}

/**
 * Extract event name from Cloudinary public_id
 * Format: when/<<event name>>_uid.png
 */
function extractEventName(publicId) {
  // Remove folder prefix (when/)
  const filename = publicId.replace(`${CLOUDINARY_FOLDER}/`, '');

  // Remove the _uid suffix (everything after last underscore before extension)
  // e.g., "mayflower-compact_abc123" -> "mayflower-compact"
  const match = filename.match(/^(.+)_[a-zA-Z0-9]+$/);

  if (match) {
    return match[1].toLowerCase();
  }

  // Fallback: just return the filename without extension
  return filename.toLowerCase();
}

/**
 * Build optimized Cloudinary URL
 */
function buildCloudinaryUrl(publicId, width = 660) {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto:good',  // 'auto:best' for highest quality, 'auto:good' for balanced
    width: width,          // 660 = 2x for retina displays
    crop: 'fill',
    gravity: 'auto',
    dpr: 'auto'            // Automatic device pixel ratio
  });
}

/**
 * Load all event JSON files
 */
function loadEventFiles() {
  const files = fs.readdirSync(EVENTS_DIR)
    .filter(f => f.endsWith('.json') && f !== 'manifest.json');

  return files.map(filename => {
    const filePath = path.join(EVENTS_DIR, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      filename,
      filePath,
      events: JSON.parse(content)
    };
  });
}

/**
 * Main function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Cloudinary Image URL Updater');
  console.log('='.repeat(60));

  // Check for API credentials
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    if (!process.env.CLOUDINARY_URL) {
      console.error('\nError: Cloudinary credentials not found!');
      console.error('Please set one of:');
      console.error('  - CLOUDINARY_URL environment variable');
      console.error('  - CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET environment variables');
      console.error('\nYou can find these in your Cloudinary Console Settings > API Keys');
      process.exit(1);
    }
  }

  // Fetch images from Cloudinary
  const cloudinaryImages = await fetchCloudinaryImages();

  // Create a map of event name -> Cloudinary image info
  const imageMap = new Map();
  for (const img of cloudinaryImages) {
    const eventName = extractEventName(img.public_id);
    imageMap.set(eventName, {
      publicId: img.public_id,
      url: buildCloudinaryUrl(img.public_id),
      originalUrl: img.secure_url
    });
  }

  console.log('Cloudinary images found:');
  for (const [name, info] of imageMap) {
    console.log(`  ${name} -> ${info.publicId}`);
  }
  console.log('');

  // Load event files
  const eventFiles = loadEventFiles();
  console.log(`Found ${eventFiles.length} event files\n`);

  // Match and update
  let totalMatched = 0;
  let totalUpdated = 0;

  for (const { filename, filePath, events } of eventFiles) {
    let fileUpdated = false;

    for (const event of events) {
      const eventName = event.name.toLowerCase();

      if (imageMap.has(eventName)) {
        const imgInfo = imageMap.get(eventName);
        const newUrl = imgInfo.url;

        if (event.image_url !== newUrl) {
          const hadImage = !!event.image_url;
          event.image_url = newUrl;
          fileUpdated = true;
          totalUpdated++;
          console.log(`  [UPDATE] ${event.friendly_name}`);
          console.log(`           ${hadImage ? 'Replaced' : 'Added'}: ${newUrl}`);
        }
        totalMatched++;
      }
    }

    if (fileUpdated) {
      fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
      console.log(`  [SAVED] ${filename}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log(`Summary:`);
  console.log(`  - Cloudinary images: ${cloudinaryImages.length}`);
  console.log(`  - Matched to events: ${totalMatched}`);
  console.log(`  - URLs updated: ${totalUpdated}`);
  console.log('='.repeat(60));

  // List unmatched images
  const matchedNames = new Set();
  for (const { events } of eventFiles) {
    for (const event of events) {
      if (imageMap.has(event.name.toLowerCase())) {
        matchedNames.add(event.name.toLowerCase());
      }
    }
  }

  const unmatchedImages = [...imageMap.keys()].filter(name => !matchedNames.has(name));
  if (unmatchedImages.length > 0) {
    console.log(`\nUnmatched Cloudinary images (no corresponding event found):`);
    for (const name of unmatchedImages) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});