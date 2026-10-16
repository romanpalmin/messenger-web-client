import { useMemo, useReducer } from 'react';
import { ApiError, createApiClient } from '../../api/client';
import type { Credentials } from '../../api/types';
import { ChatList } from './ChatList';
import { chatReducer, initialChatState } from './chatReducer';
import { MessageComposer } from './MessageComposer';
import { MessageList } from './MessageList';
import { NewChatForm } from './NewChatForm';
import { formatPhone } from './phone';

interface Props {
  credentials: Credentials;
  onLogout: () => void;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function ChatApp({ credentials, onLogout }: Props) {
  const client = useMemo(() => createApiClient(credentials), [credentials]);
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const activeChat = state.chats.find((chat) => chat.chatId === state.activeChatId) ?? null;

  async function send(text: string) {
    if (!activeChat) return;
    const { chatId } = activeChat;
    const localId = crypto.randomUUID();
    dispatch({ type: 'messageSending', chatId, localId, text, timestamp: nowSeconds() });
    try {
      const { idMessage } = await client.sendMessage(chatId, text);
      dispatch({ type: 'messageSent', chatId, localId, idMessage });
    } catch (e) {
      const error = e instanceof ApiError ? e.message : 'Не удалось отправить сообщение';
      dispatch({ type: 'messageFailed', chatId, localId, error });
    }
  }

  return (
    <div className="chat-app">
      <aside className="sidebar">
        <header className="sidebar__header">
          <span>Инстанс {credentials.idInstance}</span>
          <button onClick={onLogout}>Выйти</button>
        </header>
        <NewChatForm client={client} onCreate={(chatId, phone) => dispatch({ type: 'chatOpened', chatId, phone })} />
        <ChatList
          chats={state.chats}
          activeChatId={state.activeChatId}
          onSelect={(chatId) => dispatch({ type: 'chatSelected', chatId })}
        />
      </aside>
      <main className="conversation">
        {activeChat ? (
          <>
            <header className="conversation__header">{formatPhone(activeChat.phone)}</header>
            <MessageList messages={activeChat.messages} />
            <MessageComposer onSend={send} />
          </>
        ) : (
          <p className="conversation__empty">Выберите чат или создайте новый</p>
        )}
      </main>
    </div>
  );
}
