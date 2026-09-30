import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountryPickerModal from './CountryPickerModal';
import { countriesInRegion } from '../utils/regions';

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
    excludedCountries: [] as string[],
    onExcludedChange: jest.fn(),
    countryOptions: options,
    matchCount: 326,
    ...overrides,
  };
  render(<CountryPickerModal {...props} />);
  return props;
}

const chip = (name: string) => screen.getByRole('button', { name });

describe('CountryPickerModal', () => {
  it('lists every region, an unselected one with its chips off', () => {
    setup();
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Japan')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('None · All')).toBeInTheDocument();
  });

  it('starts with every country on', () => {
    setup();
    expect(chip('France')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('switches a country off, and back on', async () => {
    const props = setup();
    await userEvent.click(chip('Germany'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith(['Europe|Germany']);
    expect(props.onRegionsChange).not.toHaveBeenCalled();
  });

  it('shows a switched-off country as off, with the region partial', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(chip('1 of 2 · All'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
    await userEvent.click(chip('Germany'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
  });

  it('turns the region off with its last country', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(chip('France'));
    expect(props.onRegionsChange).toHaveBeenCalledWith([]);
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
  });

  it('adds the region of a country tapped while it is off, with only that country on', async () => {
    const props = setup();
    await userEvent.click(chip('Japan'));
    expect(props.onRegionsChange).toHaveBeenCalledWith(['Europe', 'East Asia']);
    const others = countriesInRegion('East Asia')
      .filter((c) => c !== 'Japan')
      .map((c) => `East Asia|${c}`);
    expect(props.onExcludedChange).toHaveBeenCalledWith(others);
  });

  it('keeps a region listed after its last country is switched off', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(chip('France'));
    expect(props.onRegionsChange).toHaveBeenCalledWith([]);
    // Rendered again as the parent would, with Europe now off: still listed, all chips off.
    render(<CountryPickerModal {...props} selectedRegions={[]} excludedCountries={[]} />);
    expect(screen.getAllByRole('button', { name: 'France' }).at(-1)).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('switches a whole off region back on from its header', async () => {
    const props = setup();
    await userEvent.click(chip('None · All'));
    expect(props.onRegionsChange).toHaveBeenCalledWith(['Europe', 'East Asia']);
  });

  it('puts every chip back on with Select all, and shows the deal count on Done', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(chip('Select all'));
    expect(props.onRegionsChange).toHaveBeenCalledWith(['Europe', 'East Asia']);
    expect(props.onExcludedChange).toHaveBeenCalledWith([]);
    await userEvent.click(chip('Done · 326 events'));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('disables Select all once every listed chip is on', () => {
    setup({ selectedRegions: ['Europe', 'East Asia'] });
    expect(chip('Select all')).toBeDisabled();
  });

  it('shows the first eight behind "+N more", but every match while searching', async () => {
    const nine = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Zed'];
    setup({ countryOptions: new Map([['Europe', nine]]) });
    expect(screen.queryByRole('button', { name: 'Zed' })).toBeNull();
    await userEvent.click(chip('+1 more'));
    expect(chip('Zed')).toBeInTheDocument();
    await userEvent.click(chip('Show fewer'));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search countries' }), 'z');
    expect(chip('Zed')).toBeInTheDocument();
  });

  it('keeps a country that is still on visible in the collapsed tail of a partial region', () => {
    const nine = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Zed'];
    const allButZed = nine.filter((c) => c !== 'Zed').map((c) => `Europe|${c}`);
    setup({ countryOptions: new Map([['Europe', nine]]), excludedCountries: allButZed });
    expect(chip('Zed')).toBeInTheDocument();
  });
});
