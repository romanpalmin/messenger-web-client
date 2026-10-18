import { formatTime } from './time';
import type { ChatMessage } from './types';

const STATUS_LABELS = { sending: 'Отправляется…', sent: 'Отправлено', failed: 'Не отправлено' } as const;
const STATUS_MARKS = { sending: '🕓', sent: '✓', failed: '!' } as const;

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return <p className="messages__empty">Сообщений пока нет. Напишите первое.</p>;
  }
  return (
    <ul className="messages">
      {messages.map((message, index) => (
        <li
          key={message.key}
          className={`message message--${message.direction}${
            messages[index - 1]?.direction === message.direction ? ' message--series' : ''
          }`}
        >
          <p className="message__text">{message.text}</p>
          <span className="message__meta">
            {formatTime(message.timestamp)}
            {message.direction === 'out' && (
              <span
                className={`message__status message__status--${message.status}`}
                title={STATUS_LABELS[message.status]}
              >
                <span aria-hidden="true">{STATUS_MARKS[message.status]}</span>
                <span className="visually-hidden">{STATUS_LABELS[message.status]}</span>
              </span>
            )}
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
