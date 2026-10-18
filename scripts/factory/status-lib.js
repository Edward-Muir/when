/**
 * The deck state machine (docs/curated-themes/factory.md, section 2), as pure functions over a
 * status object. scripts/factory/status.js is the only code that reads and writes the file;
 * everything here is testable without touching the disk.
 *
 * Deck `stage`:
 *   authored -> art-in-progress -> ready-to-ship -> uploaded -> pr-open -> merged -> scheduled
 * The first three are derived from the slugs and never set by hand: a deck is ready-to-ship
 * exactly when every slug is qc-pass or needs-human. The rest are set by the ship and schedule
 * stages, one step at a time.
 *
 * Per-slug `state`:
 *   pending -> downloaded -> qc-pass | qc-fail | needs-human
 *   qc-fail -> downloaded (a regeneration), at most MAX_RETRIES times; the next fail after that
 *   lands on needs-human instead.
 * `attempts` counts downloads. `reason` is the last QC reason, which the next art batch adds to
 * the image prompt.
 */

const { MAX_BATCH, MAX_RETRIES } = require('./config');

const DECK_STAGES = [
  'authored',
  'art-in-progress',
  'ready-to-ship',
  'uploaded',
  'pr-open',
  'merged',
  'scheduled',
];
/** Stages the slugs decide. */
const ART_STAGES = ['authored', 'art-in-progress', 'ready-to-ship'];
/** Stages set explicitly, each only from the one before it. */
const SET_STAGES = {
  uploaded: 'ready-to-ship',
  'pr-open': 'uploaded',
  merged: 'pr-open',
  scheduled: 'merged',
};

const SLUG_STATES = ['pending', 'downloaded', 'qc-pass', 'qc-fail', 'needs-human'];
const TERMINAL = new Set(['qc-pass', 'needs-human']);
const SLUG_TRANSITIONS = {
  pending: ['downloaded', 'needs-human'],
  downloaded: ['qc-pass', 'qc-fail', 'needs-human'],
  'qc-fail': ['downloaded', 'needs-human'],
  'qc-pass': [],
  'needs-human': [],
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_RE = /^[0-9a-f]{64}$/;

class StatusError extends Error {}

function fail(message) {
  throw new StatusError(message);
}

function iso(now) {
  return new Date(now).toISOString();
}

function create({ deck, name, slugs, now = Date.now() }) {
  if (!deck || !SLUG_RE.test(deck)) fail(`bad deck id: ${deck}`);
  const unique = new Set(slugs);
  if (unique.size !== slugs.length) fail('a slug is listed twice');
  for (const slug of slugs) if (!SLUG_RE.test(slug)) fail(`bad slug: ${slug}`);
  const status = {
    deck,
    name: name || deck,
    stage: 'authored',
    created_at: iso(now),
    updated_at: iso(now),
    stage_history: [{ stage: 'authored', at: iso(now) }],
    slugs: {},
  };
  for (const slug of slugs) {
    status.slugs[slug] = { state: 'pending', attempts: 0, reason: null, sha256: null };
  }
  return derive(status, now);
}

function setStage(status, stage, now) {
  if (status.stage === stage) return;
  status.stage = stage;
  status.stage_history.push({ stage, at: iso(now) });
}

/** Re-derive the stage while the slugs still decide it. */
function derive(status, now = Date.now()) {
  if (!ART_STAGES.includes(status.stage)) return status;
  const entries = Object.values(status.slugs);
  let stage;
  if (entries.every((s) => TERMINAL.has(s.state))) stage = 'ready-to-ship';
  else if (entries.some((s) => s.attempts > 0 || s.state !== 'pending')) stage = 'art-in-progress';
  else stage = 'authored';
  setStage(status, stage, now);
  return status;
}

/**
 * Move one slug. `opts`: `sha256` (required for downloaded), `reason` (required for qc-fail and
 * needs-human). Returns `{state}`: the state actually recorded, which for a qc-fail past the
 * retry cap is needs-human.
 */
function mark(status, slug, state, opts = {}, now = Date.now()) {
  const entry = status.slugs[slug];
  if (!entry) fail(`${slug} is not in deck ${status.deck}`);
  if (!SLUG_STATES.includes(state)) fail(`unknown state: ${state}`);
  if (!ART_STAGES.includes(status.stage)) {
    fail(`deck ${status.deck} is at ${status.stage}; its slugs can no longer change`);
  }
  if (!SLUG_TRANSITIONS[entry.state].includes(state)) {
    fail(`${slug}: ${entry.state} -> ${state} is not a legal move`);
  }

  let recorded = state;
  if (state === 'downloaded') {
    if (!SHA256_RE.test(opts.sha256 || '')) fail('downloaded needs --sha256 <64 hex chars>');
    entry.attempts += 1;
    entry.sha256 = opts.sha256;
  } else if (state === 'qc-fail' || state === 'needs-human') {
    if (!opts.reason) fail(`${state} needs --reason`);
    entry.reason = opts.reason;
    if (state === 'qc-fail' && entry.attempts > MAX_RETRIES) {
      recorded = 'needs-human';
      entry.reason = `failed QC ${entry.attempts} times; last: ${opts.reason}`;
    }
  } else if (state === 'qc-pass') {
    entry.reason = opts.reason || null;
  }

  entry.state = recorded;
  entry.updated_at = iso(now);
  status.updated_at = iso(now);
  derive(status, now);
  return { state: recorded };
}

/** A human's way back: the slug starts again with a fresh retry budget. */
function reset(status, slug, now = Date.now()) {
  const entry = status.slugs[slug];
  if (!entry) fail(`${slug} is not in deck ${status.deck}`);
  if (!ART_STAGES.includes(status.stage)) fail(`deck ${status.deck} is at ${status.stage}`);
  Object.assign(entry, { state: 'pending', attempts: 0, reason: null, sha256: null });
  entry.updated_at = iso(now);
  status.updated_at = iso(now);
  derive(status, now);
}

function stage(status, next, now = Date.now()) {
  if (!DECK_STAGES.includes(next)) fail(`unknown stage: ${next}`);
  if (!SET_STAGES[next]) fail(`${next} is derived from the slugs and cannot be set`);
  if (status.stage !== SET_STAGES[next]) {
    fail(`deck ${status.deck} is at ${status.stage}; ${next} needs ${SET_STAGES[next]}`);
  }
  setStage(status, next, now);
  status.updated_at = iso(now);
}

/**
 * The next slugs for one art session: retries first, so a deck finishes, then pending slugs,
 * each in deck order. The cap is enforced here, not in the prompt.
 */
function nextBatch(status, max = MAX_BATCH) {
  if (!Number.isInteger(max) || max < 1) fail('--max must be a positive integer');
  if (max > MAX_BATCH) fail(`--max is capped at ${MAX_BATCH}`);
  if (!['authored', 'art-in-progress'].includes(status.stage)) return [];
  const slugs = Object.entries(status.slugs);
  const retries = slugs.filter(([, s]) => s.state === 'qc-fail');
  const fresh = slugs.filter(([, s]) => s.state === 'pending');
  return [...retries, ...fresh].slice(0, max).map(([slug, s]) => ({
    slug,
    attempt: s.attempts + 1,
    retry_reason: s.state === 'qc-fail' ? s.reason : null,
  }));
}

/** The image prompt for a retry carries the last QC reason, so the same mistake is not redrawn. */
function retryPrompt(imagePrompt, reason) {
  if (!reason) return imagePrompt;
  const clean = reason.trim().replace(/\.?$/, '.');
  return `${imagePrompt} The previous image for this card was rejected: ${clean} Make sure this one does not repeat that.`;
}

function counts(status) {
  const out = Object.fromEntries(SLUG_STATES.map((s) => [s, 0]));
  for (const s of Object.values(status.slugs)) out[s.state]++;
  return out;
}

function summary(status) {
  const c = counts(status);
  const lines = [
    `${status.name} (${status.deck}): ${status.stage}`,
    `  ${Object.keys(status.slugs).length} new slugs: ` +
      SLUG_STATES.map((s) => `${c[s]} ${s}`).join(', '),
  ];
  for (const [slug, s] of Object.entries(status.slugs)) {
    if (s.state === 'needs-human' || s.state === 'qc-fail') {
      lines.push(`  ${s.state.padEnd(11)} ${slug}: ${s.reason}`);
    }
  }
  return lines.join('\n');
}

/** Structural check of a file read from disk, so a hand edit cannot wedge the factory. */
function validate(status) {
  const problems = [];
  if (!DECK_STAGES.includes(status.stage)) problems.push(`unknown stage ${status.stage}`);
  for (const [slug, s] of Object.entries(status.slugs || {})) {
    if (!SLUG_STATES.includes(s.state)) problems.push(`${slug}: unknown state ${s.state}`);
    if (!Number.isInteger(s.attempts) || s.attempts < 0) problems.push(`${slug}: bad attempts`);
    if (s.state !== 'pending' && s.state !== 'needs-human' && !s.sha256) {
      problems.push(`${slug}: ${s.state} without a sha256`);
    }
  }
  if (problems.length) fail(`status.json for ${status.deck} is invalid: ${problems.join('; ')}`);
  return status;
}

module.exports = {
  DECK_STAGES,
  SLUG_STATES,
  SLUG_TRANSITIONS,
  StatusError,
  counts,
  create,
  derive,
  mark,
  nextBatch,
  reset,
  retryPrompt,
  stage,
  summary,
  validate,
};
