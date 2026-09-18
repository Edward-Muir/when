import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Changelog from './Changelog';

const RELEASES = {
  documentedFrom: '1.24.0',
  unreleased: [],
  releases: [
    { version: '1.24.0', date: '2026-09-18', notes: ['Some events now cover a span of years.'] },
    { version: '1.23.0', date: '2026-09-17', notes: ['Every card now carries background.'] },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <Changelog />
    </MemoryRouter>
  );

beforeEach(() => {
  global.fetch = jest.fn() as unknown as typeof fetch;
});

describe('Changelog', () => {
  it('lists each release with its date and notes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => RELEASES,
    });

    renderPage();

    expect(await screen.findByText(/Some events now cover a span of years/)).toBeInTheDocument();
    expect(screen.getByText(/Every card now carries background/)).toBeInTheDocument();
    expect(screen.getByText(/18 September 2026/)).toBeInTheDocument();
  });

  // A blank page reads as "nothing has ever changed", which is worse than saying so.
  it('says so when the history cannot be loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    renderPage();

    expect(await screen.findByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it('says so when no release has been written up', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ documentedFrom: '1.24.0', unreleased: [], releases: [] }),
    });

    renderPage();

    expect(await screen.findByText(/no releases have been written up/i)).toBeInTheDocument();
  });
});
