#!/usr/bin/env node
/*
 * Screenshot the /timeline-lab directions at several board lengths, compose a contact sheet
 * per direction so the progression reads left-to-right, and capture a frame strip of the rail
 * extension (which a single still cannot show).
 *
 *   CI=true npm run build
 *   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install --no-save playwright
 *   node scripts/timeline-lab-shots.js [outDir]
 *
 * Serves build/ itself (SPA fallback) because a dev server's HMR socket never lets the page go
 * network-idle. Chromium goes through $HTTPS_PROXY with TLS 1.2 so Google Fonts and Cloudinary
 * art actually load — see docs/driving-the-app-with-playwright.md.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const OUT = (process.argv[2] || '').startsWith('--')
  ? path.join(ROOT, 'timeline-lab-shots')
  : process.argv[2] || path.join(ROOT, 'timeline-lab-shots');
const PORT = 4173;

const W = 402;
const H = 844;
const LENGTHS = [5, 14, 30];
const VARIANTS = ['none', 'paper', 'rail', 'both', 'span'];
const THEMES = ['light', 'dark'];
/** `node scripts/timeline-lab-shots.js out --strips` re-shoots only the extension strips. */
const STRIPS_ONLY = process.argv.includes('--strips');
/** How far to stretch the extension for the stills. The curve is unchanged; only its clock is. */
const SLOWMO = 12;

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let file = path.join(BUILD, url);
    if (!file.startsWith(BUILD) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(BUILD, 'index.html');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

const url = (q) => `http://127.0.0.1:${PORT}/timeline-lab?${q}`;

function launch(proxy) {
  return chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--ssl-version-max=tls1.2', '--disable-quic'],
    proxy: proxy ? { server: proxy, bypass: 'localhost,127.0.0.1' } : undefined,
  });
}

/** "at rest" / "grow ×0.24" / "settled" — the number is the segment's measured scaleY. */
function frameLabel(tag, scaleY) {
  const scale = scaleY === null ? '' : ` ×${scaleY.toFixed(2)}`;
  if (tag === 'rest') return 'at rest';
  if (tag === 'settled') return `settled${scale}`;
  if (tag.startsWith('back')) return `retract${scale}`;
  return `grow${scale}`;
}

/** A contact sheet: one row of labelled frames under a heading. */
function sheetHtml(theme, heading, cells, outDir, width, cols) {
  const ink = theme === 'dark' ? '#e4e4e4' : '#001524';
  const paper = theme === 'dark' ? '#0d1b2a' : '#f0f0f0';
  const border = theme === 'dark' ? '#2d3f50' : '#c8c8c8';
  return `<!doctype html><meta charset="utf-8">
<style>
 body{margin:0;background:${paper};color:${ink};font:14px Inter,system-ui,sans-serif;padding:24px}
 h1{font:600 22px Playfair Display,Georgia,serif;margin:0 0 16px}
 .grid{display:grid;grid-template-columns:repeat(${cols},max-content);gap:18px}
 figure{margin:0}
 img{display:block;width:${width}px;border:1px solid ${border};border-radius:10px}
 figcaption{padding-top:8px;font-family:DM Mono,ui-monospace,monospace;font-size:12px;opacity:.7}
</style>
<h1>${heading}</h1>
<div class="grid">${cells
    .map(
      ([label, f]) =>
        `<figure><img src="file://${path.join(outDir, f)}"><figcaption>${label}</figcaption></figure>`
    )
    .join('')}</div>`;
}

/** Board shots at each length, plus the whole-board view, for every variant and theme. */
async function boardShots(ctx) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: W, height: H });
  const shot = async (file, q) => {
    await page.goto(url(`bare=1&${q}`), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-timeline-index]', { timeout: 20000 });
    await page.waitForTimeout(2600); // card art + the re-centre pass
    await page.screenshot({ path: path.join(OUT, file) });
    process.stdout.write(`${file}\n`);
  };
  for (const theme of THEMES) {
    for (const v of VARIANTS) {
      for (const n of LENGTHS) await shot(`${theme}-${v}-n${n}.png`, `v=${v}&n=${n}&theme=${theme}`);
      await shot(`${theme}-${v}-whole.png`, `v=${v}&n=30&fit=1&theme=${theme}`);
    }
  }
  await page.close();
}

/** Change the lab's ghost state without a reload, so the AnimatePresence actually animates. */
async function setGhost(page, value) {
  await page.evaluate((v) => {
    const u = new URL(window.location.href);
    u.searchParams.set('ghost', v);
    window.history.pushState({}, '', u.toString());
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, value);
}

async function settleBoard(page) {
  await page.waitForSelector('[data-timeline-index]', { timeout: 20000 });
  await page.waitForTimeout(2800); // card art + the centring pass
}

/**
 * The rail extension as a frame strip. The spring is ~320ms — far quicker than a screenshot
 * round-trip — so the capture slows the page's animations through CDP (framer-motion drives
 * scaleY, and CDP's Animation.setPlaybackRate did not reach it) — so the lab's ?slowmo param
 * stretches the spring in time instead. Scaling a spring's time is exactly stiffness/k² and
 * damping/k, so the curve shown is the real one, just slower; nothing is reconstructed.
 */
async function extensionStrip(browser) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: 880 },
    deviceScaleFactor: 1,
    isMobile: false,
  });
  const page = await ctx.newPage();
  const out = [];
  for (const theme of THEMES) {
    for (const dir of ['earlier', 'later']) {
      // Pin the focused row so the board never re-scrolls mid-strip, and frame the clip on the
      // end of the board that is about to grow.
      const row = dir === 'earlier' ? 1 : 12;
      const clip =
        dir === 'earlier'
          ? { x: 0, y: 150, width: W, height: 300 }
          : { x: 0, y: 380, width: W, height: 300 };
      await page.goto(url(`v=both&n=14&row=${row}&bare=1&slowmo=${SLOWMO}&theme=${theme}`), {
        waitUntil: 'domcontentloaded',
      });
      await settleBoard(page);

      const frames = [];
      // Read the segment's actual scaleY at the moment of capture, so the strip's captions are
      // measured rather than guessed at from the wall clock.
      const grab = async (tag) => {
        const f = `${theme}-ext-${dir}-${tag}.png`;
        const scaleY = await page.evaluate(() => {
          const el = document.querySelector('.tl-rail');
          const m = el ? new DOMMatrixReadOnly(getComputedStyle(el).transform) : null;
          return m ? Math.round(m.d * 100) / 100 : null;
        });
        await page.screenshot({ path: path.join(OUT, f), clip });
        frames.push([f, tag, scaleY]);
      };
      await grab('rest');
      await setGhost(page, dir);
      for (let i = 1; i <= 7; i++) {
        await page.waitForTimeout(28 * SLOWMO);
        await grab(`${i}`);
      }
      await page.waitForTimeout(260 * SLOWMO);
      await grab('settled');
      await setGhost(page, 'off');
      for (let i = 1; i <= 3; i++) {
        await page.waitForTimeout(40 * SLOWMO);
        await grab(`back${i}`);
      }
      out.push([theme, dir, frames]);
      process.stdout.write(`${theme}-ext-${dir} (${frames.length} frames)\n`);
    }
  }
  await ctx.close();
  return out;
}

/** The same thing at real speed, as video — the only medium that actually shows the feel. */
async function extensionVideo(browser, theme) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: 880 },
    deviceScaleFactor: 1,
    isMobile: false,
    recordVideo: { dir: OUT, size: { width: W, height: 880 } },
  });
  const page = await ctx.newPage();
  await page.goto(url(`v=both&n=14&row=6&bare=1&theme=${theme}`), {
    waitUntil: 'domcontentloaded',
  });
  await settleBoard(page);
  for (const dir of ['later', 'earlier', 'later']) {
    await page.waitForTimeout(700);
    // The board has to be looking at the end that grows, so re-pin the focus row first.
    await page.evaluate((r) => {
      const u = new URL(window.location.href);
      u.searchParams.set('row', String(r));
      window.history.pushState({}, '', u.toString());
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, dir === 'earlier' ? 1 : 12);
    await page.waitForTimeout(700);
    await setGhost(page, dir);
    await page.waitForTimeout(1400);
    await setGhost(page, 'off');
    await page.waitForTimeout(900);
  }
  const video = page.video();
  await ctx.close();
  const src = await video.path();
  const dest = path.join(OUT, `rail-extension-${theme}.webm`);
  fs.renameSync(src, dest);
  process.stdout.write(`rail-extension-${theme}.webm\n`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await launch(proxy);
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    isMobile: false,
  });

  if (!STRIPS_ONLY) await boardShots(ctx);
  const strips = await extensionStrip(browser);
  for (const theme of THEMES) await extensionVideo(browser, theme);

  const sheet = await ctx.newPage();
  const compose = async (name, theme, heading, cells, width, cols = cells.length) => {
    // Size the page to the grid so fullPage has no dead margin to capture.
    await sheet.setViewportSize({ width: cols * (width + 18) + 48, height: 600 });
    const tmp = path.join(OUT, `_${name}.html`);
    fs.writeFileSync(tmp, sheetHtml(theme, heading, cells, OUT, width, cols));
    await sheet.goto(`file://${tmp}`, { waitUntil: 'load' });
    await sheet.waitForTimeout(500);
    await sheet.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
    fs.unlinkSync(tmp);
    process.stdout.write(`${name}.png\n`);
  };

  for (const theme of STRIPS_ONLY ? [] : THEMES) {
    for (const v of VARIANTS) {
      await compose(
        `sheet-${theme}-${v}`,
        theme,
        `${v} — ${theme}`,
        [
          ...LENGTHS.map((n) => [`${n} cards`, `${theme}-${v}-n${n}.png`]),
          ['whole board (30)', `${theme}-${v}-whole.png`],
        ],
        W
      );
    }
  }
  for (const [theme, dir, frames] of strips) {
    await compose(
      `strip-${theme}-${dir}`,
      theme,
      `rail extension, ${dir} — ${theme}`,
      frames.map(([f, tag, scaleY]) => [frameLabel(tag, scaleY), f]),
      300,
      4
    );
  }

  await browser.close();
  server.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
