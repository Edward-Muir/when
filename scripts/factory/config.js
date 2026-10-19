/**
 * Paths and settings shared by the deck factory's scripts (docs/curated-themes/factory.md).
 *
 * The images live outside git, in a sibling folder of the clone (`when-images`, 38 GB). Its
 * location comes from `WHEN_IMAGES_DIR` in the environment or the repo's `.env`, relative to the
 * repo root, defaulting to `../when-images`. scripts/images/paths.py resolves the same variable
 * the same way, for the Python half of the pipeline.
 *
 * The factory runs in a dedicated clone, `when-factory`, never in Edward's `when` checkout or a
 * worktree: a stage resets and cleans its working tree, so `FACTORY_DIRNAME` is the guard that
 * refuses to run anywhere else.
 */

const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');

require('dotenv').config({ path: path.join(REPO_ROOT, '.env'), quiet: true });

const FACTORY_DIRNAME = 'when-factory';

function imagesDir() {
  const configured = (process.env.WHEN_IMAGES_DIR || '').trim() || '../when-images';
  return path.resolve(REPO_ROOT, configured);
}

const IMAGES_DIR = imagesDir();

/** Overridable so the tests can work in a temporary folder. */
const DECKS_DIR = process.env.FACTORY_DECKS_DIR
  ? path.resolve(process.env.FACTORY_DECKS_DIR)
  : path.join(REPO_ROOT, 'factory', 'decks');

module.exports = {
  REPO_ROOT,
  FACTORY_DIRNAME,
  IMAGES_DIR,
  /** Full-size art straight from Gemini, kept as the archive. */
  GENERATED_DIR: path.join(IMAGES_DIR, 'generated_images'),
  /** The JPEGs uploaded to Cloudinary, one per slug. */
  DOWNSAMPLED_DIR: path.join(IMAGES_DIR, 'downsampled_generated_images'),
  /** Per-deck landing folder for downloads: inbox/<deck>/<slug>.jpeg plus manifest.jsonl. */
  INBOX_DIR: path.join(IMAGES_DIR, 'inbox'),
  /** Assets to delete once Edward approves (see find_images_to_upload.js). */
  DELETE_LIST: path.join(IMAGES_DIR, 'compare-app', 'cloudinary_delete_list.json'),
  /** The one lock every stage takes: all six share one working tree. */
  LOCK_FILE: process.env.FACTORY_LOCK_FILE
    ? path.resolve(process.env.FACTORY_LOCK_FILE)
    : path.join(IMAGES_DIR, 'factory.lock'),
  /** When each stage last ran and how it ended, so `start.js auto` can back off a broken one. */
  RUN_LOG: process.env.FACTORY_RUN_LOG
    ? path.resolve(process.env.FACTORY_RUN_LOG)
    : path.join(IMAGES_DIR, 'factory-runs.json'),
  EVENTS_DIR: path.join(REPO_ROOT, 'public', 'events'),
  DECKS_DIR,
  BACKLOG_FILE: path.join(REPO_ROOT, 'docs', 'curated-themes', 'backlog.json'),
  /** Branch prefix for a deck; the theme id follows it. */
  DECK_BRANCH_PREFIX: 'claude/deck-',
  /** Images per art session. Sonnet loses track beyond about 10 while driving the browser. */
  MAX_BATCH: 10,
  /** Regenerations after a QC fail. The third fail makes the slug needs-human. */
  MAX_RETRIES: 2,
  /** A lock older than this is stale, whatever its PID says. */
  LOCK_STALE_MS: 2 * 60 * 60 * 1000,
  /** Decks authored but not yet at pr-open. Task B waits rather than start another. */
  MAX_IN_FLIGHT: 2,
  /** `auto` skips a stage for this long after it ended blocked or failed. */
  BACKOFF_MS: 6 * 60 * 60 * 1000,
  /** List health runs when its last run is older than this. */
  HEALTH_EVERY_MS: 7 * 24 * 60 * 60 * 1000,
};
