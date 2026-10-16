import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  ReceivedNotification,
  SendMessageResponse,
  StateInstanceResponse,
} from './types';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type FetchLike = typeof fetch;

/**
 * Клиент HTTP API GREEN-API (Telegram). Токен кладётся в путь запроса, как требует сервис,
 * поэтому в логи и сообщения об ошибках мы его не выводим.
 */
export function createApiClient(credentials: Credentials, fetchImpl: FetchLike = (...args) => fetch(...args)) {
  const base = `${credentials.apiUrl.replace(/\/+$/, '')}/waInstance${encodeURIComponent(credentials.idInstance)}`;
  const token = encodeURIComponent(credentials.apiTokenInstance);

  async function request<T>(
    method: string,
    path: string,
    init: { body?: unknown; signal?: AbortSignal } = {},
  ): Promise<T> {
    const response = await fetchImpl(`${base}/${path}`, {
      method,
      signal: init.signal,
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    if (!response.ok) {
      throw new ApiError(response.status, describeError(response.status, text));
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    getStateInstance(signal?: AbortSignal) {
      return request<StateInstanceResponse>('GET', `getStateInstance/${token}`, { signal });
    },

    /** Номер в международном формате без «+» превращается в chatId. */
    checkAccount(phoneNumber: number, signal?: AbortSignal) {
      return request<CheckAccountResponse>('POST', `checkAccount/${token}`, { body: { phoneNumber }, signal });
    },

    sendMessage(chatId: string, message: string, signal?: AbortSignal) {
      return request<SendMessageResponse>('POST', `sendMessage/${token}`, { body: { chatId, message }, signal });
    },

    /** Ждёт до receiveTimeout секунд; пустая очередь даёт null. */
    receiveNotification(receiveTimeout = 20, signal?: AbortSignal) {
      return request<ReceivedNotification | null>(
        'GET',
        `receiveNotification/${token}?receiveTimeout=${receiveTimeout}`,
        {
          signal,
        },
      );
    },

    deleteNotification(receiptId: number, signal?: AbortSignal) {
      return request<DeleteNotificationResponse>('DELETE', `deleteNotification/${token}/${receiptId}`, { signal });
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

function describeError(status: number, body: string): string {
  switch (status) {
    case 401:
      return 'Неверный apiTokenInstance';
    case 403:
      return 'Неверный idInstance или адрес API';
    case 429:
      return 'Слишком много запросов, попробуйте чуть позже';
    case 466:
      return 'Лимит бесплатного тарифа: обмен возможен только с тремя чатами';
    case 469:
      return 'Telegram временно ограничил поиск аккаунтов, повторите через несколько часов';
    default:
      return reason(body) ?? `Ошибка сервера (${status})`;
  }
}

function reason(body: string): string | undefined {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object' && 'reason' in parsed && typeof parsed.reason === 'string') {
      return parsed.reason;
    }
  } catch {
    // тело не JSON — вернём общее сообщение
  }
  return undefined;
}
