/** Стабильный оттенок аватара по chatId: один и тот же чат всегда получает один и тот же цвет. */
export function avatarHue(chatId: string): number {
  let hash = 0;
  for (const char of chatId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash % 360;
}
