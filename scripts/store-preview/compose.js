/**
 * Stage 2: cut the footage, lay the captions over it, score it, and encode the preview.
 *
 * A Playwright page is the compositor. For every output frame it shows the right footage
 * frame and draws the captions as a pure function of time, then the screenshot is piped to
 * ffmpeg. Nothing depends on wall-clock timing, so a re-run gives the same video.
 *
 * App Store Connect's app preview spec: 886x1920 portrait (the 6.9" and 6.5" slots), 30 fps,
 * 15-30 s, H.264 at 10-12 Mbps, and a stereo AAC track at 256 kbps, which it requires even
 * though most people watch with the sound off.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { ROOT, launch } = require('./shared');
const { storyboard } = require('./storyboard');
const music = require('./music');

const W = 886;
const H = 1920;
const FPS = 30;

/** How many cards the live game can deal: deduped by name, Cloudinary art only. */
function catalogueCounts() {
  const dir = path.join(ROOT, 'public/events');
  const seen = new Set();
  for (const f of JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'))).files)
    for (const e of JSON.parse(fs.readFileSync(path.join(dir, f))))
      if (e?.image_url?.includes('res.cloudinary.com') && e.image_url.includes('/image/upload/'))
        seen.add(e.name);
  const types = fs.readFileSync(path.join(ROOT, 'src/types/index.ts'), 'utf8');
  const block = types.slice(
    types.indexOf('ALL_CATEGORIES'),
    types.indexOf('];', types.indexOf('ALL_CATEGORIES'))
  );
  return { playable: seen.size, categories: (block.match(/'[a-z-]+'/g) || []).length };
}

/** Split a caption line into word spans, keeping <em> emphasis on the words it wraps. */
function words(line) {
  const out = [];
  let em = false;
  for (const part of line.split(/(<em>|<\/em>)/)) {
    if (part === '<em>') em = true;
    else if (part === '</em>') em = false;
    else for (const w of part.split(/\s+/).filter(Boolean)) out.push({ w, em });
  }
  return out;
}

const PAGE = (icon) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=Inter:wght@500;600&display=block">
<style>
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#0d1b2a}
  #stage{position:absolute;inset:0;overflow:hidden}
  #shot{position:absolute;inset:0;width:${W}px;height:${H}px;transform-origin:50% 45%;will-change:transform,filter}
  #band{position:absolute;left:0;right:0;top:0;height:640px;pointer-events:none;
    background:linear-gradient(180deg,rgba(3,12,29,.96) 0%,rgba(3,12,29,.9) 38%,rgba(3,12,29,.55) 68%,rgba(3,12,29,0) 100%)}
  #bandB{position:absolute;left:0;right:0;bottom:0;height:600px;pointer-events:none;opacity:0;
    background:linear-gradient(0deg,rgba(3,12,29,.97) 0%,rgba(3,12,29,.92) 45%,rgba(3,12,29,.5) 75%,rgba(3,12,29,0) 100%)}
  #flash{position:absolute;inset:0;background:#fff4dc;opacity:0}
  .stack{position:absolute;left:56px;right:56px;top:150px;display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center}
  #stackB{top:auto;bottom:110px}
  .cap.small{font-size:76px}
  .cap{font:700 86px/1.06 'Playfair Display',Georgia,serif;color:#f3ead6;letter-spacing:-.012em;text-wrap:balance;
    text-shadow:0 4px 30px rgba(0,0,0,.55)}
  .cap span{display:inline-block;white-space:pre}
  .cap .em{font-style:italic;color:#e9b95a}
  .sub{font:500 40px/1.3 Inter,sans-serif;color:#c3cfdc;margin-top:6px;text-shadow:0 2px 16px rgba(0,0,0,.6)}
  #logo{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
  #logo .word{font:800 250px/1 'Playfair Display',Georgia,serif;color:#f3ead6;letter-spacing:-.02em;text-shadow:0 10px 60px rgba(0,0,0,.6)}
  #logo .q{color:#e9b95a;display:inline-block}
  #logo .tag{font:700 60px/1.2 'Playfair Display',Georgia,serif;color:#f3ead6;margin-top:28px}
  #logo .tag em,#end .tag em{color:#e9b95a}
  #end{position:absolute;inset:0;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
    background:radial-gradient(1100px 1000px at 50% 30%,#12304d 0%,#071a2e 50%,#030c1d 100%)}
  #end img{width:330px;height:330px;border-radius:74px;box-shadow:0 30px 90px rgba(0,0,0,.65),0 0 0 2px rgba(233,185,90,.25)}
  #end .word{font:800 200px/1 'Playfair Display',Georgia,serif;color:#f3ead6;margin-top:70px;letter-spacing:-.02em}
  #end .q{color:#e9b95a}
  #end .tag{font:700 62px/1.2 'Playfair Display',Georgia,serif;color:#f3ead6;margin-top:30px}
  #end .meta{font:500 38px/1.3 Inter,sans-serif;color:#9fb0c3;margin-top:34px}
</style></head><body>
<div id="stage"><img id="shot"></div>
<div id="band"></div>
<div id="bandB"></div>
<div class="stack" id="stack"></div>
<div class="stack" id="stackB"></div>
<div id="logo"><div class="word">When<span class="q">?</span></div><div class="tag">Put history <em>in order</em></div></div>
<div id="end"><img src="${icon}"><div class="word">When<span class="q">?</span></div>
  <div class="tag">Put history <em>in order.</em></div><div class="meta" id="endmeta"></div></div>
<div id="flash"></div>
<script>
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const outBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  window.setup = (captions, endMeta) => {
    window.caps = captions.filter((c) => c.lines).map((c) => {
      const el = document.createElement('div');
      el.innerHTML = c.lines.map((l) => '<div class="cap' + (c.small ? ' small' : '') + '">' + l.map((w) =>
        '<span class="' + (w.em ? 'em' : '') + '">' + w.w + ' </span>').join('') + '</div>').join('') +
        (c.sub ? '<div class="sub">' + c.sub + '</div>' : '');
      el.style.display = 'none';
      document.getElementById(c.pos === 'bottom' ? 'stackB' : 'stack').appendChild(el);
      return { ...c, el, spans: [...el.querySelectorAll('.cap span')], sub: el.querySelector('.sub') };
    });
    window.allCaps = captions;
    document.getElementById('endmeta').textContent = endMeta;
  };
  window.draw = async (t, frame) => {
    const shot = document.getElementById('shot');
    if (frame.src && shot.dataset.src !== frame.src) {
      shot.src = frame.src;
      shot.dataset.src = frame.src;
      await shot.decode();
    }
    shot.style.transform = 'scale(' + frame.scale + ') translateY(' + (frame.dy || 0) + 'px)';
    shot.style.filter = frame.blur ? 'blur(' + frame.blur + 'px) brightness(' + frame.dim + ')' : 'none';

    // Captions: each word rises in with a little overshoot, staggered; the block lifts away.
    const band = { top: 0, bottom: 0 };
    for (const c of window.caps) {
      const vis = t >= c.at - 0.01 && t < c.out + 0.25;
      c.el.style.display = vis ? 'block' : 'none';
      if (!vis) continue;
      const leave = clamp((t - c.out) / 0.22);
      const side = c.pos === 'bottom' ? 'bottom' : 'top';
      band[side] = Math.max(band[side], clamp((t - c.at) / 0.2) * (1 - leave));
      c.spans.forEach((s, i) => {
        const p = clamp((t - c.at - i * 0.05) / 0.42);
        const e = outBack(p);
        s.style.opacity = clamp(p * 2.2) * (1 - leave);
        s.style.transform = 'translateY(' + ((1 - e) * 70 - leave * 40) + 'px) scale(' + (0.86 + 0.14 * e) + ')';
        s.style.filter = 'blur(' + ((1 - clamp(p * 1.6)) * 10) + 'px)';
      });
      if (c.sub) {
        const p = outCubic(clamp((t - c.at - 0.32 - c.spans.length * 0.05) / 0.4));
        c.sub.style.opacity = p * (1 - leave);
        c.sub.style.transform = 'translateY(' + ((1 - p) * 24) + 'px)';
      }
    }
    document.getElementById('band').style.opacity = band.top;
    document.getElementById('bandB').style.opacity = band.bottom;

    const logo = window.allCaps.find((c) => c.pos === 'logo');
    const L = document.getElementById('logo');
    if (t >= logo.at && t < logo.out + 0.2) {
      const p = clamp((t - logo.at) / 0.38);
      const out = clamp((t - logo.out + 0.3) / 0.18); // gone before 5 s, the default poster frame
      L.style.opacity = clamp(p * 3) * (1 - out);
      L.querySelector('.word').style.transform = 'scale(' + (1.7 - 0.7 * outBack(p) + out * 0.25) + ')';
      const q = clamp((t - logo.at - 0.18) / 0.4);
      L.querySelector('.q').style.transform = 'translateY(' + (-(1 - outBack(q)) * 120) + 'px) rotate(' + ((1 - outBack(q)) * -25) + 'deg)';
      const tg = outCubic(clamp((t - logo.at - 0.32) / 0.35));
      L.querySelector('.tag').style.opacity = tg;
      L.querySelector('.tag').style.transform = 'translateY(' + ((1 - tg) * 30) + 'px)';
    } else L.style.opacity = 0;

    const end = window.allCaps.find((c) => c.pos === 'end');
    const E = document.getElementById('end');
    if (t >= end.at - 0.25) {
      const p = clamp((t - end.at + 0.25) / 0.25);
      E.style.opacity = p;
      const i = outBack(clamp((t - end.at) / 0.5));
      E.querySelector('img').style.transform = 'scale(' + (0.6 + 0.4 * i) + ')';
      const w = outBack(clamp((t - end.at - 0.15) / 0.45));
      E.querySelector('.word').style.transform = 'translateY(' + ((1 - w) * 60) + 'px)';
      E.querySelector('.word').style.opacity = clamp((t - end.at - 0.15) / 0.2);
      for (const [sel, d] of [['.tag', 0.35], ['.meta', 0.6]]) {
        const k = outCubic(clamp((t - end.at - d) / 0.4));
        E.querySelector(sel).style.opacity = k;
        E.querySelector(sel).style.transform = 'translateY(' + ((1 - k) * 26) + 'px)';
      }
    } else E.style.opacity = 0;

    document.getElementById('flash').style.opacity = frame.flash || 0;
  };
</script></body></html>`;

/** What the footage layer shows at time `t`: frame file, scale, blur, flash. */
function footage(t, segments, clips, dir, sectionStarts) {
  const seg = segments.filter((s) => t >= s.at - 1e-6).pop();
  const local = t - seg.at;
  const frame = { scale: 1, flash: 0 };
  if (seg.end) {
    const last = segments[segments.indexOf(seg) - 1];
    return footage(last.at + last.dur - 1 / FPS, segments, clips, dir, sectionStarts);
  }
  const speed = seg.speed ?? 1;
  const ct = seg.from + local * speed;
  const n = clamp(Math.round(ct * FPS), 0, clips[seg.clip].count - 1);
  frame.src = `file://${path.join(dir, 'clips', seg.clip, `${String(n + 1).padStart(5, '0')}.jpg`)}`;
  if (seg.zoom) frame.scale = seg.zoom[0] + (seg.zoom[1] - seg.zoom[0]) * (local / seg.dur);
  if (seg.blur) {
    const p = clamp(local / 0.15);
    frame.blur = 18 * p;
    frame.dim = 1 - 0.72 * p;
    frame.scale *= 1 + 0.06 * p;
  }
  // A punch-in on each landing: the board leans toward the viewer and settles.
  if (seg.punch != null) {
    const k = (local - seg.punch) / 0.32;
    if (k >= 0 && k <= 1) frame.scale *= 1 + 0.045 * Math.sin(Math.PI * k) * (1 - k * 0.3);
  }
  // A new section opens with a quick zoom settle; the logo hit opens with a flash.
  const since = t - sectionStarts.filter((s) => t >= s - 1e-6).pop();
  if (since < 0.22) frame.scale *= 1 + 0.07 * Math.pow(1 - since / 0.22, 2);
  if (seg.blur) frame.flash = 0.85 * Math.pow(clamp(1 - local / 0.3), 2);
  return frame;
}

function clamp(x, a = 0, b = 1) {
  return Math.max(a, Math.min(b, x));
}

async function compose(dir) {
  const clips = {};
  for (const f of fs.readdirSync(path.join(dir, 'clips')).filter((f) => f.endsWith('.json'))) {
    const name = f.replace(/\.json$/, '');
    clips[name] = JSON.parse(fs.readFileSync(path.join(dir, 'clips', f)));
    clips[name].count = fs.readdirSync(path.join(dir, 'clips', name)).length;
    clips[name].frames = clips[name].count;
  }
  const counts = catalogueCounts();
  const board = storyboard(clips, counts);
  const total = Math.round(board.duration * FPS);
  const sectionStarts = [
    ...new Set(
      board.segments
        .filter(
          (s) => s.clip !== 'rally' || s.at === board.segments.find((x) => x.clip === 'rally').at
        )
        .map((s) => s.at)
    ),
  ];

  console.log('  music...');
  const wav = path.join(dir, 'music.wav');
  music.render(board.cue, wav);

  const icon = `file://${path.join(ROOT, 'assets/icon/icon-master.jpg')}`;
  fs.writeFileSync(path.join(dir, 'compose.html'), PAGE(icon));
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`file://${path.join(dir, 'compose.html')}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const caps = board.captions.map((c) => ({ ...c, lines: c.lines?.map(words) }));
  const endMeta = `${(Math.floor(counts.playable / 100) * 100).toLocaleString('en-US')}+ events · ${counts.categories} categories · every era`;
  await page.evaluate(([c, m]) => window.setup(c, m), [caps, endMeta]);

  const video = path.join(dir, 'video.mp4');
  const ff = spawn(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'image2pipe',
      '-framerate',
      String(FPS),
      '-i',
      '-',
      '-c:v',
      'libx264',
      '-preset',
      'slow',
      '-profile:v',
      'high',
      '-level',
      '4.0',
      '-pix_fmt',
      'yuv420p',
      '-r',
      String(FPS),
      '-b:v',
      '11M',
      '-maxrate',
      '12M',
      '-bufsize',
      '12M',
      '-movflags',
      '+faststart',
      video,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] }
  );
  const done = new Promise((res, rej) =>
    ff.on('close', (c) => (c ? rej(new Error(`ffmpeg ${c}`)) : res()))
  );

  for (let i = 0; i < total; i++) {
    const t = i / FPS;
    await page.evaluate(
      ([t, f]) => window.draw(t, f),
      [t, footage(t, board.segments, clips, dir, sectionStarts)]
    );
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`  frame ${i}/${total}\r`);
  }
  ff.stdin.end();
  await done;
  await browser.close();

  const out = path.join(dir, 'when-preview-886x1920.mp4');
  execFileSync('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    video,
    '-i',
    wav,
    '-map',
    '0:v',
    '-map',
    '1:a',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '256k',
    '-ar',
    '48000',
    '-ac',
    '2',
    '-shortest',
    '-movflags',
    '+faststart',
    out,
  ]);
  console.log(`  ✓ ${path.relative(ROOT, out)} (${total} frames, ${board.duration}s)`);
}

module.exports = { compose };
