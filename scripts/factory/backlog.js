#!/usr/bin/env node
/**
 * Reads and marks progress on the theme list, docs/curated-themes/backlog.json
 * (factory.md, section 3). The factory only ever changes a theme's `status` (and `reason`);
 * the list itself is Edward's to edit by hand.
 *
 *   node scripts/factory/backlog.js next [--json]     # the next theme to author, or NONE
 *   node scripts/factory/backlog.js set-status <id> <status> [--reason "<why>"]
 *   node scripts/factory/backlog.js count [--json]
 *
 * **A theme is in flight when its branch exists on origin.** Every status change is committed
 * on the deck's own branch, `claude/deck-<id>`, and reaches main only when that PR merges, so
 * main keeps saying `queued` the whole time the deck is being made. `next` therefore skips any
 * theme with a `claude/deck-<id>` branch on origin, whatever main says.
 *
 * Statuses: queued -> authoring -> done, or skipped with a reason. The ship stage writes `done`
 * into the deck PR itself, because merging that PR is what makes it true. `pr-open` stays legal
 * for a hand-run flow.
 */

const fs = require('fs');
const { execFileSync } = require('child_process');

const { BACKLOG_FILE, DECK_BRANCH_PREFIX, REPO_ROOT } = require('./config');
const { parseArgs, run } = require('./cli');

const STATUSES = ['queued', 'authoring', 'pr-open', 'done', 'skipped'];
const TRANSITIONS = {
  queued: ['authoring', 'skipped'],
  authoring: ['pr-open', 'done', 'skipped', 'queued'],
  'pr-open': ['done', 'skipped', 'queued'],
  skipped: ['queued'],
  done: [],
};

/** Theme ids with a deck branch on origin (after the stage's own `git fetch`). */
function inFlightIds(cwd = REPO_ROOT) {
  const out = execFileSync(
    'git',
    ['for-each-ref', '--format=%(refname:strip=3)', `refs/remotes/origin/${DECK_BRANCH_PREFIX}*`],
    { cwd, encoding: 'utf8' }
  );
  return new Set(
    out
      .split('\n')
      .map((ref) => ref.trim())
      .filter((ref) => ref.startsWith(DECK_BRANCH_PREFIX))
      .map((ref) => ref.slice(DECK_BRANCH_PREFIX.length))
  );
}

function nextTheme(themes, inFlight) {
  return themes.find((t) => t.status === 'queued' && !inFlight.has(t.id)) || null;
}

function setStatus(themes, id, status, reason) {
  const theme = themes.find((t) => t.id === id);
  if (!theme) throw new Error(`no theme ${id} in backlog.json`);
  if (!STATUSES.includes(status)) throw new Error(`unknown status ${status}`);
  if (theme.status === status) return theme;
  if (!TRANSITIONS[theme.status].includes(status)) {
    throw new Error(`${id}: ${theme.status} -> ${status} is not a legal move`);
  }
  if (status === 'skipped' && !reason) throw new Error('skipped needs --reason');
  theme.status = status;
  if (status === 'skipped') theme.reason = reason;
  else delete theme.reason;
  return theme;
}

function counts(themes, inFlight) {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const t of themes) out[t.status]++;
  out.queued_not_in_flight = themes.filter(
    (t) => t.status === 'queued' && !inFlight.has(t.id)
  ).length;
  out.in_flight = [...inFlight];
  return out;
}

/** Prettier-formatted, as the commit hook would leave it, so a status change is a one-line diff. */
async function write(doc) {
  const prettier = require('prettier');
  const options = (await prettier.resolveConfig(BACKLOG_FILE)) || {};
  const text = await prettier.format(JSON.stringify(doc, null, 2), {
    ...options,
    parser: 'json',
  });
  fs.writeFileSync(BACKLOG_FILE, text);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest, ['json']);
  const doc = JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf8'));

  switch (command) {
    case 'next': {
      const theme = nextTheme(doc.themes, inFlightIds());
      if (args.json) console.log(JSON.stringify(theme, null, 2));
      else console.log(theme ? `${theme.id}\t${theme.name}\t${theme.scope}` : 'NONE');
      return;
    }
    case 'set-status': {
      const [id, status] = args._;
      const theme = setStatus(doc.themes, id, status, args.reason);
      await write(doc);
      console.log(`${theme.id}: ${theme.status}`);
      return;
    }
    case 'count': {
      const c = counts(doc.themes, inFlightIds());
      if (args.json) console.log(JSON.stringify(c, null, 2));
      else {
        console.log(
          STATUSES.map((s) => `${c[s]} ${s}`).join(', ') +
            `; ${c.queued_not_in_flight} queued and not yet started`
        );
      }
      return;
    }
    default:
      throw new Error('usage: backlog.js next|set-status|count');
  }
}

if (require.main === module) run(main);

module.exports = { STATUSES, TRANSITIONS, counts, inFlightIds, nextTheme, setStatus };
