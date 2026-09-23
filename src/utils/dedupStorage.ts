/**
 * localStorage persistence for the dev-only `/admin/dedup` duplicate-review tool.
 *
 * A cluster is identified by its index in `public/dedup/clusters.json`. Each decision is
 * one of:
 *   - `{ kind: 'keep', keep: string[] }` — keep these event names; the rest of the cluster
 *     is marked for deletion.
 *   - `{ kind: 'pass' }` — "keep all / not a duplicate": nothing is deleted.
 * Clusters with no stored decision are pending.
 */

import { readJson, readString, writeJson, writeString } from './storage';

export type DedupDecision = { kind: 'keep'; keep: string[] } | { kind: 'pass' };

export type DedupDecisions = Record<number, DedupDecision>;

const STORAGE_KEY = 'when-dedup-decisions-v1';
const POSITION_KEY = 'when-dedup-position-v1';

/** The cluster index the reviewer was last viewing, so reload resumes in place. */
export function getLastPosition(): number {
  const raw = readString(POSITION_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function setLastPosition(index: number): void {
  writeString(POSITION_KEY, String(index), 'dedup review position');
}

export function getDecisions(): DedupDecisions {
  return readJson(STORAGE_KEY, {}, (parsed) =>
    parsed && typeof parsed === 'object' ? (parsed as DedupDecisions) : {}
  );
}

function save(decisions: DedupDecisions): void {
  writeJson(STORAGE_KEY, decisions, 'dedup decisions');
}

export function setDecision(index: number, decision: DedupDecision): DedupDecisions {
  const next = { ...getDecisions(), [index]: decision };
  save(next);
  return next;
}

export function clearDecision(index: number): DedupDecisions {
  const next = { ...getDecisions() };
  // eslint-disable-next-line security/detect-object-injection
  delete next[index];
  save(next);
  return next;
}

export function clearAllDecisions(): DedupDecisions {
  save({});
  return {};
}
