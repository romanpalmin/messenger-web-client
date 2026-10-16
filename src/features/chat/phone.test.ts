import { formatPhone, parsePhone } from './phone';

describe('parsePhone', () => {
  it.each([
    ['+7 (900) 123-45-67', 79001234567],
    ['79001234567', 79001234567],
    ['8 900 123 45 67', 79001234567],
    ['+995 555 12 34 56', 995555123456],
  ])('разбирает %s', (input, expected) => {
    expect(parsePhone(input)).toBe(expected);
  });

  it.each(['', 'abc', '123', '1234567890123456'])('отклоняет %j', (input) => {
    expect(parsePhone(input)).toBeNull();
  });
});

describe('formatPhone', () => {
  it('добавляет плюс', () => {
    expect(formatPhone(79001234567)).toBe('+79001234567');
  });
});
