import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

  describe('автопрокрутка', () => {
    const incoming = (key: string): ChatMessage => ({ ...sending, key, direction: 'in', text: key, status: 'sent' });

    /** В jsdom нет вёрстки: задаём размеры списка вручную, как их отдал бы браузер. */
    function fakeLayout(list: HTMLElement) {
      Object.defineProperty(list, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(list, 'clientHeight', { configurable: true, value: 200 });
    }

    it('новое входящее прокручивает вниз, если пользователь внизу', () => {
      const { rerender, container } = render(<MessageList messages={[incoming('a')]} />);
      const list = container.querySelector('ul') as HTMLElement;
      fakeLayout(list);
      list.scrollTop = 800;
      fireEvent.scroll(list);

      rerender(<MessageList messages={[incoming('a'), incoming('b')]} />);

      expect(list.scrollTop).toBe(1000);
    });

    it('не дёргает вниз того, кто листает историю, но своё сообщение прокручивает всегда', () => {
      const { rerender, container } = render(<MessageList messages={[incoming('a')]} />);
      const list = container.querySelector('ul') as HTMLElement;
      fakeLayout(list);
      list.scrollTop = 0;
      fireEvent.scroll(list);

      rerender(<MessageList messages={[incoming('a'), incoming('b')]} />);
      expect(list.scrollTop).toBe(0);

      rerender(<MessageList messages={[incoming('a'), incoming('b'), { ...sending, key: 'c' }]} />);
      expect(list.scrollTop).toBe(1000);
    });

    it('кнопка «вниз» появляется, когда прокручено вверх, и возвращает к последним сообщениям', () => {
      const { container } = render(<MessageList messages={[incoming('a')]} />);
      const list = container.querySelector('ul') as HTMLElement;
      fakeLayout(list);
      list.scrollTo = vi.fn();
      expect(screen.queryByRole('button', { name: /вниз/i })).not.toBeInTheDocument();

      list.scrollTop = 0;
      fireEvent.scroll(list);
      fireEvent.click(screen.getByRole('button', { name: /вниз/i }));

      expect(list.scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: 'smooth' });

      list.scrollTop = 800;
      fireEvent.scroll(list);
      expect(screen.queryByRole('button', { name: /вниз/i })).not.toBeInTheDocument();
    });
  });
});
