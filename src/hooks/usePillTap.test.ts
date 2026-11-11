import { renderHook } from '@testing-library/react';
import { usePillTap } from './usePillTap';

const mockSelect = jest.fn();
jest.mock('./useHaptics', () => ({
  useHaptics: () => ({ haptics: { select: () => mockSelect() } }),
}));

describe('usePillTap haptics', () => {
  beforeEach(() => mockSelect.mockClear());

  it('ticks once on a single tap', () => {
    const { result } = renderHook(() => usePillTap());
    const toggle = jest.fn();
    result.current('a', 'k:a', ['a', 'b'], ['a', 'b'], jest.fn(), toggle);

    expect(toggle).toHaveBeenCalledWith('a');
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });

  it('ticks once for a double-tap isolate, which is one action', () => {
    const { result } = renderHook(() => usePillTap());
    const onChange = jest.fn();
    result.current('a', 'k:a', ['a', 'b'], ['a', 'b'], onChange, jest.fn());
    result.current('a', 'k:a', ['b'], ['a', 'b'], onChange, jest.fn());

    expect(onChange).toHaveBeenCalledWith(['a']);
    expect(mockSelect).toHaveBeenCalledTimes(1);
  });
});
