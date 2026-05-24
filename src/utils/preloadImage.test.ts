import { preloadImage } from './preloadImage';

describe('preloadImage', () => {
  let ImageMock: jest.Mock;

  beforeEach(() => {
    ImageMock = jest.fn(function (this: { src: string }) {
      this.src = '';
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
});
