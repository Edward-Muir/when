/**
 * Tests for the deck factory's state engine (docs/curated-themes/factory.md, section 10).
 *
 *   node --test scripts/factory/
 *
 * Plain node:test, not Jest: the scripts are CommonJS run by a bare `node`, outside src/.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { describe, it } = require('node:test');

const lib = require('./status-lib');
const lock = require('./lock');
const { merge3, Conflict } = require('./json-merge');
const backlog = require('./backlog');
const { guardProblem, pickDeck } = require('./start');
const { parseCsv } = require('./cli');
const { LOCK_STALE_MS, MAX_RETRIES } = require('./config');

const SHA = 'a'.repeat(64);
const slugsOf = (n) =>
  Array.from({ length: n }, (_, i) => `card-${String(i + 1).padStart(2, '0')}`);
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'factory-test-'));

describe('slug transitions', () => {
  it('walks the happy path and derives the deck stage', () => {
    const s = lib.create({ deck: 'demo', slugs: ['a', 'b'] });
    assert.equal(s.stage, 'authored');
    lib.mark(s, 'a', 'downloaded', { sha256: SHA });
    assert.equal(s.stage, 'art-in-progress');
    lib.mark(s, 'a', 'qc-pass');
    lib.mark(s, 'b', 'needs-human', { reason: 'Gemini refused a public figure' });
    assert.equal(s.stage, 'ready-to-ship');
    assert.deepEqual(
      s.stage_history.map((h) => h.stage),
      ['authored', 'art-in-progress', 'ready-to-ship']
    );
  });

  it('rejects illegal moves and missing evidence', () => {
    const s = lib.create({ deck: 'demo', slugs: ['a'] });
    assert.throws(() => lib.mark(s, 'a', 'qc-pass'), /pending -> qc-pass/);
    assert.throws(() => lib.mark(s, 'a', 'downloaded'), /sha256/);
    assert.throws(() => lib.mark(s, 'nope', 'downloaded', { sha256: SHA }), /not in deck/);
    lib.mark(s, 'a', 'downloaded', { sha256: SHA });
    assert.throws(() => lib.mark(s, 'a', 'qc-fail'), /needs --reason/);
    assert.throws(
      () => lib.mark(s, 'a', 'downloaded', { sha256: SHA }),
      /downloaded -> downloaded/
    );
    lib.mark(s, 'a', 'qc-pass');
    assert.throws(() => lib.mark(s, 'a', 'qc-fail', { reason: 'x' }), /qc-pass -> qc-fail/);
  });

  it('sets the later stages only in order, and never the derived ones', () => {
    const s = lib.create({ deck: 'demo', slugs: [] });
    assert.equal(s.stage, 'ready-to-ship', 'a deck that reuses every card needs no art');
    assert.throws(() => lib.stage(s, 'pr-open'), /needs uploaded/);
    assert.throws(() => lib.stage(s, 'art-in-progress'), /derived/);
    lib.stage(s, 'uploaded');
    lib.stage(s, 'pr-open');
    assert.throws(() => lib.reset(s, 'x'), /not in deck|is at/);
    lib.stage(s, 'merged');
    lib.stage(s, 'scheduled');
    assert.equal(s.stage, 'scheduled');
  });

  it('freezes the slugs once the deck is uploaded', () => {
    const s = lib.create({ deck: 'demo', slugs: ['a'] });
    lib.mark(s, 'a', 'needs-human', { reason: 'refused' });
    lib.stage(s, 'uploaded');
    assert.throws(() => lib.reset(s, 'a'), /is at uploaded/);
  });

  it('rejects a hand-edited file that no longer makes sense', () => {
    const s = lib.create({ deck: 'demo', slugs: ['a'] });
    s.slugs.a.state = 'qc-pass';
    assert.throws(() => lib.validate(s), /without a sha256/);
  });
});

describe('retry cap', () => {
  it(`allows ${MAX_RETRIES} regenerations, then needs a human`, () => {
    const s = lib.create({ deck: 'demo', slugs: ['a'] });
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      lib.mark(s, 'a', 'downloaded', { sha256: SHA });
      assert.equal(lib.mark(s, 'a', 'qc-fail', { reason: `wrong ${attempt}` }).state, 'qc-fail');
      assert.equal(lib.nextBatch(s)[0].retry_reason, `wrong ${attempt}`);
    }
    lib.mark(s, 'a', 'downloaded', { sha256: SHA });
    assert.equal(lib.mark(s, 'a', 'qc-fail', { reason: 'still wrong' }).state, 'needs-human');
    assert.equal(s.slugs.a.attempts, MAX_RETRIES + 1);
    assert.match(s.slugs.a.reason, /failed QC 3 times; last: still wrong/);
    assert.equal(s.stage, 'ready-to-ship');
    assert.deepEqual(lib.nextBatch(s), []);
  });

  it('a human reset gives a fresh budget', () => {
    const s = lib.create({ deck: 'demo', slugs: ['a'] });
    lib.mark(s, 'a', 'needs-human', { reason: 'refused' });
    lib.reset(s, 'a');
    assert.equal(s.stage, 'authored');
    assert.equal(lib.nextBatch(s)[0].attempt, 1);
  });

  it('puts the QC reason into the retry prompt', () => {
    assert.equal(lib.retryPrompt('Paint it.', null), 'Paint it.');
    assert.match(
      lib.retryPrompt('Paint it.', 'it showed a handgun'),
      /^Paint it\. The previous image for this card was rejected: it showed a handgun\. /
    );
  });
});

describe('batching, end to end through status.js', () => {
  const run = (dir, ...args) =>
    execFileSync(process.execPath, [path.join(__dirname, 'status.js'), ...args], {
      encoding: 'utf8',
      env: { ...process.env, FACTORY_DECKS_DIR: dir },
    });

  it('a 23-slug deck batches 10, 10, 3, then nothing', () => {
    const dir = tmp();
    const slugs = slugsOf(23);
    run(dir, 'init', '--deck', 'demo', '--name', 'Demo', '--slugs', slugs.join(','));
    const csv = ['event_name,research_prompt,image_prompt,image_generated,saved_filename']
      .concat(slugs.map((s) => `${s},"Research ${s}, carefully","Paint ""${s}"".",,`))
      .join('\n');
    fs.writeFileSync(path.join(dir, 'demo', 'prompts.csv'), csv + '\n');

    const sizes = [];
    for (let session = 0; session < 4; session++) {
      const batch = JSON.parse(run(dir, 'next-batch', '--deck', 'demo', '--max', '10'));
      sizes.push(batch.length);
      for (const item of batch) {
        assert.equal(item.research_prompt, `Research ${item.slug}, carefully`);
        assert.equal(item.image_prompt, `Paint "${item.slug}".`);
        run(dir, 'mark', '--deck', 'demo', item.slug, 'downloaded', '--sha256', SHA);
      }
    }
    assert.deepEqual(sizes, [10, 10, 3, 0]);
    assert.match(run(dir, 'summary', '--deck', 'demo'), /art-in-progress[\s\S]*23 downloaded/);
  });

  it('refuses a batch above the cap, and a second init', () => {
    const dir = tmp();
    run(dir, 'init', '--deck', 'demo', '--slugs', 'a,b');
    assert.throws(() => run(dir, 'next-batch', '--deck', 'demo', '--max', '11'), /capped at 10/);
    assert.throws(() => run(dir, 'init', '--deck', 'demo', '--slugs', 'a'), /never re-initialised/);
  });

  it('a session killed mid-batch redoes only the slug in flight', () => {
    const s = lib.create({ deck: 'demo', slugs: slugsOf(5) });
    const first = lib.nextBatch(s, 10).map((b) => b.slug);
    // The session marked two slugs, then died while the third was downloading.
    lib.mark(s, first[0], 'downloaded', { sha256: SHA });
    lib.mark(s, first[1], 'downloaded', { sha256: SHA });
    assert.deepEqual(
      lib.nextBatch(s, 10).map((b) => b.slug),
      first.slice(2)
    );
  });
});

describe('the lock', () => {
  const alive = () => true;

  it('holds against a second run, and only its token releases it', () => {
    const file = path.join(tmp(), 'factory.lock');
    const first = lock.acquire({ stage: 'art-batch', file, pid: 4242, alive });
    assert.ok(first.ok);
    const second = lock.acquire({ stage: 'art-batch', file, pid: 4343, alive });
    assert.equal(second.ok, false);
    assert.equal(second.holder.pid, 4242);
    assert.equal(lock.release({ token: 'wrong', file }).ok, false);
    assert.ok(lock.release({ token: first.lock.token, file }).ok);
    assert.ok(lock.acquire({ stage: 'qc', file, pid: 4343, alive }).ok);
  });

  it('is stale after two hours, whatever the pid says', () => {
    const file = path.join(tmp(), 'factory.lock');
    const then = Date.now() - LOCK_STALE_MS - 1000;
    assert.ok(lock.acquire({ stage: 'author', file, pid: 4242, now: then, alive }).ok);
    const next = lock.acquire({ stage: 'qc', file, pid: 4343, alive });
    assert.ok(next.ok);
    assert.match(next.replaced, /older than 2h/);
  });

  it('is stale once its process has died', () => {
    const file = path.join(tmp(), 'factory.lock');
    assert.ok(lock.acquire({ stage: 'author', file, pid: 4242, alive }).ok);
    const next = lock.acquire({ stage: 'qc', file, pid: 4343, alive: () => false });
    assert.ok(next.ok);
    assert.match(next.replaced, /pid 4242 is not running/);
  });

  it('a refresh restarts the clock', () => {
    const file = path.join(tmp(), 'factory.lock');
    const then = Date.now() - LOCK_STALE_MS + 60000;
    const held = lock.acquire({ stage: 'author', file, pid: 4242, now: then, alive });
    assert.ok(lock.refresh({ token: held.lock.token, file }).ok);
    assert.equal(
      lock.acquire({ stage: 'qc', file, pid: 4343, now: Date.now() + 120000, alive }).ok,
      false
    );
  });

  it('treats a half-written lock as stale', () => {
    const file = path.join(tmp(), 'factory.lock');
    fs.writeFileSync(file, '{"pid": 12');
    assert.ok(lock.acquire({ stage: 'qc', file, pid: 1, alive }).ok);
  });
});

describe('json-merge', () => {
  const event = (name, extra = {}) => ({ name, year: 1900, ...extra });

  it('keeps both decks’ new events in one shard', () => {
    const base = [event('a'), event('b')];
    const ours = [...base, event('ours-1')];
    const theirs = [event('a', { year: 1901 }), event('b'), event('theirs-1')];
    assert.deepEqual(merge3(base, ours, theirs), [
      event('a', { year: 1901 }),
      event('b'),
      event('ours-1'),
      event('theirs-1'),
    ]);
  });

  it('keeps an alphabetical ledger sorted', () => {
    const base = { b: 1, d: 1 };
    const merged = merge3(base, { b: 1, c: 1, d: 1 }, { a: 1, b: 1, d: 1, e: 1 });
    assert.deepEqual(Object.keys(merged), ['a', 'b', 'c', 'd', 'e']);
  });

  it('merges the manifest as a set', () => {
    assert.deepEqual(merge3(['x', 'y'], ['x', 'y', 'ours'], ['x', 'theirs']), [
      'x',
      'ours',
      'theirs',
    ]);
  });

  it('reports a real collision', () => {
    assert.throws(
      () => merge3([event('a')], [event('a', { year: 1 })], [event('a', { year: 2 })]),
      Conflict
    );
    assert.throws(() => merge3({ k: 1 }, {}, { k: 2 }), /deleted on one side/);
  });
});

describe('backlog', () => {
  const themes = () => [
    { id: 'one', status: 'done' },
    { id: 'two', status: 'queued' },
    { id: 'three', status: 'queued' },
  ];

  it('skips a theme whose branch is already on origin', () => {
    assert.equal(backlog.nextTheme(themes(), new Set()).id, 'two');
    assert.equal(backlog.nextTheme(themes(), new Set(['two'])).id, 'three');
    assert.equal(backlog.nextTheme(themes(), new Set(['two', 'three'])), null);
  });

  it('allows only the legal status moves', () => {
    const list = themes();
    backlog.setStatus(list, 'two', 'authoring');
    backlog.setStatus(list, 'two', 'done');
    assert.throws(() => backlog.setStatus(list, 'two', 'queued'), /done -> queued/);
    assert.throws(() => backlog.setStatus(list, 'three', 'skipped'), /needs --reason/);
    backlog.setStatus(list, 'three', 'skipped', 'cannot fill 30 years');
    assert.equal(list[2].reason, 'cannot fill 30 years');
  });

  it('matches the statuses backlogSchema.test.ts allows', () => {
    const test = fs.readFileSync(
      path.join(__dirname, '../../src/utils/backlogSchema.test.ts'),
      'utf8'
    );
    const allowed = JSON.parse(test.match(/const STATUSES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
    assert.deepEqual(backlog.STATUSES, allowed);
  });
});

describe('picking a deck', () => {
  const deck = (id, stage, states = []) => ({
    id,
    status: stage && {
      stage,
      slugs: Object.fromEntries(states.map((s, i) => [`${id}-${i}`, { state: s }])),
    },
    backlogStatus: stage ? 'authoring' : 'authoring',
  });

  it('art takes the oldest deck with slugs to draw', () => {
    const decks = [
      deck('old', 'art-in-progress', ['downloaded']),
      deck('new', 'authored', ['pending']),
    ];
    assert.equal(pickDeck('art-batch', decks).deck, 'new');
    assert.equal(pickDeck('qc', decks).deck, 'old');
    assert.match(pickDeck('ship', decks).exit, /no deck has work/);
  });

  it('author resumes a crashed deck before starting a new one, within the cap', () => {
    const next = { id: 'fresh' };
    assert.equal(pickDeck('author', [deck('crashed', null)], next).deck, 'crashed');
    assert.equal(pickDeck('author', [deck('a', 'pr-open')], next).deck, 'fresh');
    assert.match(
      pickDeck('author', [deck('a', 'authored'), deck('b', 'uploaded')], next).exit,
      /cap is 2/
    );
    assert.match(pickDeck('author', [], null).exit, /no queued theme/);
  });
});

describe('the guard', () => {
  it('refuses any folder but a when-factory clone', () => {
    const root = tmp();
    assert.match(guardProblem(root, root), /not a when-factory clone/);
    const factory = path.join(root, 'when-factory');
    fs.mkdirSync(path.join(factory, '.git'), { recursive: true });
    assert.equal(guardProblem(factory, factory), null);
    assert.match(guardProblem(root, factory), /outside/);
    const worktree = path.join(root, 'w', 'when-factory');
    fs.mkdirSync(worktree, { recursive: true });
    fs.writeFileSync(path.join(worktree, '.git'), 'gitdir: elsewhere');
    assert.match(guardProblem(worktree, worktree), /worktree/);
  });

  it('passes in the factory clone and refuses any other checkout', () => {
    const { FACTORY_DIRNAME, REPO_ROOT } = require('./config');
    const inFactory = path.basename(REPO_ROOT) === FACTORY_DIRNAME;
    assert.equal(Boolean(guardProblem()), !inFactory);
  });
});

describe('the prompts CSV reader', () => {
  it('handles quotes, commas and blank trailing fields', () => {
    const rows = parseCsv('a,b,c\n"x, y","say ""hi""",\n');
    assert.deepEqual(rows, [{ a: 'x, y', b: 'say "hi"', c: '' }]);
  });
});

describe('inbox.js: one download per slug', () => {
  const setup = () => {
    const root = tmp();
    const env = {
      ...process.env,
      FACTORY_DECKS_DIR: path.join(root, 'decks'),
      WHEN_IMAGES_DIR: path.join(root, 'images'),
      FACTORY_DOWNLOADS_DIR: path.join(root, 'Downloads'),
    };
    fs.mkdirSync(env.FACTORY_DOWNLOADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(env.FACTORY_DOWNLOADS_DIR, 'old-download.jpeg'), 'old');
    const call = (script, ...args) =>
      execFileSync(process.execPath, [path.join(__dirname, script), ...args], {
        encoding: 'utf8',
        env,
        stdio: 'pipe',
      });
    call('status.js', 'init', '--deck', 'demo', '--slugs', 'alpha,beta');
    fs.writeFileSync(
      path.join(env.FACTORY_DECKS_DIR, 'demo', 'prompts.csv'),
      'event_name,research_prompt,image_prompt,image_generated,saved_filename\nalpha,r,i,,\nbeta,r,i,,\n'
    );
    return {
      env,
      call,
      downloads: env.FACTORY_DOWNLOADS_DIR,
      inbox: path.join(env.WHEN_IMAGES_DIR, 'inbox', 'demo'),
    };
  };
  const exitCode = (fn) => {
    try {
      fn();
      return 0;
    } catch (error) {
      return error.status;
    }
  };

  it('moves exactly one new file onto its slug, records it, and marks it downloaded', () => {
    const { call, downloads, inbox, env } = setup();
    call('inbox.js', 'snapshot', '--deck', 'demo', '--slug', 'alpha');
    fs.writeFileSync(path.join(downloads, 'Gemini_Generated_Image_x1.jpeg'), 'picture of alpha');
    call('inbox.js', 'take', '--deck', 'demo', '--slug', 'alpha', '--wait', '10');
    assert.equal(fs.readFileSync(path.join(inbox, 'alpha.jpeg'), 'utf8'), 'picture of alpha');
    assert.ok(
      fs.existsSync(path.join(downloads, 'old-download.jpeg')),
      'older downloads are left alone'
    );
    const [line] = fs
      .readFileSync(path.join(inbox, 'manifest.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map(JSON.parse);
    const expected = require('node:crypto')
      .createHash('sha256')
      .update('picture of alpha')
      .digest('hex');
    assert.equal(line.sha256, expected);
    const status = JSON.parse(
      fs.readFileSync(path.join(env.FACTORY_DECKS_DIR, 'demo', 'status.json'), 'utf8')
    );
    assert.equal(status.slugs.alpha.state, 'downloaded');
    assert.equal(status.slugs.alpha.sha256, expected);
  });

  it('moves nothing when there is no new file, or two', () => {
    const { call, downloads, inbox } = setup();
    call('inbox.js', 'snapshot', '--deck', 'demo', '--slug', 'beta');
    assert.equal(
      exitCode(() => call('inbox.js', 'take', '--deck', 'demo', '--slug', 'beta', '--wait', '3')),
      4
    );
    fs.writeFileSync(path.join(downloads, 'Gemini_Generated_Image_a.jpeg'), 'one');
    fs.writeFileSync(path.join(downloads, 'Gemini_Generated_Image_b.jpeg'), 'two');
    assert.equal(
      exitCode(() => call('inbox.js', 'take', '--deck', 'demo', '--slug', 'beta', '--wait', '10')),
      5
    );
    assert.ok(!fs.existsSync(path.join(inbox, 'beta.jpeg')));
    assert.equal(fs.readdirSync(downloads).length, 3);
  });

  it('refuses a take without its own snapshot', () => {
    const { call } = setup();
    call('inbox.js', 'snapshot', '--deck', 'demo', '--slug', 'alpha');
    assert.equal(
      exitCode(() => call('inbox.js', 'take', '--deck', 'demo', '--slug', 'beta', '--wait', '3')),
      1
    );
  });
});

describe('qc-collect.js', () => {
  const { verdictProblem } = require('./qc-collect');
  const verdict = (slug, grade = 'pass', extra = {}) => ({
    slug,
    description: 'A steam locomotive crossing a stone viaduct at dusk.',
    checks: {
      subject: grade,
      era: 'pass',
      no_text: 'pass',
      no_frame: 'pass',
      not_graphic: 'pass',
      birth_adult: 'pass',
      scene_rules: 'pass',
    },
    verdict: grade,
    reason: grade === 'pass' ? '' : 'shows the wrong thing',
    ...extra,
  });

  it('rejects a malformed or inconsistent verdict', () => {
    assert.equal(verdictProblem(verdict('a'), 'a'), null);
    assert.match(verdictProblem(verdict('b'), 'a'), /names b/);
    assert.match(
      verdictProblem(verdict('a', 'pass', { description: '' }), 'a'),
      /cold description/
    );
    assert.match(verdictProblem(verdict('a', 'fail', { verdict: 'pass' }), 'a'), /does not follow/);
    assert.match(verdictProblem(verdict('a', 'fail', { reason: ' ' }), 'a'), /needs a reason/);
    const partial = verdict('a');
    delete partial.checks.no_frame;
    assert.match(verdictProblem(partial, 'a'), /no_frame/);
  });

  it('fails while any verdict file is missing, asks for second opinions, then applies', () => {
    const decks = path.join(tmp(), 'decks');
    const env = { ...process.env, FACTORY_DECKS_DIR: decks };
    const call = (script, ...args) =>
      execFileSync(process.execPath, [path.join(__dirname, script), ...args], {
        encoding: 'utf8',
        env,
        stdio: 'pipe',
      });
    const status = (code, ...args) => {
      try {
        return { code: 0, out: call('qc-collect.js', ...args) };
      } catch (error) {
        assert.equal(error.status, code);
        return { code: error.status, out: error.stdout };
      }
    };
    call('status.js', 'init', '--deck', 'demo', '--slugs', 'good,bad,dup');
    for (const s of ['good', 'bad', 'dup'])
      call('status.js', 'mark', '--deck', 'demo', s, 'downloaded', '--sha256', SHA);
    const qc = path.join(decks, 'demo', 'qc');
    fs.mkdirSync(qc, { recursive: true });
    const write = (name, value) => fs.writeFileSync(path.join(qc, name), JSON.stringify(value));
    write('good.precheck.json', { sha256: SHA, ok: true, problems: [] });
    write('bad.precheck.json', { sha256: SHA, ok: true, problems: [] });
    write('dup.precheck.json', {
      sha256: SHA,
      ok: false,
      problems: ['near-duplicate of moon-landing'],
    });
    write('good.json', verdict('good'));
    // bad.json is missing: the collector must fail and name it.
    let r = status(2, '--deck', 'demo');
    assert.deepEqual(
      JSON.parse(r.out).review.map((x) => x.slug),
      ['bad']
    );
    assert.equal(
      status(2, '--deck', 'demo', '--apply').code,
      2,
      'apply refuses while a review is missing'
    );

    write('bad.json', verdict('bad', 'fail'));
    r = status(3, '--deck', 'demo');
    assert.deepEqual(
      JSON.parse(r.out).recheck.map((x) => x.slug),
      ['bad']
    );

    write(
      'bad.recheck.json',
      verdict('bad', 'fail', { reason: 'a sailing ship, not a locomotive' })
    );
    call('qc-collect.js', '--deck', 'demo', '--apply');
    const s = JSON.parse(fs.readFileSync(path.join(decks, 'demo', 'status.json'), 'utf8'));
    assert.equal(s.slugs.good.state, 'qc-pass');
    assert.equal(s.slugs.bad.state, 'qc-fail');
    assert.equal(s.slugs.bad.reason, 'a sailing ship, not a locomotive');
    assert.equal(s.slugs.dup.state, 'qc-fail');
    assert.match(s.slugs.dup.reason, /^precheck: near-duplicate/);
    assert.ok(!fs.existsSync(path.join(qc, 'bad.json')), 'a failed verdict moves to history');
    assert.ok(fs.existsSync(path.join(qc, 'history', 'bad.a1.review.json')));
    assert.ok(fs.existsSync(path.join(qc, 'good.json')), 'a pass stays for the PR body');
  });
});

describe('next-slot', () => {
  const { slots, opensAt, weekday } = require('./next-slot');

  it('offers only Mondays and Fridays that open more than 48 hours away, skipping held dates', () => {
    const now = Date.parse('2026-10-18T20:00:00Z'); // a Sunday
    const open = slots([{ id: 'x', dates: ['2026-10-26'] }], now);
    assert.ok(open.every((s) => [1, 5].includes(weekday(s.date))));
    assert.ok(open.every((s) => opensAt(s.date) - now >= 48 * 3600 * 1000));
    assert.equal(open[0].date, '2026-10-23', 'Friday the 23rd opens 22 Oct 10:00Z, 62 hours away');
    assert.equal(open.find((s) => s.date === '2026-10-26').holder, 'x');
  });
});

describe('auto: one task, the state machine picks the stage', () => {
  const { pickStage } = require('./start');
  const { BACKOFF_MS, HEALTH_EVERY_MS } = require('./config');
  const now = Date.parse('2026-10-19T15:00:00Z');
  const ago = (ms) => new Date(now - ms).toISOString();
  const ran = (outcome = 'ok', ms = 60000) => ({ at: ago(ms), outcome });
  const deck = (id, stage, states = []) => ({
    id,
    status: stage && {
      stage,
      slugs: Object.fromEntries(states.map((s, i) => [`${id}-${i}`, { state: s }])),
    },
    backlogStatus: 'authoring',
  });
  const healthy = { health: ran(), schedule: ran() };
  const next = { id: 'sweet-tooth' };

  it('runs list health first when it has never run, or is a week old', () => {
    assert.equal(pickStage({ decks: [], next, now }).stage, 'health');
    assert.equal(
      pickStage({ decks: [], next, now, runLog: { health: ran('ok', HEALTH_EVERY_MS) } }).stage,
      'health'
    );
    assert.equal(pickStage({ decks: [], next, now, runLog: healthy }).stage, 'author');
  });

  it('schedules at most once a day, and only with a merged deck pending', () => {
    const log = { health: ran() };
    assert.equal(pickStage({ decks: [], next, now, runLog: log, pending: 1 }).stage, 'schedule');
    assert.equal(pickStage({ decks: [], next, now, runLog: log, pending: 0 }).stage, 'author');
    assert.equal(
      pickStage({
        decks: [],
        next,
        now,
        runLog: { ...log, schedule: ran('ok', 3600000) },
        pending: 1,
      }).stage,
      'author'
    );
  });

  it('finishes the deck in flight before starting another: ship, then qc, then art', () => {
    const decks = [
      deck('a', 'art-in-progress', ['pending', 'downloaded']),
      deck('b', 'ready-to-ship', ['qc-pass']),
    ];
    assert.deepEqual(
      [pickStage({ decks, next, now, runLog: healthy })].map((p) => [p.stage, p.deck]),
      [['ship', 'b']]
    );
    assert.equal(pickStage({ decks: decks.slice(0, 1), next, now, runLog: healthy }).stage, 'qc');
    assert.equal(
      pickStage({ decks: [deck('a', 'authored', ['pending'])], next, now, runLog: healthy }).stage,
      'art-batch'
    );
  });

  it('backs off a stage that ended blocked or failed, and art that hit the quota until tomorrow', () => {
    const decks = [deck('a', 'authored', ['pending'])];
    const blocked = { ...healthy, 'art-batch': ran('blocked', BACKOFF_MS - 60000) };
    assert.equal(
      pickStage({ decks, next, now, runLog: blocked }).stage,
      'author',
      'art waits, the rest carry on'
    );
    const later = { ...healthy, 'art-batch': ran('failed', BACKOFF_MS + 60000) };
    assert.equal(pickStage({ decks, next, now, runLog: later }).stage, 'art-batch');
    const quota = { ...healthy, 'art-batch': ran('quota', 60000) };
    assert.equal(pickStage({ decks, next, now, runLog: quota }).stage, 'author');
    const yesterday = { ...healthy, 'art-batch': ran('quota', 26 * 3600000) };
    assert.equal(pickStage({ decks, next, now, runLog: yesterday }).stage, 'art-batch');
  });

  it('exits when nothing has work, naming what is waiting', () => {
    const full = [
      deck('a', 'pr-open'),
      deck('b', 'authored', ['pending']),
      deck('c', 'uploaded', []),
    ];
    const log = { ...healthy, 'art-batch': ran('quota'), ship: ran('blocked') };
    const pick = pickStage({ decks: full, next, now, runLog: log });
    assert.match(
      pick.exit,
      /^nothing to do; waiting: ship .*art-batch \(image quota used up today\)/
    );
    assert.match(
      pickStage({ decks: [], next: null, now, runLog: healthy }).exit,
      /^nothing to do$/
    );
  });

  it('unlock --outcome records the run against the stage the lock names', () => {
    const dir = tmp();
    const env = {
      ...process.env,
      FACTORY_LOCK_FILE: path.join(dir, 'factory.lock'),
      FACTORY_RUN_LOG: path.join(dir, 'runs.json'),
    };
    const run = (...args) =>
      execFileSync(process.execPath, [path.join(__dirname, 'status.js'), ...args], {
        encoding: 'utf8',
        env,
        stdio: 'pipe',
      });
    const token = run('lock', '--stage', 'auto').trim().split(' ').pop();
    run('refresh', '--token', token);
    lock.refresh({ token, stage: 'qc', file: env.FACTORY_LOCK_FILE });
    assert.throws(() => run('unlock', '--token', token, '--outcome', 'meh'), /must be one of/);
    assert.ok(fs.existsSync(env.FACTORY_LOCK_FILE), 'a bad outcome leaves the lock held');
    assert.match(run('unlock', '--token', token, '--outcome', 'blocked'), /qc recorded as blocked/);
    const log = JSON.parse(fs.readFileSync(env.FACTORY_RUN_LOG, 'utf8'));
    assert.equal(log.qc.outcome, 'blocked');
  });
});
