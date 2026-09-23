import { readJson, readString, removeKeys, writeJson, writeString } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => jest.restoreAllMocks());

  it('round-trips JSON and strings', () => {
    writeJson('k', { a: 1 }, 'thing');
    expect(readJson('k', null)).toEqual({ a: 1 });

    writeString('s', 'hello', 'greeting');
    expect(readString('s')).toBe('hello');
  });

  it('returns the fallback for a missing key without calling normalize', () => {
    const normalize = jest.fn();
    expect(readJson('missing', 'fallback', normalize)).toBe('fallback');
    expect(normalize).not.toHaveBeenCalled();
  });

  it('returns the fallback for corrupt JSON', () => {
    localStorage.setItem('k', '{not json');
    expect(readJson('k', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when normalize throws on a malformed record', () => {
    localStorage.setItem('k', 'null');
    const normalize = (raw: unknown) => Object.keys(raw as object).length;
    expect(readJson('k', -1, normalize)).toBe(-1);
  });

  it('applies normalize to the parsed value', () => {
    localStorage.setItem('k', JSON.stringify({ n: 2 }));
    expect(readJson('k', 0, (raw) => (raw as { n: number }).n * 10)).toBe(20);
  });

  it('keeps session and local storage apart', () => {
    writeJson('k', 'session', 'thing', 'session');
    expect(readJson('k', null)).toBeNull();
    expect(readJson('k', null, undefined, 'session')).toBe('session');
  });

  it('removes every listed key', () => {
    localStorage.setItem('a', '1');
    localStorage.setItem('b', '2');
    removeKeys(['a', 'b'], 'things');
    expect(localStorage.length).toBe(0);
  });

  it('never throws when storage itself throws', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const denied = () => {
      throw new Error('denied');
    };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(denied);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(denied);
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(denied);

    expect(readJson('k', 'fallback')).toBe('fallback');
    expect(readString('k')).toBeNull();
    expect(() => writeJson('k', 1, 'thing')).not.toThrow();
    expect(() => removeKeys(['k'], 'thing')).not.toThrow();
    expect(warn).toHaveBeenCalledWith('Failed to save thing to localStorage');
    expect(warn).toHaveBeenCalledWith('Failed to clear thing from localStorage');
  });
});
