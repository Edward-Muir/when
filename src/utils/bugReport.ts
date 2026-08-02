import { HistoricalEvent } from '../types';
import { formatYear } from './gameLogic';
import { APP_VERSION } from '../version';

// Same address as the "Send Feedback" item in the main menu
export const FEEDBACK_EMAIL = 'feedback@play-when.com';

/**
 * Builds a mailto: URL for reporting a problem with a specific card.
 *
 * The body carries just enough to identify the record in public/events/ — the
 * card's internal `name` is the id we'd actually edit. The event description is
 * deliberately left out: some mail clients truncate long mailto: URLs.
 */
export function buildBugReportMailto(event: HistoricalEvent): string {
  const subject = `When — issue with "${event.friendly_name}"`;

  const body = [
    'Describe the problem with this card:',
    '',
    '',
    '--- Card details (please leave this in) ---',
    `Card ID: ${event.name}`,
    `Name: ${event.friendly_name}`,
    `Year: ${formatYear(event.year)}`,
    `Category: ${event.category}`,
    `Difficulty: ${event.difficulty}`,
    `Image: ${event.image_url || 'none'}`,
    `App version: ${APP_VERSION}`,
  ].join('\n');

  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
