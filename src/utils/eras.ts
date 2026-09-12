import { Era, EraDefinition } from '../types';

/**
 * Era definitions with historically meaningful boundaries.
 */
export const ERA_DEFINITIONS: EraDefinition[] = [
  { id: 'prehistory', name: 'Prehistory', startYear: -4500000000, endYear: -3001 },
  { id: 'ancient', name: 'Ancient', startYear: -3000, endYear: 499 },
  { id: 'medieval', name: 'Medieval', startYear: 500, endYear: 1499 },
  { id: 'earlyModern', name: 'Renaissance', startYear: 1500, endYear: 1759 },
  { id: 'industrial', name: 'Industrial', startYear: 1760, endYear: 1913 },
  { id: 'worldWars', name: 'World Wars', startYear: 1914, endYear: 1945 },
  { id: 'coldWar', name: 'Cold War', startYear: 1946, endYear: 1991 },
  { id: 'modern', name: 'Modern', startYear: 1992, endYear: 2100 },
];

export const ALL_ERAS: Era[] = [
  'prehistory',
  'ancient',
  'medieval',
  'earlyModern',
  'industrial',
  'worldWars',
  'coldWar',
  'modern',
];

/**
 * The era a year falls in. Years outside the table clamp to the nearest end — the
 * catalogue has an event at year 30000, beyond `modern`'s 2100 ceiling.
 */
export function eraForYear(year: number): Era {
  const first = ERA_DEFINITIONS[0];
  if (first && year < first.startYear) return first.id;
  const match = ERA_DEFINITIONS.find((d) => year >= d.startYear && year <= d.endYear);
  return match?.id ?? 'modern';
}
