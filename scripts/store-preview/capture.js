/**
 * Stage 1: record real gameplay footage of play-when.com for the preview video.
 *
 * Every clip is the live site in dark mode at 443x960 CSS px and DPR 2 (886x1920, the App
 * Store preview size), recorded with the CDP screencast. Frames arrive whenever the page
 * repaints, so each clip is written with its timestamps and resampled to a constant 30 fps by
 * ffmpeg (`normalise`).
 *
 * The decks are curated, not faked: a route filters each catalogue file the site fetches down
 * to a handful of marquee events, served verbatim (same ids, art and detail prose). Both decks
 * are Custom games, which never submit a score. `Math.random` is seeded so the first deck
 * deals the hook's three cards; `--find-seed` searches for a seed that does.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  SITE,
  answerKey,
  launch,
  seedStorage,
  standInLeaderboard,
  settle,
  activeCard,
  dropTarget,
  placeCard,
} = require('./shared');

const W = 443;
const H = 960;
const FPS = 30;

const HOOK = ['Great Pyramid of Giza Built', 'First Moon Landing', 'Death of Cleopatra'];
const RALLY = [
  'Columbus Reaches the Americas',
  "Gutenberg's Printing Press",
  'Titanic Sinks',
  "Wright Brothers' First Flight",
  'Tyrannosaurus rex',
];
// More cards than get played, so every correct drop draws a replacement and the hand stays
// full on camera, as it does in a real game.
const DECK_ONE = [
  ...HOOK,
  ...RALLY,
  'Rosetta Stone Discovered',
  'Stonehenge Construction Begins',
  'iPhone Released',
  'Harvard College Founded',
  "Galileo's Trial",
];
const OXFORD = 'University of Oxford Founded';
const LEAVE = "Galileo's Trial";
const DECK_TWO = [
  'Tyrannosaurus rex',
  'Stonehenge Construction Begins',
  'Great Pyramid of Giza Built',
  'Death of Cleopatra',
  'University of Oxford Founded',
  'Aztec Empire Established',
  'Columbus Reaches the Americas',
  "Gutenberg's Printing Press",
  "Galileo's Trial",
  'Harvard College Founded',
  'Rosetta Stone Discovered',
  'Titanic Sinks',
  "Wright Brothers' First Flight",
  'First Moon Landing',
  'iPhone Released',
];

// Runs in the page before the app: a seeded Math.random, so a deck deals the same every run.
function seedRandom(seed) {
  let a = seed >>> 0;
  Math.random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Records CDP screencast frames into named clips. */
class Recorder {
  constructor(page, dir) {
    this.page = page;
    this.dir = dir;
    this.clip = null;
  }

  async init() {
    this.cdp = await this.page.context().newCDPSession(this.page);
    this.cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
      this.cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      if (!this.clip) return;
      const file = path.join(
        this.clip.dir,
        `${String(this.clip.frames.length).padStart(5, '0')}.jpg`
      );
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      this.clip.frames.push({ file, t: metadata.timestamp });
    });
  }

  async start(name) {
    const dir = path.join(this.dir, 'screencast', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    this.clip = { name, dir, frames: [], marks: [] };
    await this.cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 95,
      maxWidth: W * 2,
      maxHeight: H * 2,
      everyNthFrame: 1,
    });
    // Nudge a repaint so the clip opens on a frame even if the page is idle.
    await this.page.evaluate(() => {
      document.body.style.outline = '0 solid transparent';
      requestAnimationFrame(() => (document.body.style.outline = ''));
    });
    await sleep(150);
  }

  /** Note a moment in the clip (a drop), so the cut and the music can land on it. */
  mark(type) {
    if (this.clip) this.clip.marks.push({ type, at: Date.now() / 1000 });
  }

  async stop() {
    await sleep(100);
    const clip = this.clip;
    const end = Date.now() / 1000;
    await this.cdp.send('Page.stopScreencast');
    this.clip = null;
    normalise(clip, this.dir, end);
    return clip;
  }
}

/** Resample a clip's irregular frames to a constant-rate PNG sequence (ffmpeg concat). */
function normalise(clip, outDir, end) {
  const { frames, name } = clip;
  if (frames.length < 1) throw new Error(`clip ${name} caught ${frames.length} frames`);
  const list = frames
    .map((f, i) => {
      const next = i + 1 < frames.length ? frames[i + 1].t : Math.max(end, f.t + 1 / FPS);
      return `file '${f.file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
    })
    .join('\n');
  const listFile = path.join(clip.dir, 'list.txt');
  fs.writeFileSync(listFile, `${list}\nfile '${frames[frames.length - 1].file}'\n`);
  const out = path.join(outDir, 'clips', name);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const t0 = frames[0].t;
  fs.mkdirSync(path.join(outDir, 'clips'), { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'clips', `${name}.json`),
    JSON.stringify({
      frames: Math.round((end - t0) * FPS),
      marks: clip.marks.map((m) => ({ type: m.type, t: +(m.at - t0).toFixed(3) })),
    })
  );
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listFile,
    '-vf',
    `fps=${FPS},scale=${W * 2}:${H * 2}:flags=lanczos`,
    '-q:v',
    '1',
    path.join(out, '%05d.jpg'),
  ]);
  const count = fs.readdirSync(out).length;
  console.log(
    `  ✓ ${name}: ${frames.length} raw frames over ${(end - frames[0].t).toFixed(1)}s -> ${count} @ ${FPS}fps`
  );
}

async function newPage(browser, { seed, deck } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
    ignoreHTTPSErrors: true,
  });
  await ctx.addInitScript(seedStorage);
  if (seed != null) await ctx.addInitScript(seedRandom, seed);
  const page = await ctx.newPage();
  await page.route(/google-analytics|googletagmanager/, (r) => r.abort());
  await standInLeaderboard(page);
  if (deck) {
    const keep = new Set(deck);
    await page.route(/\/events\/[\w-]+\.json(\?|$)/, async (route) => {
      if (/manifest\.json/.test(route.request().url())) return route.continue();
      const res = await route.fetch();
      const body = await res.json();
      await route.fulfill({ response: res, json: body.filter((e) => keep.has(e.friendly_name)) });
    });
  }
  return page;
}

async function startCustom(page) {
  await page.goto(`${SITE}/custom`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await settle(page, 4000);
  await page
    .getByRole('button', { name: /Play\s+·/ })
    .first()
    .click({ force: true });
  await settle(page, 4000);
}

/** The anchor card and the hand, read by cycling the hand once round. */
async function dealt(page) {
  const anchor = await page.$$eval('[data-timeline-year]', (els) =>
    els.map((e) => +e.getAttribute('data-timeline-year'))
  );
  const hand = [];
  for (let i = 0; i < 5; i++) {
    hand.push(await activeCard(page));
    await cycle(page);
  }
  return { anchor: anchor.join(' | '), hand };
}

async function cycle(page) {
  await page.click('[aria-label="Cycle to next card"]', { force: true });
  await page.waitForTimeout(650);
}

/** Cycle the hand until `name` is the active card; false if it isn't in the hand. */
async function bring(page, name) {
  for (let i = 0; i < 6; i++) {
    if ((await activeCard(page)) === name) return true;
    await cycle(page);
  }
  return false;
}

/** A filmed drag: an eased glide with a beat of hover over the slot, like a thumb. */
async function filmDrag(
  page,
  years,
  { rec, index, glideMs = 620, hoverMs = 260, after = 2200 } = {}
) {
  const { name, from, to } = await dropTarget(page, years, { index });
  await page.mouse.move(from.x, from.y);
  await sleep(120);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y - 14, { steps: 3 });
  const steps = Math.round(glideMs / 16);
  for (let i = 1; i <= steps; i++) {
    const t = ease(i / steps);
    await page.mouse.move(from.x + (to.x - from.x) * t, from.y - 14 + (to.y - from.y + 14) * t);
    await sleep(16);
  }
  await sleep(hoverMs);
  await page.mouse.up();
  rec?.mark(index == null ? 'correct' : 'wrong');
  await sleep(after);
  return name;
}

/** Smoothly scroll the timeline's scroller from top to bottom over `ms`. */
async function sweep(page, ms) {
  await page.evaluate(async (ms) => {
    const first = document.querySelector('[data-timeline-year]');
    let el = first?.parentElement;
    while (
      el &&
      !(el.scrollHeight > el.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(el).overflowY))
    )
      el = el.parentElement;
    el = el || document.scrollingElement;
    el.scrollTop = 0;
    await new Promise((r) => setTimeout(r, 400));
    const max = el.scrollHeight - el.clientHeight;
    const t0 = performance.now();
    await new Promise((done) => {
      const step = (now) => {
        const t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        el.scrollTop = max * e;
        if (t < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
  }, ms);
  await sleep(500);
}

/** Place every dealt card except `skip`, which stay in hand. */
async function playAllBut(page, years, skip) {
  for (let guard = 0; guard < 40; guard++) {
    let name = await activeCard(page);
    for (let i = 0; i < 6 && skip.includes(name); i++) {
      await cycle(page);
      name = await activeCard(page);
    }
    if (skip.includes(name)) return;
    await placeCard(page, years, { after: 1400 });
  }
}

async function findSeed(browser) {
  for (let seed = 1; seed < 200; seed++) {
    const page = await newPage(browser, { seed, deck: DECK_ONE });
    await startCustom(page);
    const { anchor, hand } = await dealt(page);
    await page.context().close();
    const ok = anchor === '-2560' && hand.includes(HOOK[1]) && hand.includes(HOOK[2]);
    console.log(`  seed ${seed}: anchor ${anchor} | hand ${hand.join(', ')}${ok ? '  <- ok' : ''}`);
    if (ok) return seed;
  }
  throw new Error('no seed deals the hook');
}

async function capture(outDir, { seed, parts = ['one', 'two', 'home'] }) {
  const years = answerKey();
  const browser = await launch();
  try {
    let page;
    let rec;
    // Deck one: the hook, the rally and a card's story.
    if (parts.includes('one')) {
      page = await newPage(browser, { seed, deck: DECK_ONE });
      rec = new Recorder(page, outDir);
      await rec.init();
      await startCustom(page);
      for (const name of HOOK.slice(1))
        if (!(await bring(page, name))) throw new Error(`seed ${seed} did not deal ${name}`);
      await bring(page, 'First Moon Landing');
      await placeCard(page, years);
      await bring(page, 'Death of Cleopatra');
      await dropTarget(page, years); // centre the slot before the camera rolls
      await rec.start('hook');
      await sleep(500);
      await filmDrag(page, years, { rec, glideMs: 800, hoverMs: 420, after: 2600 });
      await rec.stop();

      await rec.start('rally');
      await sleep(300);
      for (const name of RALLY) {
        await bring(page, name); // if it hasn't been drawn yet, play whatever's up instead
        await filmDrag(page, years, { rec, glideMs: 520, hoverMs: 180, after: 1700 });
      }
      await sleep(800);
      await rec.stop();

      // Centre on the Great Pyramid and open its story.
      await page.evaluate(() => {
        const els = [...document.querySelectorAll('[data-timeline-year]')];
        els[2]?.scrollIntoView({ block: 'center', behavior: 'instant' });
      });
      await settle(page, 1500);
      await rec.start('detail');
      await sleep(700);
      await page
        .getByRole('button', { name: /Great Pyramid of Giza Built/i })
        .first()
        .click({ force: true });
      rec.mark('open');
      await page
        .locator('[data-testid="modal-card"]')
        .waitFor({ state: 'visible', timeout: 10000 });
      await sleep(2000);
      await page.evaluate(async () => {
        const el = document.querySelector('[data-testid="detail-scroll"]');
        const max = el.scrollHeight - el.clientHeight;
        const t0 = performance.now();
        const ms = 3600;
        await new Promise((done) => {
          const step = (now) => {
            const t = Math.min(1, (now - t0) / ms);
            el.scrollTop =
              Math.min(max, 520) * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
            if (t < 1) requestAnimationFrame(step);
            else done();
          };
          requestAnimationFrame(step);
        });
      });
      await sleep(800);
      await rec.stop();
      await page.context().close();
    }

    // Deck two: a long timeline with one honest miss in it.
    if (parts.includes('two')) {
      page = await newPage(browser, { seed: seed + 1, deck: DECK_TWO });
      rec = new Recorder(page, outDir);
      await rec.init();
      await startCustom(page);
      // Place every card but Oxford, so the Aztec Empire is on the board before the miss.
      await playAllBut(page, years, [OXFORD, LEAVE]);
      if (!(await bring(page, OXFORD))) throw new Error('Oxford was never dealt');
      const marks = await page.$$eval('[data-timeline-year]', (els) =>
        els.map((e) => +e.getAttribute('data-timeline-year'))
      );
      const afterAztec = marks.filter((y) => y <= 1428).length;
      await dropTarget(page, years, { index: afterAztec });
      await rec.start('wrong');
      await sleep(500);
      await filmDrag(page, years, {
        rec,
        index: afterAztec,
        glideMs: 700,
        hoverMs: 380,
        after: 2600,
      });
      await rec.stop();

      // Finish the deck, holding one card back so the game never reaches its end screen.
      await playAllBut(page, years, [LEAVE]);
      await settle(page, 1500);
      await rec.start('sweep');
      await sweep(page, 4200);
      await rec.stop();
      await page.context().close();
    }

    // Home: today's Daily, then the Archive of past themes.
    if (parts.includes('home')) {
      page = await newPage(browser);
      rec = new Recorder(page, outDir);
      await rec.init();
      await page.goto(`${SITE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await settle(page, 6000);
      await rec.start('daily');
      await sleep(2200);
      await rec.stop();
      await page.goto(`${SITE}/archive`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await settle(page, 5000);
      await rec.start('archive');
      await page.mouse.move(W / 2, H / 2);
      for (let i = 0; i < 40; i++) {
        await page.mouse.wheel(0, 14);
        await sleep(30);
      }
      await sleep(800);
      await rec.stop();
    }
  } finally {
    await browser.close();
  }
}

module.exports = { capture, findSeed, launch };
