import { preloadImage, preloadEventImages, holdDecoded } from './preloadImage';

describe('preloadImage', () => {
  let instances: Array<{ src: string; fetchPriority?: string }>;
  let ImageMock: jest.Mock;

  beforeEach(() => {
    instances = [];
    ImageMock = jest.fn(function (this: { src: string }) {
      this.src = '';
      instances.push(this as { src: string; fetchPriority?: string });
    });
    (global as unknown as { Image: unknown }).Image = ImageMock;
  });

  it('creates one Image per unique URL and deduplicates repeats', () => {
    preloadImage('https://res.cloudinary.com/x/image/upload/a.jpg');
    preloadImage('https://res.cloudinary.com/x/image/upload/a.jpg');
    preloadImage('https://res.cloudinary.com/x/image/upload/b.jpg');

    expect(ImageMock).toHaveBeenCalledTimes(2);
  });

  it('is a no-op for an undefined URL', () => {
    preloadImage(undefined);
    expect(ImageMock).not.toHaveBeenCalled();
  });

  it('sets low fetch priority when requested', () => {
    preloadImage('https://res.cloudinary.com/x/image/upload/low.jpg', 'low');
    expect(instances[0].fetchPriority).toBe('low');

    preloadImage('https://res.cloudinary.com/x/image/upload/auto.jpg');
    expect(instances[1].fetchPriority).toBeUndefined();
  });
});

describe('preloadEventImages', () => {
  let instances: Array<{ src: string }>;

  beforeEach(() => {
    instances = [];
    (global as unknown as { Image: unknown }).Image = jest.fn(function (this: { src: string }) {
      this.src = '';
      instances.push(this as { src: string });
    });
  });

  it('warms each requested variant as a distinct URL and skips undefined events', () => {
    const event = { image_url: 'https://res.cloudinary.com/x/image/upload/ev1.jpg' };
    preloadEventImages([event, undefined], ['thumbnail', 'detail']);

    const srcs = instances.map((i) => i.src);
    expect(srcs).toHaveLength(2);
    expect(srcs.some((s) => s.includes('w_400'))).toBe(true); // thumbnail variant
    expect(srcs.some((s) => s.includes('w_768'))).toBe(true); // detail variant
    expect(new Set(srcs).size).toBe(2); // distinct URLs, so each variant dedupes separately
  });
});

describe('holdDecoded', () => {
  it('decodes one Image per URL, skips empty ones, and survives a failed decode', () => {
    const made: Array<{ src: string; decode: jest.Mock }> = [];
    (global as unknown as { Image: unknown }).Image = jest.fn(function (this: {
      src: string;
      decode: jest.Mock;
    }) {
      this.src = '';
      this.decode = jest.fn(() => Promise.reject(new Error('broken image')));
      made.push(this);
    });

    expect(() =>
      holdDecoded(['https://x/hold-a.jpg', undefined, 'https://x/hold-b.jpg'])
    ).not.toThrow();

    expect(made.map((m) => m.src)).toEqual(['https://x/hold-a.jpg', 'https://x/hold-b.jpg']);
    expect(made.every((m) => m.decode.mock.calls.length === 1)).toBe(true);
  });

  it('works where Image has no decode()', () => {
    (global as unknown as { Image: unknown }).Image = jest.fn(function (this: { src: string }) {
      this.src = '';
    });
    expect(() => holdDecoded(['https://x/hold-c.jpg'])).not.toThrow();
  });
});
