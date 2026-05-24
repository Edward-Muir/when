import { getImageUrl, isCloudinaryImage } from './cloudinaryImage';

const CLOUDINARY =
  'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda?_a=BAMAMiiu0';
const WIKIMEDIA =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/330px-Example.jpg';

describe('getImageUrl', () => {
  it('keeps the detail variant at full size (no width cap), preserving the query', () => {
    expect(getImageUrl(CLOUDINARY, 'detail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda?_a=BAMAMiiu0'
    );
  });

  it('does not add a width to the detail variant', () => {
    expect(getImageUrl(CLOUDINARY, 'detail')).not.toContain('w_');
  });

  it('rewrites the thumbnail variant to eco quality + w_220 and preserves the query', () => {
    const result = getImageUrl(CLOUDINARY, 'thumbnail');
    expect(result).toContain('/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:eco,w_220/');
    expect(result).toContain('cave-paintings_cd9oda?_a=BAMAMiiu0');
  });

  it('passes Wikimedia URLs through unchanged', () => {
    expect(getImageUrl(WIKIMEDIA, 'thumbnail')).toBe(WIKIMEDIA);
  });

  it('passes undefined through unchanged', () => {
    expect(getImageUrl(undefined, 'thumbnail')).toBeUndefined();
  });

  it('injects a transform when the URL has no existing transform segment', () => {
    const noTransform = 'https://res.cloudinary.com/dscb8inz1/image/upload/cave-paintings_cd9oda';
    expect(getImageUrl(noTransform, 'detail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda'
    );
  });

  it('produces a valid URL with no stray trailing ? when there is no query', () => {
    const noQuery =
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,q_auto:good/cave-paintings_cd9oda';
    expect(getImageUrl(noQuery, 'thumbnail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:eco,w_220/cave-paintings_cd9oda'
    );
  });

  it('replaces (not appends) when re-rewriting an already-optimized URL', () => {
    const alreadyThumb = getImageUrl(CLOUDINARY, 'thumbnail')!;
    expect(getImageUrl(alreadyThumb, 'detail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda?_a=BAMAMiiu0'
    );
  });

  it('keeps g_auto, dpr_auto and f_auto in both variants', () => {
    for (const variant of ['thumbnail', 'detail'] as const) {
      const result = getImageUrl(CLOUDINARY, variant)!;
      expect(result).toContain('g_auto');
      expect(result).toContain('dpr_auto');
      expect(result).toContain('f_auto');
    }
  });
});

describe('isCloudinaryImage', () => {
  it('is true for a Cloudinary delivery URL', () => {
    expect(isCloudinaryImage(CLOUDINARY)).toBe(true);
  });

  it('is false for a Wikimedia URL, undefined, and empty string', () => {
    expect(isCloudinaryImage(WIKIMEDIA)).toBe(false);
    expect(isCloudinaryImage(undefined)).toBe(false);
    expect(isCloudinaryImage('')).toBe(false);
  });
});
