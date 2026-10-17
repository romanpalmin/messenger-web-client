import { useEffect, useRef } from 'react';
import type { ApiError, ApiClient } from '../../api/client';
import type { NotificationBody } from '../../api/types';
import { pollNotifications } from './polling';

/**
 * Запускает опрос уведомлений на время жизни компонента и останавливает его при размонтировании
 * или смене клиента (другой инстанс). Обработчики лежат в ref, поэтому новая функция в пропсах
 * не перезапускает опрос — перезапуск нужен только при смене `client`.
 */
export function useNotifications(
  client: ApiClient,
  onNotification: (body: NotificationBody) => void,
  onFatal?: (error: ApiError) => void,
) {
  const handlers = useRef({ onNotification, onFatal });
  useEffect(() => {
    handlers.current = { onNotification, onFatal };
  });

  useEffect(() => {
    const controller = new AbortController();
    void pollNotifications({
      client,
      signal: controller.signal,
      onNotification: (body) => handlers.current.onNotification(body),
      onFatal: (error) => handlers.current.onFatal?.(error),
    });
    return () => controller.abort();
  }, [client]);
}
