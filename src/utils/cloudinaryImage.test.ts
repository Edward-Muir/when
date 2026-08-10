import { getImageUrl, isCloudinaryImage } from './cloudinaryImage';

const CLOUDINARY =
  'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda?_a=BAMAMiiu0';
const WIKIMEDIA =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Example.jpg/330px-Example.jpg';

describe('getImageUrl', () => {
  it('caps the detail variant to the popup box, preserving the query', () => {
    expect(getImageUrl(CLOUDINARY, 'detail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_768,q_auto:good,w_768/cave-paintings_cd9oda?_a=BAMAMiiu0'
    );
  });

  it('rewrites the thumbnail variant to good quality + w_400 and preserves the query', () => {
    const result = getImageUrl(CLOUDINARY, 'thumbnail');
    expect(result).toContain('/image/upload/c_fill,f_auto,g_auto,h_400,q_auto:good,w_400/');
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
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_768,q_auto:good,w_768/cave-paintings_cd9oda'
    );
  });

  it('produces a valid URL with no stray trailing ? when there is no query', () => {
    const noQuery =
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,q_auto:good/cave-paintings_cd9oda';
    expect(getImageUrl(noQuery, 'thumbnail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_400,q_auto:good,w_400/cave-paintings_cd9oda'
    );
  });

  it('replaces (not appends) when re-rewriting an already-optimized URL', () => {
    const alreadyThumb = getImageUrl(CLOUDINARY, 'thumbnail')!;
    expect(getImageUrl(alreadyThumb, 'detail')).toBe(
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,f_auto,g_auto,h_768,q_auto:good,w_768/cave-paintings_cd9oda?_a=BAMAMiiu0'
    );
  });

  it('strips a baked dpr_auto transform rather than inheriting it', () => {
    const bakedWithDpr =
      'https://res.cloudinary.com/dscb8inz1/image/upload/c_fill,dpr_auto,f_auto,g_auto,q_auto:good/cave-paintings_cd9oda';
    expect(getImageUrl(bakedWithDpr, 'thumbnail')).not.toContain('dpr_');
  });

  it('keeps g_auto and f_auto in both variants (edge-resolved, must stay in the URL)', () => {
    for (const variant of ['thumbnail', 'detail'] as const) {
      const result = getImageUrl(CLOUDINARY, variant)!;
      expect(result).toContain('g_auto');
      expect(result).toContain('f_auto');
    }
  });

  // Regression guards for the bandwidth blowout: an uncapped variant made Cloudinary
  // ship the full 1024/2048px original, and dpr_auto minted a derived asset per DPR.
  it('bounds every variant with an explicit width', () => {
    for (const variant of ['thumbnail', 'detail'] as const) {
      expect(getImageUrl(CLOUDINARY, variant)).toMatch(/[,/]w_\d+/);
    }
  });

  it('never emits dpr_auto in any variant', () => {
    for (const variant of ['thumbnail', 'detail'] as const) {
      expect(getImageUrl(CLOUDINARY, variant)).not.toContain('dpr_');
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
