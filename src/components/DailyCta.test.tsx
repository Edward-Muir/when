import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyCta from './DailyCta';

const noop = jest.fn();

function renderCta(props: Partial<React.ComponentProps<typeof DailyCta>> = {}) {
  return render(
    <DailyCta played unclaimed={false} onShare={noop} onPlay={noop} onSubmit={noop} {...props} />
  );
}

const eye = () => screen.queryByRole('button', { name: /review today's timeline/i });

describe('DailyCta review button', () => {
  it('is absent before the daily is played', () => {
    renderCta({ played: false, canReview: true });

    expect(screen.getByRole('button', { name: /play daily challenge/i })).toBeInTheDocument();
    expect(eye()).not.toBeInTheDocument();
  });

  it('is absent when there is no board to restore', () => {
    renderCta({ canReview: false });

    expect(screen.getByRole('button', { name: /challenge a friend/i })).toBeInTheDocument();
    expect(eye()).not.toBeInTheDocument();
  });

  it('sits beside the share once the daily is done, and opens the board', async () => {
    const onReview = jest.fn();
    renderCta({ canReview: true, onReview });

    expect(screen.getByRole('button', { name: /challenge a friend/i })).toBeInTheDocument();
    await userEvent.click(eye() as HTMLElement);

    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('sits beside the submit button too, so the review is there whichever is showing', () => {
    renderCta({ unclaimed: true, canReview: true });

    expect(screen.getByRole('button', { name: /submit your score/i })).toBeInTheDocument();
    expect(eye()).toBeInTheDocument();
  });

  it('halos only while the strip is up, which is what points at it', () => {
    const { rerender } = renderCta({ canReview: true });
    expect(eye()).not.toHaveClass('animate-hint-halo');

    rerender(
      <DailyCta
        played
        unclaimed={false}
        onShare={noop}
        onPlay={noop}
        onSubmit={noop}
        canReview
        reviewNudge
      />
    );
    expect(eye()).toHaveClass('animate-hint-halo');
  });
});
