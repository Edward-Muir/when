import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HomeRoute from './Home';

jest.mock('../App', () => ({
  __esModule: true,
  default: ({ initialTab }: { initialTab?: string }) => <div>App on {initialTab}</div>,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:tab?" element={<HomeRoute />} />
        <Route path="/daily" element={<h1>Daily route</h1>} />
      </Routes>
    </MemoryRouter>
  );

describe('HomeRoute', () => {
  it('opens the home screen on the tab the path names', () => {
    renderAt('/stats');
    expect(screen.getByText('App on stats')).toBeInTheDocument();
  });

  it('opens on Daily at the root', () => {
    renderAt('/');
    expect(screen.getByText('App on home')).toBeInTheDocument();
  });

  it('sends the retired Achievements path to the Stats tab', () => {
    renderAt('/achievements');
    expect(screen.getByText('App on stats')).toBeInTheDocument();
  });

  it('falls back to the root for an unknown segment', () => {
    renderAt('/nonsense');
    expect(screen.getByText('App on home')).toBeInTheDocument();
  });

  it('leaves static routes to their own pages', () => {
    renderAt('/daily');
    expect(screen.getByRole('heading', { name: 'Daily route' })).toBeInTheDocument();
  });
});
