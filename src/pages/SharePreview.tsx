import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Share2 } from 'lucide-react';
import type { HistoricalEvent } from '../types';
import { loadAllEvents } from '../utils/eventLoader';
import { getDailyPreviewEvent } from '../utils/dailyConfig';
import { getDailyTheme, getThemeDisplayName } from './../utils/dailyTheme';
import { getLocalDateString } from '../utils/puzzleDate';
import {
  formatShareDate,
  generateDailyShareText,
  generateShareText,
  shareContent,
} from '../utils/share';
import { renderShareCard, renderShareFile, ShareCardSpec } from '../utils/shareImage';
import { WhenGameState } from '../types';

/**
 * Dev-only harness (route: /share-preview, unlinked) for the share card and the share
 * text that travels with it.
 *
 * The card is a canvas render that only exists for the half-second between tapping
 * Share and the OS sheet opening, so there is otherwise no way to look at it. This page
 * renders it at full size next to the exact message it ships with, and can fire a real
 * `navigator.share()` so the share sheet's behaviour (notably which apps list an image
 * payload) can be checked on a device.
 */

type Preset = 'daily' | 'marathon' | 'challenge';

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'marathon', label: 'Marathon' },
  { id: 'challenge', label: 'Challenge' },
];

const SharePreview: React.FC = () => {
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [preset, setPreset] = useState<Preset>('daily');
  const [seedIndex, setSeedIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>();
  const [status, setStatus] = useState('');

  useEffect(() => {
    loadAllEvents().then(setEvents);
  }, []);

  const today = getLocalDateString();
  const theme = getThemeDisplayName(getDailyTheme(today));

  // Index 0 is the real seed card for today; the rest let the layout be checked against
  // long names, missing art and extreme colours.
  const withArt = events.filter((event) => event.image_url);
  const dailySeed = getDailyPreviewEvent(events, today);
  const seedEvent = seedIndex === 0 ? dailySeed : (withArt[seedIndex % withArt.length] ?? null);

  const spec: ShareCardSpec =
    preset === 'daily'
      ? {
          event: seedEvent,
          eyebrow: `Daily · ${formatShareDate(today)} · ${theme}`,
          score: '11',
          scoreLabel: 'events in my timeline',
          detail: 'best run of 4 · #47 globally',
          url: 'play-when.com/daily',
        }
      : preset === 'marathon'
        ? {
            event: seedEvent,
            eyebrow: 'Marathon',
            score: '23',
            scoreLabel: 'events placed',
            detail: 'best run of 9',
            url: 'play-when.com',
          }
        : {
            event: seedEvent,
            eyebrow: 'Marathon',
            score: '12',
            scoreLabel: 'events placed',
            detail: 'best run of 5',
            url: 'play-when.com/challenge/able-baker-cane',
          };

  const text =
    preset === 'daily'
      ? generateDailyShareText({
          date: today,
          theme,
          correctCount: 10,
          bestStreak: 4,
          leaderboardRank: 47,
        })
      : generateShareText({
          gameMode: 'suddenDeath',
          placementHistory: Array(preset === 'marathon' ? 23 : 12).fill(true),
          players: [{ id: 0, name: 'Player 1', hand: [], hasWon: false, placementHistory: [] }],
          winners: [],
          roundNumber: 1,
          bestStreak: preset === 'marathon' ? 9 : 5,
          lastConfig:
            preset === 'challenge'
              ? ({ challengeCode: 'able-baker-cane' } as WhenGameState['lastConfig'])
              : null,
          // Only the fields the text builder reads are supplied.
        } as unknown as WhenGameState);

  const render = useCallback(async () => {
    setStatus('rendering…');
    const blob = await renderShareCard(spec);
    if (!blob) {
      setStatus('render failed');
      return;
    }
    setImageUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(blob);
    });
    setStatus(`${Math.round(blob.size / 1024)} KB`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ ...spec, event: spec.event?.name })]);

  useEffect(() => {
    if (events.length) render();
  }, [events.length, render]);

  const share = async () => {
    const file = await renderShareFile(spec, 'when-preview.jpg');
    const copied = await shareContent(text, 'When - Timeline Game', file);
    setStatus(copied ? 'copied to clipboard (no share sheet)' : 'handed to the share sheet');
  };

  const button = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className={`min-h-[44px] px-4 rounded-lg border font-body text-sm transition-colors ${
        active
          ? 'border-accent bg-accent text-white'
          : 'border-border bg-surface text-text hover:bg-border/50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen overflow-y-auto bg-bg text-text p-6 space-y-5">
      <h1 className="font-display text-2xl font-semibold">Share preview</h1>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((entry) =>
          button(entry.label, preset === entry.id, () => setPreset(entry.id))
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {button('Next seed card', false, () => setSeedIndex((i) => i + 1))}
        {button('Today’s seed', seedIndex === 0, () => setSeedIndex(0))}
        <button
          onClick={render}
          className="min-h-[44px] px-4 rounded-lg border border-border bg-surface text-text font-body text-sm flex items-center gap-2 hover:bg-border/50"
        >
          <RefreshCw className="w-4 h-4" /> Re-render
        </button>
        <button
          onClick={share}
          className="min-h-[44px] px-4 rounded-lg bg-accent-secondary text-white font-body text-sm flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Fire real share
        </button>
        <span className="font-mono text-xs text-text-muted">{status}</span>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        {imageUrl && (
          /* eslint-disable-next-line jsx-a11y/img-redundant-alt */
          <img
            src={imageUrl}
            alt="Rendered share card"
            className="w-[270px] rounded-xl border border-border shadow-sm"
          />
        )}
        <pre className="font-mono text-sm whitespace-pre-wrap bg-surface border border-border rounded-xl p-4 max-w-md">
          {text}
        </pre>
      </div>

      <p className="font-body text-xs text-text-muted max-w-md">
        Hero art is always the pre-placed seed card, never a card the player placed — see the header
        comment in <code>shareImage.ts</code>.
      </p>
    </div>
  );
};

export default SharePreview;
