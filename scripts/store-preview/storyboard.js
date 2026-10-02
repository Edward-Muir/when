/**
 * The edit decision list: which footage plays when, the captions over it, and the music cues.
 *
 * Section boundaries sit on the 120 BPM grid from the logo hit (4.0 s), so the cuts land on
 * the beat. Footage windows are placed by the drop marks the capture recorded, so a re-capture
 * with slightly different timing still cuts on each placement. Every claim in a caption is
 * checked against the catalogue the cards come from (and the web) before it ships:
 *   - Death of Cleopatra (30 BCE) to the Moon landing (1969) is 1,999 years; back to the
 *     Great Pyramid (2560 BCE) it is 2,530.
 *   - University of Oxford Founded (1096) to Aztec Empire Established (1428) is 332 years.
 */

const LOGO = 4.0;
const RALLY_AT = 5.0;
const WRONG_AT = 11.5;
const DETAIL_AT = 14.5;
const SWEEP_AT = 20.0;
const DAILY_AT = 24.0;
const ARCHIVE_AT = 25.5;
const END_AT = 27.0;
const DURATION = 29.4;

function storyboard(clips, { playable, categories }) {
  const segments = [];
  const correct = [];
  const wrong = [];
  const drops = (name, type) => clips[name].marks.filter((m) => m.type === type).map((m) => m.t);
  const clipLength = (name) => clips[name].frames / 30;

  // Hook: Cleopatra lands at 2.7 s, then holds on the finished timeline.
  const hookDrop = drops('hook', 'correct')[0];
  const hookFrom = Math.max(0, hookDrop - 2.7);
  segments.push({ clip: 'hook', at: 0, from: hookFrom, dur: LOGO, zoom: [1.0, 1.06] });
  correct.push(hookDrop - hookFrom);
  // Behind the logo: the same timeline, frozen and blurred.
  segments.push({
    clip: 'hook',
    at: LOGO,
    from: hookFrom + LOGO,
    dur: RALLY_AT - LOGO,
    speed: 0,
    blur: true,
  });

  // Rally: one window per drop, cut on the pick-up and closing on the landing.
  const rally = drops('rally', 'correct');
  const span = (WRONG_AT - RALLY_AT) / rally.length;
  rally.forEach((t, i) => {
    const last = i === rally.length - 1;
    const tail = last ? 0.75 : 0.32;
    const from = t - (span - tail);
    segments.push({ clip: 'rally', at: RALLY_AT + i * span, from, dur: span, punch: span - tail });
    correct.push(RALLY_AT + i * span + span - tail);
  });

  // The miss: Oxford dropped after the Aztecs, then the shake and the tombstone.
  const miss = drops('wrong', 'wrong')[0];
  const wrongLead = 1.25;
  segments.push({ clip: 'wrong', at: WRONG_AT, from: miss - wrongLead, dur: DETAIL_AT - WRONG_AT });
  wrong.push(WRONG_AT + wrongLead);

  // A card's story: the tap, the painting, then the prose rolling by.
  const open = drops('detail', 'open')[0];
  segments.push({
    clip: 'detail',
    at: DETAIL_AT,
    from: Math.max(0, open - 0.35),
    dur: SWEEP_AT - DETAIL_AT,
    speed: Math.min(1.25, (clipLength('detail') - open) / (SWEEP_AT - DETAIL_AT)),
  });

  // The whole timeline, earliest to latest.
  const sweepLen = clipLength('sweep');
  segments.push({
    clip: 'sweep',
    at: SWEEP_AT,
    from: 0.25,
    dur: DAILY_AT - SWEEP_AT,
    speed: Math.max(1, (sweepLen - 0.5) / (DAILY_AT - SWEEP_AT)),
  });

  segments.push({
    clip: 'daily',
    at: DAILY_AT,
    from: 0.1,
    dur: ARCHIVE_AT - DAILY_AT,
    zoom: [1.0, 1.04],
  });
  segments.push({
    clip: 'archive',
    at: ARCHIVE_AT,
    from: 0.1,
    dur: END_AT - ARCHIVE_AT,
    zoom: [1.05, 1.0],
  });
  segments.push({ end: true, at: END_AT, dur: DURATION - END_AT });

  const events = `${(Math.floor(playable / 100) * 100).toLocaleString('en-US')}+`;
  const captions = [
    {
      at: 0.15,
      out: LOGO,
      pos: 'top',
      small: true,
      lines: ['Cleopatra lived closer to <em>the Moon landing</em>'],
    },
    {
      at: 1.55,
      out: LOGO,
      pos: 'top2',
      small: true,
      lines: ['than to the <em>Great Pyramid.</em>'],
    },
    { at: LOGO, out: RALLY_AT, pos: 'logo' },
    { at: RALLY_AT - 0.5, out: 8.1, pos: 'top', lines: ['Drag each event <em>into place</em>'] },
    { at: 8.1, out: WRONG_AT, pos: 'top', lines: ['Before or <em>after?</em>'] },
    {
      at: WRONG_AT,
      out: WRONG_AT + wrongLead + 0.15,
      pos: 'top',
      lines: ['Oxford, or <em>the Aztecs?</em>'],
    },
    {
      at: WRONG_AT + wrongLead + 0.35,
      out: DETAIL_AT,
      pos: 'top',
      lines: ['Oxford is older. <em>By 332 years.</em>'],
      sub: 'Every miss teaches you something',
    },
    {
      at: DETAIL_AT + 0.3,
      out: SWEEP_AT,
      pos: 'bottom',
      lines: ['Every card tells <em>its story</em>'],
      sub: 'Tap a card to learn what happened',
    },
    {
      at: SWEEP_AT,
      out: DAILY_AT,
      pos: 'bottom',
      lines: ['From <em>T. rex</em> to the <em>iPhone</em>'],
      sub: `${events} events across ${categories} categories`,
    },
    { at: DAILY_AT, out: ARCHIVE_AT, pos: 'top', lines: ['A new challenge <em>every day</em>'] },
    { at: ARCHIVE_AT, out: END_AT, pos: 'top', lines: ['Replay every <em>past theme</em>'] },
    { at: END_AT, out: DURATION + 1, pos: 'end' },
  ];

  const cue = {
    duration: DURATION,
    logo: LOGO,
    groove: [RALLY_AT - 1.0, END_AT],
    breakdown: [DETAIL_AT - 0.5, SWEEP_AT],
    build: SWEEP_AT,
    end: END_AT,
    correct,
    wrong,
  };
  return { duration: DURATION, segments, captions, cue };
}

module.exports = { storyboard };
