import { formatPhone } from './phone';
import type { Chat } from './types';

/** Что показывать как название чата, как в Telegram: имя собеседника, если оно известно, иначе номер, иначе chatId. */
export function chatTitle(chat: Pick<Chat, 'chatId' | 'phone' | 'name'>): string {
  if (chat.name) return chat.name;
  if (chat.phone !== undefined) return formatPhone(chat.phone);
  return chat.chatId;
}
