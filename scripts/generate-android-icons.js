#!/usr/bin/env node

/**
 * Generate the Android launcher icons and splash images from the same painting as iOS.
 *
 * Companion to scripts/generate-icons.js (web + iOS). Same master, same 880px crop, same
 * #030c1d background, so every platform shows the identical hourglass.
 *
 * Outputs, under android/app/src/main/res:
 *   mipmap-<density>/ic_launcher.png           legacy square icon (API < 26)
 *   mipmap-<density>/ic_launcher_round.png     legacy round icon (API < 26)
 *   mipmap-<density>/ic_launcher_foreground.png adaptive-icon foreground (API 26+); the
 *       background is the colour in values/ic_launcher_background.xml (#030c1d)
 *   drawable-(port|land)-<density>/splash.png  pre-Android-12 launch image
 *
 * Adaptive icons are 108dp with only the middle ~72dp visible, and many launchers mask that to
 * a circle. The hourglass is tall, so to keep its caps inside a 72dp circle the painting is
 * drawn at 62dp and feathered at its edges into the #030c1d background (no square seam).
 *
 * Usage: node scripts/generate-android-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const MASTER = path.join(ROOT, 'assets/icon/icon-master.jpg');
const RES = path.join(ROOT, 'android/app/src/main/res');

const CROP = { left: 72, top: 76, width: 880, height: 880 }; // as generate-icons.js
const BACKGROUND = '#030c1d';

// dp -> px multipliers
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const LEGACY_DP = 48;
const ADAPTIVE_DP = 108;
const ADAPTIVE_ART_DP = 62;

// Pre-Android-12 splash sizes (portrait w x h; landscape is swapped), as in Capacitor's template.
const SPLASH = {
  mdpi: [320, 480],
  hdpi: [480, 800],
  xhdpi: [720, 1280],
  xxhdpi: [960, 1600],
  xxxhdpi: [1280, 1920],
};

const crop = () => sharp(MASTER).extract(CROP);

// A square mask that is opaque in the middle and fades to transparent towards the edges.
const feather = (size, solid) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs><radialGradient id="f" cx="50%" cy="50%" r="50%">
        <stop offset="${solid}" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#f)"/>
    </svg>`
  );

async function legacyIcons(density, scale) {
  const size = Math.round(LEGACY_DP * scale);
  const dir = path.join(RES, `mipmap-${density}`);
  fs.mkdirSync(dir, { recursive: true });
  const square = await crop().resize(size, size, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(square)
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'ic_launcher.png'));
  const circle = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );
  await sharp(square)
    .ensureAlpha()
    .composite([{ input: circle, blend: 'dest-in' }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'ic_launcher_round.png'));
}

async function adaptiveForeground(density, scale) {
  const canvas = Math.round(ADAPTIVE_DP * scale);
  const art = Math.round(ADAPTIVE_ART_DP * scale);
  const offset = Math.round((canvas - art) / 2);
  const artBuf = await crop()
    .resize(art, art, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: feather(art, 0.8), blend: 'dest-in' }])
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: artBuf, left: offset, top: offset }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png'));
}

// The painting, feathered into the background colour (same treatment as the iOS splash).
async function splashImage(width, height, file) {
  const artSize = Math.round(Math.min(width, height) * 0.6);
  const art = await sharp(MASTER)
    .resize(artSize, artSize, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: feather(artSize, 0.72), blend: 'dest-in' }])
    .png()
    .toBuffer();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 3, background: BACKGROUND } })
    .composite([
      {
        input: art,
        left: Math.round((width - artSize) / 2),
        top: Math.round((height - artSize) / 2),
      },
    ])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(file);
}

async function main() {
  if (!fs.existsSync(RES))
    throw new Error(`No Android project at ${RES}. Run "npx cap add android" first.`);
  for (const [density, scale] of Object.entries(DENSITIES)) {
    await legacyIcons(density, scale);
    await adaptiveForeground(density, scale);
  }
  for (const [density, [w, h]] of Object.entries(SPLASH)) {
    await splashImage(w, h, path.join(RES, `drawable-port-${density}`, 'splash.png'));
    await splashImage(h, w, path.join(RES, `drawable-land-${density}`, 'splash.png'));
  }
  await splashImage(480, 320, path.join(RES, 'drawable', 'splash.png'));
  console.log('Android icons and splash images written to', path.relative(ROOT, RES));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
