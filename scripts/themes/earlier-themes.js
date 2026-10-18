/**
 * Every theme a new deck must stay distinct from, for `theme-gap.js --overlap`
 * (docs/curated-themes/factory.md, "Overlap control while decks are authored").
 *
 * Four sources, because no one of them has them all:
 *   1. docs/curated-themes/publish-inputs.md: the ready-to-paste JSON of banks 1 and 2,
 *      including themes not yet on the calendar.
 *   2. factory/decks/<id>/deck.json in this checkout: factory decks already merged.
 *   3. deck.json on every claude/deck-* branch on origin: decks still in flight, which would
 *      otherwise be invisible to each other.
 *   4. The live calendar (/api/themes): themes published by hand, such as English History.
 * The same id from several sources is one theme; the first source wins.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

function fromPublishInputs() {
  const file = path.join(ROOT, 'docs', 'curated-themes', 'publish-inputs.md');
  if (!fs.existsSync(file)) return [];
  const themes = [];
  for (const [, block] of fs.readFileSync(file, 'utf8').matchAll(/```json\n([\s\S]*?)```/g)) {
    try {
      const theme = JSON.parse(block);
      if (theme.id && Array.isArray(theme.eventNames)) themes.push(theme);
    } catch {
      // A prose example rather than an input; not a theme.
    }
  }
  return themes;
}

function fromMergedDecks() {
  const dir = path.join(ROOT, 'factory', 'decks');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((id) => path.join(dir, id, 'deck.json'))
    .filter((file) => fs.existsSync(file))
    .map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
}

function fromDeckBranches() {
  let refs;
  try {
    refs = execFileSync(
      'git',
      ['for-each-ref', '--format=%(refname:strip=3)', 'refs/remotes/origin/claude/deck-*'],
      { cwd: ROOT, encoding: 'utf8' }
    );
  } catch {
    return [];
  }
  const themes = [];
  for (const branch of refs.split('\n').filter(Boolean)) {
    const id = branch.replace(/^claude\/deck-/, '');
    try {
      const text = execFileSync('git', ['show', `origin/${branch}:factory/decks/${id}/deck.json`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      themes.push(JSON.parse(text));
    } catch {
      // Not reconciled yet, so it has no cards to share.
    }
  }
  return themes;
}

async function fromCalendar() {
  const base = process.env.THEMES_API_URL || 'https://www.play-when.com';
  try {
    const response = await fetch(`${base}/api/themes?fresh=${Date.now()}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { themes: (await response.json()).themes ?? [], error: null };
  } catch (error) {
    return { themes: [], error: error.message };
  }
}

/** `{themes: [{id, name, eventNames, source}], warnings}`, excluding `selfId`. */
async function loadEarlierThemes(selfId) {
  const calendar = await fromCalendar();
  const sources = [
    ['publish-inputs.md', fromPublishInputs()],
    ['merged deck', fromMergedDecks()],
    ['deck branch', fromDeckBranches()],
    ['calendar', calendar.themes],
  ];
  const byId = new Map();
  for (const [source, themes] of sources) {
    for (const theme of themes) {
      if (theme.id === selfId || byId.has(theme.id)) continue;
      byId.set(theme.id, { id: theme.id, name: theme.name, eventNames: theme.eventNames, source });
    }
  }
  const warnings = calendar.error ? [`live calendar unavailable (${calendar.error})`] : [];
  return { themes: [...byId.values()], warnings };
}

/** Shared-card counts against each earlier theme, largest first. */
function overlapReport(slugs, themes) {
  const mine = new Set(slugs);
  return themes
    .map((theme) => ({
      ...theme,
      shared: theme.eventNames.filter((slug) => mine.has(slug)),
    }))
    .filter((theme) => theme.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length);
}

module.exports = { loadEarlierThemes, overlapReport };
