import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FilterControls from './FilterControls';
import { ALL_CATEGORIES, ALL_DIFFICULTIES } from '../types';
import { ALL_ERAS } from '../utils/eras';
import { ALL_REGIONS } from '../utils/regions';

function setup(overrides: Partial<React.ComponentProps<typeof FilterControls>> = {}) {
  const props = {
    selectedDifficulties: [...ALL_DIFFICULTIES],
    onDifficultiesChange: jest.fn(),
    selectedCategories: [...ALL_CATEGORIES],
    onCategoriesChange: jest.fn(),
    selectedEras: [...ALL_ERAS],
    onErasChange: jest.fn(),
    selectedRegions: [...ALL_REGIONS],
    onRegionsChange: jest.fn(),
    excludedCountries: [] as string[],
    onExcludedChange: jest.fn(),
    countryOptions: new Map([['Europe', ['France', 'Germany']]]),
    showCounts: true,
    ...overrides,
  };
  render(<FilterControls {...props} />);
  return props;
}

const button = (name: string) => screen.getByRole('button', { name });

describe('FilterControls', () => {
  it('starts with every group full: Select all disabled, Clear ready', () => {
    setup();
    // The four group headers, and the Countries row's summary.
    expect(screen.getAllByText('All')).toHaveLength(5);
    expect(button('Select all Categories')).toBeDisabled();
    expect(button('Clear Categories')).toBeEnabled();
  });

  it('clears a group, and selects all of it again', async () => {
    const props = setup({ selectedCategories: ['science'] });
    expect(screen.getByText(`1/${ALL_CATEGORIES.length}`)).toBeInTheDocument();
    await userEvent.click(button('Clear Categories'));
    expect(props.onCategoriesChange).toHaveBeenLastCalledWith([]);
    await userEvent.click(button('Select all Categories'));
    expect(props.onCategoriesChange).toHaveBeenLastCalledWith(ALL_CATEGORIES);
  });

  it('disables Clear on an empty group and prompts for a pick', () => {
    setup({ selectedEras: [] });
    expect(button('Clear Eras')).toBeDisabled();
    expect(button('Select all Eras')).toBeEnabled();
    expect(screen.getByText('Pick at least one era')).toBeInTheDocument();
  });

  it('treats a region with countries switched off as not all selected', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    expect(screen.getByText(`${ALL_REGIONS.length - 1}/${ALL_REGIONS.length}`)).toBeInTheDocument();
    await userEvent.click(button('Select all Regions'));
    expect(props.onRegionsChange).toHaveBeenLastCalledWith([...ALL_REGIONS]);
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
  });

  it('clears every region along with its switched-off countries', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(button('Clear Regions'));
    expect(props.onRegionsChange).toHaveBeenLastCalledWith([]);
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
  });

  it('marks each chip on, off or partly on for assistive tech', () => {
    setup({ selectedDifficulties: ['easy'], excludedCountries: ['Europe|Germany'] });
    expect(button('Easy')).toHaveAttribute('aria-pressed', 'true');
    expect(button('Hard')).toHaveAttribute('aria-pressed', 'false');
    expect(button('Europe')).toHaveAttribute('aria-pressed', 'mixed');
  });

  it('still isolates a chip on double-tap', async () => {
    const props = setup();
    await userEvent.click(button('Medium'));
    await userEvent.click(button('Medium'));
    expect(props.onDifficultiesChange).toHaveBeenLastCalledWith(['medium']);
  });
});
