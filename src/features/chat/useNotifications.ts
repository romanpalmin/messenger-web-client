import { useEffect, useRef } from 'react';
import type { ApiError, ApiClient } from '../../api/client';
import type { NotificationBody } from '../../api/types';
import { pollNotifications } from './polling';

/**
 * Запускает опрос уведомлений на время жизни компонента и останавливает его при размонтировании
 * или смене клиента (другой инстанс). Обработчики лежат в ref, поэтому новая функция в пропсах
 * не перезапускает опрос — перезапуск нужен только при смене `client` или `enabled`.
 * `enabled = false` (например, опрос ведёт другая вкладка) не запускает опрос вовсе.
 */
export function useNotifications(
  client: ApiClient,
  onNotification: (body: NotificationBody) => void,
  onFatal?: (error: ApiError) => void,
  enabled = true,
) {
  const handlers = useRef({ onNotification, onFatal });
  useEffect(() => {
    handlers.current = { onNotification, onFatal };
  });

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    void pollNotifications({
      client,
      signal: controller.signal,
      onNotification: (body) => handlers.current.onNotification(body),
      onFatal: (error) => handlers.current.onFatal?.(error),
    });
    return () => controller.abort();
  }, [client, enabled]);
}
