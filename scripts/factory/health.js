#!/usr/bin/env node
/**
 * The weekly list-health report (factory.md, task A), assembled in one command so the stage
 * only has to run it and relay it.
 *
 *   node scripts/factory/health.js
 *
 * Sections: themes left (a warning under 30 queued, about a month's notice to build more);
 * the decks on origin and any that look stuck; the calendar's buffer, gaps and off-cadence
 * days; `theme:verify`; skipped themes and why; open factory PRs; and closed-unmerged ones
 * whose Cloudinary assets should be queued for deletion (listed, never deleted).
 *
 * Writes the report to <images>/factory-reports/health-<date>.md as well as stdout. Nothing is
 * committed: main is Edward's.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const { BACKLOG_FILE, IMAGES_DIR, REPO_ROOT } = require('./config');
const backlog = require('./backlog');
const { describe: describeDeck, listDecks, showJson } = require('./decks');
const { report: calendarReport } = require('./next-slot');
const { run } = require('./cli');

const LOW_WATER = 30;
const STUCK_DAYS = 3;

function gh(args) {
  try {
    return JSON.parse(
      execFileSync('gh', args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    );
  } catch {
    return null;
  }
}

async function main() {
  const lines = [];
  const say = (...l) => lines.push(...l);
  const today = new Date().toISOString().slice(0, 10);
  const doc = JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf8'));
  const decks = listDecks();
  const counts = backlog.counts(doc.themes, backlog.inFlightIds());

  say(`# Deck factory health, ${today}`, '');

  say('## Themes left', '');
  say(
    `- ${counts.queued_not_in_flight} queued and not started; ${counts.done} done; ${counts.skipped} skipped.`
  );
  if (counts.queued_not_in_flight < LOW_WATER) {
    say(
      `- **Fewer than ${LOW_WATER} left: time for a theme-list session** (the deck-factory skill, \`theme-list\`).`
    );
  }
  say('');

  say('## Decks on origin', '');
  if (!decks.length) say('- none');
  const now = Date.now();
  for (const d of decks) {
    const age = Math.floor((now - Date.parse(d.committedAt)) / 86400000);
    const idle = d.status && ['pr-open', 'merged', 'scheduled'].includes(d.status.stage);
    const stuck = !idle && age >= STUCK_DAYS ? ` **(no change for ${age} days)**` : '';
    say(`- ${describeDeck(d)}${stuck}`);
  }
  say('');

  say('## Calendar', '');
  try {
    const response = await fetch(
      `${process.env.THEMES_API_URL || 'https://www.play-when.com'}/api/themes?fresh=${now}`
    );
    const r = calendarReport((await response.json()).themes || []);
    say(
      `- Buffer: **${r.buffer_days} days**, to the first open Monday or Friday (${r.next_open ? r.next_open.date : 'none'}).`,
      `- ${r.scheduled_ahead} curated days ahead, the last on ${r.last_date}.`,
      `- Open Mon/Fri before then: ${r.gaps.length ? r.gaps.map((g) => g.date).join(', ') : 'none'}.`,
      `- Off-cadence days (drift): ${r.drift.length ? r.drift.map(([d, id]) => `${d} ${id}`).join(', ') : 'none'}.`
    );
  } catch (error) {
    say(`- Could not read the calendar: ${error.message}`);
  }
  say('');

  say('## theme:verify', '');
  const verify = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, 'scripts', 'verify-themes.js')],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }
  );
  const flagged = `${verify.stdout}`.split('\n\n').filter((block) => /^\s*[✗·]/.test(block.trim()));
  say(
    verify.status === 0
      ? '- Every theme still to run resolves.'
      : '- **Failing.** A theme still to run has lost cards:'
  );
  for (const block of flagged) say('', '```', block.trim(), '```');
  say('');

  say('## Skipped themes', '');
  const skipped = doc.themes
    .filter((t) => t.status === 'skipped')
    .map((t) => `- ${t.id} (on main): ${t.reason}`);
  for (const d of decks) {
    const b = showJson(d.ref, 'docs/curated-themes/backlog.json');
    const t = b && b.themes.find((x) => x.id === d.id && x.status === 'skipped');
    if (t) skipped.push(`- ${t.id} (skip PR not merged yet): ${t.reason}`);
  }
  say(...(skipped.length ? skipped : ['- none']), '');

  say('## Factory pull requests', '');
  const open = gh([
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '50',
    '--json',
    'number,title,headRefName,url',
  ]);
  const closed = gh([
    'pr',
    'list',
    '--state',
    'closed',
    '--limit',
    '50',
    '--json',
    'number,headRefName,mergedAt,url',
  ]);
  if (!open) say('- Could not reach GitHub.');
  else {
    const mine = open.filter((p) => p.headRefName.startsWith('claude/deck-'));
    say(
      ...(mine.length
        ? mine.map((p) => `- open: [#${p.number}](${p.url}) ${p.title}`)
        : ['- none open'])
    );
  }
  const unmerged = (closed || []).filter(
    (p) => p.headRefName.startsWith('claude/deck-') && !p.mergedAt
  );
  for (const p of unmerged) {
    const id = p.headRefName.slice('claude/deck-'.length);
    const uploads = showJson(`origin/${p.headRefName}`, `factory/decks/${id}/uploads.json`);
    if (uploads && Object.keys(uploads).length) {
      say(
        `- closed unmerged: [#${p.number}](${p.url}). Queue its ${Object.keys(uploads).length} assets in ` +
          '`cloudinary_delete_list.json` once you agree: ' +
          Object.values(uploads)
            .map((u) => `\`${u.public_id}\``)
            .join(', ')
      );
    }
  }
  say('');

  const text = lines.join('\n');
  const outDir = path.join(IMAGES_DIR, 'factory-reports');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `health-${today}.md`), text + '\n');
  console.log(text);
  console.log(`\n(saved to ${path.join(outDir, `health-${today}.md`)})`);
}

if (require.main === module) run(main);
