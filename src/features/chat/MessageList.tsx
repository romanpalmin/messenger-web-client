import type { ChatMessage } from './types';

const STATUS_LABELS = { sending: 'Отправляется…', sent: 'Отправлено', failed: 'Не отправлено' } as const;

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return <p className="messages__empty">Сообщений пока нет. Напишите первое.</p>;
  }
  return (
    <ul className="messages">
      {messages.map((message) => (
        <li key={message.key} className={`message message--${message.direction}`}>
          <p className="message__text">{message.text}</p>
          <span className="message__meta">
            {formatTime(message.timestamp)}
            {message.direction === 'out' && ` · ${STATUS_LABELS[message.status]}`}
          </span>
          {message.status === 'failed' && message.error && (
            <span role="alert" className="message__error">
              {message.error}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
