import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageList } from './MessageList';
import type { ChatMessage } from './types';

const sending: ChatMessage = {
  key: 'local-1',
  direction: 'out',
  text: 'Привет',
  timestamp: 100,
  status: 'sending',
};

describe('MessageList', () => {
  it('не пересоздаёт элемент списка, когда сообщение получает idMessage от сервиса', () => {
    const { rerender } = render(<MessageList messages={[sending]} />);
    const before = screen.getByText('Привет').closest('li');

    rerender(<MessageList messages={[{ ...sending, idMessage: 'm1', status: 'sent' }]} />);
    const after = screen.getByText('Привет').closest('li');

    expect(after).toBe(before);
    expect(screen.getByText(/Отправлено/)).toBeInTheDocument();
  });

  it('помечает серию подряд идущих сообщений одного автора', () => {
    const messages: ChatMessage[] = [
      { ...sending, key: 'a', text: 'Раз' },
      { ...sending, key: 'b', text: 'Два' },
      { ...sending, key: 'c', text: 'Три', direction: 'in' },
    ];
    render(<MessageList messages={messages} />);

    expect(screen.getByText('Раз').closest('li')).not.toHaveClass('message--series');
    expect(screen.getByText('Два').closest('li')).toHaveClass('message--series');
    expect(screen.getByText('Три').closest('li')).not.toHaveClass('message--series');
  });
});
