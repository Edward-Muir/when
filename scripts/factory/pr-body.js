#!/usr/bin/env node
/**
 * Writes the body of a deck's pull request (factory.md, C3) to stdout, from the files the
 * earlier stages left in factory/decks/<id>/.
 *
 *   node scripts/factory/pr-body.js --deck <id> > factory/decks/<id>/pr-body.md
 *
 * Sections: the theme; the deck (year, card, NEW or reused, band, QC, a thumbnail); the gates
 * and overlap; the fact-check flags; the QC history of every new card; the needs-human list;
 * and the theme JSON ready to dispatch, without dates (task D picks them).
 *
 * Thumbnails use the game's own `thumbnail` rung (src/utils/cloudinaryImage.ts), so the PR
 * mints no new transformation (docs/cloudinary-cost-controls.md): it warms an asset the game
 * would create anyway.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { DECKS_DIR, REPO_ROOT } = require('./config');
const { buildIndex, formatYear, loadEligibleEvents } = require('../themes/catalogue');
const { parseArgs, readJson, run } = require('./cli');

/** Must match VARIANT_TRANSFORM.thumbnail in src/utils/cloudinaryImage.ts. */
const THUMBNAIL = 'c_fill,f_auto,g_auto,h_400,q_auto:good,w_400';

const maybe = (file) => (fs.existsSync(file) ? readJson(file) : null);
const cell = (text) =>
  String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ');

function thumbnail(url) {
  if (!url || !url.includes('/image/upload/')) return '';
  const [left, rest] = url.split('/image/upload/');
  const parts = rest.split('?')[0].split('/');
  const publicId = parts[parts.length - 1];
  return `<img src="${left}/image/upload/${THUMBNAIL}/${publicId}" width="72">`;
}

function gateReport(deck) {
  try {
    return execFileSync(
      process.execPath,
      [
        path.join(REPO_ROOT, 'scripts', 'theme-gap.js'),
        '--slugs',
        deck.eventNames.join(','),
        '--include-pending',
        '--overlap',
        deck.id,
      ],
      { encoding: 'utf8' }
    );
  } catch (error) {
    return error.stdout || String(error);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.deck) throw new Error('--deck <id> is required');
  const dir = path.join(DECKS_DIR, args.deck);
  const theme = readJson(path.join(dir, 'theme.json'));
  const deck = readJson(path.join(dir, 'deck.json'));
  const status = readJson(path.join(dir, 'status.json'));
  const facts = maybe(path.join(dir, 'fact-check.json'));
  const qc = maybe(path.join(dir, 'qc', 'summary.json')) || {};

  const events = loadEligibleEvents({ includePending: true });
  const index = buildIndex(events);
  const byName = new Map(events.map((e) => [e.name, e]));
  const isNew = (slug) => slug in status.slugs;

  const lines = [];
  const counts = { new: deck.eventNames.filter(isNew).length };
  counts.reused = deck.eventNames.length - counts.new;
  const human = Object.entries(status.slugs).filter(([, s]) => s.state === 'needs-human');

  lines.push(
    `A curated deck from the factory: **${theme.name}**, ${deck.eventNames.length} cards ` +
      `(${counts.new} new, ${counts.reused} reused). Built by the deck-factory stages ` +
      '(`docs/curated-themes/factory.md`); nothing here was scheduled.',
    '',
    `- **Scope:** ${theme.scope}`,
    theme.boundary ? `- **Boundary:** ${theme.boundary}` : null,
    theme.notes ? `- **Edward's notes:** ${theme.notes}` : null,
    `- **Theme note:** \`docs/curated-themes/${deck.id}.md\``,
    human.length
      ? `- **Needs you:** ${human.length} card(s) have no usable art yet (below). The deck can't be scheduled until they do.`
      : '- **Needs you:** a review, then a merge. Every new card has art that passed QC.',
    ''
  );

  lines.push(
    '## The deck',
    '',
    '| Year | Card | | Band | QC | Art |',
    '| ---: | --- | --- | :-: | --- | --- |'
  );
  for (const slug of [...deck.eventNames].sort(
    (a, b) => (byName.get(a)?.year ?? 0) - (byName.get(b)?.year ?? 0)
  )) {
    const e = byName.get(slug);
    if (!e) {
      lines.push(`| ? | \`${slug}\` (not in the catalogue) | | | | |`);
      continue;
    }
    const band = index.bandOf(e);
    const q = isNew(slug) ? status.slugs[slug].state : 'live';
    lines.push(
      `| ${formatYear(e.year)} | ${cell(e.friendly_name)}<br>\`${slug}\` | ${isNew(slug) ? 'NEW' : 'reused'} | ${band}${band === 0 ? ' foothold' : ''} | ${q} | ${thumbnail(e.image_url)} |`
    );
  }
  lines.push('');

  lines.push('## Gates', '', '```', gateReport(deck).trim(), '```', '');

  if (facts) {
    const flagged = facts.checked.filter((c) => c.verdict !== 'ok');
    lines.push('## Fact check', '');
    if (!flagged.length) lines.push(`All ${facts.checked.length} new cards checked out.`);
    else {
      lines.push('| Card | Verdict | Field | Found | Source |', '| --- | --- | --- | --- | --- |');
      for (const c of flagged) {
        lines.push(
          `| \`${c.slug}\` | ${c.verdict === 'fix' ? 'fixed' : '**unsupported**'} | ${cell(c.field)} | ${cell(c.found)}${c.suggestion ? ` → ${cell(c.suggestion)}` : ''} | ${c.source ? `[link](${c.source})` : ''} |`
        );
      }
    }
    lines.push('');
  }

  lines.push(
    '## Art QC',
    '',
    'One Haiku reviewer per image described it cold, then judged it against the card; every fail or unsure had a strict Sonnet second opinion.',
    '',
    '| Card | Result | Attempts | Reason | What the reviewer saw |',
    '| --- | --- | :-: | --- | --- |'
  );
  for (const [slug, s] of Object.entries(status.slugs)) {
    const row = qc[slug] || {};
    const history = fs.existsSync(path.join(dir, 'qc', 'history'))
      ? fs
          .readdirSync(path.join(dir, 'qc', 'history'))
          .filter((f) => f.startsWith(`${slug}.a`) && /\.(review|recheck)\.json$/.test(f))
          .map((f) => readJson(path.join(dir, 'qc', 'history', f)).reason)
          .filter(Boolean)
      : [];
    const reasons = [...history.map((r) => `earlier: ${r}`), s.reason].filter(Boolean).join('; ');
    lines.push(
      `| \`${slug}\` | ${s.state} | ${s.attempts} | ${cell(reasons)} | ${cell(row.description)} |`
    );
  }
  lines.push('');

  if (human.length) {
    lines.push('## Needs a human', '');
    for (const [slug, s] of human) lines.push(`- \`${slug}\`: ${s.reason}`);
    lines.push('');
  }

  lines.push(
    '## Theme JSON',
    '',
    'For `publish-theme.yml` once this merges. Task D adds `dates` and runs `validate`; publishing stays a hand dispatch.',
    '',
    '```json',
    JSON.stringify({ id: deck.id, name: deck.name, eventNames: deck.eventNames }),
    '```',
    '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)'
  );

  console.log(lines.filter((l) => l !== null).join('\n'));
}

if (require.main === module) run(main);
