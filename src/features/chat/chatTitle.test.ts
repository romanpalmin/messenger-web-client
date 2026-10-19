import { chatTitle } from './chatTitle';

describe('chatTitle', () => {
  it('показывает имя, если оно известно, даже при известном номере', () => {
    expect(chatTitle({ chatId: '1', phone: 79001234567, name: 'Анна' })).toBe('Анна');
    expect(chatTitle({ chatId: '1', name: 'Анна' })).toBe('Анна');
  });

  it('без имени показывает номер', () => {
    expect(chatTitle({ chatId: '1', phone: 79001234567 })).toBe('+79001234567');
    expect(chatTitle({ chatId: '1', phone: 79001234567, name: '' })).toBe('+79001234567');
  });

  it('без имени и номера показывает chatId', () => {
    expect(chatTitle({ chatId: '12345' })).toBe('12345');
  });
});
