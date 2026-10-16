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
      <button type="submit" disabled={!text.trim()}>
        Отправить
      </button>
    </form>
  );
}
