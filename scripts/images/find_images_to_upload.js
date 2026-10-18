#!/usr/bin/env node
/**
 * Find the downsampled JPEGs that must be MANUALLY uploaded to Cloudinary.
 *
 * After `downsample.py --force` regenerated every JPEG, the mtime signal for
 * "which images are new / not yet on Cloudinary" was lost. This script
 * recomputes that set authoritatively from Cloudinary's current state.
 *
 * An event needs uploading iff, AFTER the 295 queued deletions
 * (compare-app/cloudinary_delete_list.json), it will have NO image on Cloudinary.
 * Worked out at public_id granularity (robust even if some new renders were
 * already uploaded — those keep a surviving public_id and are skipped, so we
 * never create a duplicate):
 *
 *   for each local downsampled image (event name n):
 *     pids      = all Cloudinary public_ids that normalize to n
 *     surviving = pids - deleteList   (matched by exact public_id)
 *     if surviving is empty -> upload n   (classified new | replacement)
 *
 * READ-ONLY against Cloudinary. Nothing is deleted or uploaded. By default it
 * COPIES the to-upload JPEGs into ../to_upload/ (use --move to move; --dry-run
 * to only report).
 *
 *   node scripts/images/find_images_to_upload.js --dry-run
 *   node scripts/images/find_images_to_upload.js
 *
 * The image folders are under WHEN_IMAGES_DIR (scripts/factory/config.js; default
 * ../when-images). Creds (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET, optional
 * CLOUDINARY_CLOUD_NAME) are loaded from the repo's .env.
 *
 * This is the whole-catalogue reconciliation. The deck factory uploads a deck's own slugs with
 * scripts/factory/cloudinary-upload.js instead.
 */

const fs = require('fs');
const path = require('path');

const {
  REPO_ROOT,
  IMAGES_DIR: IMAGES_ROOT,
  DOWNSAMPLED_DIR,
  DELETE_LIST: DELETE_LIST_PATH,
  EVENTS_DIR,
} = require('../factory/config');

let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
} catch (e) {
  console.error('Please install cloudinary: npm install cloudinary');
  process.exit(1);
}

const OUT_DIR = path.join(IMAGES_ROOT, 'to_upload');

const CLOUDINARY_FOLDER = '';
const DRY_RUN = process.argv.includes('--dry-run');
const MOVE = process.argv.includes('--move');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dscb8inz1',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Canonical public_id -> event name (mirrors scripts/update-cloudinary-urls.js)
function extractEventName(publicId) {
  const filename = CLOUDINARY_FOLDER ? publicId.replace(`${CLOUDINARY_FOLDER}/`, '') : publicId;
  const match = filename.match(/^(.+)_[a-zA-Z0-9]+$/);
  return (match ? match[1] : filename).toLowerCase();
}

async function fetchAllCloudinary() {
  const ids = [];
  let nextCursor = null;
  do {
    const options = { type: 'upload', max_results: 500 };
    if (CLOUDINARY_FOLDER) options.prefix = `${CLOUDINARY_FOLDER}/`;
    if (nextCursor) options.next_cursor = nextCursor;
    const result = await cloudinary.api.resources(options);
    for (const r of result.resources) ids.push(r.public_id);
    nextCursor = result.next_cursor;
    process.stdout.write(`\r  fetched ${ids.length} Cloudinary resources...`);
  } while (nextCursor);
  process.stdout.write('\n');
  return ids;
}

function loadValidEventNames() {
  const names = new Set();
  for (const f of fs.readdirSync(EVENTS_DIR)) {
    if (!f.endsWith('.json') || f === 'manifest.json') continue;
    const events = JSON.parse(fs.readFileSync(path.join(EVENTS_DIR, f), 'utf8'));
    for (const ev of events) {
      if (ev && ev.name) names.add(String(ev.name).toLowerCase());
    }
  }
  return names;
}

async function main() {
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    if (!process.env.CLOUDINARY_URL) {
      console.error(`\nError: Cloudinary credentials not found. Set CLOUDINARY_API_KEY + ` +
        `CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in ${path.join(REPO_ROOT, '.env')}`);
      process.exit(1);
    }
  }
  if (!fs.existsSync(DELETE_LIST_PATH)) {
    console.error(`No delete list at ${DELETE_LIST_PATH}`);
    process.exit(1);
  }

  console.log('='.repeat(64));
  console.log(`Find images to upload  ${DRY_RUN ? '(DRY RUN)' : MOVE ? '(MOVE)' : '(COPY)'}`);
  console.log('='.repeat(64));

  // 1. Cloudinary current state -> Map<name, Set<public_id>>
  console.log('Fetching Cloudinary resources...');
  const cloudPids = await fetchAllCloudinary();
  const cloudByName = new Map();
  for (const pid of cloudPids) {
    const name = extractEventName(pid);
    if (!cloudByName.has(name)) cloudByName.set(name, new Set());
    cloudByName.get(name).add(pid);
  }

  // 2. Delete list -> set of exact public_ids
  const deleteEntries = JSON.parse(fs.readFileSync(DELETE_LIST_PATH, 'utf8'));
  const deletePids = new Set(deleteEntries.map((e) => e.public_id).filter(Boolean));

  // 3. Valid event names (to filter out non-event junk files)
  const validNames = loadValidEventNames();

  // 4. Local downsampled images -> stems
  const localFiles = fs.readdirSync(DOWNSAMPLED_DIR).filter((f) => f.toLowerCase().endsWith('.jpg'));

  const toUpload = [];   // { name, file, kind: 'new' | 'replacement' }
  const junk = [];       // local jpgs whose stem is not a valid event name
  for (const file of localFiles) {
    const name = path.parse(file).name.toLowerCase();
    if (!validNames.has(name)) { junk.push(file); continue; }
    const pids = cloudByName.get(name) || new Set();
    const surviving = [...pids].filter((p) => !deletePids.has(p));
    if (surviving.length === 0) {
      toUpload.push({ name, file, kind: pids.size === 0 ? 'new' : 'replacement' });
    }
  }

  // 5. Warn: delete-list events that have NO local downsampled jpg (replacement w/ nothing to upload)
  const localStems = new Set(localFiles.map((f) => path.parse(f).name.toLowerCase()));
  const replacementsMissingLocal = deleteEntries
    .map((e) => String(e.name).toLowerCase())
    .filter((n) => !localStems.has(n));

  // Summary
  const newCount = toUpload.filter((t) => t.kind === 'new').length;
  const replCount = toUpload.filter((t) => t.kind === 'replacement').length;
  console.log('');
  console.log(`  Cloudinary resources:        ${cloudPids.length}`);
  console.log(`  unique cloud event names:    ${cloudByName.size}`);
  console.log(`  delete list (public_ids):    ${deletePids.size}`);
  console.log(`  local downsampled jpgs:       ${localFiles.length} (${junk.length} non-event skipped)`);
  console.log(`  ── TO UPLOAD:                 ${toUpload.length}  (${newCount} new, ${replCount} replacement)`);
  console.log('');

  if (junk.length) {
    console.log(`  ⚠ ${junk.length} local jpg(s) are not valid event names (skipped):`);
    for (const j of junk.slice(0, 20)) console.log(`      ${j}`);
    if (junk.length > 20) console.log(`      ... and ${junk.length - 20} more`);
    console.log('');
  }
  if (replacementsMissingLocal.length) {
    console.log(`  ⚠ ${replacementsMissingLocal.length} delete-list event(s) have NO local downsampled jpg ` +
      `(their replacement can't be uploaded):`);
    for (const n of replacementsMissingLocal.slice(0, 20)) console.log(`      ${n}`);
    if (replacementsMissingLocal.length > 20) console.log(`      ... and ${replacementsMissingLocal.length - 20} more`);
    console.log('');
  }

  if (DRY_RUN) {
    console.log('Dry run — nothing copied. Re-run without --dry-run to stage into to_upload/.');
    return;
  }

  // Stage into a fresh to_upload/ dir
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) fs.rmSync(path.join(OUT_DIR, f));
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const manifestLines = [];
  for (const { name, file, kind } of toUpload) {
    const src = path.join(DOWNSAMPLED_DIR, file);
    const dst = path.join(OUT_DIR, file);
    if (MOVE) fs.renameSync(src, dst);
    else fs.copyFileSync(src, dst);
    manifestLines.push(`${kind}\t${file}`);
  }
  fs.writeFileSync(path.join(OUT_DIR, '_manifest.txt'),
    `# ${toUpload.length} images to upload (${newCount} new, ${replCount} replacement)\n` +
    `# generated against Cloudinary (${cloudPids.length} resources) minus ${deletePids.size} queued deletions\n` +
    manifestLines.sort().join('\n') + '\n');

  console.log(`${MOVE ? 'Moved' : 'Copied'} ${toUpload.length} file(s) into ${OUT_DIR}`);
  console.log(`Manifest: ${path.join(OUT_DIR, '_manifest.txt')}`);
  console.log('\nNext: manually upload everything in to_upload/ to Cloudinary, then run');
  console.log('  delete_old_cloudinary.js --execute   (delete the 295)  →  update-cloudinary-urls.js');
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
