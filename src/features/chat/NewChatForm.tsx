import { useState, type FormEvent } from 'react';
import { ApiError, type ApiClient } from '../../api/client';
import { parsePhone } from './phone';

interface Props {
  client: ApiClient;
  onCreate: (chatId: string, phone: number) => void;
}

export function NewChatForm({ client, onCreate }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const phone = parsePhone(value);
    if (phone === null) {
      setError('Введите номер в международном формате, например +7 900 123-45-67');
      return;
    }
    setPending(true);
    try {
      const result = await client.checkAccount(phone);
      if (!result.exist || !result.chatId) {
        setError('На этом номере нет аккаунта Telegram');
        return;
      }
      onCreate(result.chatId, phone);
      setValue('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось связаться с сервером');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="new-chat" onSubmit={handleSubmit}>
      <input
        aria-label="Номер телефона получателя"
        placeholder="+7 900 123-45-67"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="tel"
        autoComplete="off"
      />
      <button type="submit" disabled={pending}>
        {pending ? 'Ищем…' : 'Новый чат'}
      </button>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </form>
  );
}
