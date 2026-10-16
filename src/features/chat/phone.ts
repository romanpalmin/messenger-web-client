/**
 * Приводит введённый номер к виду, который ждёт checkAccount: цифры в международном формате без «+».
 * Российское «8…» из 11 цифр превращается в «7…». Возвращает null, если номер не похож на телефон.
 */
export function parsePhone(input: string): number | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }
  return Number(digits);
}

export function formatPhone(phone: number): string {
  return `+${phone}`;
}
