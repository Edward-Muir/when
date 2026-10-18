#!/usr/bin/env node
/**
 * A three-way merge driver for JSON, used only inside the factory clone.
 *
 * Every deck appends its new events to the same shards (`public/events/themes.json`, its detail
 * sidecar) and its decisions to the same ledgers (`scripts/events/year-range-decided.json`). Two
 * decks in flight therefore both change the tail of the same files, and a line merge calls that
 * a conflict although nothing collides. This merges by structure instead:
 *
 * - objects merge key by key; a sorted object stays sorted (the ledgers are alphabetical);
 * - arrays of records with a unique `name` (event shards) merge record by record, ours in order,
 *   then records only they added;
 * - arrays of strings (the manifest) merge as sets, keeping our order;
 * - anything else changed differently on both sides is a real conflict, and the driver exits 1
 *   leaving our version in place, which git then reports as conflicted.
 *
 * Git calls it as `json-merge.js %O %A %B %P` (base, ours, theirs, path) and reads the result
 * from %A. start.js registers it in the clone's own .git/config and .git/info/attributes, so it
 * never applies in Edward's checkout. GitHub's merge button does not run custom drivers, so the
 * factory merges origin/main into a deck branch at the start of every stage.
 */

const fs = require('fs');
const path = require('path');
const { isDeepStrictEqual: same } = require('util');

const ABSENT = Symbol('absent');

class Conflict extends Error {}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isNamedRecords(arr) {
  if (!Array.isArray(arr) || !arr.every((r) => isObject(r) && typeof r.name === 'string')) {
    return false;
  }
  return new Set(arr.map((r) => r.name)).size === arr.length;
}

function isSorted(keys) {
  return keys.every((k, i) => i === 0 || keys[i - 1] <= k);
}

function merge3(base, ours, theirs, at = '$') {
  if (same(ours, theirs)) return ours;
  if (same(base, ours)) return theirs;
  if (same(base, theirs)) return ours;

  if (isObject(ours) && isObject(theirs)) {
    const b = isObject(base) ? base : {};
    return mergeKeyed(
      b,
      ours,
      theirs,
      Object.keys,
      (o, k) => (k in o ? o[k] : ABSENT),
      at,
      (entries, sorted) =>
        Object.fromEntries(
          sorted ? entries.sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)) : entries
        )
    );
  }

  if (isNamedRecords(ours) && isNamedRecords(theirs) && (base === ABSENT || isNamedRecords(base))) {
    const index = (arr) => new Map(arr.map((r) => [r.name, r]));
    const b = index(base === ABSENT ? [] : base);
    const o = index(ours);
    const t = index(theirs);
    return mergeKeyed(
      b,
      o,
      t,
      (m) => [...m.keys()],
      (m, k) => (m.has(k) ? m.get(k) : ABSENT),
      at,
      (entries) => entries.map(([, v]) => v),
      false
    );
  }

  const strings = (a) => Array.isArray(a) && a.every((x) => typeof x === 'string');
  if (strings(ours) && strings(theirs) && (base === ABSENT || strings(base))) {
    const b = new Set(base === ABSENT ? [] : base);
    const theirsSet = new Set(theirs);
    const added = theirs.filter((x) => !b.has(x) && !ours.includes(x));
    const removed = new Set([...b].filter((x) => !theirsSet.has(x)));
    return [...ours.filter((x) => !removed.has(x)), ...added];
  }

  throw new Conflict(`${at}: changed differently on both sides`);
}

/**
 * The shared shape of an object merge and a named-record merge. Result order is ours, then keys
 * only they added. `keepSorted` re-sorts when all three sides were sorted to begin with.
 */
function mergeKeyed(base, ours, theirs, keysOf, get, at, build, keepSorted = true) {
  const ourKeys = keysOf(ours);
  const theirKeys = keysOf(theirs);
  const order = [...ourKeys, ...theirKeys.filter((k) => get(ours, k) === ABSENT)];
  const sorted = keepSorted && isSorted(keysOf(base)) && isSorted(ourKeys) && isSorted(theirKeys);
  const entries = [];
  for (const key of order) {
    const b = get(base, key);
    const o = get(ours, key);
    const t = get(theirs, key);
    let value;
    if (o === ABSENT || t === ABSENT) {
      // One side deleted (or never had) it. A delete wins only over an untouched value.
      const present = o === ABSENT ? t : o;
      if (b === ABSENT) value = present;
      else if (same(b, present)) value = ABSENT;
      else throw new Conflict(`${at}.${key}: deleted on one side, changed on the other`);
    } else value = merge3(b, o, t, `${at}.${key}`);
    if (value !== ABSENT) entries.push([key, value]);
  }
  return build(entries, sorted);
}

function parse(file) {
  const text = fs.readFileSync(file, 'utf8');
  return { text, value: text.trim() ? JSON.parse(text) : ABSENT };
}

async function format(value, ourText, pathname) {
  const plain = JSON.stringify(value, null, 2) + (ourText.endsWith('\n') ? '\n' : '');
  // Keep prettier-managed files as the commit hook would leave them; event files are ignored by
  // .prettierignore and keep JSON.stringify's layout.
  try {
    const prettier = require('prettier');
    // Git runs a merge driver from the top of the working tree.
    const ignorePath = path.join(process.cwd(), '.prettierignore');
    const info = await prettier.getFileInfo(pathname, { ignorePath });
    if (info.ignored) return plain;
    const options = (await prettier.resolveConfig(pathname)) || {};
    return prettier.format(plain, { ...options, parser: 'json' });
  } catch {
    return plain;
  }
}

async function main() {
  const [basePath, oursPath, theirsPath, pathname = oursPath] = process.argv.slice(2);
  let base;
  let ours;
  let theirs;
  try {
    base = parse(basePath);
    ours = parse(oursPath);
    theirs = parse(theirsPath);
  } catch (error) {
    console.error(`json-merge: ${pathname} is not valid JSON on every side (${error.message})`);
    process.exit(1);
  }
  try {
    const merged = merge3(base.value, ours.value, theirs.value);
    fs.writeFileSync(oursPath, await format(merged, ours.text, pathname));
  } catch (error) {
    if (!(error instanceof Conflict)) throw error;
    console.error(`json-merge: ${pathname}: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { ABSENT, Conflict, merge3 };
