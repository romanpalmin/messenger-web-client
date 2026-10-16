export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage {
  /** Пока сообщение отправляется — локальный id, после ответа API — idMessage. */
  id: string;
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
