# Driving & Playing "When" with Playwright

A runbook for automating the app end-to-end — launching it, clicking through
it, placing cards, and (on production) playing the daily and submitting a
leaderboard score. Written by a Claude instance that worked all of this out the
hard way, so the next one doesn't have to. Everything here is stuff that is
**not obvious** and cost real debugging time.

If you only need to confirm a change works in the running app, this is your
fast path. Read it top-to-bottom once; after that the code blocks are
copy-pasteable.

---

## 1. Prerequisites (fresh container)

```bash
npm install                                   # project deps aren't pre-populated
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
  npm install --no-save playwright@latest      # driver only; browser is pre-installed
```

- Chromium is already on disk at **`/opt/pw-browsers/chromium`** (a symlink).
  Never run `playwright install`. Always launch with
  `executablePath: '/opt/pw-browsers/chromium'`.
- If your script lives outside the repo (e.g. a scratchpad), Node can't resolve
  `playwright`. Either put the script in the repo tree or run it with
  `NODE_PATH=/home/user/when/node_modules node yourscript.js`.

## 2. Launching the app

**Local (frontend only, no leaderboard API):**

```bash
BROWSER=none npm start        # serves http://localhost:3000 ; leave running in background
```

Use `vercel dev` instead if you need the `/api/leaderboard/*` routes (needs
Upstash Redis env vars — usually absent locally, so leaderboard submit 404s).

**Production (the real site, real leaderboard):** navigate to
`https://play-when.com/daily`. Note the apex 307-redirects to `www.` — either
host works. Production needs the proxy + TLS workaround below.

## 3. Three gotchas that will waste your time if you don't know them

| Symptom                                                                            | Cause                                                                                         | Fix                                                                                  |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `page.goto` hangs on `networkidle`                                                 | dev server keeps an HMR websocket open, so the network is never idle                          | use `waitUntil: 'domcontentloaded'` + explicit `waitForTimeout`/`waitFor`            |
| `page.screenshot` times out "waiting for fonts to load"                            | Google Fonts requests hang through the egress proxy, so `document.fonts.ready` never resolves | `page.route` and **abort** external fonts/analytics/images (regex below)             |
| Every HTTPS request to production is `net::ERR_CONNECTION_RESET` (curl works fine) | The egress proxy resets Chromium's TLS 1.3 **post-quantum ClientHello**                       | launch with `--ssl-version-max=tls1.2` **and** route Chromium through `$HTTPS_PROXY` |

Boilerplate that handles all three:

```js
const { chromium } = require('playwright');
const proxy = process.env.HTTPS_PROXY; // e.g. http://127.0.0.1:45019 (port rotates)
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium',
  args: ['--no-sandbox', '--ssl-version-max=tls1.2', '--disable-quic'], // tls flag only needed for prod
  proxy: proxy ? { server: proxy } : undefined, // omit for localhost
});
const ctx = await browser.newContext({
  viewport: { width: 402, height: 1200 }, // tall = fewer scroll problems (see §6)
  deviceScaleFactor: 2,
  isMobile: false, // keep the mouse/PointerSensor path
  ignoreHTTPSErrors: true, // trust the proxy's MITM cert (prod)
});
const page = await ctx.newPage();
await page.route('**/*', (r) => {
  const u = r.request().url();
  return /fonts\.googleapis|fonts\.gstatic|gstatic|google-analytics|googletagmanager|cloudinary/.test(
    u
  )
    ? r.abort()
    : r.continue(); // NEVER abort play-when.com/api/* calls
});
await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
```

(Aborting Cloudinary just means card art is blank — harmless for driving the game.)

## 4. Selectors & on-screen state

The app has almost **no `data-testid`s**, so rely on these stable handles:

- **Active card (the drag handle):** `div.cursor-grab` (first match). Its
  `innerText` (first line) is the event's `friendly_name`.
- **Placed timeline markers:** `[data-timeline-year]`. The attribute value is
  the event's `year` (negative = BCE). **Tombstones (wrong placements) are
  excluded** from this selector, so `[data-timeline-year]` count == your score.
- **Drop zones (dnd-kit droppables, ids not in the DOM):** `timeline-zone`
  (the timeline) and `bottom-bar-zone` (the hand — a drop here returns the card).
- **Bottom-left counters:** big number = lives/"cards left"; 📏 = events placed;
  ⚡ = current streak.
- **There is no first-run modal** (2026-09; the old "How to Play" / "Got it" popup is
  gone). Nothing blocks the first drag. To replay a fresh install's hints,
  `localStorage.removeItem('when-hints-seen')` — or click **Reset Hints** in the burger
  menu, which also works mid-game (it broadcasts, so the hook re-reads on the spot).
- **Onboarding hint strips:** one-line pills in `[role="status"]` (the in-game one sits
  just above the hand; each home tab has one under its heading). They appear once per
  install, never block a drag (the in-game ones are dismissed by a drag start), and
  tapping one dismisses it. The copy is in `src/utils/hintCopy.ts` if you need to match
  on it. The in-game idle nudge appears 4 s after play starts with no drag — note "play
  starts" is when the transition finishes, a second or two after the Play click, so budget
  from the first hand card appearing, not from the click.
- **The in-game ladder is one pill per placement**, shown when the placement animation
  settles and replacing whatever is up: `wrong` → `correct` → `tapCard` → `stats` → `swap`.
  Do **not** pause between drags to "let a hint appear" — that is what hid a real bug until
  2026-09. Each pill lands ~500-700 ms after `mouse.up`, and three of them glow a control at
  the same time (`[class*="animate-hint-"]`): the top hand card's wrapper for `tapCard`, the
  bottom-left counter button for `stats`, the cycle button for `swap`.
- **Mode select → start a game:** nav button `[aria-label="Custom game"]`, then
  the button matching `/Play\s+·/` ("Play · N events"). Custom is the only mode there.
- **Leaderboard submit (at game over):** `input[placeholder*="name" i]` (maxlength
  20, pre-filled with a random name — clear it first), then the button matching
  `/submit to leaderboard/i`.

## 5. Placing a card — the drag that actually works

The board uses **`@dnd-kit`** with a custom **`PointerSensor`**
(`activationConstraint: { distance: 8 }`) and **`collisionDetection={pointerWithin}`**.
Two consequences:

1. dnd-kit **ignores HTML5 drag events**. Playwright's `dragTo` / synthetic
   `dragstart` do nothing. You must drive **real pointer events**.
2. Because collision is `pointerWithin`, the drop target is decided purely by
   the **pointer position** — so a correctly-placed pointer is all you need.

The recipe:

```js
await page.mouse.move(cx, cy); // cx,cy = active card centre
await page.mouse.down();
await page.mouse.move(cx, cy - 14, { steps: 4 }); // exceed the 8px activation distance
await page.mouse.move(targetX, targetY, { steps: 28 }); // drag to the insertion point
await page.mouse.move(targetX, targetY, { steps: 4 }); // settle onDragMove
await page.waitForTimeout(120);
await page.mouse.up();
await page.waitForTimeout(1600); // placement + feedback animation
```

**Computing `targetY` for insertion index `k`** (timeline is ascending, index 0
= earliest). The game does `insertion = markerMidpoints.findIndex(mid => pointerY < mid)`,
so read the marker rects and aim between the neighbours:

```js
const pos = await page.$$eval('[data-timeline-year]', (els) =>
  els.map((e) => {
    const r = e.getBoundingClientRect();
    return r.top + r.height / 2;
  })
);
const handTop = cardBox.y; // the hand bar starts at the active card
let targetY;
if (pos.length === 0)
  targetY = (140 + handTop - 30) / 2; // empty timeline
else if (k <= 0)
  targetY = Math.max(148, pos[0] - 34); // before earliest
else if (k >= pos.length)
  targetY = Math.min(handTop - 30, pos.at(-1) + 34); // after latest
else targetY = (pos[k - 1] + pos[k]) / 2; // between k-1 and k
const targetX = 402 / 2;
```

Keep `targetY` **above the hand bar** (`handTop`), or the drop lands in
`bottom-bar-zone` and the card just returns to hand.

## 6. The tall-timeline trap (important)

Once the timeline is longer than the viewport it scrolls, and your target
marker may be **off-screen**:

- Target **fully below the viewport** → drop is a **no-op** (card returns to
  hand, no penalty) — you get stuck re-drawing the same card forever.
- Target maps to a **wrong on-screen slot** → registers as a **wrong placement**
  (tombstone, costs a life).

Fix: **scroll the insertion boundary to centre before every drag.**

```js
await page.evaluate((k) => {
  const els = [...document.querySelectorAll('[data-timeline-year]')];
  els[Math.max(0, Math.min(els.length - 1, k))]?.scrollIntoView({
    block: 'center',
    behavior: 'instant',
  });
}, k);
await page.waitForTimeout(700); // then re-read marker rects and compute targetY
```

A tall viewport (height ≥ 1200) also helps by fitting more markers at once.

## 7. Modes, scoring & the daily

- **Game phases:** `loading → modeSelect → transitioning → playing → gameOver`.
- **Sudden-death mechanics — the only rule-set, used by both modes:** the 5-card
  hand is 5 **lives**. Correct placement → draw a replacement (streak++). Wrong
  placement → tombstone, lose a card, streak resets. **Game over at 5 misses.**
  Score = timeline length. The deck is huge ("Everything" theme), so the game
  only ends by running out of lives — expect a long game if you play well.
  There is **no mode picker to click**: `GameMode` is just `daily | suddenDeath`,
  and they differ only in how the deck is seeded.
- **Daily** (`/daily`, auto-starts): seeded per **local calendar date** — same
  cards, same order for everyone in the same timezone that day. Not UTC: see the
  header comment in `src/utils/puzzleDate.ts`, and note the test suite pins
  `TZ=America/Los_Angeles`. One-play-per-day is gated client-side, so a **fresh
  browser context replays the same seed** (useful if a tool bug forces a restart
  _before_ you submit). Single-player suppresses per-placement popups, so it
  flows fast.
- **Custom:** same mechanics, deck built from the category/era/difficulty filters
  on the Custom tab.
- **Submitting:** at game over a "Submit to Leaderboard" panel appears. Fill the
  name input, click submit. The API dedups by a per-context deviceId, so a fresh
  context can submit once.

## 8. Oracle vs. honest play

- **Oracle (for smoke tests / guaranteed completion):** the full answer key is
  `public/events/*.json` — build a `friendly_name → year` map (iterate the files
  in `manifest.json`), and place each card at `count(years < cardYear)`.
- **Honest play (for a real score):** only read the card's `friendly_name` and
  the already-**revealed** timeline years, and decide from your own knowledge —
  do **not** read the dataset. The hidden card's year is never in the DOM; the
  placed markers give you legitimate anchors, exactly like a human sees. A
  Claude playing honestly on 2026-07-24 scored **60, streak 27, #1** — the misses
  were genuine judgment calls on ancient trade routes and "earliest-origin"
  cards (e.g. the game dates _Cheque_ to 300 BCE, not the 9th-c. Islamic sakk).

**Interactive harness pattern** (lets _you_ make each placement decision without
burning context on a giant script): run a long-lived Node process that, each
turn, writes the visible state (card name + revealed marker years + counters) to
`state.json` and polls `decisions.jsonl` for the next line; you `Read` the state,
decide the index, and append `{"turn":N,"index":K}` (or
`{"action":"submit","name":"claude"}` at game over). This keeps the browser alive
across your tool calls and keeps the answer key out of your view.

## 9. Minimal self-contained oracle script

A complete "does it boot, can it play, does placement work" smoke test:

```js
// NODE_PATH=/home/user/when/node_modules node smoke.js   (app running on :3000)
const fs = require('fs'),
  path = require('path'),
  { chromium } = require('playwright');
const EV = '/home/user/when/public/events';
const yr = new Map();
for (const f of JSON.parse(fs.readFileSync(`${EV}/manifest.json`)).files)
  for (const e of JSON.parse(fs.readFileSync(`${EV}/${f}`)))
    if (e?.friendly_name != null && e.year != null && !yr.has(e.friendly_name))
      yr.set(e.friendly_name, e.year);

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  });
  const c = await b.newContext({ viewport: { width: 402, height: 1200 }, isMobile: false });
  const p = await c.newPage();
  await p.route('**/*', (r) =>
    /fonts\.g|gstatic|analytics|cloudinary/.test(r.request().url()) ? r.abort() : r.continue()
  );
  await p.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);
  await p.click('button[aria-label="Custom game"]');
  await p.waitForTimeout(800);
  await p.getByRole('button', { name: /Play\s+·/ }).click();
  await p.waitForTimeout(2500);
  try {
    await p.getByRole('button', { name: /got it/i }).click({ timeout: 4000 });
  } catch {}

  for (let turn = 0; turn < 8; turn++) {
    const h = p.locator('div.cursor-grab').first();
    await h.waitFor({ state: 'visible', timeout: 6000 });
    await p.waitForTimeout(400);
    const box = await h.boundingBox();
    const name = (await h.innerText()).trim().split('\n')[0].trim();
    const marks = await p.$$eval('[data-timeline-year]', (els) =>
      els.map((e) => ({
        y: +e.getAttribute('data-timeline-year'),
        mid: e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2,
      }))
    );
    const cardYear = yr.get(name);
    const k = cardYear == null ? marks.length : marks.filter((m) => m.y < cardYear).length;
    await p.evaluate((i) => {
      const e = [...document.querySelectorAll('[data-timeline-year]')];
      e[Math.max(0, Math.min(e.length - 1, i))]?.scrollIntoView({ block: 'center' });
    }, k);
    await p.waitForTimeout(600);
    const pos = await p.$$eval('[data-timeline-year]', (els) =>
      els.map((e) => e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)
    );
    const top = box.y;
    const ty =
      pos.length === 0
        ? (top + 110) / 2
        : k <= 0
          ? Math.max(148, pos[0] - 34)
          : k >= pos.length
            ? Math.min(top - 30, pos.at(-1) + 34)
            : (pos[k - 1] + pos[k]) / 2;
    const cx = box.x + box.width / 2,
      cy = box.y + box.height / 2;
    await p.mouse.move(cx, cy);
    await p.mouse.down();
    await p.mouse.move(cx, cy - 14, { steps: 4 });
    await p.mouse.move(201, ty, { steps: 28 });
    await p.waitForTimeout(120);
    await p.mouse.up();
    await p.waitForTimeout(1600);
    console.log(`turn ${turn + 1}: placed "${name}" (${cardYear}) at index ${k}`);
  }
  await p.screenshot({ path: 'smoke.png' });
  await b.close();
})();
```

## 10. If you improve the tooling

The single highest-leverage change for future automation would be adding a few
`data-testid`s: on the active card, the timeline drop-zone, and the counters.
Everything above works without them, but they'd make it far less brittle.
