#!/usr/bin/env node
/**
 * Frame-accurate probe for the dot → tick landing (TimelineTick / TimelineMarker).
 *
 *   CI=true npm run build && npx serve -s build -l 4178
 *   node scripts/tick-landing-probe.js
 *
 * Plays a real Custom game with real pointer events (see
 * docs/driving-the-app-with-playwright.md) and samples, every animation frame, the marker's box
 * and the one tick body that is off its resting 12×4. Stills are the wrong tool here: the morph
 * is ~350ms and the screenshot pipeline lags a throttled page badly enough to miss it entirely.
 * What matters is measurable instead.
 *
 * What to read in the output:
 *   HANDOFF GAP      distance between the marker's last lit centre and the dash's first. The
 *                    claim "the dot becomes the tick" is this number being ~0.
 *   both lit         frames showing a lit marker AND a moving dash in different places. Must be
 *                    0 outside the snuff, or the handoff has a visible double.
 *   dash width track 6 → 12. On a miss it holds at 6 for the whole travel, then grows.
 *   first dash       6×8 with `shadow=none` on a miss (already snuffed), `glow` on a correct one.
 *   tick column      spread across every tick at rest — the BOARD COLUMN invariant, still 0.
 */
/* eslint-disable */
const { chromium } = require('playwright');

const BASE = process.env.PROBE_BASE || 'http://localhost:4178';
const W = 402;

const SAMPLER = () => {
  window.__s = [];
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };
  const tick = () => {
    const mk = document.querySelector('[data-insertion-marker]');
    // The landing dash is the only tick body whose inline width/height differ from 12x4.
    const bodies = [...document.querySelectorAll('[data-tick-body]')];
    const moving = bodies.find((b) => {
      const r = b.getBoundingClientRect();
      return Math.abs(r.width - 12) > 0.4 || Math.abs(r.height - 4) > 0.4;
    });
    const scroller = document.querySelector('[data-board-scroller]');
    window.__s.push({
      t: performance.now(),
      scrollTop: scroller ? scroller.scrollTop : null,
      mk: box(mk),
      mkOp: mk ? +getComputedStyle(mk).opacity : null,
      mkPhase: mk ? mk.getAttribute('data-insertion-marker') : null,
      mkShadow: mk ? getComputedStyle(mk).boxShadow : null,
      dash: box(moving),
      dashShadow: moving ? getComputedStyle(moving).boxShadow : null,
      ticks: bodies.map((b) => {
        const r = b.getBoundingClientRect();
        return +(r.left + r.width / 2).toFixed(2);
      }),
    });
    requestAnimationFrame(tick);
  };
  tick();
};

async function startGame(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.click('[aria-label="Custom game"]');
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Play ·")');
  await page.waitForTimeout(5000);
}

async function placeCard(page, k, { slow = false } = {}) {
  const card = await page.$('div.cursor-grab');
  const cb = await card.boundingBox();
  const cx = cb.x + cb.width / 2;
  const cy = cb.y + cb.height / 2;

  const pos = await page.$$eval('[data-timeline-year]', (els) =>
    els.map((e) => {
      const r = e.getBoundingClientRect();
      return r.top + r.height / 2;
    })
  );
  const handTop = cb.y;
  let targetY;
  if (pos.length === 0) targetY = (140 + handTop - 30) / 2;
  else if (k <= 0) targetY = Math.max(148, pos[0] - 34);
  else if (k >= pos.length) targetY = Math.min(handTop - 30, pos[pos.length - 1] + 34);
  else targetY = (pos[k - 1] + pos[k]) / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 14, { steps: 4 });
  await page.mouse.move(W / 2, targetY, { steps: 28 });
  await page.mouse.move(W / 2, targetY, { steps: 4 });
  // Let the marker's trailing spring settle so the drop origin is unambiguous.
  await page.waitForTimeout(slow ? 500 : 140);
  await page.evaluate(SAMPLER);
  await page.mouse.up();
  await page.waitForTimeout(2600);
  const samples = await page.evaluate(() => window.__s);
  await page.evaluate(() => {
    window.__s = [];
  });
  return samples;
}

function report(label, s) {
  const lastMarker = [...s].reverse().find((x) => x.mkOp > 0.5 && x.mk);
  const firstDash = s.find((x) => x.dash);
  const lastDash = [...s].reverse().find((x) => x.dash);
  console.log(`\n=== ${label} ===`);
  console.log(`frames=${s.length} phases=${[...new Set(s.map((x) => x.mkPhase))].join(',')}`);
  if (!firstDash) {
    console.log('NO LANDING DASH SEEN — the tick never left its resting size.');
    return;
  }
  console.log(
    `first dash: ${firstDash.dash.w.toFixed(1)}x${firstDash.dash.h.toFixed(1)} ` +
      `centre=(${firstDash.dash.cx.toFixed(1)}, ${firstDash.dash.cy.toFixed(1)}) ` +
      `shadow=${firstDash.dashShadow === 'none' ? 'none' : 'glow'}`
  );
  if (lastMarker) {
    const dx = firstDash.dash.cx - lastMarker.mk.cx;
    const dy = firstDash.dash.cy - lastMarker.mk.cy;
    console.log(
      `last lit marker centre=(${lastMarker.mk.cx.toFixed(1)}, ${lastMarker.mk.cy.toFixed(1)}) ` +
        `phase=${lastMarker.mkPhase}`
    );
    console.log(`HANDOFF GAP: dx=${dx.toFixed(2)} dy=${dy.toFixed(2)}`);
  }
  const overlap = s.filter((x) => x.mkOp > 0.1 && x.dash && x.mkPhase !== 'snuff');
  console.log(`frames with BOTH a lit marker and a moving dash: ${overlap.length}`);
  const widths = s.filter((x) => x.dash).map((x) => +x.dash.w.toFixed(1));
  console.log(`dash width track: ${widths.filter((_, i) => i % 3 === 0).join(' ')}`);
  console.log(
    `last dash: ${lastDash.dash.w.toFixed(1)}x${lastDash.dash.h.toFixed(1)} ` +
      `shadow=${lastDash.dashShadow === 'none' ? 'none' : 'glow'}`
  );
  const end = s[s.length - 1];
  const spread = Math.max(...end.ticks) - Math.min(...end.ticks);
  console.log(`tick column spread at rest: ${spread.toFixed(2)}px over ${end.ticks.length} ticks`);
  console.log(`scrollTop moved: ${Math.abs((end.scrollTop ?? 0) - (s[0].scrollTop ?? 0))}px`);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: W, height: 1200 },
    deviceScaleFactor: 1,
    isMobile: false,
  });
  const page = await ctx.newPage();
  await page.route('**/*', (r) =>
    /fonts\.googleapis|fonts\.gstatic|gstatic|cloudinary/.test(r.request().url())
      ? r.abort()
      : r.continue()
  );

  await startGame(page);

  for (let i = 0; i < 8; i++) {
    const before = await page.$$eval('[data-timeline-year]', (e) => e.length);
    const tombsBefore = await page.$$eval('[data-tombstone-name]', (e) => e.length);
    const s = await placeCard(page, Math.floor(Math.random() * (before + 1)));
    const after = await page.$$eval('[data-timeline-year]', (e) => e.length);
    const tombsAfter = await page.$$eval('[data-tombstone-name]', (e) => e.length);
    if (after > before) report(`placement ${i + 1} — CORRECT`, s);
    else if (tombsAfter > tombsBefore) report(`placement ${i + 1} — MISS`, s);
    else report(`placement ${i + 1} — no-op`, s);
    if (await page.$('text=/submit to leaderboard/i')) break;
  }

  await browser.close();
})();
