import { formatPhone } from './phone';
import type { Chat } from './types';

/** Что показывать как название чата: номер, если он известен, иначе имя из уведомления, иначе chatId. */
export function chatTitle(chat: Pick<Chat, 'chatId' | 'phone' | 'name'>): string {
  if (chat.phone !== undefined) return formatPhone(chat.phone);
  return chat.name || chat.chatId;
}
