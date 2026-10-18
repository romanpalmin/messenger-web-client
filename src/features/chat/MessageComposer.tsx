import { useState, type FormEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
}

/** Максимальная длина текстового сообщения в API. */
export const MAX_MESSAGE_LENGTH = 4096;

export function MessageComposer({ onSend }: Props) {
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        aria-label="Сообщение"
        placeholder="Напишите сообщение"
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="composer__send" aria-label="Отправить" disabled={!text.trim()}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M3 20.5v-6.7l9-1.8-9-1.8V3.5L21.5 12 3 20.5z" fill="currentColor" />
        </svg>
      </button>
    </form>
  );
}
