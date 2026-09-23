/**
 * localStorage for the hidden /image-qc tool.
 *
 * Stores a verdict per event, keyed by the event `name` (its unique code).
 * Used to remember which images have already been reviewed across reloads so
 * the QC queue only ever shows un-judged images.
 */

import { readJson, writeJson } from './storage';

export type QcVerdict = 'pass' | 'fail';
export type QcResults = Record<string, QcVerdict>;

const QC_RESULTS_KEY = 'when-image-qc-results';

/** Read all stored verdicts. Returns an empty object on any error. */
export function getQcResults(): QcResults {
  return readJson(QC_RESULTS_KEY, {}, normalizeQcResults);
}

function normalizeQcResults(raw: unknown): QcResults {
  const parsed = raw as QcResults;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

/** Record (or overwrite) the verdict for one event. Fails silently. */
export function setQcResult(name: string, verdict: QcVerdict): void {
  const results = getQcResults();
  // eslint-disable-next-line security/detect-object-injection
  results[name] = verdict;
  writeJson(QC_RESULTS_KEY, results, 'image-QC result');
}
