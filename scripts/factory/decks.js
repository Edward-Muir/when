#!/usr/bin/env node
/**
 * Every deck the factory has on origin, read straight from the branches without checking any
 * out. A deck's state lives on its own branch (factory/decks/<id>/status.json on
 * claude/deck-<id>), so this is how a stage finds the deck to work on, and how list health sees
 * them all.
 *
 *   node scripts/factory/decks.js            # one line per deck
 *   node scripts/factory/decks.js --json
 *
 * Run it after `git fetch origin`; it reads the remote-tracking refs.
 */

const { execFileSync } = require('child_process');

const { DECK_BRANCH_PREFIX, REPO_ROOT } = require('./config');
const { counts } = require('./status-lib');
const { parseArgs } = require('./cli');

function git(args, opts = {}) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', ...opts });
}

function showJson(ref, file) {
  try {
    return JSON.parse(git(['show', `${ref}:${file}`], { stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

/**
 * `[{id, branch, ref, status, backlogStatus, committedAt}]`, oldest deck first. `status` is
 * null while a deck is still being authored (no status.json yet).
 */
function listDecks() {
  const out = git([
    'for-each-ref',
    '--sort=committerdate',
    '--format=%(refname:strip=2)\t%(committerdate:iso-strict)',
    `refs/remotes/origin/${DECK_BRANCH_PREFIX}*`,
  ]);
  const decks = [];
  for (const line of out.split('\n').filter(Boolean)) {
    const [remoteRef, committedAt] = line.split('\t');
    const branch = remoteRef.replace(/^origin\//, '');
    const id = branch.slice(DECK_BRANCH_PREFIX.length);
    const ref = `origin/${branch}`;
    const status = showJson(ref, `factory/decks/${id}/status.json`);
    const backlog = showJson(ref, 'docs/curated-themes/backlog.json');
    const theme = backlog && backlog.themes.find((t) => t.id === id);
    // A branch that only shares the prefix (claude/deck-factory-plan, the list's own PR) is not a deck.
    if (!status && !theme) continue;
    decks.push({
      id,
      branch,
      ref,
      status,
      backlogStatus: theme ? theme.status : null,
      committedAt,
    });
  }
  // Oldest first by when the deck was created, falling back to the branch's first sighting.
  const born = (d) => (d.status && d.status.created_at) || d.committedAt;
  return decks.sort((a, b) => (born(a) < born(b) ? -1 : born(a) > born(b) ? 1 : 0));
}

function describe(deck) {
  if (!deck.status) return `${deck.id}: authoring (backlog ${deck.backlogStatus})`;
  const c = counts(deck.status);
  const parts = Object.entries(c)
    .filter(([, n]) => n)
    .map(([s, n]) => `${n} ${s}`);
  return `${deck.id}: ${deck.status.stage}${parts.length ? ` (${parts.join(', ')})` : ''}`;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2), ['json']);
  const decks = listDecks();
  if (args.json) console.log(JSON.stringify(decks, null, 2));
  else if (!decks.length) console.log('no decks on origin');
  else for (const deck of decks) console.log(describe(deck));
}

module.exports = { describe, git, listDecks, showJson };
