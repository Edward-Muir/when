#!/usr/bin/env node
/**
 * For each beat of a deck's blind spine, the catalogue cards on or next to its year: the
 * reconciler's evidence for "is this beat already a card?" (factory.md, section 4, step 2).
 *
 *   node scripts/factory/spine-matches.js --deck <id>
 *
 * Reads factory/decks/<id>/spine.json and writes factory/decks/<id>/matches.json. Matching is by
 * **year first**, because a slug can be named for the cause while its title names the event:
 * `english-civil-war-aftermath` is the Restoration of Charles II, and a name search for
 * "restoration" never finds it. A candidate is any card whose year is within a year of the
 * beat's, or whose evidence window covers it, ranked by shared words. The reconciler, not this
 * script, decides whether a candidate names essentially the same event.
 *
 * It checks the spine first and refuses one the reconciler couldn't cut to 30: fewer than
 * MIN_BEATS beats, two beats in one year, a title over 35 characters, a date in a title or
 * description, or beats bunched into one stretch (scripts/themes/bunching.js). Bunching has to be
 * caught here: the reconciler may only use the spine's own spares, so a bunched spine can only
 * ever give a bunched deck.
 */

const fs = require('fs');
const path = require('path');

const { DECKS_DIR } = require('./config');
const { loadEligibleEvents } = require('../themes/catalogue');
const { eventDateClues } = require('../events/date-clues');
const { bunchingReport } = require('../themes/bunching');
const { parseArgs, readJson, run, writeJson } = require('./cli');

/** About 40 are asked for; 34 still leaves the reconciler a few spares above 30. */
const MIN_BEATS = 34;

function spineProblems(spine) {
  const beats = Array.isArray(spine.beats) ? spine.beats : [];
  const p = [];
  if (beats.length < MIN_BEATS)
    p.push(`${beats.length} beats; want about 40, at least ${MIN_BEATS}`);
  const years = new Map();
  beats.forEach((beat, i) => {
    const label = `beat ${i} (${beat.title || 'untitled'})`;
    if (!Number.isInteger(beat.year)) p.push(`${label}: year must be an integer`);
    else if (years.has(beat.year)) p.push(`${label}: same year as beat ${years.get(beat.year)}`);
    else years.set(beat.year, i);
    if (!beat.title || beat.title.length > 35) p.push(`${label}: title must be 1-35 characters`);
    if (!beat.description) p.push(`${label}: no description`);
    const clues = eventDateClues({
      friendly_name: beat.title || '',
      description: beat.description || '',
    });
    if (clues.length) p.push(`${label}: states a date (${clues.map((c) => c.match).join(', ')})`);
  });
  const bunch = bunchingReport(beats.map((b) => b.year).filter(Number.isInteger));
  if (!bunch.ok) {
    p.push(
      `${bunch.densest.count} beats fall in ${bunch.densest.from}-${bunch.densest.to}; ` +
        `no 10-year window may hold more than ${bunch.limit} across a ${bunch.span}-year span. ` +
        'Spread the beats wider, and reach further back if the subject has earlier history'
    );
  }
  return p;
}

const STOP = new Set(
  'the of and for with from into that this their first new its was were by on at in to a an is as'.split(
    ' '
  )
);
const words = (text) =>
  new Set(
    String(text)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );

function candidatesFor(beat, events) {
  const beatWords = words(`${beat.title} ${beat.description || ''}`);
  return events
    .filter((e) => {
      const end = e.year_end ?? e.year;
      return Math.abs(e.year - beat.year) <= 1 || (e.year <= beat.year && beat.year <= end);
    })
    .map((e) => {
      const theirs = words(`${e.friendly_name} ${e.description} ${e.name.replace(/-/g, ' ')}`);
      const shared = [...beatWords].filter((w) => theirs.has(w));
      return { event: e, score: shared.length, shared };
    })
    .sort(
      (a, b) =>
        b.score - a.score || Math.abs(a.event.year - beat.year) - Math.abs(b.event.year - beat.year)
    )
    .filter((c, i) => c.score > 0 || i < 6)
    .slice(0, 12)
    .map(({ event, score, shared }) => ({
      name: event.name,
      friendly_name: event.friendly_name,
      year: event.year,
      year_end: event.year_end,
      description: event.description,
      score,
      shared,
    }));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.deck) throw new Error('--deck <id> is required');
  const dir = path.join(DECKS_DIR, args.deck);
  const spine = readJson(path.join(dir, 'spine.json'));
  const problems = spineProblems(spine);
  if (problems.length) {
    throw new Error(`the spine needs fixing:\n  ${problems.join('\n  ')}`);
  }
  const events = loadEligibleEvents({ includePending: true });
  const out = spine.beats.map((beat, index) => ({
    beat: index,
    year: beat.year,
    title: beat.title,
    candidates: candidatesFor(beat, events),
  }));
  writeJson(path.join(dir, 'matches.json'), out);
  for (const m of out) {
    const top = m.candidates.filter((c) => c.score > 0).slice(0, 3);
    console.log(
      `${String(m.beat).padStart(2)} ${String(m.year).padStart(6)}  ${m.title}` +
        (top.length
          ? `\n      ? ${top.map((c) => `${c.name} (${c.year}, ${c.score})`).join('; ')}`
          : '')
    );
  }
  console.log(`\nWrote ${path.relative(process.cwd(), path.join(dir, 'matches.json'))}`);
}

if (require.main === module) run(main);

module.exports = { candidatesFor, spineProblems, words };
