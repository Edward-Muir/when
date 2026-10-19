#!/usr/bin/env node
/**
 * The preamble every factory stage runs first (factory.md, The clone), in code rather than in
 * the skill's prose, because it is the part that can destroy work if it runs in the wrong place.
 *
 *   node scripts/factory/start.js            # auto: the state machine picks the stage
 *   node scripts/factory/start.js <health|author|art-batch|qc|ship|schedule>   # force one
 *
 * **One scheduled task runs the whole factory** (factory.md, section 2). With no stage, or
 * `auto`, phase 2 picks the first stage that has work, downstream first so a deck in flight
 * finishes before another starts (pickStage, below). Each run still does exactly one stage.
 *
 * It prints one JSON object as its last line:
 *   {"action": "run", "stage", "deck", "branch", "token", ...}  do the stage, then unlock
 *   {"action": "exit", "reason"}                                 nothing to do; lock released
 *   {"action": "blocked", "reason", ...}                         needs Edward; lock released
 *
 * Phase 1, which may be an old copy of this file left by the last checkout:
 *   1. The guard: refuse unless the repo folder is `when-factory` and a full clone (not a
 *      worktree). Everything after this resets the working tree.
 *   2. Take the global lock, or exit at once if another stage holds it.
 *   3. `git fetch origin`, then check out origin/main detached and clean the tree, keeping only
 *      node_modules, .env and settings.local.json.
 *   4. Re-run this script from the fresh checkout, so phase 2 is always main's version.
 * Phase 2:
 *   5. Register the JSON merge driver in the clone's own git config.
 *   6. Pick the deck for this stage (oldest first, at most one).
 *   7. Check out claude/deck-<id> from origin, or branch it off origin/main for a new deck, and
 *      merge origin/main into an existing one so the deck stays mergeable and runs current code.
 *   8. `npm ci`, only if package-lock.json changed since the last install.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const config = require('./config');
const lock = require('./lock');

const {
  REPO_ROOT,
  FACTORY_DIRNAME,
  DECK_BRANCH_PREFIX,
  MAX_IN_FLIGHT,
  BACKOFF_MS,
  HEALTH_EVERY_MS,
} = config;
const STAGES = ['health', 'author', 'art-batch', 'qc', 'ship', 'schedule'];
/** The order `auto` tries them in: cheap periodic checks when due, then downstream first. */
const AUTO_ORDER = ['health', 'schedule', 'ship', 'qc', 'art-batch', 'author'];
/** Stages that work on main and need no deck. */
const NO_DECK = new Set(['health', 'schedule']);
const KEEP = ['node_modules', '.env', '.claude/settings.local.json'];
/**
 * What a stage syncs to and branches from. Always origin/main in a real run; the override is
 * for trying out factory changes from a branch before they merge.
 */
const BASE = process.env.FACTORY_BASE_REF || 'origin/main';

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', ...opts });
}

function emit(result) {
  console.log(JSON.stringify(result));
}

function guardProblem(cwd = process.cwd(), root = REPO_ROOT) {
  if (path.basename(root) !== FACTORY_DIRNAME) {
    return `this checkout is ${root}, not a ${FACTORY_DIRNAME} clone; a stage resets its working tree, so it only runs there`;
  }
  const rel = path.relative(fs.realpathSync(root), fs.realpathSync(cwd));
  if (rel.startsWith('..') || path.isAbsolute(rel)) return `cwd ${cwd} is outside ${root}`;
  if (!fs.statSync(path.join(root, '.git')).isDirectory()) {
    return `${root} is a worktree; the factory runs in a full clone`;
  }
  return null;
}

/** Deck stages each stage works on, and whether a deck has work for it. */
function hasWork(stage, status) {
  if (!status) return false;
  const states = Object.values(status.slugs).map((s) => s.state);
  switch (stage) {
    case 'art-batch':
      return (
        ['authored', 'art-in-progress'].includes(status.stage) &&
        states.some((s) => s === 'pending' || s === 'qc-fail')
      );
    case 'qc':
      return states.includes('downloaded');
    case 'ship':
      return ['ready-to-ship', 'uploaded'].includes(status.stage);
    default:
      return false;
  }
}

const IN_FLIGHT_STAGES = new Set(['authored', 'art-in-progress', 'ready-to-ship', 'uploaded']);

/**
 * Which deck a stage takes. `decks` is decks.js's list, oldest first; `next` is the backlog's
 * next theme. Returns {deck, isNew} or {exit: reason}.
 */
function pickDeck(stage, decks, next) {
  if (stage === 'author') {
    // A deck whose authoring crashed has a branch but no status.json yet: finish it first.
    const resume = decks.find((d) => !d.status && d.backlogStatus === 'authoring');
    if (resume) return { deck: resume.id, isNew: false, resumed: true };
    const inFlight = decks.filter(
      (d) =>
        (!d.status && d.backlogStatus === 'authoring') ||
        (d.status && IN_FLIGHT_STAGES.has(d.status.stage))
    );
    if (inFlight.length >= MAX_IN_FLIGHT) {
      return {
        exit: `${inFlight.length} decks are still in progress (${inFlight.map((d) => d.id).join(', ')}); the cap is ${MAX_IN_FLIGHT}`,
      };
    }
    if (!next) return { exit: 'no queued theme left in backlog.json' };
    return { deck: next.id, isNew: true, theme: next };
  }
  const deck = decks.find((d) => hasWork(stage, d.status));
  return deck ? { deck: deck.id, isNew: false } : { exit: `no deck has work for ${stage}` };
}

/** The local calendar day, for "once a day" and "until tomorrow". */
const localDay = (t) => new Date(t).toLocaleDateString('en-CA');

/**
 * Why `auto` should leave a stage alone for now, or null. A stage that ended blocked or failed
 * waits BACKOFF_MS, so one broken stage (Chrome signed out, a merge conflict) can't take every
 * run; art that hit Gemini's daily cap waits for the next local day. Forcing a stage ignores it.
 */
function backoffReason(stage, runLog, now) {
  const last = runLog[stage];
  if (!last) return null;
  const at = Date.parse(last.at);
  if (last.outcome === 'quota' && localDay(at) === localDay(now))
    return 'image quota used up today';
  if ((last.outcome === 'blocked' || last.outcome === 'failed') && now - at < BACKOFF_MS) {
    return `${last.outcome} at ${last.at}; waiting ${BACKOFF_MS / 3600000}h`;
  }
  return null;
}

/**
 * Which stage an `auto` run takes. Returns pickDeck's result plus `stage`, or {exit: reason}.
 * `pending` is how many merged decks are not on the calendar yet.
 */
function pickStage({ decks, next, runLog = {}, now = Date.now(), pending = 0 }) {
  const waiting = [];
  for (const stage of AUTO_ORDER) {
    const why = backoffReason(stage, runLog, now);
    const last = runLog[stage];
    let pick = null;
    if (stage === 'health') {
      if (!last || now - Date.parse(last.at) >= HEALTH_EVERY_MS) pick = { deck: null };
    } else if (stage === 'schedule') {
      if (pending > 0 && (!last || localDay(Date.parse(last.at)) !== localDay(now)))
        pick = { deck: null };
    } else {
      const p = pickDeck(stage, decks, next);
      if (!p.exit) pick = p;
    }
    if (!pick) continue;
    if (why) {
      waiting.push(`${stage} (${why})`);
      continue;
    }
    return { stage, ...pick };
  }
  return { exit: `nothing to do${waiting.length ? `; waiting: ${waiting.join(', ')}` : ''}` };
}

function registerMergeDriver() {
  const driver = `node ${path.join(REPO_ROOT, 'scripts', 'factory', 'json-merge.js')} %O %A %B %P`;
  git(['config', 'merge.factory-json.name', 'structural JSON merge for the deck factory']);
  git(['config', 'merge.factory-json.driver', driver]);
  const attributes = path.join(REPO_ROOT, '.git', 'info', 'attributes');
  const line = '*.json merge=factory-json';
  const current = fs.existsSync(attributes) ? fs.readFileSync(attributes, 'utf8') : '';
  if (!current.split('\n').includes(line)) {
    fs.mkdirSync(path.dirname(attributes), { recursive: true });
    fs.writeFileSync(
      attributes,
      current + (current && !current.endsWith('\n') ? '\n' : '') + line + '\n'
    );
  }
}

function npmCiIfNeeded() {
  const lockfile = path.join(REPO_ROOT, 'package-lock.json');
  const stamp = path.join(REPO_ROOT, 'node_modules', '.factory-lock-hash');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(lockfile)).digest('hex');
  const installed = fs.existsSync(stamp) ? fs.readFileSync(stamp, 'utf8').trim() : null;
  if (installed === hash && fs.existsSync(path.join(REPO_ROOT, 'node_modules'))) return false;
  const result = spawnSync('npm', ['ci'], {
    cwd: REPO_ROOT,
    // npm's chatter goes to stderr: stdout carries only the JSON result.
    stdio: ['ignore', process.stderr, process.stderr],
    env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: 'true' },
  });
  if (result.status !== 0) throw new Error('npm ci failed');
  fs.writeFileSync(stamp, hash + '\n');
  return true;
}

function phase1(stage) {
  const problem = guardProblem();
  if (problem) {
    emit({ action: 'blocked', reason: problem });
    process.exit(2);
  }
  const taken = lock.acquire({ stage });
  if (!taken.ok) {
    const h = taken.holder;
    emit({ action: 'exit', reason: `locked by ${h.stage} (pid ${h.pid}) since ${h.at}` });
    return;
  }
  const { token } = taken.lock;
  try {
    git(['fetch', '--prune', 'origin'], { stdio: ['ignore', 'ignore', 'inherit'] });
    // A run that died mid-merge leaves MERGE_HEAD behind; a hard reset clears it.
    git(['reset', '--hard', '--quiet'], { stdio: 'ignore' });
    git(['checkout', '--force', '--detach', BASE], { stdio: 'ignore' });
    git(['clean', '-ffdx', ...KEEP.flatMap((p) => ['-e', p])], { stdio: 'ignore' });
  } catch (error) {
    lock.release({ token });
    emit({ action: 'blocked', reason: `sync failed: ${error.message.split('\n')[0]}` });
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [__filename, stage, '--phase2', token], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

async function phase2(requested, token) {
  let stage = requested;
  const finish = (result) => {
    if (result.action !== 'run') lock.release({ token });
    // A stage that can't even start is backed off like one that failed, or every auto run
    // would pick it again.
    if (result.action === 'blocked' && stage !== 'auto') {
      lock.recordRun({ stage, outcome: 'blocked' });
    }
    emit(result);
  };
  try {
    registerMergeDriver();
    const { listDecks } = require('./decks');
    const backlog = require('./backlog');
    const decks = listDecks();
    const doc = JSON.parse(fs.readFileSync(config.BACKLOG_FILE, 'utf8'));
    const next = backlog.nextTheme(doc.themes, backlog.inFlightIds());

    let pick = null;
    if (requested === 'auto') {
      let pending = 0;
      try {
        pending = (await require('./next-slot').pendingDecks()).length;
      } catch {
        // No calendar, no scheduling this run; every other stage still works offline.
      }
      pick = pickStage({ decks, next, runLog: lock.readRunLog(), pending });
      if (pick.exit) {
        finish({ action: 'exit', reason: pick.exit });
        return;
      }
      stage = pick.stage;
      // The lock was taken as `auto`; name the stage, so its outcome is logged against it.
      lock.refresh({ token, stage });
    }

    if (NO_DECK.has(stage)) {
      npmCiIfNeeded();
      finish({
        action: 'run',
        stage,
        deck: null,
        branch: null,
        token,
        decks: decks.map((d) => d.id),
      });
      return;
    }

    if (!pick) pick = pickDeck(stage, decks, next);
    if (pick.exit) {
      finish({ action: 'exit', reason: pick.exit });
      return;
    }

    const branch = `${DECK_BRANCH_PREFIX}${pick.deck}`;
    if (pick.isNew) {
      git(['checkout', '-B', branch, BASE], { stdio: 'ignore' });
    } else {
      git(['checkout', '-B', branch, `origin/${branch}`], { stdio: 'ignore' });
      const before = git(['rev-parse', 'HEAD']).trim();
      try {
        git(['merge', '--no-edit', BASE], { stdio: ['ignore', 'ignore', 'pipe'] });
      } catch (error) {
        const conflicted = git(['diff', '--name-only', '--diff-filter=U'])
          .trim()
          .split('\n')
          .filter(Boolean);
        git(['merge', '--abort'], { stdio: 'ignore' });
        finish({
          action: 'blocked',
          reason: `merging ${BASE} into ${branch} conflicts`,
          deck: pick.deck,
          conflicted,
        });
        return;
      }
      if (git(['rev-parse', 'HEAD']).trim() !== before) {
        git(['push', 'origin', branch], { stdio: 'ignore' });
      }
    }
    const installed = npmCiIfNeeded();
    finish({
      action: 'run',
      stage,
      deck: pick.deck,
      branch,
      token,
      new_deck: pick.isNew,
      resumed: Boolean(pick.resumed),
      npm_ci: installed,
      theme: pick.theme || undefined,
    });
  } catch (error) {
    finish({ action: 'blocked', reason: error.message.split('\n')[0] });
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const stage = argv[0] && !argv[0].startsWith('--') ? argv.shift() : 'auto';
  const [flag, token] = argv;
  if (stage !== 'auto' && !STAGES.includes(stage)) {
    console.error(`usage: start.js [auto|${STAGES.join('|')}]`);
    process.exit(1);
  }
  if (flag === '--phase2') phase2(stage, token);
  else phase1(stage);
}

module.exports = { AUTO_ORDER, backoffReason, guardProblem, hasWork, pickDeck, pickStage, STAGES };
