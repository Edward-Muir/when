import { preloadImage, preloadEventImages } from './preloadImage';

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
    expect(srcs.some((s) => s.includes('w_220'))).toBe(true); // thumbnail variant
    expect(srcs.some((s) => s.includes('q_auto:good') && !s.includes('w_220'))).toBe(true); // detail
  });
});
