#!/usr/bin/env node
/**
 * Moves one Gemini download out of ~/Downloads and onto its slug, the step where the October
 * 2026 audit's swaps were made (factory.md, C1). Most bad cards showed another card's picture,
 * often an alphabetical neighbour: an off-by-one rename when files were moved in a batch.
 * So the move is done in code, one slug at a time, and it never guesses:
 *
 *   node scripts/factory/inbox.js snapshot --deck <id> --slug <slug>   # before sending the prompts
 *   node scripts/factory/inbox.js take --deck <id> --slug <slug>       # after clicking download
 *
 * `take` waits (up to --wait seconds, default 90) until the files that are new since the
 * snapshot have stopped growing. Then:
 *   - exactly one new image: move it to <images>/inbox/<deck>/<slug>.<ext>, append
 *     {slug, sha256, prompt_hash, attempt, source_name, downloaded_at} to manifest.jsonl, and
 *     mark the slug downloaded through status.js with that sha256;
 *   - none (exit 4) or two or more (exit 5): move nothing. The art session retries the slug.
 * A retry's earlier file is kept as inbox/<deck>/rejected/<slug>.<attempt>.<ext>.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { DECKS_DIR, INBOX_DIR } = require('./config');
const lib = require('./status-lib');
const { parseArgs, parseCsv, readJson, run, writeJson } = require('./cli');

const DOWNLOADS = process.env.FACTORY_DOWNLOADS_DIR || path.join(os.homedir(), 'Downloads');
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const PARTIAL = /\.(crdownload|part|download|tmp)$/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function listing() {
  const out = {};
  for (const name of fs.readdirSync(DOWNLOADS)) {
    try {
      const st = fs.statSync(path.join(DOWNLOADS, name));
      if (st.isFile()) out[name] = st.size;
    } catch {
      // Vanished between readdir and stat; not ours.
    }
  }
  return out;
}

function deckInbox(deck) {
  const dir = path.join(INBOX_DIR, deck);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function snapshotFile(deck) {
  return path.join(deckInbox(deck), '.snapshot.json');
}

/** The exact image prompt this attempt was sent, as next-batch built it. */
function promptHash(deck, slug, status) {
  const csv = path.join(DECKS_DIR, deck, 'prompts.csv');
  const row = parseCsv(fs.readFileSync(csv, 'utf8')).find((r) => r.event_name === slug);
  if (!row) throw new Error(`${slug} has no row in prompts.csv`);
  const entry = status.slugs[slug];
  const prompt = lib.retryPrompt(row.image_prompt, entry.state === 'qc-fail' ? entry.reason : null);
  return crypto
    .createHash('sha256')
    .update(`${row.research_prompt}\n${prompt}`)
    .digest('hex')
    .slice(0, 16);
}

async function take({ deck, slug, waitSeconds }) {
  const snapFile = snapshotFile(deck);
  if (!fs.existsSync(snapFile))
    throw new Error('no snapshot: run `inbox.js snapshot` before the prompts');
  const snap = readJson(snapFile);
  if (snap.slug !== slug) throw new Error(`the snapshot was taken for ${snap.slug}, not ${slug}`);

  const status = lib.validate(readJson(path.join(DECKS_DIR, deck, 'status.json')));
  const entry = status.slugs[slug];
  if (!entry) throw new Error(`${slug} is not in deck ${deck}`);
  if (entry.state !== 'pending' && entry.state !== 'qc-fail') {
    throw new Error(`${slug} is ${entry.state}; only a pending or qc-fail slug takes a download`);
  }

  // Wait until the new files exist, none is partial, and their sizes held still for one poll.
  const deadline = Date.now() + waitSeconds * 1000;
  let fresh = [];
  let previous = null;
  for (;;) {
    const now = listing();
    const added = Object.keys(now).filter((n) => !(n in snap.files));
    const settled =
      added.length > 0 &&
      !added.some((n) => PARTIAL.test(n)) &&
      previous !== null &&
      added.every((n) => previous[n] === now[n] && now[n] > 0);
    if (settled) {
      fresh = added.filter((n) => IMAGE_EXT.test(n));
      break;
    }
    if (Date.now() > deadline) {
      fresh = added.filter((n) => IMAGE_EXT.test(n) && !PARTIAL.test(n));
      if (added.some((n) => PARTIAL.test(n))) {
        console.error(`still downloading after ${waitSeconds}s: ${added.join(', ')}`);
        process.exit(4);
      }
      break;
    }
    previous = now;
    await sleep(2000);
  }

  if (fresh.length === 0) {
    console.error(`no new image in ${DOWNLOADS} since the snapshot; nothing moved. Retry ${slug}.`);
    process.exit(4);
  }
  if (fresh.length > 1) {
    console.error(
      `${fresh.length} new images (${fresh.join(', ')}); nothing moved. Retry ${slug}.`
    );
    process.exit(5);
  }

  const source = path.join(DOWNLOADS, fresh[0]);
  const ext = path.extname(fresh[0]).toLowerCase().replace('.jpg', '.jpeg');
  const dir = deckInbox(deck);
  const attempt = entry.attempts + 1;
  for (const old of fs.readdirSync(dir).filter((n) => n.startsWith(`${slug}.`))) {
    fs.mkdirSync(path.join(dir, 'rejected'), { recursive: true });
    fs.renameSync(
      path.join(dir, old),
      path.join(dir, 'rejected', `${slug}.${entry.attempts}${path.extname(old)}`)
    );
  }
  const target = path.join(dir, `${slug}${ext}`);
  fs.renameSync(source, target);
  fs.rmSync(snapFile, { force: true });

  const hash = sha256(target);
  const line = {
    slug,
    sha256: hash,
    prompt_hash: promptHash(deck, slug, status),
    attempt,
    source_name: fresh[0],
    bytes: fs.statSync(target).size,
    downloaded_at: new Date().toISOString(),
  };
  fs.appendFileSync(path.join(dir, 'manifest.jsonl'), JSON.stringify(line) + '\n');

  // status.js stays the only writer of status.json.
  execFileSync(
    process.execPath,
    [
      path.join(__dirname, 'status.js'),
      'mark',
      '--deck',
      deck,
      slug,
      'downloaded',
      '--sha256',
      hash,
    ],
    { stdio: 'inherit' }
  );
  console.log(
    `${slug}: ${path.relative(process.cwd(), target)} (${(line.bytes / 1e6).toFixed(1)} MB, sha256 ${hash.slice(0, 12)})`
  );
  if (line.bytes < 1e6)
    console.log('  warning: under 1 MB; a full-size Gemini download is about 3.5 MB');
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  if (!args.deck || !args.slug) throw new Error('--deck <id> and --slug <slug> are required');
  if (command === 'snapshot') {
    writeJson(snapshotFile(args.deck), {
      slug: args.slug,
      at: new Date().toISOString(),
      files: listing(),
    });
    console.log(`snapshot of ${DOWNLOADS} taken for ${args.slug}`);
    return undefined;
  }
  if (command === 'take')
    return take({ deck: args.deck, slug: args.slug, waitSeconds: Number(args.wait || 90) });
  throw new Error('usage: inbox.js snapshot|take --deck <id> --slug <slug> [--wait 90]');
}

if (require.main === module) run(main);
