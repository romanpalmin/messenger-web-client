import { newLocalId } from './localId';

describe('newLocalId', () => {
  it('даёт 32 hex-символа и не повторяется', () => {
    const ids = new Set(Array.from({ length: 1000 }, newLocalId));

    expect(ids.size).toBe(1000);
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('работает без crypto.randomUUID, как на HTTP-адресе (незащищённый контекст)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });

    expect(newLocalId()).toMatch(/^[0-9a-f]{32}$/);

    vi.unstubAllGlobals();
  });
});
