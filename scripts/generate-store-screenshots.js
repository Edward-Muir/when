#!/usr/bin/env node

/**
 * App Store screenshots: capture the live app, then frame each shot with a headline.
 *
 *   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-save playwright
 *   node scripts/generate-store-screenshots.js            # capture + compose
 *   node scripts/generate-store-screenshots.js --compose  # re-frame existing captures only
 *
 * Captures play-when.com at 440x956 CSS px and DPR 3, which is exactly the 6.9" iPhone
 * screenshot size App Store Connect asks for (1320x2868). Raw captures go to
 * assets/app-store/raw/, framed ones to assets/app-store/screenshots/.
 *
 * The run plays one Custom game (never the Daily, and it never submits a score), placing cards
 * with the answer key from public/events/ so every placement lands. The proxy/TLS flags and the
 * drag recipe come from docs/driving-the-app-with-playwright.md. It loads a few dozen card
 * images from Cloudinary; keep re-runs occasional (docs/cloudinary-cost-controls.md).
 */

const fs = require('fs');
const path = require('path');
const {
  ROOT,
  SITE,
  answerKey,
  launch,
  seedStorage,
  standInLeaderboard,
  settle,
  placeCard,
} = require('./store-preview/shared');

const RAW = path.join(ROOT, 'assets/app-store/raw');
const OUT = path.join(ROOT, 'assets/app-store/screenshots');
const W = 440;
const H = 956;
const PLACEMENTS = 7;

// Background and headline colours come from the icon painting.
const SHOTS = [
  {
    file: '1-daily',
    title: 'A new history challenge <em>every day</em>',
    sub: 'One themed deck, the same for everyone',
  },
  {
    file: '2-drag',
    title: 'Drag each event <em>into place</em>',
    sub: 'Before or after? Trust your instincts',
  },
  {
    file: '3-timeline',
    title: 'Build the <em>longest timeline</em>',
    sub: 'Every right answer grows your run',
  },
  {
    file: '4-detail',
    title: 'Every card tells <em>its story</em>',
    sub: 'Flip a placed card to learn what happened',
  },
  {
    file: '5-archive',
    title: 'Replay every <em>past theme</em>',
    sub: 'Or build your own game from any era',
  },
];

async function capture() {
  fs.mkdirSync(RAW, { recursive: true });
  const years = answerKey();
  const browser = await launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 3,
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript(seedStorage);
  const page = await ctx.newPage();
  await page.route(/google-analytics|googletagmanager/, (r) => r.abort());
  await standInLeaderboard(page);
  const shot = async (file) => {
    await page.screenshot({ path: path.join(RAW, `${file}.png`), timeout: 30000 });
    console.log(`  ✓ raw/${file}.png`);
  };

  await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 6000);
  await shot('1-daily');

  await page.goto(`${SITE}/archive`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 5000);
  await shot('5-archive');

  await page.goto(`${SITE}/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 4000);
  await page
    .getByRole('button', { name: /Play\s+·/ })
    .first()
    .click({ force: true });
  await settle(page, 4000);

  const placed = [];
  for (let i = 0; i < PLACEMENTS; i++) {
    const midDrag = i === PLACEMENTS - 1 ? () => shot('2-drag') : undefined;
    placed.push(await placeCard(page, years, { pauseMidDrag: midDrag }));
  }
  // Centre the timeline on its middle card, so the whole run fits between Earlier and Later.
  await page.evaluate(() => {
    const els = [...document.querySelectorAll('[data-timeline-year]')];
    els[Math.floor(els.length / 2)]?.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await settle(page, 2500);
  await shot('3-timeline');

  // Open a placed card's detail popup; the prose shard loads lazily.
  const pick = placed[Math.floor(placed.length / 2)];
  await page
    .getByRole('button', { name: new RegExp(pick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
    .first()
    .click({ force: true });
  await page.locator('[data-testid="modal-card"]').waitFor({ state: 'visible', timeout: 10000 });
  await settle(page, 3500);
  await shot('4-detail');

  await browser.close();
}

async function compose() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const page = await browser.newPage({
    viewport: { width: 1320, height: 2868 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  for (const s of SHOTS) {
    const raw = path.join(RAW, `${s.file}.png`);
    if (!fs.existsSync(raw)) throw new Error(`missing ${raw}; run without --compose first`);
    const src = `data:image/png;base64,${fs.readFileSync(raw).toString('base64')}`;
    await page.setContent(
      `<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@500&display=swap">
<style>
  html,body{margin:0;width:1320px;height:2868px;overflow:hidden}
  body{background:radial-gradient(1400px 900px at 50% 0%,#12304d 0%,#071a2e 45%,#030c1d 100%);font-family:Inter,sans-serif}
  .head{position:absolute;top:150px;left:90px;right:90px;text-align:center}
  h1{margin:0;font:700 100px/1.08 'Playfair Display',Georgia,serif;color:#f3ead6;letter-spacing:-.01em;text-wrap:balance}
  h1 em{font-style:italic;color:#e9b95a}
  p{margin:34px 0 0;font:500 44px/1.3 Inter,sans-serif;color:#9fb0c3}
  .phone{position:absolute;top:640px;left:50%;transform:translateX(-50%);width:1040px;border-radius:64px;overflow:hidden;
    box-shadow:0 0 0 14px #0b1624,0 0 0 16px #2a3b52,0 60px 140px rgba(0,0,0,.6)}
  .phone img{display:block;width:100%}
</style></head><body>
<div class="head"><h1>${s.title}</h1><p>${s.sub}</p></div>
<div class="phone"><img src="${src}"></div></body></html>`,
      { waitUntil: 'load' }
    );
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, `${s.file}.png`), timeout: 30000 });
    console.log(`  ✓ screenshots/${s.file}.png (1320x2868)`);
  }
  await browser.close();
}

(async () => {
  if (!process.argv.includes('--compose')) {
    console.log('Capturing play-when.com...');
    await capture();
  }
  console.log('Framing...');
  await compose();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
