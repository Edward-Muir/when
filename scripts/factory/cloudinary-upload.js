#!/usr/bin/env node
/**
 * Uploads a deck's passed art to Cloudinary, and proves every byte arrived on the right slug
 * (factory.md, C3).
 *
 *   node scripts/factory/cloudinary-upload.js --deck <id>                 # archive, downsample, upload
 *   node scripts/factory/cloudinary-upload.js --deck <id> --verify-urls   # after update-cloudinary-urls.js
 *
 * Upload, for each qc-pass slug:
 *   1. The inbox file's sha256 must still be the one status.json recorded at download.
 *   2. Copy it to generated_images/ (the full-size archive), then downsample it
 *      (scripts/images/downsample.py) to downsampled_generated_images/<slug>.jpg.
 *   3. Refuse a slug that already has an asset on Cloudinary we didn't upload:
 *      update-cloudinary-urls.js keeps the OLDEST asset per slug, so a second one would lose.
 *   4. Upload with public_id `<slug>_<6 random chars>`, check the returned etag (an MD5 of the
 *      bytes received), then fetch the original back from the CDN and compare its sha256.
 *   5. Record it in factory/decks/<id>/uploads.json, so a re-run skips what is done.
 * When every qc-pass slug is uploaded and verified, the deck moves to `uploaded` (via status.js).
 *
 * --verify-urls replaces the two checks factory.md used to do by eye, and exits 1 on failure:
 *   - no existing `image_url` line was removed, and exactly one was added per uploaded slug;
 *   - every uploaded slug's URL names its own public_id, whose stem is the slug.
 *
 * Credentials come from .env (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME).
 * The fetch-back reads the original asset with no transformation, so it mints no derived asset
 * (docs/cloudinary-cost-controls.md).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { DECKS_DIR, DOWNSAMPLED_DIR, GENERATED_DIR, INBOX_DIR, REPO_ROOT } = require('./config');
const { parseArgs, readJson, run, writeJson } = require('./cli');

const IMAGE_EXTS = ['.jpeg', '.jpg', '.png', '.webp'];
const hash = (algo, bytes) => crypto.createHash(algo).update(bytes).digest('hex');

function cloudinary() {
  const sdk = require('cloudinary').v2;
  if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials are missing from .env');
  }
  sdk.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dscb8inz1',
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
    secure: true,
  });
  return sdk;
}

/** Mirrors extractEventName in scripts/update-cloudinary-urls.js. */
function stemOf(publicId) {
  const match = publicId.match(/^(.+)_[a-zA-Z0-9]+$/);
  return (match ? match[1] : publicId).toLowerCase();
}

function inboxFile(deck, slug) {
  for (const ext of IMAGE_EXTS) {
    const file = path.join(INBOX_DIR, deck, `${slug}${ext}`);
    if (fs.existsSync(file)) return file;
  }
  return null;
}

function suffix() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.randomBytes(6), (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * Which qc-pass slugs still need uploading. A slug is done once `uploads.json` records a verified
 * upload of the same source image (the Gemini download QC passed, `source_sha256`).
 *
 * Done-ness is never judged by the downsampled JPEG's bytes: downsampling again does not always
 * give the same bytes, and on 2026-10-20 a re-run of ship took that as "changed" and uploaded 10
 * Sweet Tooth images a second time under new ids. A slug whose source changed after its upload is
 * a `conflict`, refused rather than uploaded again, so a duplicate can't be created by accident.
 */
function planUploads(status, uploads) {
  const todo = [];
  const done = [];
  const conflicts = [];
  for (const [slug, s] of Object.entries(status.slugs)) {
    if (s.state !== 'qc-pass') continue;
    const u = uploads[slug];
    if (!u) todo.push(slug);
    else if (u.verified && u.source_sha256 === s.sha256) done.push(slug);
    else if (u.verified) conflicts.push(slug);
    else todo.push(slug);
  }
  return { todo, done, conflicts };
}

async function upload(deck) {
  const dir = path.join(DECKS_DIR, deck);
  const status = readJson(path.join(dir, 'status.json'));
  if (!['ready-to-ship', 'uploaded'].includes(status.stage)) {
    throw new Error(`deck ${deck} is at ${status.stage}; it uploads at ready-to-ship`);
  }
  const uploadsFile = path.join(dir, 'uploads.json');
  const uploads = fs.existsSync(uploadsFile) ? readJson(uploadsFile) : {};
  const plan = planUploads(status, uploads);
  if (plan.conflicts.length) {
    throw new Error(
      `${plan.conflicts.join(', ')}: already uploaded from a different source image; ` +
        'replace those by hand (and queue the old asset for deletion) rather than upload again'
    );
  }
  const slugs = plan.todo;
  if (!slugs.length)
    console.log(`all ${plan.done.length} qc-pass images are already uploaded and verified`);

  // 1-2: check the source, archive it, downsample it.
  for (const slug of slugs) {
    const file = inboxFile(deck, slug);
    if (!file) throw new Error(`${slug}: no file in the inbox`);
    const sha = hash('sha256', fs.readFileSync(file));
    if (sha !== status.slugs[slug].sha256) {
      throw new Error(`${slug}: the inbox file is not the one QC passed (sha256 differs)`);
    }
    const archived = path.join(GENERATED_DIR, path.basename(file));
    if (fs.existsSync(archived) && hash('sha256', fs.readFileSync(archived)) !== sha) {
      throw new Error(`${slug}: generated_images already holds a different ${path.basename(file)}`);
    }
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
    fs.copyFileSync(file, archived);
  }
  if (slugs.length) {
    execFileSync(
      'python3',
      [
        path.join(REPO_ROOT, 'scripts', 'images', 'downsample.py'),
        '--input',
        path.join(INBOX_DIR, deck),
        '--output',
        DOWNSAMPLED_DIR,
        '--slugs',
        slugs.join(','),
        '--force',
      ],
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
  }

  const sdk = slugs.length ? cloudinary() : null;
  let uploaded = 0;
  for (const slug of slugs) {
    const local = path.join(DOWNSAMPLED_DIR, `${slug}.jpg`);
    const bytes = fs.readFileSync(local);
    const sha = hash('sha256', bytes);
    const done = uploads[slug];

    // 3: nothing else may already sit on this slug.
    const listed = await sdk.api.resources({ type: 'upload', prefix: `${slug}_`, max_results: 50 });
    const foreign = listed.resources
      .map((r) => r.public_id)
      .filter((id) => stemOf(id) === slug && (!done || id !== done.public_id));
    if (foreign.length) {
      throw new Error(
        `${slug}: Cloudinary already has ${foreign.join(', ')}; resolve that by hand first`
      );
    }

    // 4: upload, then prove the bytes.
    // An earlier attempt that never verified keeps its id and is overwritten, never duplicated.
    const publicId = done ? done.public_id : `${slug}_${suffix()}`;
    const result = await sdk.uploader.upload(local, {
      public_id: publicId,
      overwrite: Boolean(done),
      resource_type: 'image',
      unique_filename: false,
      use_filename: false,
    });
    if (result.etag !== hash('md5', bytes)) {
      throw new Error(`${slug}: Cloudinary's etag ${result.etag} does not match the file sent`);
    }
    const original = `https://res.cloudinary.com/${sdk.config().cloud_name}/image/upload/v${result.version}/${result.public_id}.${result.format}`;
    const response = await fetch(original);
    if (!response.ok)
      throw new Error(`${slug}: fetching ${original} back gave HTTP ${response.status}`);
    const fetched = hash('sha256', Buffer.from(await response.arrayBuffer()));
    if (fetched !== sha)
      throw new Error(`${slug}: the bytes fetched back differ from the bytes uploaded`);

    uploads[slug] = {
      public_id: result.public_id,
      version: result.version,
      bytes: bytes.length,
      sha256: sha,
      source_sha256: status.slugs[slug].sha256,
      verified: true,
      uploaded_at: new Date().toISOString(),
    };
    writeJson(uploadsFile, uploads);
    uploaded++;
    console.log(`${slug}: ${result.public_id} (${(bytes.length / 1024).toFixed(0)} KB, verified)`);
  }
  writeJson(uploadsFile, uploads);
  console.log(
    `${uploaded} uploaded, ${slugs.length - uploaded} already done, ${slugs.length} in all`
  );

  if (status.stage === 'ready-to-ship') {
    execFileSync(
      process.execPath,
      [path.join(__dirname, 'status.js'), 'stage', '--deck', deck, 'uploaded'],
      {
        stdio: 'inherit',
      }
    );
  }
}

function verifyUrls(deck) {
  const dir = path.join(DECKS_DIR, deck);
  const uploads = fs.existsSync(path.join(dir, 'uploads.json'))
    ? readJson(path.join(dir, 'uploads.json'))
    : {};
  const problems = [];

  // Everything this deck branch changed in the catalogue, committed or not, measured from where
  // it left main. A resumed ship has already committed its URLs, so the working-tree diff alone
  // would count none of them.
  const git = (args) =>
    execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const base = git(['merge-base', 'HEAD', process.env.FACTORY_BASE_REF || 'origin/main']).trim();
  const diff = git(['diff', '--unified=0', base, '--', 'public/events/']);
  const removed = diff.split('\n').filter((l) => /^-\s*"image_url"/.test(l)).length;
  const added = diff.split('\n').filter((l) => /^\+\s*"image_url"/.test(l)).length;
  const expected = Object.keys(uploads).length;
  if (removed) problems.push(`${removed} existing image_url line(s) removed or rewritten; want 0`);
  if (added !== expected)
    problems.push(`${added} image_url line(s) added; want ${expected}, one per uploaded slug`);

  const events = new Map();
  for (const file of readJson(path.join(REPO_ROOT, 'public', 'events', 'manifest.json')).files) {
    for (const e of readJson(path.join(REPO_ROOT, 'public', 'events', file))) events.set(e.name, e);
  }
  for (const [slug, u] of Object.entries(uploads)) {
    const url = (events.get(slug) || {}).image_url || '';
    const publicId = url.split('/').pop().split('?')[0];
    if (!url) problems.push(`${slug}: no image_url`);
    else if (publicId !== u.public_id)
      problems.push(`${slug}: image_url names ${publicId}, not ${u.public_id}`);
    else if (stemOf(publicId) !== slug)
      problems.push(`${slug}: public_id stem is ${stemOf(publicId)}`);
  }
  if (problems.length) throw new Error(`URL check failed:\n  ${problems.join('\n  ')}`);
  console.log(
    `URL check passed: ${expected} new image_url line(s), none removed, every stem its slug`
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2), ['verify-urls']);
  if (!args.deck) throw new Error('--deck <id> is required');
  if (args['verify-urls']) verifyUrls(args.deck);
  else await upload(args.deck);
}

if (require.main === module) run(main);

module.exports = { planUploads, stemOf };
