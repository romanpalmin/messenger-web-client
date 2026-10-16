import type { Credentials } from '../../api/types';

const KEY = 'messenger-web-client:credentials';

/** Данные входа живут только до закрытия вкладки (sessionStorage), в localStorage их не кладём. */
export function loadCredentials(): Credentials | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'apiUrl' in parsed &&
      typeof parsed.apiUrl === 'string' &&
      'idInstance' in parsed &&
      typeof parsed.idInstance === 'string' &&
      'apiTokenInstance' in parsed &&
      typeof parsed.apiTokenInstance === 'string'
    ) {
      return { apiUrl: parsed.apiUrl, idInstance: parsed.idInstance, apiTokenInstance: parsed.apiTokenInstance };
    }
  } catch {
    // хранилище недоступно или данные повреждены — просто просим войти заново
  }
  return null;
}

export function saveCredentials(credentials: Credentials): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(credentials));
  } catch {
    // без хранилища работаем только в памяти
  }
}

export function clearCredentials(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ничего страшного
  }
}
