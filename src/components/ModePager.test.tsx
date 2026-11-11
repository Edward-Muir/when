import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ModePager, { ModePagerHandle } from './ModePager';

const LABELS = ['Daily', 'Archive', 'Custom', 'Stats', 'Timeline'];
const PAGE_WIDTH = 400;

// jsdom does no layout, so every element reports a width of 0 and the pager would bail out.
let widthSpy: jest.SpyInstance;
beforeEach(() => {
  widthSpy = jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(PAGE_WIDTH);
  HTMLElement.prototype.scrollTo = jest.fn();
});
afterEach(() => widthSpy.mockRestore());

const renderPager = (props: Partial<React.ComponentProps<typeof ModePager>> = {}) => {
  const ref = React.createRef<ModePagerHandle>();
  render(
    <ModePager ref={ref} {...props}>
      {LABELS.map((label) => (
        <div key={label}>{label} page</div>
      ))}
    </ModePager>
  );
  // eslint-disable-next-line testing-library/no-node-access -- the track is the pages' parent
  const track = screen.getByText('Daily page').parentElement!.parentElement!;
  return { ref, track };
};

describe('ModePager', () => {
  it('renders one page per child, and no indicator of its own', () => {
    renderPager();
    LABELS.forEach((label) => expect(screen.getByText(`${label} page`)).toBeInTheDocument());
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('Daily')).toBeNull();
  });

  it('opens on the requested page without a slide', () => {
    const { track } = renderPager({ initialIndex: 4 });
    expect(track.scrollLeft).toBe(4 * PAGE_WIDTH);
  });

  it('reports the page under the scroll position', () => {
    const onIndexChange = jest.fn();
    const { track } = renderPager({ onIndexChange });
    track.scrollLeft = 2 * PAGE_WIDTH + 30;
    fireEvent.scroll(track);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
  });

  it('scrolls to a page through its handle, clamped to the last', () => {
    const { ref, track } = renderPager();
    ref.current!.scrollToPage(3);
    expect(track.scrollTo).toHaveBeenLastCalledWith({ left: 3 * PAGE_WIDTH, behavior: 'smooth' });
    ref.current!.scrollToPage(9);
    expect(track.scrollTo).toHaveBeenLastCalledWith({ left: 4 * PAGE_WIDTH, behavior: 'smooth' });
  });
});
