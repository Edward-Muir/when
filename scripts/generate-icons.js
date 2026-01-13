#!/usr/bin/env node

/**
 * Generate PNG icons from favicon.svg using Puppeteer
 *
 * Uses headless Chrome to properly render the SVG with Google Fonts (Playfair)
 * and takes screenshots at various sizes for:
 * - Browser favicon (64x64)
 * - Apple touch icon (180x180)
 * - PWA manifest icons (192x192, 512x512)
 *
 * Usage: node scripts/generate-icons.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const SVG_PATH = path.join(PUBLIC_DIR, 'favicon.svg');

// Icon sizes to generate
const ICONS = [
  { name: 'favicon.png', size: 64 },
  { name: 'logo180.png', size: 180 },
  { name: 'logo192.png', size: 192 },
  { name: 'logo512.png', size: 512 },
];

async function generateIcons() {
  // Read the SVG file
  const svgContent = fs.readFileSync(SVG_PATH, 'utf8');

  console.log('Generating PNG icons from favicon.svg using Puppeteer...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const icon of ICONS) {
    const page = await browser.newPage();
    await page.setViewport({
      width: icon.size,
      height: icon.size,
      deviceScaleFactor: 1,
    });

    // Create HTML that loads Google Font and displays SVG at exact size
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair:wght@900&display=swap');
            * { margin: 0; padding: 0; }
            html, body {
              width: ${icon.size}px;
              height: ${icon.size}px;
              overflow: hidden;
            }
            svg {
              width: ${icon.size}px;
              height: ${icon.size}px;
              display: block;
            }
          </style>
        </head>
        <body>${svgContent}</body>
      </html>
    `;

    // Navigate to blank page first
    await page.goto('about:blank');

    // Set content without waiting for network
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Wait a bit for font to load from CSS @import
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const outputPath = path.join(PUBLIC_DIR, icon.name);
    await page.screenshot({
      path: outputPath,
      type: 'png',
      omitBackground: false,
    });

    const stats = fs.statSync(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`  ✓ ${icon.name} (${icon.size}x${icon.size}) - ${sizeKB} KB`);

    await page.close();
  }

  await browser.close();

  console.log('\nDone! All icons generated successfully.');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
