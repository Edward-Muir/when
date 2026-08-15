import { HEIGHT, WIDTH } from './shareImage';

/**
 * The renderer itself needs a real canvas, which jsdom does not provide — it is verified
 * visually through `/share-preview`. What is worth pinning here is the frame, because the
 * failure it guards against already shipped once and was invisible until someone posted a
 * card to WhatsApp.
 */
describe('share card dimensions', () => {
  /**
   * WhatsApp center-crops a chat image taller than roughly 1:1.41. At the original 9:16
   * that removed ~200px from the top and bottom — the "When?" wordmark and, more
   * seriously, the URL. The files-only share tier drops the message text, so that
   * burned-in URL is the only thing telling a viewer where to play.
   */
  it('stays inside the aspect ratio WhatsApp will show uncropped', () => {
    expect(HEIGHT / WIDTH).toBeLessThanOrEqual(1.41);
  });

  it('is 4:5, the native max-portrait size for an Instagram feed post', () => {
    expect(WIDTH / HEIGHT).toBeCloseTo(4 / 5, 5);
  });
});
