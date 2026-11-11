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

describe('FilterControls, folded (the Custom tab)', () => {
  const foldRow = (title: string) =>
    screen
      .getAllByRole('button')
      .find((b) => b.hasAttribute('aria-expanded') && b.textContent?.startsWith(title)) as
      | HTMLElement
      | undefined;

  it('folds every group to a row stating its setting, with no chips showing', () => {
    setup({ collapsible: true });
    expect(foldRow('Difficulty')).toHaveTextContent('All 4');
    expect(foldRow('Categories')).toHaveTextContent(`All ${ALL_CATEGORIES.length}`);
    expect(foldRow('Eras')).toHaveTextContent('All 8');
    expect(foldRow('Regions')).toHaveTextContent(`All ${ALL_REGIONS.length}`);
    expect(screen.getByRole('button', { name: /^Countries/ })).toHaveTextContent('All');
    expect(screen.queryByRole('button', { name: 'Easy' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear Categories' })).not.toBeInTheDocument();
  });

  it('opens one group at a time in place, and folds it again on a second tap', async () => {
    setup({ collapsible: true });
    await userEvent.click(foldRow('Difficulty') as HTMLElement);
    expect(foldRow('Difficulty')).toHaveAttribute('aria-expanded', 'true');
    expect(button('Easy')).toBeInTheDocument();
    expect(button('Clear Card Difficulty')).toBeEnabled();

    await userEvent.click(foldRow('Eras') as HTMLElement);
    expect(foldRow('Difficulty')).toHaveAttribute('aria-expanded', 'false');
    expect(foldRow('Eras')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('button', { name: 'Easy' })).not.toBeInTheDocument();
    expect(button('Renaissance')).toBeInTheDocument();

    await userEvent.click(foldRow('Eras') as HTMLElement);
    expect(screen.queryByRole('button', { name: 'Renaissance' })).not.toBeInTheDocument();
  });

  it('marks a changed group in teal and leaves a default one muted', () => {
    setup({ collapsible: true, selectedCategories: ['science'] });
    expect(screen.getByText('Science')).toHaveClass('text-accent-secondary');
    expect(screen.getByText('All 4')).toHaveClass('text-text-muted');
  });

  it('counts a partial group and says None for an empty one, prompting once open', async () => {
    setup({ collapsible: true, selectedCategories: ['science', 'art'], selectedEras: [] });
    expect(foldRow('Categories')).toHaveTextContent(`2 of ${ALL_CATEGORIES.length}`);
    expect(screen.getByText('None')).toHaveClass('text-accent-secondary');
    await userEvent.click(foldRow('Eras') as HTMLElement);
    expect(screen.getByText('Pick at least one era')).toBeInTheDocument();
  });

  it('keeps the double-tap isolate inside an open group', async () => {
    const props = setup({ collapsible: true });
    await userEvent.click(foldRow('Difficulty') as HTMLElement);
    await userEvent.click(button('Medium'));
    await userEvent.click(button('Medium'));
    expect(props.onDifficultiesChange).toHaveBeenLastCalledWith(['medium']);
  });

  it('shows switched-off countries on their own row, in teal', () => {
    setup({ collapsible: true, excludedCountries: ['Europe|Germany'] });
    // `countrySummary`'s wording, unchanged: Europe's only other listed country is on.
    expect(screen.getByText('France')).toHaveClass('text-accent-secondary');
    // Regions counts regions; the countries are the next row's business.
    expect(foldRow('Regions')).toHaveTextContent(`All ${ALL_REGIONS.length}`);
  });
});
