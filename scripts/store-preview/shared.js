/**
 * Helpers shared by the App Store capture scripts (screenshots and the preview video).
 * The proxy/TLS flags and the drag recipe come from docs/driving-the-app-with-playwright.md.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '../..');
const SITE = 'https://www.play-when.com';
const STAND_IN_NAMES = [
  'Amber Falcon',
  'Sapphire Cobra',
  'Ancient Badger',
  'Jade Condor',
  'Crimson Owl',
];

/** friendly_name -> year, from the catalogue the live site serves. */
function answerKey() {
  const dir = path.join(ROOT, 'public/events');
  const years = new Map();
  for (const f of JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'))).files)
    for (const e of JSON.parse(fs.readFileSync(path.join(dir, f))))
      if (e && e.friendly_name != null && e.year != null && !years.has(e.friendly_name))
        years.set(e.friendly_name, e.year);
  return years;
}

async function launch() {
  const proxy = process.env.HTTPS_PROXY;
  return chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--ssl-version-max=tls1.2', '--disable-quic'],
    proxy: proxy ? { server: proxy } : undefined,
  });
}

// A returning player's storage: every one-shot hint and "new" tab dot already seen.
// Runs in the page (addInitScript), so it must stay self-contained.
function seedStorage() {
  const hints = {};
  for (const k of [
    'drag',
    'wrong',
    'correct',
    'closeEnough',
    'tapCard',
    'stats',
    'swap',
    'dailyTab',
    'archiveTab',
    'customTab',
    'statsTab',
    'timelineTab',
    'reviewEye',
  ])
    hints[k] = true;
  localStorage.setItem('when-hints-seen', JSON.stringify(hints));
  localStorage.setItem(
    'when-nav-seen',
    JSON.stringify({ archive: true, stats: true, timeline: true })
  );
}

// Real scores, but never real players' nicknames in a public store listing: swap each name
// for one in the style of the app's own random names.
async function standInLeaderboard(page) {
  await page.route(/\/api\/leaderboard\/\d{4}-\d{2}-\d{2}/, async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    (body.leaderboard || []).forEach(
      (e, i) => (e.displayName = STAND_IN_NAMES[i % STAND_IN_NAMES.length])
    );
    await route.fulfill({ response: res, json: body });
  });
}

async function settle(page, ms = 2500) {
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.fonts.ready);
}

/** The active card's friendly_name, once the hand is ready. */
async function activeCard(page) {
  const hand = page.locator('div.cursor-grab').first();
  await hand.waitFor({ state: 'visible', timeout: 10000 });
  return (await hand.innerText()).trim().split('\n')[0].trim();
}

/**
 * Where the active card goes: its name, the insertion index `k` and the pointer's start and
 * end points. By default the slot is the one the answer key says; `index` overrides that (a
 * deliberate miss). Scrolls the slot to centre first (the tall-timeline trap, §6 of the doc).
 */
async function dropTarget(page, years, { index } = {}) {
  const width = page.viewportSize().width;
  const hand = page.locator('div.cursor-grab').first();
  await hand.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  const box = await hand.boundingBox();
  const name = (await hand.innerText()).trim().split('\n')[0].trim();
  const year = years.get(name);
  const marks = await page.$$eval('[data-timeline-year]', (els) =>
    els.map((e) => +e.getAttribute('data-timeline-year'))
  );
  const k = index ?? (year == null ? marks.length : marks.filter((y) => y < year).length);
  await page.evaluate((i) => {
    const els = [...document.querySelectorAll('[data-timeline-year]')];
    els[Math.max(0, Math.min(els.length - 1, i))]?.scrollIntoView({
      block: 'center',
      behavior: 'instant',
    });
  }, k);
  await page.waitForTimeout(600);
  const pos = await page.$$eval('[data-timeline-year]', (els) =>
    els.map((e) => e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)
  );
  const top = box.y;
  const ty =
    pos.length === 0
      ? (140 + top - 30) / 2
      : k <= 0
        ? Math.max(148, pos[0] - 34)
        : k >= pos.length
          ? Math.min(top - 30, pos[pos.length - 1] + 34)
          : (pos[k - 1] + pos[k]) / 2;
  return {
    name,
    k,
    from: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    to: { x: width / 2, y: ty },
  };
}

/**
 * Drag the active card onto the timeline (see `dropTarget`). `pauseMidDrag` runs while the
 * card hovers over its slot.
 */
async function placeCard(page, years, { index, pauseMidDrag, after = 1800 } = {}) {
  const { name, from, to } = await dropTarget(page, years, { index });
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y - 14, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 28 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  await page.waitForTimeout(150);
  if (pauseMidDrag) await pauseMidDrag();
  await page.mouse.up();
  await page.waitForTimeout(after);
  return name;
}

module.exports = {
  ROOT,
  SITE,
  answerKey,
  launch,
  seedStorage,
  standInLeaderboard,
  settle,
  activeCard,
  dropTarget,
  placeCard,
};
