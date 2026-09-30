import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountryPickerModal from './CountryPickerModal';

const options = new Map([
  ['Europe', ['France', 'Germany']],
  ['East Asia', ['Japan']],
]);

function setup(overrides: Partial<React.ComponentProps<typeof CountryPickerModal>> = {}) {
  const props = {
    open: true,
    onClose: jest.fn(),
    selectedRegions: ['Europe'],
    onRegionsChange: jest.fn(),
    selectedCountries: [] as string[],
    onCountriesChange: jest.fn(),
    countryOptions: options,
    matchCount: 326,
    ...overrides,
  };
  render(<CountryPickerModal {...props} />);
  return props;
}

describe('CountryPickerModal', () => {
  it("lists only the selected regions' countries until a search", () => {
    setup();
    expect(screen.getByRole('button', { name: 'Germany' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Japan' })).toBeNull();
  });

  it('toggles a country', async () => {
    const props = setup({ selectedCountries: ['France'] });
    await userEvent.click(screen.getByRole('button', { name: 'Germany' }));
    expect(props.onCountriesChange).toHaveBeenLastCalledWith(['France', 'Germany']);
    await userEvent.click(screen.getByRole('button', { name: 'France' }));
    expect(props.onCountriesChange).toHaveBeenLastCalledWith([]);
    expect(props.onRegionsChange).not.toHaveBeenCalled();
  });

  it('adds the region of a country found by search outside the selection', async () => {
    const props = setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search countries' }), 'jap');
    await userEvent.click(screen.getByRole('button', { name: 'Japan' }));
    expect(props.onRegionsChange).toHaveBeenCalledWith(['Europe', 'East Asia']);
    expect(props.onCountriesChange).toHaveBeenCalledWith(['Japan']);
  });

  it('clears every pick, and shows the deal count on Done', async () => {
    const props = setup({ selectedCountries: ['Germany'] });
    await userEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(props.onCountriesChange).toHaveBeenCalledWith([]);
    await userEvent.click(screen.getByRole('button', { name: 'Done · 326 events' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the first eight behind "+N more", but every match while searching', async () => {
    const nine = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Zed'];
    setup({ countryOptions: new Map([['Europe', nine]]), selectedCountries: [] });
    expect(screen.queryByRole('button', { name: 'Zed' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: '+1 more' }));
    expect(screen.getByRole('button', { name: 'Zed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search countries' }), 'z');
    expect(screen.getByRole('button', { name: 'Zed' })).toBeInTheDocument();
  });

  it('keeps a picked country visible in the collapsed tail', () => {
    const nine = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Zed'];
    setup({ countryOptions: new Map([['Europe', nine]]), selectedCountries: ['Zed'] });
    expect(screen.getByRole('button', { name: 'Zed' })).toBeInTheDocument();
  });
});
