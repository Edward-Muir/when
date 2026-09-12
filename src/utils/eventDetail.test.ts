import { loadEventDetail, peekEventDetail, resetEventDetailCache } from './eventDetail';
import { getSourceFile } from './eventLoader';

jest.mock('./eventLoader', () => ({ getSourceFile: jest.fn() }));

const mockedGetSourceFile = getSourceFile as jest.MockedFunction<typeof getSourceFile>;

/**
 * The contract that matters here is cheapness. A shard is up to ~375 KB gzipped, so fetching it
 * twice for two cards from the same file — or at all for a card whose shard has no entry — is
 * the regression this pins.
 */

function mockShard(body: unknown, ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({ ok, json: async () => body });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

beforeEach(() => {
  resetEventDetailCache();
  mockedGetSourceFile.mockReset();
  mockedGetSourceFile.mockReturnValue('people.json');
});

describe('loadEventDetail', () => {
  it('reads the paragraphs out of the shard its event belongs to', async () => {
    const fetchMock = mockShard({ 'a-slug': { paragraphs: ['one', 'two'] } });

    await expect(loadEventDetail('a-slug')).resolves.toEqual(['one', 'two']);
    expect(fetchMock).toHaveBeenCalledWith('/events/detail/people.json');
  });

  it('fetches each shard once, however many cards are opened from it', async () => {
    const fetchMock = mockShard({
      'a-slug': { paragraphs: ['one', 'two'] },
      'b-slug': { paragraphs: ['three', 'four'] },
    });

    await Promise.all([loadEventDetail('a-slug'), loadEventDetail('b-slug')]);
    await loadEventDetail('a-slug');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resolves null for a slug the shard does not carry', async () => {
    mockShard({ 'other-slug': { paragraphs: ['one', 'two'] } });
    await expect(loadEventDetail('a-slug')).resolves.toBeNull();
  });

  it('resolves null rather than throwing when the shard is missing or the fetch fails', async () => {
    mockShard({}, false);
    await expect(loadEventDetail('a-slug')).resolves.toBeNull();

    resetEventDetailCache();
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    await expect(loadEventDetail('a-slug')).resolves.toBeNull();
  });

  it('resolves null before the catalogue has loaded, rather than guessing a shard', async () => {
    mockedGetSourceFile.mockReturnValue(null);
    const fetchMock = mockShard({ 'a-slug': { paragraphs: ['one', 'two'] } });

    await expect(loadEventDetail('a-slug')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats an empty paragraph list as no detail', async () => {
    mockShard({ 'a-slug': { paragraphs: [] } });
    await expect(loadEventDetail('a-slug')).resolves.toBeNull();
  });
});

describe('peekEventDetail', () => {
  it("says 'don't know yet' before the shard is cached, and answers after", async () => {
    mockShard({ 'a-slug': { paragraphs: ['one', 'two'] } });

    expect(peekEventDetail('a-slug')).toBeUndefined();
    await loadEventDetail('a-slug');
    expect(peekEventDetail('a-slug')).toEqual(['one', 'two']);
    expect(peekEventDetail('absent-slug')).toBeNull();
  });
});
