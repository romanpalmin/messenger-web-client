import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
}

/** Максимальная длина текстового сообщения в API. */
export const MAX_MESSAGE_LENGTH = 4096;

export function MessageComposer({ onSend }: Props) {
  const [text, setText] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Поле растёт вместе с текстом: сначала сбрасываем высоту, чтобы scrollHeight посчитался заново (и уменьшался)
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${field.scrollHeight}px`;
  }, [text]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    send();
  }

  // Enter отправляет, Shift+Enter — перенос строки. isComposing: Enter внутри IME-ввода не должен отправлять.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <textarea
        ref={fieldRef}
        rows={1}
        aria-label="Сообщение"
        placeholder="Напишите сообщение"
        value={text}
        maxLength={MAX_MESSAGE_LENGTH}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
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
