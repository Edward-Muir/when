/**
 * The review board's card index: every card image there is, catalogue and factory deck alike,
 * with the exact image the board shows for it and when that image last changed
 * (docs/events-images/review-board.md).
 *
 * Which image a card shows, first match:
 *   1. a factory slug not yet uploaded: its inbox file, `inbox/<deck>/<slug>.jpeg`;
 *   2. `downsampled_generated_images/<slug>.jpg`, the uploaded bytes, when its size matches the
 *      live Cloudinary asset (or Cloudinary can't be listed);
 *   3. otherwise Cloudinary, in exactly the webapp's two rungs, loaded by the browser. Never an
 *      original and never another transformation, so the board mints nothing the game doesn't.
 *
 * `resolveCard` is exported for the regeneration step that reads the redo list, so it judges
 * "is this still the image Edward marked" with the same logic the board used.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const {
  DECK_BRANCH_PREFIX,
  DOWNSAMPLED_DIR,
  EVENTS_DIR,
  IMAGES_DIR,
  INBOX_DIR,
  REPO_ROOT,
} = require('../../factory/config');
const { parseCsv, writeJson } = require('../../factory/cli');
const { git, showJson } = require('../../factory/decks');

const { DATA_DIR } = require('./redo-list');
const CACHE_FILE = path.join(DATA_DIR, 'cache.json');
const LISTING_MAX_AGE_MS = 60 * 60 * 1000;
const UPLOAD_MARKER = '/image/upload/';

/** Mirrors VARIANT_TRANSFORM in src/utils/cloudinaryImage.ts; redo-list.test.js checks it. */
const RUNGS = {
  thumbnail: 'c_fill,f_auto,g_auto,h_400,q_auto:good,w_400',
  detail: 'c_fill,f_auto,g_auto,h_768,q_auto:good,w_768',
};
const TRANSFORM_TOKEN = /^(c_|q_|f_|w_|h_|g_|dpr_)/;

/** Mirrors getImageUrl in src/utils/cloudinaryImage.ts: swap the stored transform for a rung. */
function rungUrl(url, variant) {
  const at = url.indexOf(UPLOAD_MARKER);
  if (at === -1) return url;
  const rest = url.slice(at + UPLOAD_MARKER.length);
  const slash = rest.indexOf('/');
  const first = slash === -1 ? rest : rest.slice(0, slash);
  const isTransform = first.includes(',') || TRANSFORM_TOKEN.test(first);
  const publicPath = isTransform && slash !== -1 ? rest.slice(slash + 1) : rest;
  return `${url.slice(0, at)}${UPLOAD_MARKER}${RUNGS[variant]}/${publicPath}`;
}

/** The public_id an `image_url` names: no transform, version, query or extension. */
function publicIdOf(url) {
  if (!url || !url.includes(UPLOAD_MARKER)) return null;
  const segments = url.split(UPLOAD_MARKER)[1].split('?')[0].split('/');
  while (segments.length > 1 && (segments[0].includes(',') || TRANSFORM_TOKEN.test(segments[0]))) {
    segments.shift();
  }
  if (segments.length > 1 && /^v\d+$/.test(segments[0])) segments.shift();
  return decodeURIComponent(segments.join('/')).replace(/\.(jpe?g|png|webp)$/i, '');
}

const nfc = (s) => s.normalize('NFC');
const rel = (file) => path.relative(IMAGES_DIR, file);

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

/** sha256 of a file, cached by size and mtime so a rebuild re-reads only what changed. */
function hasher(cache) {
  cache.hashes = cache.hashes || {};
  return (file) => {
    const stat = fs.statSync(file);
    const key = rel(file);
    const hit = cache.hashes[key];
    if (hit && hit.size === stat.size && hit.mtimeMs === stat.mtimeMs) return hit;
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    cache.hashes[key] = { size: stat.size, mtimeMs: stat.mtimeMs, sha256 };
    return cache.hashes[key];
  };
}

/**
 * Every upload on Cloudinary, keyed by public_id: an Admin API listing, which costs API calls
 * but no transformations. Cached for an hour; `force` re-lists.
 */
async function cloudinaryListing(cache, force, warnings) {
  const fresh =
    cache.cloudinary && Date.now() - Date.parse(cache.cloudinary.fetched_at) < LISTING_MAX_AGE_MS;
  if (fresh && !force) return cache.cloudinary.resources;
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    warnings.push('No Cloudinary keys in .env: catalogue dates fall back to file times.');
    return cache.cloudinary ? cache.cloudinary.resources : null;
  }
  try {
    const sdk = require('cloudinary').v2;
    sdk.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dscb8inz1',
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true,
    });
    const resources = {};
    let cursor;
    do {
      const page = await sdk.api.resources({
        type: 'upload',
        max_results: 500,
        ...(cursor ? { next_cursor: cursor } : {}),
      });
      for (const r of page.resources) {
        resources[nfc(r.public_id)] = {
          version: r.version,
          bytes: r.bytes,
          created_at: r.created_at,
        };
      }
      cursor = page.next_cursor;
    } while (cursor);
    cache.cloudinary = { fetched_at: new Date().toISOString(), resources };
    return resources;
  } catch (error) {
    warnings.push(`Cloudinary listing failed (${error.message || error.error?.message}).`);
    return cache.cloudinary ? cache.cloudinary.resources : null;
  }
}

function loadCatalogue() {
  const manifest = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, 'manifest.json'), 'utf8'));
  const events = new Map();
  for (const entry of manifest.files) {
    const file = typeof entry === 'string' ? entry : entry.file;
    for (const e of JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8'))) {
      events.set(nfc(e.name), e);
    }
  }
  return events;
}

function showText(ref, file) {
  try {
    return git(['show', `${ref}:${file}`], { stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
}

/** Every factory deck: merged ones read from origin/main, the rest from their own branch. */
function loadDecks(warnings) {
  const onMain = new Set(
    git(['ls-tree', '--name-only', 'origin/main', 'factory/decks/'])
      .split('\n')
      .filter(Boolean)
      .map((p) => path.basename(p))
  );
  const branches = new Set(
    git([
      'for-each-ref',
      '--format=%(refname:strip=3)',
      `refs/remotes/origin/${DECK_BRANCH_PREFIX}*`,
    ])
      .split('\n')
      .filter(Boolean)
      .map((b) => b.slice(DECK_BRANCH_PREFIX.length))
  );
  const decks = [];
  for (const id of new Set([...onMain, ...branches])) {
    const merged = onMain.has(id) && showText('origin/main', `factory/decks/${id}/deck.json`);
    const ref = merged || !branches.has(id) ? 'origin/main' : `origin/${DECK_BRANCH_PREFIX}${id}`;
    const dir = `factory/decks/${id}`;
    const status = showJson(ref, `${dir}/status.json`);
    if (!status) continue;
    const prompts = showText(ref, `${dir}/prompts.csv`);
    const manifestFile = path.join(INBOX_DIR, id, 'manifest.jsonl');
    const downloads = new Map();
    if (fs.existsSync(manifestFile)) {
      for (const line of fs.readFileSync(manifestFile, 'utf8').split('\n').filter(Boolean)) {
        try {
          const row = JSON.parse(line);
          downloads.set(row.slug, row);
        } catch {
          warnings.push(`${rel(manifestFile)} has an unreadable line.`);
        }
      }
    }
    decks.push({
      id,
      name: status.name || id,
      stage: status.stage,
      ref,
      status,
      newEvents: new Map((showJson(ref, `${dir}/new-events.json`) || []).map((e) => [e.name, e])),
      uploads: showJson(ref, `${dir}/uploads.json`) || {},
      prompts: prompts ? parseCsv(prompts) : [],
      downloads,
    });
  }
  return decks;
}

function inboxFile(deck, slug) {
  for (const ext of ['.jpeg', '.jpg', '.png', '.webp']) {
    const file = path.join(INBOX_DIR, deck, `${slug}${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

/** Image prompts by slug, lowest precedence first so a later file wins. */
function loadPrompts(decks) {
  const prompts = new Map();
  const add = (rows, source) => {
    for (const row of rows) {
      if (row.event_name && row.image_prompt) {
        prompts.set(nfc(row.event_name), { image_prompt: row.image_prompt, source });
      }
    }
  };
  const csvs = (dir) =>
    fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((f) => f.endsWith('.csv') && !/backup|old|copy/i.test(f))
          .sort()
          .map((f) => path.join(dir, f))
      : [];
  const artDir = path.join(REPO_ROOT, 'docs', 'curated-themes', 'art');
  const repoArt = csvs(artDir);
  const files = [
    ...csvs(path.join(IMAGES_DIR, 'claude_prompts')),
    ...csvs(IMAGES_DIR).filter((f) => path.basename(f) !== 'all_prompts.csv'),
    path.join(IMAGES_DIR, 'all_prompts.csv'),
    ...repoArt.filter((f) => !/remake/.test(f)),
    ...repoArt.filter((f) => /remake/.test(f)),
  ];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const label = file.startsWith(REPO_ROOT)
      ? path.relative(REPO_ROOT, file)
      : `when-images/${rel(file)}`;
    add(parseCsv(fs.readFileSync(file, 'utf8')), label);
  }
  for (const deck of decks) add(deck.prompts, `factory/decks/${deck.id}/prompts.csv`);
  return prompts;
}

/**
 * The image a live (uploaded) card shows: the local downsampled copy when it matches the asset
 * on Cloudinary, otherwise Cloudinary's own rungs.
 */
function liveImage({ slug, imageUrl, publicId, listing, downsampled, hash }) {
  const asset = listing && publicId ? listing[publicId] : null;
  const localName = downsampled.get(slug);
  if (localName) {
    const file = path.join(DOWNSAMPLED_DIR, localName);
    const stat = fs.statSync(file);
    if (!asset || asset.bytes === stat.size) {
      return {
        image: { kind: 'downsampled', file: rel(file), sha256: hash(file).sha256 },
        asset,
        mtimeMs: stat.mtimeMs,
      };
    }
  }
  if (!imageUrl) return null;
  return {
    image: {
      kind: 'cloudinary',
      file: null,
      sha256: null,
      thumb_url: rungUrl(imageUrl, 'thumbnail'),
      detail_url: rungUrl(imageUrl, 'detail'),
    },
    asset,
    mtimeMs: null,
  };
}

function textOf(event) {
  return {
    friendly_name: event.friendly_name || event.name,
    year: event.year,
    year_end: event.year_end ?? null,
    category: event.category || null,
    description: event.description || '',
  };
}

function catalogueCard(slug, event, { listing, downsampled, hash }) {
  if (!event.image_url) return null;
  const publicId = publicIdOf(event.image_url);
  const shown = liveImage({
    slug,
    imageUrl: event.image_url,
    publicId,
    listing,
    downsampled,
    hash,
  });
  if (!shown) return null;
  const { image, asset, mtimeMs } = shown;
  const updated = asset
    ? { at: new Date(asset.version * 1000).toISOString(), from: 'cloudinary' }
    : { at: mtimeMs ? new Date(mtimeMs).toISOString() : null, from: mtimeMs ? 'mtime' : null };
  return {
    slug,
    ...textOf(event),
    source: 'catalogue',
    deck: null,
    factory_state: null,
    live: true,
    public_id: publicId,
    cloudinary_version: asset ? asset.version : null,
    image,
    updated_at: updated.at,
    updated_from: updated.from,
  };
}

/** A deck's own card: its inbox file until it is uploaded, then the live asset. */
function factoryCard(deck, rawSlug, info, { listing, downsampled, hash, catalogue }) {
  const slug = nfc(rawSlug);
  if (info.state === 'pending') return null;
  const event = catalogue.get(slug) || deck.newEvents.get(rawSlug);
  if (!event) return null;
  const upload = deck.uploads[rawSlug];
  let shown = null;
  let publicId = null;
  if (upload) {
    publicId = event.image_url ? publicIdOf(event.image_url) : upload.public_id;
    shown = liveImage({ slug, imageUrl: event.image_url, publicId, listing, downsampled, hash });
  } else {
    const file = inboxFile(deck.id, rawSlug);
    if (file) {
      shown = { image: { kind: 'inbox', file: rel(file), sha256: hash(file).sha256 }, asset: null };
    }
  }
  if (!shown) return null;
  const download = deck.downloads.get(rawSlug);
  let updated = { at: info.updated_at || null, from: 'status' };
  if (download) updated = { at: download.downloaded_at, from: 'downloaded_at' };
  else if (upload) updated = { at: upload.uploaded_at, from: 'uploaded_at' };
  let version = null;
  if (shown.asset) version = shown.asset.version;
  else if (upload) version = upload.version;
  return {
    slug,
    ...textOf(event),
    source: 'factory',
    deck: { id: deck.id, name: deck.name, stage: deck.stage },
    factory_state: info.state,
    live: catalogue.has(slug),
    public_id: publicId,
    cloudinary_version: version,
    image: shown.image,
    updated_at: updated.at,
    updated_from: updated.from,
  };
}

let lastIndex = null;

/**
 * Builds the index. `refresh` fetches origin (so new deck slugs appear) and re-lists Cloudinary.
 * Returns `{cards, bySlug, prompts, decks, categories, warnings, built_at}`, newest image first.
 */
async function buildIndex({ refresh = false } = {}) {
  const warnings = [];
  if (refresh) {
    try {
      execFileSync('git', ['fetch', 'origin', '--quiet'], {
        cwd: REPO_ROOT,
        timeout: 60000,
        stdio: 'ignore',
      });
    } catch {
      warnings.push('git fetch origin failed: deck data may be stale.');
    }
  }
  const cache = readCache();
  const hash = hasher(cache);
  const listing = await cloudinaryListing(cache, refresh, warnings);
  const catalogue = loadCatalogue();
  const decks = loadDecks(warnings);
  const downsampled = new Map(
    fs
      .readdirSync(DOWNSAMPLED_DIR)
      .filter((f) => f.endsWith('.jpg'))
      .map((f) => [nfc(f.slice(0, -4)), f])
  );

  const ctx = { listing, downsampled, hash, catalogue };
  const bySlug = new Map();
  for (const [slug, event] of catalogue) {
    const card = catalogueCard(slug, event, ctx);
    if (card) bySlug.set(slug, card);
  }
  for (const deck of decks) {
    for (const [rawSlug, info] of Object.entries(deck.status.slugs || {})) {
      const card = factoryCard(deck, rawSlug, info, ctx);
      if (card) bySlug.set(card.slug, card);
    }
  }

  writeJson(CACHE_FILE, cache);

  const cards = [...bySlug.values()].sort(
    (a, b) => (b.updated_at || '').localeCompare(a.updated_at || '') || a.slug.localeCompare(b.slug)
  );
  const deckCounts = new Map();
  for (const c of cards)
    if (c.deck) deckCounts.set(c.deck.id, (deckCounts.get(c.deck.id) || 0) + 1);
  lastIndex = {
    cards,
    bySlug,
    prompts: loadPrompts(decks),
    decks: decks
      .filter((d) => deckCounts.has(d.id))
      .map((d) => ({ id: d.id, name: d.name, stage: d.stage, count: deckCounts.get(d.id) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    categories: [...new Set(cards.map((c) => c.category).filter(Boolean))].sort(),
    warnings,
    built_at: new Date().toISOString(),
  };
  return lastIndex;
}

/** The card as the board would show it now, from the last index built (or a fresh one). */
async function resolveCard(slug, index) {
  const idx = index || lastIndex || (await buildIndex());
  return idx.bySlug.get(nfc(slug)) || null;
}

module.exports = { DATA_DIR, RUNGS, rungUrl, publicIdOf, buildIndex, resolveCard };
