import { useEffect, useState } from 'react';

/**
 * Очередь уведомлений GREEN-API одна на инстанс, поэтому опрашивать её должна одна вкладка.
 * Хук берёт именованный замок (Web Locks API): кто получил, тот «владелец» и опрашивает; остальные
 * вкладки ждут в очереди за замком и подхватывают опрос сами, когда владелец закроется.
 * Без Web Locks (небезопасный контекст, старый браузер) защиты нет: считаем вкладку владельцем, как раньше.
 */
export function usePollingLock(name: string): boolean {
  const supported = typeof navigator !== 'undefined' && 'locks' in navigator;
  const [owner, setOwner] = useState(!supported);

  useEffect(() => {
    if (!supported) return;
    const controller = new AbortController();
    let cancelled = false;
    let release: (() => void) | undefined;

    navigator.locks
      .request(name, { signal: controller.signal }, () => {
        if (cancelled) return;
        setOwner(true);
        // замок держится, пока не завершится этот промис: освобождаем в cleanup или при закрытии вкладки
        return new Promise<void>((resolve) => {
          release = resolve;
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setOwner(true);
      });

    return () => {
      cancelled = true;
      controller.abort();
      release?.();
      setOwner(false);
    };
  }, [name, supported]);

  return owner;
}
