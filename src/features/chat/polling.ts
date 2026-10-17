import { ApiError, type ApiClient } from '../../api/client';
import type { NotificationBody } from '../../api/types';

/** 401 и 403 — неверные данные доступа: повторять бессмысленно, опрос останавливается. */
const FATAL_STATUSES = new Set([401, 403]);

export interface PollOptions {
  client: Pick<ApiClient, 'receiveNotification' | 'deleteNotification'>;
  /** Отмена: прерывает и текущий запрос, и паузу между повторами. */
  signal: AbortSignal;
  onNotification: (body: NotificationBody) => void;
  /** Опрос остановлен навсегда (неверный токен или idInstance). */
  onFatal?: (error: ApiError) => void;
  /** Сколько секунд сервис держит запрос открытым, если уведомлений нет. */
  receiveTimeout?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
}

/**
 * Long-poll получения уведомлений GREEN-API: запросил → обработал → удалил → снова запросил.
 * Уведомление нужно удалять (deleteNotification), иначе сервис отдаст его повторно.
 * При сбое сети или 5xx ждёт всё дольше (1 с, 2 с, 4 с…), пока не получится.
 */
export async function pollNotifications(options: PollOptions): Promise<void> {
  const {
    client,
    signal,
    onNotification,
    onFatal,
    receiveTimeout = 20,
    retryDelayMs = 1000,
    maxRetryDelayMs = 30000,
  } = options;
  let failures = 0;

  while (!signal.aborted) {
    try {
      const notification = await client.receiveNotification(receiveTimeout, signal);
      failures = 0;
      if (!notification) continue; // очередь пуста — сразу спрашиваем снова
      try {
        onNotification(notification.body);
      } finally {
        // Удаляем даже если обработчик упал: иначе одно битое уведомление будет приходить бесконечно и заблокирует очередь.
        await client.deleteNotification(notification.receiptId, signal);
      }
    } catch (error) {
      if (signal.aborted) return; // это наша отмена, не сбой
      if (error instanceof ApiError && FATAL_STATUSES.has(error.status)) {
        onFatal?.(error);
        return;
      }
      failures += 1;
      await sleep(Math.min(retryDelayMs * 2 ** (failures - 1), maxRetryDelayMs), signal);
    }
  }
}

/** Пауза, которую можно прервать отменой (иначе после abort цикл «досыпал» бы до конца паузы). */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}
