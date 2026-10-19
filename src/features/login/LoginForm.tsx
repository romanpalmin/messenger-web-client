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
      <div className="login__brand">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="48" height="48" />
        <h1>Вход</h1>
      </div>
      <p className="login__hint">
        Данные инстанса из личного кабинета GREEN-API. Адрес API тоже берите из кабинета: у инстанса он может отличаться
        от стандартного (например, https://4100.api.green-api.com). Данные хранятся только в этой вкладке.
      </p>

      <label>
        Адрес API
        <input
          name="apiUrl"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          required
          inputMode="url"
          autoComplete="off"
        />
      </label>
      <label>
        idInstance
        <input
          name="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          required
          inputMode="numeric"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
        />
      </label>
      <label>
        apiTokenInstance
        <input
          name="apiTokenInstance"
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          required
          // Chrome игнорирует "off" у полей пароля и подставляет сохранённый логин в предыдущее поле;
          // "new-password" говорит, что это не форма входа на сайт, а ввод нового секрета
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
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
