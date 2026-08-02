import { buildBugReportMailto, FEEDBACK_EMAIL } from './bugReport';
import { HistoricalEvent } from '../types';
import { APP_VERSION } from '../version';

const event: HistoricalEvent = {
  name: 'wwi-end',
  friendly_name: 'World War I ends',
  year: 1918,
  category: 'warfare',
  description: 'The Armistice of 11 November 1918 ended fighting on the Western Front.',
  difficulty: 'easy',
  image_url: 'when/armistice.jpg',
};

// Pulls a single query param back out of the mailto: URL, decoded.
function param(url: string, key: 'subject' | 'body'): string {
  const pair = url
    .slice(url.indexOf('?') + 1)
    .split('&')
    .find((p) => p.startsWith(`${key}=`));
  return decodeURIComponent(pair?.slice(key.length + 1) ?? '');
}

describe('buildBugReportMailto', () => {
  it('addresses the mail to the feedback inbox', () => {
    expect(buildBugReportMailto(event).startsWith(`mailto:${FEEDBACK_EMAIL}?`)).toBe(true);
    expect(FEEDBACK_EMAIL).toBe('feedback@play-when.com');
  });

  it('names the card in the subject', () => {
    expect(param(buildBugReportMailto(event), 'subject')).toContain('World War I ends');
  });

  it('includes the details needed to find and fix the record', () => {
    const body = param(buildBugReportMailto(event), 'body');
    // `name` is the internal id — the thing we actually edit in public/events/
    expect(body).toContain('Card ID: wwi-end');
    expect(body).toContain('Name: World War I ends');
    expect(body).toContain('Year: 1918');
    expect(body).toContain('Category: warfare');
    expect(body).toContain('Difficulty: easy');
    expect(body).toContain('Image: when/armistice.jpg');
    expect(body).toContain(`App version: ${APP_VERSION}`);
  });

  it('says "none" when the card has no image', () => {
    const noImage: HistoricalEvent = { ...event, image_url: undefined };
    expect(param(buildBugReportMailto(noImage), 'body')).toContain('Image: none');
  });

  it('formats BCE years the way the card displays them', () => {
    const bce = { ...event, year: -44, friendly_name: 'Julius Caesar assassinated' };
    expect(param(buildBugReportMailto(bce), 'body')).toContain('Year: 44 BCE');
  });

  it('escapes characters that would otherwise break the mailto: URL', () => {
    const messy = { ...event, friendly_name: 'Ampersand & hash # test', name: 'a&b#c' };
    const url = buildBugReportMailto(messy);

    // Only the two separators we wrote ourselves may appear unescaped
    expect(url.match(/&/g)).toHaveLength(1);
    expect(url).not.toContain('#');
    expect(url.split('?')[1].split('&')[0].startsWith('subject=')).toBe(true);

    expect(param(url, 'subject')).toContain('Ampersand & hash # test');
    expect(param(url, 'body')).toContain('Card ID: a&b#c');
  });

  it('keeps the body short by leaving the full description out', () => {
    expect(param(buildBugReportMailto(event), 'body')).not.toContain('Armistice');
  });
});
