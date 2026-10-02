import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomGameSettings from './CustomGameSettings';
import { ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ALL_ERAS } from '../utils/eras';
import { ALL_REGIONS } from '../utils/regions';
import { CHALLENGE_URL } from '../utils/share';

function setup(overrides: Partial<React.ComponentProps<typeof CustomGameSettings>> = {}) {
  const props = {
    selectedDifficulties: [...ALL_DIFFICULTIES],
    setSelectedDifficulties: jest.fn(),
    selectedCategories: [...ALL_CATEGORIES],
    setSelectedCategories: jest.fn(),
    selectedEras: [...ALL_ERAS],
    setSelectedEras: jest.fn(),
    selectedRegions: [...ALL_REGIONS],
    setSelectedRegions: jest.fn(),
    excludedCountries: [] as string[],
    setExcludedCountries: jest.fn(),
    countryOptions: new Map<string, string[]>(),
    playerCount: 1,
    onPlayerCountChange: jest.fn(),
    suddenDeathHandSize: 5,
    setSuddenDeathHandSize: jest.fn(),
    onPlay: jest.fn(),
    isPlayValid: true,
    deckCount: 500,
    ...overrides,
  };
  return render(<CustomGameSettings {...props} />);
}

const shareInput = () => screen.getByPlaceholderText('paste a share link') as HTMLInputElement;

describe('CustomGameSettings', () => {
  it('shows a share link for a complete selection', () => {
    setup();
    expect(shareInput().value.startsWith(`${CHALLENGE_URL}/`)).toBe(true);
    expect(screen.getByRole('button', { name: 'Share settings' })).toBeEnabled();
  });

  it('withholds the link while a group is empty, since it would not load', () => {
    setup({ selectedCategories: [], isPlayValid: false, deckCount: 0 });
    expect(shareInput().value).toBe('');
    expect(screen.getByRole('button', { name: 'Share settings' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Play · 0 events/ })).toBeDisabled();
  });
});
