import { useLayoutEffect, useRef, useState } from 'react';
import { formatTime } from './time';
import type { ChatMessage } from './types';

const STATUS_LABELS = { sending: 'Отправляется…', sent: 'Отправлено', failed: 'Не отправлено' } as const;
const STATUS_MARKS = { sending: '🕓', sent: '✓', failed: '!' } as const;

/** Насколько близко к низу (px) считаем, что пользователь «читает последние сообщения». */
const STICK_THRESHOLD = 80;

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  // Прокручен ли список к низу. Ref, а не state: от него зависит только поведение эффекта, перерисовка не нужна.
  const stickToBottom = useRef(true);
  // А вот показ кнопки «вниз» — состояние: от него зависит разметка.
  const [showJump, setShowJump] = useState(false);
  const last = messages[messages.length - 1];
  const lastKey = last?.key;
  const lastIsOwn = last?.direction === 'out';

  function handleScroll() {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_THRESHOLD;
    setShowJump(!stickToBottom.current);
  }

  function jumpToBottom() {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }

  // К низу — когда пришло/ушло сообщение, но не выдёргиваем того, кто листает историю вверх; своё сообщение — всегда вниз.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list || !lastKey) return;
    if (stickToBottom.current || lastIsOwn) {
      list.scrollTop = list.scrollHeight;
      stickToBottom.current = true;
    }
  }, [lastKey, lastIsOwn]);

  if (messages.length === 0) {
    return <p className="messages__empty">Сообщений пока нет. Напишите первое.</p>;
  }
  return (
    <div className="messages-wrap">
      <ul ref={listRef} className="messages" onScroll={handleScroll}>
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
      {showJump && (
        <button
          type="button"
          className="messages__jump"
          aria-label="Вниз, к последним сообщениям"
          onClick={jumpToBottom}
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
