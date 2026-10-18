/**
 * The factory's one global lock (docs/curated-themes/factory.md, The clone).
 *
 * All six stages share one working tree, so any two runs overlapping would check out different
 * branches under each other. The lock is a JSON file, `{pid, stage, token, at}`, created with
 * O_EXCL so two runs racing for a stale lock cannot both win.
 *
 * A lock is stale once it is older than LOCK_STALE_MS (2 hours) or its PID has died. The PID is
 * the Claude process the stage runs under, found by walking up from this script, since the node
 * process itself exits as soon as the command returns. Desktop may run several sessions under
 * one long-lived process, so the age is the backstop and the token is what proves ownership.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { LOCK_FILE, LOCK_STALE_MS } = require('./config');

function isAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/** The nearest ancestor whose command looks like Claude, else the parent shell. */
function ownerPid() {
  let pid = process.ppid;
  for (let depth = 0; depth < 12 && pid > 1; depth++) {
    let line;
    try {
      line = execFileSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], { encoding: 'utf8' });
    } catch {
      break;
    }
    const match = line.trim().match(/^(\d+)\s+(.*)$/);
    if (!match) break;
    if (/claude/i.test(match[2])) return pid;
    pid = Number(match[1]);
  }
  return process.ppid;
}

function read(file = LOCK_FILE) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    // An unreadable lock (a crash mid-write) is treated as stale rather than held for ever.
    return { corrupt: true, at: new Date(0).toISOString() };
  }
}

function staleReason(lock, now = Date.now(), alive = isAlive) {
  if (!lock) return 'absent';
  if (lock.corrupt) return 'unreadable';
  const age = now - Date.parse(lock.at);
  if (!(age < LOCK_STALE_MS)) return `older than ${LOCK_STALE_MS / 3600000}h`;
  if (!alive(lock.pid)) return `pid ${lock.pid} is not running`;
  return null;
}

/**
 * Take the lock. Returns `{ok: true, lock}` or `{ok: false, holder}`.
 * Options exist for the tests: a fixed pid, clock and liveness check.
 */
function acquire({ stage, file = LOCK_FILE, pid = ownerPid(), now = Date.now(), alive } = {}) {
  const existing = read(file);
  if (existing && !staleReason(existing, now, alive)) return { ok: false, holder: existing };
  if (existing) fs.rmSync(file, { force: true });

  const lock = {
    pid,
    stage: stage || 'unknown',
    token: crypto.randomBytes(6).toString('hex'),
    at: new Date(now).toISOString(),
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try {
    fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n', { flag: 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') return { ok: false, holder: read(file) };
    throw error;
  }
  return { ok: true, lock, replaced: existing ? staleReason(existing, now, alive) : null };
}

/** Release the lock. Needs the token it was taken with, unless forced by a human. */
function release({ token, force = false, file = LOCK_FILE } = {}) {
  const existing = read(file);
  if (!existing) return { ok: true, note: 'no lock was held' };
  if (!force && existing.token !== token) {
    return { ok: false, holder: existing, note: 'token does not match the lock' };
  }
  fs.rmSync(file, { force: true });
  return { ok: true };
}

/** Restart the clock on a held lock, for a long stage such as authoring. */
function refresh({ token, file = LOCK_FILE, now = Date.now() } = {}) {
  const existing = read(file);
  if (!existing || existing.token !== token) return { ok: false, holder: existing };
  const lock = { ...existing, at: new Date(now).toISOString() };
  fs.writeFileSync(file, JSON.stringify(lock, null, 2) + '\n');
  return { ok: true, lock };
}

module.exports = { acquire, release, refresh, read, staleReason, isAlive, ownerPid };
