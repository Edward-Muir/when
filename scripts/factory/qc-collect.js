#!/usr/bin/env node
/**
 * Collects a deck's QC verdicts and turns them into slug states (factory.md, C2). The October
 * 2026 audit's Haiku reviewers sometimes skipped work, so completeness is checked here, in code,
 * rather than trusted.
 *
 *   node scripts/factory/qc-collect.js --deck <id>            # what is still missing
 *   node scripts/factory/qc-collect.js --deck <id> --apply    # record the verdicts
 *
 * For every slug at `downloaded`, in factory/decks/<id>/qc/:
 *   1. `<slug>.precheck.json` must exist and match the file's sha256. A failed precheck is a
 *      qc-fail on its own; no model needs to look.
 *   2. Otherwise `<slug>.json`, card-art-qc's verdict, must exist and be well formed: the slug,
 *      a description, all seven checks graded pass/fail/unsure, and a verdict that follows from
 *      them.
 *   3. A `fail` or `unsure` needs `<slug>.recheck.json`, the strict second opinion.
 *
 * Without --apply it prints `{"review": [...], "recheck": [...]}` and exits 2 while any first
 * review is missing or invalid, 3 while only second opinions are, and 0 when everything is in.
 * --apply refuses to run until it would exit 0, then marks each slug through status.js:
 *   precheck fail -> qc-fail; pass -> qc-pass; recheck pass -> qc-pass; recheck fail -> qc-fail;
 *   recheck unsure -> needs-human.
 * A failed slug's verdict files move to qc/history/, so the next attempt starts clean, and
 * qc/summary.json keeps one row per slug for the PR body.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { DECKS_DIR } = require('./config');
const { parseArgs, readJson, run, writeJson } = require('./cli');

const CHECKS = [
  'subject',
  'era',
  'no_text',
  'no_frame',
  'not_graphic',
  'birth_adult',
  'scene_rules',
];
const GRADES = ['pass', 'fail', 'unsure'];

function readMaybe(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

/** Why a verdict file is unusable, or null. */
function verdictProblem(v, slug) {
  if (!v) return 'missing or not JSON';
  if (v.slug !== slug) return `names ${v.slug}, not ${slug}`;
  if (typeof v.description !== 'string' || v.description.trim().length < 20) {
    return 'no cold description';
  }
  if (!v.checks || typeof v.checks !== 'object') return 'no checks';
  const missing = CHECKS.filter((c) => !GRADES.includes(v.checks[c]));
  if (missing.length) return `checks not graded: ${missing.join(', ')}`;
  const grades = CHECKS.map((c) => v.checks[c]);
  const implied = grades.includes('fail') ? 'fail' : grades.includes('unsure') ? 'unsure' : 'pass';
  if (v.verdict !== implied)
    return `verdict ${v.verdict} does not follow from the checks (${implied})`;
  if (v.verdict !== 'pass' && !String(v.reason || '').trim())
    return 'a fail or unsure needs a reason';
  return null;
}

function collect(deck) {
  const dir = path.join(DECKS_DIR, deck);
  const status = readJson(path.join(dir, 'status.json'));
  const qc = path.join(dir, 'qc');
  const review = [];
  const recheck = [];
  const decisions = [];

  for (const [slug, entry] of Object.entries(status.slugs)) {
    if (entry.state !== 'downloaded') continue;
    const pre = readMaybe(path.join(qc, `${slug}.precheck.json`));
    if (!pre || pre.sha256 !== entry.sha256) {
      review.push({ slug, problem: 'no precheck for this download; run image-precheck.py' });
      continue;
    }
    if (!pre.ok) {
      decisions.push({
        slug,
        state: 'qc-fail',
        reason: `precheck: ${pre.problems.join('; ')}`,
        by: 'precheck',
      });
      continue;
    }
    const first = readMaybe(path.join(qc, `${slug}.json`));
    const problem = verdictProblem(first, slug);
    if (problem) {
      review.push({ slug, problem });
      continue;
    }
    if (first.verdict === 'pass') {
      decisions.push({
        slug,
        state: 'qc-pass',
        reason: '',
        by: 'review',
        description: first.description,
      });
      continue;
    }
    const second = readMaybe(path.join(qc, `${slug}.recheck.json`));
    const secondProblem = verdictProblem(second, slug);
    if (secondProblem) {
      recheck.push({ slug, first: first.verdict, reason: first.reason, problem: secondProblem });
      continue;
    }
    const state = { pass: 'qc-pass', fail: 'qc-fail', unsure: 'needs-human' }[second.verdict];
    decisions.push({
      slug,
      state,
      reason: second.reason || '',
      by: 'recheck',
      description: second.description,
    });
  }
  return { status, qc, review, recheck, decisions };
}

function archive(qc, slug, attempt) {
  const history = path.join(qc, 'history');
  fs.mkdirSync(history, { recursive: true });
  for (const kind of ['', '.recheck', '.precheck']) {
    const file = path.join(qc, `${slug}${kind}.json`);
    if (fs.existsSync(file))
      fs.renameSync(file, path.join(history, `${slug}.a${attempt}${kind || '.review'}.json`));
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2), ['apply']);
  if (!args.deck) throw new Error('--deck <id> is required');
  const { status, qc, review, recheck, decisions } = collect(args.deck);

  if (review.length || recheck.length || !args.apply) {
    console.log(JSON.stringify({ review, recheck, ready: decisions.length }, null, 2));
    if (args.apply && (review.length || recheck.length)) {
      console.error('✗ not applied: every slug needs its verdicts first');
    }
    process.exit(review.length ? 2 : recheck.length ? 3 : 0);
  }

  const summaryFile = path.join(qc, 'summary.json');
  const summary = fs.existsSync(summaryFile) ? readJson(summaryFile) : {};
  for (const d of decisions) {
    const cmd = ['mark', '--deck', args.deck, d.slug, d.state];
    if (d.reason) cmd.push('--reason', d.reason);
    const out = execFileSync(process.execPath, [path.join(__dirname, 'status.js'), ...cmd], {
      encoding: 'utf8',
    });
    const recorded = out.includes('needs-human') ? 'needs-human' : d.state;
    const attempt = status.slugs[d.slug].attempts;
    summary[d.slug] = {
      state: recorded,
      reason: d.reason,
      by: d.by,
      attempts: attempt,
      description: d.description || null,
    };
    if (recorded !== 'qc-pass') archive(qc, d.slug, attempt);
    console.log(`${d.slug}: ${recorded}${d.reason ? ` (${d.reason})` : ''}`);
  }
  writeJson(summaryFile, summary);
}

if (require.main === module) run(main);

module.exports = { CHECKS, verdictProblem };
