/**
 * Локальный идентификатор сообщения до ответа сервера. Не `crypto.randomUUID()`: он есть только в защищённом контексте
 * (HTTPS или localhost), а на обычном HTTP-адресе (например, голый IP) его нет и отправка падала бы.
 * `crypto.getRandomValues` доступен везде.
 */
export function newLocalId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}
