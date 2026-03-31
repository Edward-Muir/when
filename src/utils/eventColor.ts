import { CSSProperties } from 'react';
import { HistoricalEvent } from '../types';

/** Returns inline style for event color background, or undefined for default */
export function getEventColorStyle(event: HistoricalEvent): CSSProperties | undefined {
  return event.color ? { backgroundColor: event.color } : undefined;
}

/** Returns the appropriate text color class for an event's color */
export function getEventTextClass(event: HistoricalEvent): string {
  if (!event.color) return 'text-text';
  return event.text_color === 'dark' ? 'text-black/85' : 'text-white/90';
}
