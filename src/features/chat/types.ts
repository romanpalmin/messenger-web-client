export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  /** Стабильный ключ для списка: не меняется за всё время жизни сообщения (иначе React пересоздаст элемент). */
  key: string;
  /** Идентификатор сообщения в GREEN-API: у исходящего появляется после ответа, у входящего есть сразу. */
  idMessage?: string;
  direction: 'in' | 'out';
  text: string;
  /** Секунды Unix, как в уведомлениях GREEN-API. */
  timestamp: number;
  status: MessageStatus;
  error?: string;
}

export interface Chat {
  chatId: string;
  phone: number;
  messages: ChatMessage[];
}

export interface ChatState {
  chats: Chat[];
  activeChatId: string | null;
}
