import { initialChatState } from './chatReducer';
import type { Chat, ChatMessage, ChatState } from './types';

/** Чаты хранятся отдельно для каждого инстанса: после входа в другой инстанс чужая переписка не появится. */
const storageKey = (idInstance: string) => `messenger-web-client:chats:${idInstance}`;

const RELOADED_WHILE_SENDING = 'Страница была перезагружена до подтверждения отправки';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    (value.direction === 'in' || value.direction === 'out') &&
    typeof value.text === 'string' &&
    typeof value.timestamp === 'number' &&
    (value.status === 'sending' || value.status === 'sent' || value.status === 'failed')
  );
}

function isChat(value: unknown): value is Chat {
  return (
    isRecord(value) &&
    typeof value.chatId === 'string' &&
    (value.phone === undefined || typeof value.phone === 'number') &&
    (value.name === undefined || typeof value.name === 'string') &&
    Array.isArray(value.messages) &&
    value.messages.every(isMessage)
  );
}

/**
 * Сообщение в статусе «отправляется» после перезагрузки уже не дождётся ответа сервера (запрос оборван):
 * показываем его как неотправленное, а не вечно «отправляется».
 */
function settleInterrupted(message: ChatMessage): ChatMessage {
  return message.status === 'sending' ? { ...message, status: 'failed', error: RELOADED_WHILE_SENDING } : message;
}

/** Состояние чатов из sessionStorage; при отсутствии, порче данных или недоступном хранилище — пустое. */
export function loadChatState(idInstance: string): ChatState {
  try {
    const raw = sessionStorage.getItem(storageKey(idInstance));
    if (!raw) return initialChatState;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.chats) || !parsed.chats.every(isChat)) return initialChatState;
    const chats = parsed.chats.map((chat) => ({ ...chat, messages: chat.messages.map(settleInterrupted) }));
    const activeChatId =
      typeof parsed.activeChatId === 'string' && chats.some((chat) => chat.chatId === parsed.activeChatId)
        ? parsed.activeChatId
        : null;
    return { chats, activeChatId };
  } catch {
    // хранилище недоступно или JSON повреждён — начинаем с пустого состояния
    return initialChatState;
  }
}

export function saveChatState(idInstance: string, state: ChatState): void {
  try {
    sessionStorage.setItem(storageKey(idInstance), JSON.stringify(state));
  } catch {
    // переполнение или запрет хранилища: работаем только в памяти
  }
}

export function clearChatState(idInstance: string): void {
  try {
    sessionStorage.removeItem(storageKey(idInstance));
  } catch {
    // ничего страшного
  }
}
