import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MessageComposer } from './MessageComposer';

describe('MessageComposer', () => {
  it('Enter отправляет сообщение и очищает поле', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);

    await user.type(screen.getByLabelText('Сообщение'), 'Привет{Enter}');

    expect(onSend).toHaveBeenCalledWith('Привет');
    expect(screen.getByLabelText('Сообщение')).toHaveValue('');
  });

  it('Shift+Enter переносит строку, а сообщение уходит многострочным', async () => {
    const onSend = vi.fn();
    const user = userEvent.setup();
    render(<MessageComposer onSend={onSend} />);

    await user.type(screen.getByLabelText('Сообщение'), 'Раз{Shift>}{Enter}{/Shift}Два');
    expect(onSend).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(onSend).toHaveBeenCalledWith('Раз\nДва');
  });
});
