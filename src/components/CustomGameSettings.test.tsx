import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  render(<CustomGameSettings {...props} />);
  return props;
}

const shareInput = () => screen.getByPlaceholderText('paste a share link') as HTMLInputElement;

const shareButton = () => screen.getByRole('button', { name: 'Share settings' });

describe('CustomGameSettings', () => {
  it('folds the filters to rows, with Play and Share side by side', () => {
    setup();
    expect(screen.getByRole('button', { name: /^Categories/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(screen.getByRole('button', { name: /Play · 500 events/ })).toBeEnabled();
    expect(shareButton()).toBeEnabled();
    // The link field lives in the popup, closed until Share is tapped.
    expect(screen.queryByPlaceholderText('paste a share link')).not.toBeInTheDocument();
  });

  it('opens the share link for a complete selection from the Share button', async () => {
    setup();
    await userEvent.click(shareButton());
    expect(screen.getByRole('dialog')).toHaveTextContent('Share this game');
    expect(shareInput().value.startsWith(`${CHALLENGE_URL}/`)).toBe(true);
    expect(screen.getByRole('button', { name: /Share link/ })).toBeEnabled();
  });

  it('shuffles to a new link, keeping the settings', async () => {
    setup();
    await userEvent.click(shareButton());
    const before = shareInput().value;
    await userEvent.click(screen.getByRole('button', { name: 'Shuffle seed' }));
    expect(shareInput().value).not.toBe(before);
  });

  it('applies the settings of a pasted link', async () => {
    const props = setup();
    await userEvent.click(shareButton());
    // Six words: hand 5, one player, every option on, so the settings are all restored as is.
    const link = shareInput().value;
    fireEvent.change(shareInput(), { target: { value: '' } });
    fireEvent.change(shareInput(), { target: { value: link } });
    expect(props.setSelectedCategories).toHaveBeenLastCalledWith(ALL_CATEGORIES);
    expect(props.setSuddenDeathHandSize).toHaveBeenLastCalledWith(5);
  });

  it('marks a link that does not decode, and will not share it', async () => {
    setup();
    await userEvent.click(shareButton());
    await userEvent.clear(shareInput());
    await userEvent.type(shareInput(), 'not a code');
    expect(shareInput()).toHaveClass('border-error');
    expect(screen.getByRole('button', { name: /Share link/ })).toBeDisabled();
  });

  it('withholds the link while a group is empty, since it would not load', () => {
    setup({ selectedCategories: [], isPlayValid: false, deckCount: 0 });
    expect(shareButton()).toBeDisabled();
    expect(screen.getByRole('button', { name: /Play · 0 events/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Categories/ })).toHaveTextContent('None');
  });
});
