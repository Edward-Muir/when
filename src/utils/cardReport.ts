import { getDeviceFingerprint } from './deviceFingerprint';
import { APP_VERSION } from '../version';

/**
 * Reporting a problem with a card's data. Submits straight to the API — no mail
 * app — and remembers what's already been reported for the rest of the session
 * so the same card can't be reported twice.
 *
 * The reason ids must stay in sync with REPORT_REASON_IDS in
 * api/card-reports/reportSchema.ts; cardReport.test.ts guards that.
 */

export type ReportReasonId = 'wrong-year' | 'wrong-image' | 'bad-description' | 'other';

export const REPORT_REASONS: { id: ReportReasonId; label: string }[] = [
  { id: 'wrong-year', label: 'Wrong year' },
  { id: 'wrong-image', label: 'Wrong image' },
  { id: 'bad-description', label: 'Bad description' },
  { id: 'other', label: 'Something else' },
];

/** 'duplicate' means the server already has this report — treat it as success. */
export type ReportOutcome = 'sent' | 'duplicate' | 'rate-limited' | 'error';

const REPORTED_CARDS_KEY = 'when-reported-cards';

/** Reads the session's reported-card ids, tolerating anything malformed. */
function getReportedCards(): string[] {
  try {
    const raw = sessionStorage.getItem(REPORTED_CARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === 'string');
  } catch {
    return [];
  }
}

export function hasReportedCard(eventName: string): boolean {
  return getReportedCards().includes(eventName);
}

export function markCardReported(eventName: string): void {
  try {
    const reported = getReportedCards();
    if (reported.includes(eventName)) return;
    reported.push(eventName);
    sessionStorage.setItem(REPORTED_CARDS_KEY, JSON.stringify(reported));
  } catch {
    console.warn('Failed to save reported card to sessionStorage');
  }
}

/**
 * Posts a report for one card. Never throws — callers switch on the outcome.
 */
export async function submitCardReport(
  eventName: string,
  reason: ReportReasonId
): Promise<ReportOutcome> {
  try {
    const deviceId = await getDeviceFingerprint();
    const response = await fetch('/api/card-reports/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, reason, deviceId, appVersion: APP_VERSION }),
    });

    if (response.ok) return 'sent';
    if (response.status === 409) return 'duplicate';
    if (response.status === 429) return 'rate-limited';
    return 'error';
  } catch {
    // Offline, blocked, or the fingerprint couldn't be generated.
    return 'error';
  }
}
