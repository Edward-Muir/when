import { eraForYear, ERA_DEFINITIONS } from './eras';

describe('eraForYear', () => {
  it('maps each definition boundary pair to the adjacent eras', () => {
    for (let i = 0; i < ERA_DEFINITIONS.length - 1; i++) {
      const era = ERA_DEFINITIONS.at(i);
      const next = ERA_DEFINITIONS.at(i + 1);
      if (!era || !next) throw new Error('unexpected table shape');
      expect(eraForYear(era.endYear)).toBe(era.id);
      expect(eraForYear(next.startYear)).toBe(next.id);
    }
  });

  it('clamps years outside the table to the nearest end', () => {
    expect(eraForYear(-5e9)).toBe('prehistory');
    expect(eraForYear(30000)).toBe('modern');
  });

  it('places a few landmark years', () => {
    expect(eraForYear(-1184)).toBe('ancient');
    expect(eraForYear(1066)).toBe('medieval');
    expect(eraForYear(1571)).toBe('earlyModern');
    expect(eraForYear(1943)).toBe('worldWars');
    expect(eraForYear(1969)).toBe('coldWar');
    expect(eraForYear(2024)).toBe('modern');
  });
});
