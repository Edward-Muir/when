import React, { useEffect, useState } from 'react';
import { Check, Flag, AlertCircle } from 'lucide-react';
import { HistoricalEvent } from '../types';
import { getEventTextClass } from '../utils/eventColor';
import {
  REPORT_REASONS,
  ReportReasonId,
  hasReportedCard,
  markCardReported,
  submitCardReport,
} from '../utils/cardReport';

type ReportUiState = 'idle' | 'choosing' | 'sending' | 'sent' | 'error';

// Sub-component for reporting a problem with the card's data (wrong year, bad
// image, typo). Tapping reveals reason chips; picking one submits to the API.
// Once sent, the row shows a confirmation for the rest of the session so nobody
// reports the same card twice.
function ReportIssueButton({ event, tombstone }: { event: HistoricalEvent; tombstone?: boolean }) {
  const [uiState, setUiState] = useState<ReportUiState>(() =>
    hasReportedCard(event.name) ? 'sent' : 'idle'
  );

  // Switching cards (the popup is reused) must reset the row to match the new card.
  useEffect(() => {
    setUiState(hasReportedCard(event.name) ? 'sent' : 'idle');
  }, [event.name]);

  const textClass = tombstone ? 'text-text-muted' : getEventTextClass(event);
  // The description popup lets clicks bubble to the backdrop to dismiss, so every
  // control in here has to stop propagation or the card vanishes mid-report.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleReason = async (reason: ReportReasonId) => {
    setUiState('sending');
    const outcome = await submitCardReport(event.name, reason);
    // 'duplicate' means the server already has it — same confirmation as success.
    if (outcome === 'sent' || outcome === 'duplicate') {
      markCardReported(event.name);
      setUiState('sent');
    } else {
      setUiState('error');
    }
  };

  const rowClass = `w-full min-h-[44px] flex items-center justify-center gap-1.5 font-body text-xs opacity-60 hover:opacity-100 active:scale-95 transition-all ${textClass}`;

  return (
    <div className="px-4 border-t border-border" onClick={stop}>
      {uiState === 'idle' && (
        <button
          onClick={(e) => {
            stop(e);
            setUiState('choosing');
          }}
          aria-label="Report an issue with this card"
          className={rowClass}
        >
          <Flag className="w-3.5 h-3.5" />
          Report an issue
        </button>
      )}

      {(uiState === 'choosing' || uiState === 'sending') && (
        <div className="py-2">
          <p className={`text-xs font-body text-center opacity-60 mb-2 ${textClass}`}>
            What&apos;s wrong with this card?
          </p>
          {/* 2x2: four 44px-tall chips can't fit one row inside a 340px card. */}
          <div className="grid grid-cols-2 gap-1.5">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason.id}
                disabled={uiState === 'sending'}
                onClick={(e) => {
                  stop(e);
                  handleReason(reason.id);
                }}
                className={`px-3 min-h-[44px] rounded-xl border border-border bg-surface/20 font-body text-xs hover:bg-surface/40 active:scale-95 transition-all disabled:opacity-40 ${textClass}`}
              >
                {reason.label}
              </button>
            ))}
          </div>
          <button
            onClick={(e) => {
              stop(e);
              setUiState('idle');
            }}
            disabled={uiState === 'sending'}
            className={`w-full min-h-[44px] font-body text-xs opacity-50 hover:opacity-80 transition-opacity ${textClass}`}
          >
            {uiState === 'sending' ? 'Sending…' : 'Cancel'}
          </button>
        </div>
      )}

      {uiState === 'sent' && (
        // Full opacity, unlike the idle row's 60% — the point is that it reads as
        // clearly changed so nobody wonders whether the tap registered.
        <p
          aria-live="polite"
          className={`w-full min-h-[44px] flex items-center justify-center gap-1.5 font-body text-xs font-semibold ${textClass}`}
        >
          <Check className="w-4 h-4" />
          Reported — thanks!
        </p>
      )}

      {uiState === 'error' && (
        <button
          onClick={(e) => {
            stop(e);
            setUiState('choosing');
          }}
          aria-live="polite"
          className={`${rowClass} opacity-80`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Couldn&apos;t send — tap to retry
        </button>
      )}
    </div>
  );
}

export default ReportIssueButton;
