#!/usr/bin/env node

/**
 * App Store preview video: real gameplay, captioned and scored, at 886x1920 / 30 fps.
 *
 *   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-save playwright
 *   node scripts/store-preview              # capture + music + compose
 *   node scripts/store-preview --capture    # re-record the footage only
 *   node scripts/store-preview --capture=home  # re-record one part: one, two or home
 *   node scripts/store-preview --compose    # re-cut from saved footage (music included)
 *   node scripts/store-preview --find-seed  # find a Math.random seed that deals the hook
 *
 * Output: scripts/outputs/store-preview/when-preview-886x1920.mp4 (gitignored). The spec it
 * meets, and why the decks are curated, are in docs/mobile-ios/index.md. Capture loads a few
 * dozen card images from Cloudinary; keep re-runs occasional (docs/cloudinary-cost-controls.md).
 */

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./shared');

const OUT = path.join(ROOT, 'scripts/outputs/store-preview');
// Deals the Great Pyramid as the anchor with the Moon landing and Cleopatra in hand.
const SEED = 21;

(async () => {
  const args = process.argv.slice(2);
  const all = !args.some((a) => a.startsWith('--'));
  fs.mkdirSync(OUT, { recursive: true });
  if (args.includes('--find-seed')) {
    const { findSeed, launch } = require('./capture');
    const browser = await launch();
    try {
      console.log(`seed: ${await findSeed(browser)}`);
    } finally {
      await browser.close();
    }
    return;
  }
  const only = args.find((a) => a.startsWith('--capture='));
  if (all || only || args.includes('--capture')) {
    console.log('Capturing play-when.com...');
    const parts = only ? only.split('=')[1].split(',') : undefined;
    await require('./capture').capture(OUT, { seed: SEED, parts });
  }
  if (all || args.includes('--compose')) {
    console.log('Cutting...');
    await require('./compose').compose(OUT);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
