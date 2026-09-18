import React, { useEffect, useState } from 'react';
import InfoPageLayout from './InfoPageLayout';
import { APP_VERSION } from '../version';
import { fetchReleaseNotes, formatReleaseDate, type ReleaseEntry } from '../utils/releaseNotes';

const releaseCardClass = 'bg-surface rounded-xl border border-border p-4 mb-3';
const versionClass = 'text-sm font-display font-semibold text-text mb-2';
const noteClass = 'text-sm font-body text-text-muted leading-relaxed';
const statusClass = 'text-sm font-body text-text-muted';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; releases: ReleaseEntry[] };

const Changelog: React.FC = () => {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    // Fetched rather than bundled, deliberately: a player on an old build still needs to
    // see the release they are being offered. See src/utils/releaseNotes.ts.
    const controller = new AbortController();

    fetchReleaseNotes(controller.signal)
      .then((releases) => setState({ status: 'ready', releases }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  return (
    <InfoPageLayout title="What's New">
      <p className="text-xs font-body text-text-muted mb-6">Currently playing v{APP_VERSION}</p>

      {state.status === 'loading' && <p className={statusClass}>Loading the release history…</p>}

      {/* Say the history could not be loaded rather than rendering a blank page, which
          reads as "nothing has ever changed". */}
      {state.status === 'error' && (
        <p className={statusClass}>
          The release history could not be loaded. Check the connection and try again.
        </p>
      )}

      {state.status === 'ready' && state.releases.length === 0 && (
        <p className={statusClass}>No releases have been written up yet.</p>
      )}

      {state.status === 'ready' &&
        state.releases.map((release) => (
          <div key={release.version} className={releaseCardClass}>
            <h2 className={versionClass}>
              v{release.version}
              <span className="font-body font-normal text-text-muted">
                {' · '}
                {formatReleaseDate(release.date)}
              </span>
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              {release.notes.map((note) => (
                <li key={note} className={noteClass}>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </InfoPageLayout>
  );
};

export default Changelog;
