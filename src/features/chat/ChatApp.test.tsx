import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { ChatApp } from './ChatApp';

const credentials = { apiUrl: 'https://api.test.local', idInstance: '1000000001', apiTokenInstance: 'fake-token' };
const base = 'https://api.test.local/waInstance1000000001';

function mockCheckAccount(exist = true) {
  server.use(
    http.post(`${base}/checkAccount/fake-token`, () =>
      HttpResponse.json(exist ? { exist: true, chatId: '10000000' } : { exist: false, chatId: '' }),
    ),
  );
}

async function createChat(user: ReturnType<typeof userEvent.setup>, phone = '+7 900 123-45-67') {
  await user.type(screen.getByLabelText('Номер телефона получателя'), phone);
  await user.click(screen.getByRole('button', { name: 'Новый чат' }));
}

describe('ChatApp', () => {
  it('создаёт чат по номеру и показывает его в списке', async () => {
    mockCheckAccount();
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);

    await createChat(user);

    const list = await screen.findByRole('list');
    expect(within(list).getByText('+79001234567')).toBeInTheDocument();
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument();
  });

  it('сообщает, что на номере нет Telegram', async () => {
    mockCheckAccount(false);
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);

    await createChat(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('На этом номере нет аккаунта Telegram');
  });

  it('не ходит в сеть при некорректном номере', async () => {
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);

    await createChat(user, '123');

    expect(screen.getByRole('alert')).toHaveTextContent('международном формате');
  });

  it('отправляет сообщение и показывает статус «Отправлено»', async () => {
    mockCheckAccount();
    let body: unknown;
    server.use(
      http.post(`${base}/sendMessage/fake-token`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ idMessage: 'm1' });
      }),
    );
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);

    await user.type(await screen.findByLabelText('Сообщение'), 'Привет');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText(/Отправлено/)).toBeInTheDocument();
    expect(screen.getAllByText('Привет').length).toBeGreaterThan(0);
    expect(body).toEqual({ chatId: '10000000', message: 'Привет' });
  });

  it('показывает ошибку, если отправка не удалась', async () => {
    mockCheckAccount();
    server.use(http.post(`${base}/sendMessage/fake-token`, () => new HttpResponse(null, { status: 466 })));
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);

    await user.type(await screen.findByLabelText('Сообщение'), 'Привет');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(await screen.findByText(/Не отправлено/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Лимит бесплатного тарифа');
  });

  it('кнопка «Отправить» неактивна для пустого текста', async () => {
    mockCheckAccount();
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);

    await screen.findByLabelText('Сообщение');
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });
});
