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

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..', '..');

require('dotenv').config({ path: path.join(REPO_ROOT, '.env'), quiet: true });

const FACTORY_DIRNAME = 'when-factory';

function imagesDir() {
  const configured = (process.env.WHEN_IMAGES_DIR || '').trim() || '../when-images';
  return path.resolve(REPO_ROOT, configured);
}

const IMAGES_DIR = imagesDir();

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
  LOCK_FILE: path.join(IMAGES_DIR, 'factory.lock'),
  EVENTS_DIR: path.join(REPO_ROOT, 'public', 'events'),
  DECKS_DIR: path.join(REPO_ROOT, 'factory', 'decks'),
  BACKLOG_FILE: path.join(REPO_ROOT, 'docs', 'curated-themes', 'backlog.json'),
};
