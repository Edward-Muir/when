#!/usr/bin/env node
/**
 * The image review board: every card image in a grid, newest first, where Edward marks the ones
 * to regenerate. It only records the choices, in ../when-images/review-board/redo-list.json; a
 * separate step regenerates (docs/events-images/review-board.md).
 *
 *   node scripts/images/review-board/server.js [--port 5179]
 *   open http://127.0.0.1:5179
 *
 * Thumbnails are made locally with macOS `sips` and cached by sha256 under review-board/thumbs/.
 * A card with no matching local file is shown through the webapp's own Cloudinary rungs, loaded
 * by the browser, so the board never mints a new derived asset.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { execFile } = require('child_process');

const { IMAGES_DIR } = require('../../factory/config');
const { parseArgs } = require('../../factory/cli');
const { buildIndex } = require('./cards');
const redo = require('./redo-list');

const APP_DIR = __dirname;
const THUMBS_DIR = path.join(redo.DATA_DIR, 'thumbs');
const THUMB_PX = 480;
const MAX_SIPS = 4;

const args = parseArgs(process.argv.slice(2));
const PORT = parseInt(args.port, 10) || 5179;

let index = null;
let building = null;

function rebuild(refresh) {
  if (!building) {
    building = buildIndex({ refresh })
      .then((built) => {
        index = built;
        return built;
      })
      .finally(() => {
        building = null;
      });
  }
  return building;
}

function send(res, status, contentType, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': contentType, ...headers });
  res.end(body);
}

const json = (res, status, value) => send(res, status, 'application/json', JSON.stringify(value));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 64 * 1024) reject(new Error('body too large'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('bad json'));
      }
    });
  });
}

const MIME = {
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

/** The card's local image file, or null. Paths come from the index, never from the request. */
function localFile(card) {
  if (!card || !card.image.file) return null;
  const file = path.join(IMAGES_DIR, card.image.file);
  return fs.existsSync(file) ? file : null;
}

// --- Thumbnails: sips, at most MAX_SIPS at once, cached by slug and sha256 ---

const pending = new Map();
const queue = [];
let running = 0;

function pump() {
  while (running < MAX_SIPS && queue.length) {
    const job = queue.shift();
    running++;
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
    const tmp = `${job.out}.${process.pid}.tmp.jpg`;
    execFile(
      'sips',
      [
        '-Z',
        String(THUMB_PX),
        '-s',
        'format',
        'jpeg',
        '-s',
        'formatOptions',
        '75',
        job.src,
        '--out',
        tmp,
      ],
      (error) => {
        running--;
        if (error) {
          fs.rmSync(tmp, { force: true });
          job.reject(error);
        } else {
          fs.renameSync(tmp, job.out);
          job.resolve(job.out);
        }
        pump();
      }
    );
  }
}

function thumbnail(card) {
  const src = localFile(card);
  if (!src) return Promise.reject(new Error('no local file'));
  const out = path.join(THUMBS_DIR, `${card.slug}.${card.image.sha256.slice(0, 12)}.jpg`);
  if (fs.existsSync(out)) return Promise.resolve(out);
  if (!pending.has(out)) {
    const promise = new Promise((resolve, reject) => {
      queue.push({ src, out, resolve, reject });
      pump();
    }).finally(() => pending.delete(out));
    pending.set(out, promise);
  }
  return pending.get(out);
}

// --- The API ---

function openMarks() {
  const list = redo.readRedoList();
  const marks = {};
  const closed = {};
  for (const entry of list.entries) {
    if (redo.isOpen(entry)) marks[entry.slug] = entry;
    else closed[entry.slug] = entry.applied_at ? 'applied' : 'skipped';
  }
  return { marks, closed };
}

function cardsPayload() {
  const { marks, closed } = openMarks();
  return {
    cards: index.cards.map((c) => ({ ...c, has_prompt: index.prompts.has(c.slug) })),
    marks,
    closed,
    decks: index.decks,
    categories: index.categories,
    warnings: index.warnings,
    built_at: index.built_at,
    redo_file: redo.REDO_FILE,
  };
}

/** True when the page's view of the card's image is still the current one. */
function sameImage(card, body) {
  if (card.image.kind === 'cloudinary') return body.cloudinary_version === card.cloudinary_version;
  return body.sha256 === card.image.sha256;
}

async function handleApi(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/cards') return json(res, 200, cardsPayload());

  if (req.method === 'GET' && pathname.startsWith('/api/card/')) {
    const card = index.bySlug.get(pathname.slice('/api/card/'.length));
    if (!card) return json(res, 404, { error: 'unknown card' });
    return json(res, 200, { ...card, prompt: index.prompts.get(card.slug) || null });
  }

  if (req.method === 'POST' && pathname === '/api/refresh') {
    await rebuild(true);
    return json(res, 200, cardsPayload());
  }

  if (req.method === 'POST' && ['/api/mark', '/api/note', '/api/unmark'].includes(pathname)) {
    const body = await readBody(req);
    const card = index.bySlug.get(body.slug);
    if (!card) return json(res, 404, { error: 'unknown card' });
    let entry;
    if (pathname === '/api/mark') {
      if (!sameImage(card, body)) {
        return json(res, 409, { error: 'this image changed since the page loaded; press Refresh' });
      }
      entry = redo.updateRedoList((list) => redo.mark(list, card, body.note));
    } else if (pathname === '/api/note') {
      entry = redo.updateRedoList((list) => redo.setNote(list, card.slug, body.note));
    } else {
      redo.updateRedoList((list) => redo.unmark(list, card.slug));
      entry = null;
    }
    return json(res, 200, { ok: true, entry, marked: Object.keys(openMarks().marks).length });
  }

  return json(res, 404, { error: 'not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent(url.pathname).normalize('NFC');
  try {
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      return send(
        res,
        200,
        'text/html; charset=utf-8',
        fs.readFileSync(path.join(APP_DIR, 'index.html'))
      );
    }
    if (!index) await rebuild(false);

    if (req.method === 'GET' && pathname.startsWith('/thumb/')) {
      const card = index.bySlug.get(pathname.slice('/thumb/'.length));
      if (!localFile(card)) return send(res, 404, 'text/plain', 'not found');
      const file = await thumbnail(card);
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return fs.createReadStream(file).pipe(res);
    }
    if (req.method === 'GET' && pathname.startsWith('/full/')) {
      const card = index.bySlug.get(pathname.slice('/full/'.length));
      const file = localFile(card);
      if (!file) return send(res, 404, 'text/plain', 'not found');
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      return fs.createReadStream(file).pipe(res);
    }
    if (pathname.startsWith('/api/')) return await handleApi(req, res, pathname);
    return send(res, 404, 'text/plain', 'not found');
  } catch (error) {
    if (!res.headersSent) json(res, 500, { error: error.message });
    else res.end();
  }
});

rebuild(false)
  .then((built) => {
    server.listen(PORT, '127.0.0.1', () => {
      const factory = built.cards.filter((c) => c.source === 'factory').length;
      const marked = Object.keys(openMarks().marks).length;
      console.log('Image review board running:');
      console.log(`  http://127.0.0.1:${PORT}`);
      console.log(`  ${built.cards.length} cards (${factory} factory), ${marked} marked`);
      console.log(`  Redo list: ${redo.REDO_FILE}`);
      for (const warning of built.warnings) console.log(`  ! ${warning}`);
    });
  })
  .catch((error) => {
    console.error(`✗ ${error.message}`);
    process.exit(1);
  });
