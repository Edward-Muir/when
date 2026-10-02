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
const doubleTap = async (name: string) => {
  await userEvent.click(chip(name));
  await userEvent.click(chip(name));
};
/** Every Europe country in the taxonomy except these, as switched-off pairs. */
const europeExcept = (...on: string[]) =>
  countriesInRegion('Europe')
    .filter((c) => !on.includes(c))
    .map((c) => `Europe|${c}`);

describe('CountryPickerModal', () => {
  it('lists every region, an unselected one with its chips off', () => {
    setup();
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Japan')).toHaveAttribute('aria-pressed', 'false');
  });

  it('counts each region like the other filter groups', () => {
    setup({ excludedCountries: ['Europe|Germany'] });
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('starts with every country on', () => {
    setup();
    expect(chip('France')).toHaveAttribute('aria-pressed', 'true');
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('switches a country off with one tap', async () => {
    const props = setup();
    await userEvent.click(chip('Germany'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith(['Europe|Germany']);
    expect(props.onRegionsChange).not.toHaveBeenCalled();
  });

  it('shows a switched-off country as off, and turns it back on with one tap', async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    expect(chip('Germany')).toHaveAttribute('aria-pressed', 'false');
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

  it('isolates a country within its region on double-tap, leaving other regions alone', async () => {
    const props = setup({ selectedRegions: ['Europe', 'East Asia'] });
    await doubleTap('Germany');
    expect(props.onExcludedChange).toHaveBeenLastCalledWith(europeExcept('Germany'));
    expect(props.onRegionsChange).not.toHaveBeenCalled();
  });

  it('restores the whole region on a double-tap of its only country', async () => {
    // Stateful, as in the app: the first tap turns Europe off and the second must bring it back.
    let latest = { regions: ['Europe'], excluded: europeExcept('Germany') };
    const Harness = () => {
      const [regions, setRegions] = React.useState(latest.regions);
      const [excluded, setExcluded] = React.useState(latest.excluded);
      latest = { regions, excluded };
      return (
        <CountryPickerModal
          open
          onClose={jest.fn()}
          selectedRegions={regions}
          onRegionsChange={setRegions}
          excludedCountries={excluded}
          onExcludedChange={setExcluded}
          countryOptions={options}
        />
      );
    };
    render(<Harness />);
    await doubleTap('Germany');
    expect(latest).toEqual({ regions: ['Europe'], excluded: [] });
  });

  it('keeps a region listed after its last country is switched off', () => {
    setup({ selectedRegions: [], excludedCountries: [] });
    expect(chip('France')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('0/2')).toBeInTheDocument();
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

  it("turns a region off with its header's Clear, keeping its chips listed", async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(chip('Clear Europe'));
    expect(props.onRegionsChange).toHaveBeenCalledWith([]);
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
  });

  it("restores a whole region with its header's Select all", async () => {
    const props = setup({ excludedCountries: ['Europe|Germany'] });
    await userEvent.click(chip('Select all Europe'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith([]);
    expect(props.onRegionsChange).not.toHaveBeenCalled();
  });

  it('selects an off region whole from its header', async () => {
    const props = setup();
    await userEvent.click(chip('Select all East Asia'));
    expect(props.onRegionsChange).toHaveBeenCalledWith(['Europe', 'East Asia']);
  });

  it('disables a region header button that would change nothing', () => {
    setup();
    expect(chip('Select all Europe')).toBeDisabled();
    expect(chip('Clear Europe')).toBeEnabled();
    expect(chip('Select all East Asia')).toBeEnabled();
    expect(chip('Clear East Asia')).toBeDisabled();
  });

  it('clears only the matching countries while searching', async () => {
    const props = setup();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search countries' }), 'ger');
    await userEvent.click(chip('Clear Europe'));
    expect(props.onExcludedChange).toHaveBeenLastCalledWith(europeExcept('France'));
    expect(props.onRegionsChange).not.toHaveBeenCalled();
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

  it('never expands the collapsed list when a region turns partial', () => {
    const nine = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Zed'];
    setup({ countryOptions: new Map([['Europe', nine]]), excludedCountries: ['Europe|A1'] });
    expect(screen.queryByRole('button', { name: 'Zed' })).toBeNull();
    expect(chip('+1 more')).toBeInTheDocument();
  });
});
