#!/usr/bin/env node

/**
 * Script to fetch image dimensions for historical events
 * and update the event JSON files with image_width and image_height fields.
 *
 * Usage: node scripts/fetch-image-dimensions.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const EVENTS_DIR = path.join(__dirname, '../public/events');
const RATE_LIMIT_MS = 50; // Delay between requests

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch image and determine dimensions from the response
 * Works by reading enough bytes to parse image headers
 */
async function getImageDimensions(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageDimensionFetcher/1.0)'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        request.destroy();
        getImageDimensions(response.headers.location).then(resolve);
        return;
      }

      if (response.statusCode !== 200) {
        request.destroy();
        resolve(null);
        return;
      }

      const chunks = [];
      let totalLength = 0;
      const maxBytes = 65536; // Read up to 64KB to get dimensions

      response.on('data', (chunk) => {
        chunks.push(chunk);
        totalLength += chunk.length;

        // Try to parse dimensions from accumulated data
        const buffer = Buffer.concat(chunks);
        const dimensions = parseImageDimensions(buffer);

        if (dimensions || totalLength >= maxBytes) {
          request.destroy();
          resolve(dimensions);
        }
      });

      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(parseImageDimensions(buffer));
      });

      response.on('error', () => {
        resolve(null);
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      resolve(null);
    });
  });
}

/**
 * Parse image dimensions from buffer
 * Supports PNG, JPEG, GIF, WebP, and SVG
 */
function parseImageDimensions(buffer) {
  if (buffer.length < 24) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    if (buffer.length >= 24) {
      return {
        width: buffer.readUInt32BE(16),
        height: buffer.readUInt32BE(20)
      };
    }
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return parseJpegDimensions(buffer);
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    if (buffer.length >= 10) {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8)
      };
    }
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return parseWebpDimensions(buffer);
  }

  // SVG: Check for XML/SVG text
  const text = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
  if (text.includes('<svg') || text.includes('<?xml')) {
    return parseSvgDimensions(text);
  }

  return null;
}

function parseJpegDimensions(buffer) {
  let offset = 2;

  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];

    // SOF markers (Start of Frame) contain dimensions
    if ((marker >= 0xC0 && marker <= 0xC3) ||
        (marker >= 0xC5 && marker <= 0xC7) ||
        (marker >= 0xC9 && marker <= 0xCB) ||
        (marker >= 0xCD && marker <= 0xCF)) {
      if (offset + 9 <= buffer.length) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7)
        };
      }
    }

    // Skip to next marker
    if (marker === 0xD8 || marker === 0xD9 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
      offset += 2;
    } else if (offset + 4 <= buffer.length) {
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    } else {
      break;
    }
  }

  return null;
}

function parseWebpDimensions(buffer) {
  if (buffer.length < 30) return null;

  // VP8 format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x20) {
    if (buffer.length >= 30) {
      return {
        width: (buffer.readUInt16LE(26) & 0x3FFF),
        height: (buffer.readUInt16LE(28) & 0x3FFF)
      };
    }
  }

  // VP8L format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x4C) {
    if (buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3FFF) + 1,
        height: ((bits >> 14) & 0x3FFF) + 1
      };
    }
  }

  // VP8X format
  if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
    if (buffer.length >= 30) {
      return {
        width: ((buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1),
        height: ((buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1)
      };
    }
  }

  return null;
}

function parseSvgDimensions(text) {
  const widthMatch = text.match(/width\s*=\s*["']?(\d+)/);
  const heightMatch = text.match(/height\s*=\s*["']?(\d+)/);

  if (widthMatch && heightMatch) {
    return {
      width: parseInt(widthMatch[1], 10),
      height: parseInt(heightMatch[1], 10)
    };
  }

  // Try viewBox
  const viewBoxMatch = text.match(/viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
  if (viewBoxMatch) {
    return {
      width: Math.round(parseFloat(viewBoxMatch[1])),
      height: Math.round(parseFloat(viewBoxMatch[2]))
    };
  }

  return null;
}

async function processJsonFile(filePath) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);

  const content = fs.readFileSync(filePath, 'utf8');
  const events = JSON.parse(content);

  let updated = false;
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const event of events) {
    // Skip if no image_url
    if (!event.image_url) {
      continue;
    }

    // Skip if already has dimensions
    if (event.image_width && event.image_height) {
      skipCount++;
      continue;
    }

    const dimensions = await getImageDimensions(event.image_url);

    if (dimensions) {
      event.image_width = dimensions.width;
      event.image_height = dimensions.height;
      updated = true;
      successCount++;
      console.log(`  [OK] ${event.friendly_name}: ${dimensions.width}x${dimensions.height}`);
    } else {
      failCount++;
      console.log(`  [FAIL] ${event.friendly_name}: Could not get dimensions`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  if (updated) {
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2) + '\n');
    console.log(`  [SAVED] Updated ${path.basename(filePath)}`);
  }

  return { successCount, skipCount, failCount };
}

async function findJsonFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Image Dimension Fetcher for Timeline Events');
  console.log('='.repeat(60));

  const jsonFiles = await findJsonFiles(EVENTS_DIR);
  console.log(`Found ${jsonFiles.length} event files to process`);

  let totalSuccess = 0;
  let totalSkip = 0;
  let totalFail = 0;

  for (const file of jsonFiles) {
    const { successCount, skipCount, failCount } = await processJsonFile(file);
    totalSuccess += successCount;
    totalSkip += skipCount;
    totalFail += failCount;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Done!`);
  console.log(`  Updated: ${totalSuccess}`);
  console.log(`  Skipped (already had dimensions): ${totalSkip}`);
  console.log(`  Failed: ${totalFail}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
