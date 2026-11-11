import { registerBackHandler, runTopBackHandler } from './backStack';

describe('backStack', () => {
  it('reports nothing to run when empty', () => {
    expect(runTopBackHandler()).toBe(false);
  });

  it('runs the most recently registered handler only', () => {
    const first = jest.fn();
    const second = jest.fn();
    const offFirst = registerBackHandler(first);
    const offSecond = registerBackHandler(second);

    expect(runTopBackHandler()).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    offSecond();
    runTopBackHandler();
    expect(first).toHaveBeenCalledTimes(1);
    offFirst();
  });

  it('keeps a base handler under one registered before it', () => {
    const popup = jest.fn();
    const base = jest.fn();
    const offPopup = registerBackHandler(popup);
    const offBase = registerBackHandler(base, true);

    runTopBackHandler();
    expect(popup).toHaveBeenCalledTimes(1);
    expect(base).not.toHaveBeenCalled();

    offPopup();
    runTopBackHandler();
    expect(base).toHaveBeenCalledTimes(1);
    offBase();
  });
});
