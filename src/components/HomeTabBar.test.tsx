import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomeTabBar from './HomeTabBar';
import { TABS, TabKey } from './homeTabs';
import { NAV_DOT_SETTLE_MS } from '../hooks/useNavDots';
import { armNavOnce, hasSeenNav, markNavSeen, markNavUnseen } from '../utils/playerStorage';

beforeEach(() => localStorage.clear());

const renderBar = (activeKey: TabKey = 'home') => {
  const onSelect = jest.fn();
  const view = render(<HomeTabBar activeKey={activeKey} onSelect={onSelect} />);
  const rerenderOn = (key: TabKey) =>
    view.rerender(<HomeTabBar activeKey={key} onSelect={onSelect} />);
  return { onSelect, rerenderOn };
};

const dots = () => screen.queryAllByRole('img', { name: 'New' });

describe('HomeTabBar', () => {
  it('shows the five tabs in order, each with its word, under the labels scripts select by', () => {
    renderBar();
    const tabs = screen.getAllByRole('button');
    expect(tabs.map((t) => t.getAttribute('aria-label'))).toEqual([
      'Go home',
      'Past decks',
      'Custom game',
      'View stats',
      'View my timeline',
    ]);
    expect(tabs.map((t) => t.textContent)).toEqual(TABS.map((tab) => tab.label));
  });

  it('marks only the active tab as the current page, teal on Custom and gold elsewhere', () => {
    const { rerenderOn } = renderBar('stats');
    expect(screen.getByLabelText('View stats')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('View stats')).toHaveClass('text-accent');
    expect(screen.getByLabelText('Go home')).not.toHaveAttribute('aria-current');
    expect(screen.getByLabelText('Go home')).toHaveClass('text-text-muted');

    rerenderOn('custom');
    expect(screen.getByLabelText('Custom game')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByLabelText('Custom game')).toHaveClass('text-accent-secondary');
  });

  it('asks for the tab, and leaves the highlight to the pager', async () => {
    const { onSelect } = renderBar('home');
    await userEvent.click(screen.getByLabelText('View my timeline'));
    expect(onSelect).toHaveBeenCalledWith('timeline');
    // The highlight moves only when the scroll arrives (activeKey), never on the tap itself.
    expect(screen.getByLabelText('Go home')).toHaveAttribute('aria-current', 'page');
  });

  it('draws Custom as sliders, not a settings cog', () => {
    renderBar();
    // Lucide stamps the icon's name on the svg; there is no accessible query for a glyph.
    // eslint-disable-next-line testing-library/no-node-access
    const icon = screen.getByLabelText('Custom game').querySelector('svg');
    expect(icon).toHaveClass('lucide-sliders-horizontal');
  });
});

describe('HomeTabBar "new" dots', () => {
  afterEach(() => jest.useRealTimers());

  it('shows none on a fresh install', () => {
    renderBar();
    expect(dots()).toHaveLength(0);
    expect(hasSeenNav('archive')).toBe(true);
  });

  it('shows the armed dots on their own tabs', () => {
    markNavUnseen('stats');
    armNavOnce('timeline');
    renderBar();
    expect(dots()).toHaveLength(2);
    expect(screen.getByLabelText('View stats')).toContainElement(dots()[0]);
    expect(screen.getByLabelText('View my timeline')).toContainElement(dots()[1]);
  });

  it('clears a dot once the pager settles on its tab, and remembers it', () => {
    jest.useFakeTimers();
    armNavOnce('archive');
    const { rerenderOn } = renderBar('home');
    expect(screen.getByLabelText('Past decks')).toContainElement(dots()[0]);

    rerenderOn('archive');
    act(() => jest.advanceTimersByTime(NAV_DOT_SETTLE_MS));
    expect(dots()).toHaveLength(0);
    expect(hasSeenNav('archive')).toBe(true);
  });

  it('keeps the dot on a tab the pager only scrolls across', () => {
    jest.useFakeTimers();
    markNavUnseen('stats');
    const { rerenderOn } = renderBar('home');
    rerenderOn('archive');
    rerenderOn('stats');
    act(() => jest.advanceTimersByTime(NAV_DOT_SETTLE_MS / 4));
    rerenderOn('timeline');
    act(() => jest.advanceTimersByTime(NAV_DOT_SETTLE_MS));
    expect(screen.getByLabelText('View stats')).toContainElement(dots()[0]);
    expect(hasSeenNav('stats')).toBe(false);
  });

  it('clears the dot of the tab Home opens on', () => {
    jest.useFakeTimers();
    markNavSeen('archive');
    markNavUnseen('stats');
    renderBar('stats');
    act(() => jest.advanceTimersByTime(NAV_DOT_SETTLE_MS));
    expect(dots()).toHaveLength(0);
  });
});
