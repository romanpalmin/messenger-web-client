import { renderHook, waitFor } from '@testing-library/react';
import { usePollingLock } from './usePollingLock';

// jsdom не знает Web Locks: простая очередь замков с поддержкой отмены ожидания через signal
function installFakeLocks() {
  const tails = new Map<string, Promise<unknown>>();
  const locks = {
    request(name: string, options: { signal?: AbortSignal }, callback: () => unknown) {
      const { signal } = options;
      const previous = tails.get(name) ?? Promise.resolve();
      return new Promise((resolve, reject) => {
        const aborted = () => reject(new DOMException('aborted', 'AbortError'));
        signal?.addEventListener('abort', aborted);
        tails.set(
          name,
          previous.then(async () => {
            if (signal?.aborted) return;
            try {
              resolve(await callback());
            } catch (error) {
              reject(error);
            }
          }),
        );
      });
    },
  };
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'locks');
});

describe('usePollingLock', () => {
  it('без Web Locks вкладка считается владельцем', () => {
    const { result } = renderHook(() => usePollingLock('queue'));
    expect(result.current).toBe(true);
  });

  it('вторая вкладка ждёт и становится владельцем, когда первая закрылась', async () => {
    installFakeLocks();
    const first = renderHook(() => usePollingLock('queue'));
    await waitFor(() => expect(first.result.current).toBe(true));

    const second = renderHook(() => usePollingLock('queue'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(second.result.current).toBe(false);

    first.unmount();
    await waitFor(() => expect(second.result.current).toBe(true));
  });

  it('замки с разными именами (разные инстансы) не мешают друг другу', async () => {
    installFakeLocks();
    const a = renderHook(() => usePollingLock('queue-a'));
    const b = renderHook(() => usePollingLock('queue-b'));
    await waitFor(() => {
      expect(a.result.current).toBe(true);
      expect(b.result.current).toBe(true);
    });
  });
});
