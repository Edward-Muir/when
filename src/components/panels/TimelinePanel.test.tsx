import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimelinePanel from './TimelinePanel';
import { hasSeenHint, markHintSeen } from '../../utils/playerStorage';
import { TAB_HINT_TEXT } from '../../utils/hintCopy';
import { TAB_HINT_MOUNT_DELAY_MS } from '../../hooks/useTabHint';

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    })),
  });
});

afterEach(() => {
  jest.useRealTimers();
});

const settle = () => act(() => jest.advanceTimersByTime(TAB_HINT_MOUNT_DELAY_MS));

describe('TimelinePanel first-visit hint', () => {
  it('shows the strip once the tab is on screen, and marks it', () => {
    render(<TimelinePanel allEvents={[]} active />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    settle();
    expect(screen.getByRole('status')).toHaveTextContent(TAB_HINT_TEXT.timelineTab);
    expect(hasSeenHint('timelineTab')).toBe(true);
    // No modal: the old "Got it" explainer is gone.
    expect(screen.queryByRole('button', { name: 'Got it' })).toBeNull();
  });

  it('stays quiet while the panel is pre-mounted off screen', () => {
    render(<TimelinePanel allEvents={[]} active={false} />);
    settle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(hasSeenHint('timelineTab')).toBe(false);
  });

  it('does not return once seen, and honours the old intro flag', () => {
    markHintSeen('timelineTab');
    const { unmount } = render(<TimelinePanel allEvents={[]} active />);
    settle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    unmount();

    localStorage.clear();
    localStorage.setItem('when-timeline-intro-seen', '1');
    render(<TimelinePanel allEvents={[]} active />);
    settle();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('dismisses on tap', async () => {
    render(<TimelinePanel allEvents={[]} active />);
    settle();
    await userEvent.click(screen.getByRole('button', { name: TAB_HINT_TEXT.timelineTab }));
    // The strip fades out; drive the exit animation to its end.
    act(() => jest.advanceTimersByTime(1000));
    await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  });
});
