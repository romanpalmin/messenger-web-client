import type { Chat, ChatMessage, ChatState } from './types';

export const initialChatState: ChatState = { chats: [], activeChatId: null };

export type ChatAction =
  | { type: 'chatOpened'; chatId: string; phone: number }
  | { type: 'chatSelected'; chatId: string }
  | { type: 'chatClosed' }
  | { type: 'messageSending'; chatId: string; localId: string; text: string; timestamp: number }
  | { type: 'messageSent'; chatId: string; localId: string; idMessage: string }
  | { type: 'messageFailed'; chatId: string; localId: string; error: string }
  | { type: 'messageReceived'; chatId: string; idMessage: string; text: string; timestamp: number };

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chatOpened': {
      const exists = state.chats.some((chat) => chat.chatId === action.chatId);
      const chats = exists
        ? state.chats
        : [...state.chats, { chatId: action.chatId, phone: action.phone, messages: [] } satisfies Chat];
      return { chats, activeChatId: action.chatId };
    }
    case 'chatSelected':
      return state.chats.some((chat) => chat.chatId === action.chatId)
        ? { ...state, activeChatId: action.chatId }
        : state;
    // «Назад» на мобильном: чат остаётся в списке, просто ни один не открыт. Уже закрыт — состояние то же (bail-out).
    case 'chatClosed':
      return state.activeChatId === null ? state : { ...state, activeChatId: null };
    case 'messageSending': {
      const message: ChatMessage = {
        key: action.localId,
        direction: 'out',
        text: action.text,
        timestamp: action.timestamp,
        status: 'sending',
      };
      return updateChat(state, action.chatId, (chat) => ({ ...chat, messages: [...chat.messages, message] }));
    }
    case 'messageSent':
      return updateMessage(state, action.chatId, action.localId, (message) => ({
        ...message,
        idMessage: action.idMessage,
        status: 'sent',
        error: undefined,
      }));
    case 'messageFailed':
      return updateMessage(state, action.chatId, action.localId, (message) => ({
        ...message,
        status: 'failed',
        error: action.error,
      }));
    case 'messageReceived': {
      const chat = state.chats.find((c) => c.chatId === action.chatId);
      // Чужой чат (не открывали по номеру) игнорируем; повторное уведомление с тем же idMessage — тоже.
      if (!chat || chat.messages.some((m) => m.idMessage === action.idMessage)) return state;
      const message: ChatMessage = {
        key: action.idMessage,
        idMessage: action.idMessage,
        direction: 'in',
        text: action.text,
        timestamp: action.timestamp,
        status: 'sent',
      };
      return updateChat(state, action.chatId, (c) => ({ ...c, messages: [...c.messages, message] }));
    }
  }
}

function updateChat(state: ChatState, chatId: string, update: (chat: Chat) => Chat): ChatState {
  return { ...state, chats: state.chats.map((chat) => (chat.chatId === chatId ? update(chat) : chat)) };
}

function updateMessage(
  state: ChatState,
  chatId: string,
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
): ChatState {
  return updateChat(state, chatId, (chat) => ({
    ...chat,
    messages: chat.messages.map((message) => (message.key === messageId ? update(message) : message)),
  }));
}
