/**
 * localStorage for the hidden /image-qc tool.
 *
 * Stores a verdict per event, keyed by the event `name` (its unique code).
 * Used to remember which images have already been reviewed across reloads so
 * the QC queue only ever shows un-judged images.
 */

export type QcVerdict = 'pass' | 'fail';
export type QcResults = Record<string, QcVerdict>;

const QC_RESULTS_KEY = 'when-image-qc-results';

/** Read all stored verdicts. Returns an empty object on any error. */
export function getQcResults(): QcResults {
  try {
    const stored = localStorage.getItem(QC_RESULTS_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as QcResults;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Record (or overwrite) the verdict for one event. Fails silently. */
export function setQcResult(name: string, verdict: QcVerdict): void {
  try {
    const results = getQcResults();
    // eslint-disable-next-line security/detect-object-injection
    results[name] = verdict;
    localStorage.setItem(QC_RESULTS_KEY, JSON.stringify(results));
  } catch {
    console.warn('Failed to save image-QC result to localStorage');
  }
}

/** Remove the verdict for one event (used by Undo). Fails silently. */
export function clearQcResult(name: string): void {
  try {
    const results = getQcResults();
    // eslint-disable-next-line security/detect-object-injection
    delete results[name];
    localStorage.setItem(QC_RESULTS_KEY, JSON.stringify(results));
  } catch {
    console.warn('Failed to clear image-QC result from localStorage');
  }
}
