#!/usr/bin/env node
/**
 * Where merged factory decks go on the calendar (factory.md, section 6). Read-only: it never
 * publishes. Scheduling stays a workflow dispatch, and publishing waits for Edward.
 *
 *   node scripts/factory/next-slot.js --report              # buffer, gaps, drift
 *   node scripts/factory/next-slot.js --pending             # merged decks not on the calendar
 *   node scripts/factory/next-slot.js --deck <id>           # write factory/dispatch/<id>.json
 *                                                           # and a lasting copy in factory-reports/
 *
 * A merged deck is one whose factory/decks/<id>/deck.json is on main (this checkout, which the
 * schedule stage keeps at origin/main). It is pending until its id is on /api/themes.
 *
 * Slots are Mondays and Fridays, the curated cadence (docs/curated-themes/index.md), and the
 * earliest open one wins, gaps included. A date is open when no theme holds it and it opens
 * (D-1 10:00Z, midnight in UTC+14) more than SAFETY_HOURS from now, so a validate today and a
 * publish tomorrow still land before it goes live anywhere.
 */

const fs = require('fs');
const path = require('path');

const { DECKS_DIR, IMAGES_DIR, REPO_ROOT } = require('./config');
const { parseArgs, readJson, run, writeJson } = require('./cli');

const CURATED_WEEKDAYS = [1, 5]; // Monday, Friday
const SAFETY_HOURS = 48;
const LOOKAHEAD_DAYS = 120;
const DAY = 24 * 3600 * 1000;

const iso = (t) => new Date(t).toISOString().slice(0, 10);
const weekday = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();
const opensAt = (date) => Date.parse(`${date}T00:00:00Z`) - 14 * 3600 * 1000;

async function calendar() {
  const base = process.env.THEMES_API_URL || 'https://www.play-when.com';
  const response = await fetch(`${base}/api/themes?fresh=${Date.now()}`);
  if (!response.ok) throw new Error(`could not read the calendar: HTTP ${response.status}`);
  return response.json();
}

function taken(themes) {
  const byDate = new Map();
  for (const t of themes) for (const d of t.dates || []) byDate.set(d, t.id);
  return byDate;
}

/** Mondays and Fridays from the first settable date, with whoever holds each. */
function slots(themes, now = Date.now()) {
  const byDate = taken(themes);
  const out = [];
  for (let t = now; t < now + LOOKAHEAD_DAYS * DAY; t += DAY) {
    const date = iso(t);
    if (!CURATED_WEEKDAYS.includes(weekday(date))) continue;
    if (opensAt(date) - now < SAFETY_HOURS * 3600 * 1000) continue;
    out.push({ date, holder: byDate.get(date) || null });
  }
  return out;
}

function report(themes, now = Date.now()) {
  const today = iso(now);
  const ahead = [...taken(themes).entries()].filter(([d]) => d >= today).sort();
  const last = ahead.length ? ahead[ahead.length - 1][0] : null;
  const drift = ahead.filter(([d]) => !CURATED_WEEKDAYS.includes(weekday(d)));
  const open = slots(themes, now).filter((s) => !s.holder && (!last || s.date <= last));
  const next = slots(themes, now).find((s) => !s.holder);
  // The buffer is how long until the first curated slot nobody holds, not until the last theme.
  const buffer = next
    ? Math.round((Date.parse(next.date) - Date.parse(today)) / DAY)
    : LOOKAHEAD_DAYS;
  return {
    today,
    scheduled_ahead: ahead.length,
    last_date: last,
    buffer_days: buffer,
    drift,
    gaps: open,
    next_open: next,
  };
}

function mergedDecks() {
  if (!fs.existsSync(DECKS_DIR)) return [];
  return fs
    .readdirSync(DECKS_DIR)
    .filter((id) => fs.existsSync(path.join(DECKS_DIR, id, 'deck.json')))
    .map((id) => readJson(path.join(DECKS_DIR, id, 'deck.json')));
}

async function main() {
  const args = parseArgs(process.argv.slice(2), ['report', 'pending', 'json']);
  const cal = await calendar();
  const themes = cal.themes || [];
  const onCalendar = new Set(themes.map((t) => t.id));

  if (args.report) {
    const r = report(themes);
    if (args.json) return console.log(JSON.stringify(r, null, 2));
    console.log(`Curated days ahead: ${r.scheduled_ahead}, the last on ${r.last_date}`);
    console.log(
      `Buffer: ${r.buffer_days} days, to the first open Mon/Fri (${r.next_open ? r.next_open.date : 'none in range'})`
    );
    console.log(
      `Open Mon/Fri before the last curated day: ${r.gaps.map((g) => g.date).join(', ') || 'none'}`
    );
    console.log(
      `Off-cadence days (drift): ${r.drift.map(([d, id]) => `${d} ${id}`).join(', ') || 'none'}`
    );
    return undefined;
  }

  const pending = mergedDecks().filter((d) => !onCalendar.has(d.id));
  if (args.pending) {
    console.log(JSON.stringify(pending.map((d) => d.id)));
    return undefined;
  }

  if (args.deck) {
    const deck = pending.find((d) => d.id === args.deck);
    if (!deck) {
      throw new Error(
        onCalendar.has(args.deck)
          ? `${args.deck} is already on the calendar`
          : `${args.deck} has no deck.json on main; it hasn't merged`
      );
    }
    // Dates handed out earlier in this run are taken too: validate doesn't write the calendar.
    const dispatchDir = path.join(REPO_ROOT, 'factory', 'dispatch');
    const given = fs.existsSync(dispatchDir)
      ? fs
          .readdirSync(dispatchDir)
          .filter((f) => f.endsWith('.json') && f !== `${deck.id}.json`)
          .map((f) => readJson(path.join(dispatchDir, f)))
      : [];
    const slot = slots([...themes, ...given]).find((s) => !s.holder);
    if (!slot) throw new Error(`no open Monday or Friday in the next ${LOOKAHEAD_DAYS} days`);
    const theme = { id: deck.id, name: deck.name, eventNames: deck.eventNames, dates: [slot.date] };
    const out = path.join(REPO_ROOT, 'factory', 'dispatch', `${deck.id}.json`);
    writeJson(out, theme);
    // The clone is cleaned at the start of every stage, so Edward's publish command points here.
    const keep = path.join(IMAGES_DIR, 'factory-reports', `dispatch-${deck.id}.json`);
    writeJson(keep, theme);
    console.log(
      JSON.stringify({
        deck: deck.id,
        date: slot.date,
        file: path.relative(REPO_ROOT, out),
        publish_file: keep,
      })
    );
    return undefined;
  }
  throw new Error('usage: next-slot.js --report | --pending | --deck <id>');
}

if (require.main === module) run(main);

module.exports = { report, slots, opensAt, weekday };
