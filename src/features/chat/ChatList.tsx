import { formatPhone } from './phone';
import { formatTime } from './time';
import type { Chat } from './types';

interface Props {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
}

export function ChatList({ chats, activeChatId, onSelect }: Props) {
  if (chats.length === 0) {
    return <p className="chat-list__empty">Чатов пока нет. Введите номер и создайте первый.</p>;
  }
  return (
    <ul className="chat-list">
      {chats.map((chat) => {
        const last = chat.messages[chat.messages.length - 1];
        return (
          <li key={chat.chatId}>
            <button
              className={chat.chatId === activeChatId ? 'chat-list__item chat-list__item--active' : 'chat-list__item'}
              onClick={() => onSelect(chat.chatId)}
            >
              <span className="chat-list__top">
                <span className="chat-list__name">{formatPhone(chat.phone)}</span>
                {last && (
                  <time className="chat-list__time" dateTime={new Date(last.timestamp * 1000).toISOString()}>
                    {formatTime(last.timestamp)}
                  </time>
                )}
              </span>
              {last && <span className="chat-list__preview">{last.text}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
