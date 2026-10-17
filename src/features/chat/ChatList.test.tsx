import { render, screen } from '@testing-library/react';
import { ChatList } from './ChatList';
import type { Chat } from './types';

const chat: Chat = {
  chatId: '1',
  phone: 79001234567,
  messages: [
    { key: 'a', direction: 'out', text: 'Привет', timestamp: 1_000, status: 'sent' },
    { key: 'b', direction: 'in', text: 'Здравствуй', timestamp: 2_000, status: 'sent' },
  ],
};

describe('ChatList', () => {
  it('показывает превью и время именно последнего сообщения', () => {
    render(<ChatList chats={[chat]} activeChatId={null} onSelect={() => {}} />);

    expect(screen.getByText('Здравствуй')).toBeInTheDocument();
    expect(screen.queryByText('Привет')).not.toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/).closest('time')).toHaveAttribute(
      'datetime',
      new Date(2_000 * 1000).toISOString(),
    );
  });

  it('у чата без сообщений нет времени и превью', () => {
    render(<ChatList chats={[{ ...chat, messages: [] }]} activeChatId={null} onSelect={() => {}} />);

    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
  });
});
