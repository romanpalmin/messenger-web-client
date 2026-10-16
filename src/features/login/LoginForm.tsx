import { useState, type FormEvent } from 'react';
import { ApiError, createApiClient } from '../../api/client';
import type { Credentials, InstanceState } from '../../api/types';

export const DEFAULT_API_URL = 'https://api.green-api.com';

const STATE_MESSAGES: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован: отсканируйте QR-код или введите код в личном кабинете GREEN-API',
  starting: 'Инстанс запускается, подождите пару минут и попробуйте снова',
  blocked: 'Инстанс заблокирован',
  suspended: 'На аккаунте временные ограничения',
  pendingPayment: 'Нужно продлить или оплатить инстанс в личном кабинете',
};

interface Props {
  onLogin: (credentials: Credentials) => void;
}

export function LoginForm({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const credentials: Credentials = {
      apiUrl: apiUrl.trim(),
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    };
    try {
      const { stateInstance } = await createApiClient(credentials).getStateInstance();
      if (stateInstance === 'authorized') {
        onLogin(credentials);
        return;
      }
      setError(STATE_MESSAGES[stateInstance] ?? `Инстанс недоступен (состояние: ${stateInstance})`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось связаться с сервером, проверьте адрес API и сеть');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="login" onSubmit={handleSubmit}>
      <h1>Вход</h1>
      <p className="login__hint">Данные инстанса из личного кабинета GREEN-API. Они хранятся только в этой вкладке.</p>

      <label>
        Адрес API
        <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} required inputMode="url" autoComplete="off" />
      </label>
      <label>
        idInstance
        <input
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          required
          inputMode="numeric"
          autoComplete="off"
        />
      </label>
      <label>
        apiTokenInstance
        <input
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          required
          autoComplete="off"
        />
      </label>

      {error && (
        <p role="alert" className="login__error">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending}>
        {pending ? 'Проверяем…' : 'Войти'}
      </button>
    </form>
  );
}
