import { chatTitle } from './chatTitle';

describe('chatTitle', () => {
  it('показывает номер, если он известен', () => {
    expect(chatTitle({ chatId: '1', phone: 79001234567, name: 'Анна' })).toBe('+79001234567');
  });

  it('без номера показывает имя из уведомления', () => {
    expect(chatTitle({ chatId: '1', name: 'Анна' })).toBe('Анна');
  });

  it('без номера и имени показывает chatId', () => {
    expect(chatTitle({ chatId: '12345' })).toBe('12345');
    expect(chatTitle({ chatId: '12345', name: '' })).toBe('12345');
  });
});
