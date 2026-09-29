#!/usr/bin/env node

/**
 * Generate every app icon, the favicon and the iOS launch-screen image from one painting.
 *
 * The master is a Gemini oil painting (assets/icon/icon-master.jpg), made with the prompts in
 * docs/app-icon/gemini-icon-prompts.md. Vector icons were tried for four rounds and rejected;
 * the painting matches the card art. See docs/mobile-ios/index.md ("Icons, splash, store art").
 *
 * The icon is a centred crop of the master (CROP), because a hand-sized icon needs its one
 * object to fill more of the square than a card image does. Tested at 1024/180/60/40/29 px:
 * a tighter crop pushes the hourglass caps into the iOS corner mask.
 *
 * Outputs (all opaque; the App Store rejects an icon with an alpha channel):
 *   public/favicon.png (64), public/favicon.ico (16/32/48/64), public/logo180.png,
 *   public/logo192.png, public/logo512.png,
 *   ios/App/App/Assets.xcassets/AppIcon.appiconset/logo1024.png,
 *   ios/App/App/Assets.xcassets/Splash.imageset/splash-2732.png
 *
 * The icon and splash only reach iPhones in a new App Store build; the web copies ship on deploy.
 *
 * Usage: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const MASTER = path.join(ROOT, 'assets/icon/icon-master.jpg');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ASSETS = path.join(ROOT, 'ios/App/App/Assets.xcassets');

// Centred 880px crop of the 1024px master (4px lower, which centres the hourglass).
const CROP = { left: 72, top: 76, width: 880, height: 880 };
// The painting's own corner colour, so the splash canvas and the painting meet without a seam.
const BACKGROUND = '#030c1d';
const SPLASH_SIZE = 2732;
// On a phone, aspect-fill shows roughly the middle 1260px of the 2732px splash.
const SPLASH_ART = 980;

const PNG_ICONS = [
  { file: path.join(PUBLIC_DIR, 'favicon.png'), size: 64 },
  { file: path.join(PUBLIC_DIR, 'logo180.png'), size: 180 },
  { file: path.join(PUBLIC_DIR, 'logo192.png'), size: 192 },
  { file: path.join(PUBLIC_DIR, 'logo512.png'), size: 512 },
  { file: path.join(ASSETS, 'AppIcon.appiconset/logo1024.png'), size: 1024 },
];
const ICO_SIZES = [16, 32, 48, 64];

const iconAt = (size) =>
  sharp(MASTER)
    .extract(CROP)
    .resize(size, size, { kernel: 'lanczos3' })
    .removeAlpha()
    .png({ compressionLevel: 9 });

// An .ico is a directory of embedded PNGs; every browser that reads .ico accepts PNG entries.
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

// The painting, feathered at its edges so it dissolves into the flat splash colour.
async function buildSplash() {
  const feather = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SPLASH_ART}" height="${SPLASH_ART}">
      <defs><radialGradient id="f" cx="50%" cy="50%" r="50%">
        <stop offset="0.72" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient></defs>
      <rect width="100%" height="100%" fill="url(#f)"/>
    </svg>`
  );
  const art = await sharp(MASTER)
    .resize(SPLASH_ART, SPLASH_ART, { kernel: 'lanczos3' })
    .ensureAlpha()
    .composite([{ input: feather, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const offset = Math.round((SPLASH_SIZE - SPLASH_ART) / 2);
  const dir = path.join(ASSETS, 'Splash.imageset');
  fs.mkdirSync(dir, { recursive: true });
  await sharp({
    create: { width: SPLASH_SIZE, height: SPLASH_SIZE, channels: 3, background: BACKGROUND },
  })
    .composite([{ input: art, left: offset, top: offset }])
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, 'splash-2732.png'));
  fs.writeFileSync(
    path.join(dir, 'Contents.json'),
    JSON.stringify(
      {
        images: ['1x', '2x', '3x'].map((scale) => ({
          idiom: 'universal',
          filename: 'splash-2732.png',
          scale,
        })),
        info: { version: 1, author: 'xcode' },
      },
      null,
      2
    ) + '\n'
  );
  console.log(`  ✓ Splash.imageset/splash-2732.png (${SPLASH_SIZE}x${SPLASH_SIZE})`);
}

async function main() {
  console.log(`Generating icons from ${path.relative(ROOT, MASTER)}...\n`);
  for (const { file, size } of PNG_ICONS) {
    await iconAt(size).toFile(file);
    const kb = (fs.statSync(file).size / 1024).toFixed(1);
    console.log(`  ✓ ${path.relative(ROOT, file)} (${size}x${size}) - ${kb} KB`);
  }
  const pngs = await Promise.all(
    ICO_SIZES.map(async (size) => ({ size, data: await iconAt(size).toBuffer() }))
  );
  fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buildIco(pngs));
  console.log(`  ✓ public/favicon.ico (${ICO_SIZES.join('/')})`);
  await buildSplash();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
