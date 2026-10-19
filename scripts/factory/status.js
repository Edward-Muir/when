#!/usr/bin/env node
/**
 * The only code that reads and writes factory/decks/<id>/status.json (factory.md, section 2).
 * The rules live in status-lib.js; this is the command line around them.
 *
 *   node scripts/factory/status.js init --deck <id> --name "<Name>" --slugs a,b,c
 *   node scripts/factory/status.js next-batch --deck <id> [--max 10]
 *   node scripts/factory/status.js mark --deck <id> <slug> downloaded --sha256 <hex>
 *   node scripts/factory/status.js mark --deck <id> <slug> qc-fail --reason "<why>"
 *   node scripts/factory/status.js mark --deck <id> <slug> qc-pass | needs-human --reason "<why>"
 *   node scripts/factory/status.js reset --deck <id> <slug>        # a human's retry
 *   node scripts/factory/status.js stage --deck <id> uploaded | pr-open | merged | scheduled
 *   node scripts/factory/status.js summary --deck <id> [--json]
 *   node scripts/factory/status.js lock --stage <name>              # prints the token
 *   node scripts/factory/status.js refresh --token <t>
 *   node scripts/factory/status.js unlock --token <t> --outcome ok|blocked|failed|quota [--force]
 *   node scripts/factory/status.js lock-status
 *
 * next-batch prints a JSON array. Each item carries the slug, its attempt number, the research
 * and image prompts from the deck's prompts.csv, and for a retry the image prompt already
 * carries the last QC reason. An empty array means the art session has nothing to do.
 */

const fs = require('fs');
const path = require('path');

const { DECKS_DIR } = require('./config');
const lib = require('./status-lib');
const lock = require('./lock');
const { parseArgs, parseCsv, readJson, run, writeJson } = require('./cli');

const statusFile = (deck) => path.join(DECKS_DIR, deck, 'status.json');

function load(deck) {
  if (!deck) throw new Error('--deck <id> is required');
  const file = statusFile(deck);
  if (!fs.existsSync(file)) throw new Error(`no status for deck ${deck} at ${file}`);
  return lib.validate(readJson(file));
}

function promptsFor(deck, file) {
  const csv = file || path.join(DECKS_DIR, deck, 'prompts.csv');
  if (!fs.existsSync(csv)) throw new Error(`no prompts at ${csv}; run theme-art-prompts.py first`);
  return new Map(parseCsv(fs.readFileSync(csv, 'utf8')).map((row) => [row.event_name, row]));
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest, ['json', 'force']);
  const deck = args.deck;

  switch (command) {
    case 'init': {
      if (fs.existsSync(statusFile(deck || ''))) {
        throw new Error(`deck ${deck} already has a status; it is never re-initialised`);
      }
      const slugs = (args.slugs || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const status = lib.create({ deck, name: args.name, slugs });
      writeJson(statusFile(deck), status);
      console.log(lib.summary(status));
      return;
    }
    case 'next-batch': {
      const status = load(deck);
      const batch = lib.nextBatch(status, args.max ? Number(args.max) : undefined);
      const prompts = batch.length ? promptsFor(deck, args.prompts) : new Map();
      const out = batch.map((item) => {
        const row = prompts.get(item.slug);
        if (!row) throw new Error(`${item.slug} has no row in prompts.csv`);
        return {
          ...item,
          research_prompt: row.research_prompt,
          image_prompt: lib.retryPrompt(row.image_prompt, item.retry_reason),
        };
      });
      console.log(JSON.stringify(out, null, 2));
      return;
    }
    case 'mark': {
      const [slug, state] = args._;
      const status = load(deck);
      const { state: recorded } = lib.mark(status, slug, state, args);
      writeJson(statusFile(deck), status);
      const note = recorded === state ? '' : ` (retry cap reached, so ${recorded})`;
      console.log(`${slug}: ${recorded}${note}; deck ${status.stage}`);
      return;
    }
    case 'reset': {
      const status = load(deck);
      lib.reset(status, args._[0]);
      writeJson(statusFile(deck), status);
      console.log(`${args._[0]}: pending; deck ${status.stage}`);
      return;
    }
    case 'stage': {
      const status = load(deck);
      lib.stage(status, args._[0]);
      writeJson(statusFile(deck), status);
      console.log(`deck ${deck}: ${status.stage}`);
      return;
    }
    case 'summary': {
      const status = load(deck);
      if (args.json) {
        console.log(JSON.stringify({ ...status, counts: lib.counts(status) }, null, 2));
      } else console.log(lib.summary(status));
      return;
    }
    case 'lock': {
      const result = lock.acquire({ stage: args.stage });
      if (!result.ok) {
        console.log(
          `HELD by ${result.holder.stage} (pid ${result.holder.pid}) since ${result.holder.at}`
        );
        process.exit(3);
      }
      if (result.replaced) console.log(`(replaced a stale lock: ${result.replaced})`);
      console.log(`LOCKED ${result.lock.token}`);
      return;
    }
    case 'refresh': {
      const result = lock.refresh({ token: args.token });
      if (!result.ok) throw new Error('the lock is not held with that token');
      console.log(`refreshed at ${result.lock.at}`);
      return;
    }
    case 'unlock': {
      // The stage comes from the lock itself, so a run only has to say how it ended.
      if (args.outcome && !lock.OUTCOMES.includes(args.outcome)) {
        throw new Error(`--outcome must be one of ${lock.OUTCOMES.join(', ')}`);
      }
      const held = lock.read();
      const result = lock.release({ token: args.token, force: args.force });
      if (!result.ok) throw new Error(result.note);
      if (args.outcome && held && held.stage) {
        lock.recordRun({ stage: held.stage, outcome: args.outcome });
        console.log(`unlocked; ${held.stage} recorded as ${args.outcome}`);
      } else console.log(result.note || 'unlocked');
      return;
    }
    case 'lock-status': {
      const held = lock.read();
      const stale = lock.staleReason(held);
      console.log(held ? `${JSON.stringify(held)}${stale ? ` (stale: ${stale})` : ''}` : 'free');
      return;
    }
    default:
      throw new Error(
        'usage: status.js init|next-batch|mark|reset|stage|summary|lock|refresh|unlock|lock-status'
      );
  }
}

run(main);
