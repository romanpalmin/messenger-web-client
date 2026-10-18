import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
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

describe('ChatApp: сохранение чатов', () => {
  it('после перезагрузки (повторного монтирования) чаты и открытый чат на месте', async () => {
    mockCheckAccount();
    const user = userEvent.setup();
    const first = render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);
    await screen.findByLabelText('Сообщение');
    first.unmount();

    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);

    expect(within(screen.getByRole('list')).getByText('+79001234567')).toBeInTheDocument();
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument();
  });

  it('«Выйти» стирает сохранённые чаты и вызывает onLogout', async () => {
    mockCheckAccount();
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<ChatApp credentials={credentials} onLogout={onLogout} />);
    await createChat(user);
    await screen.findByLabelText('Сообщение');

    await user.click(screen.getByRole('button', { name: 'Выйти' }));

    expect(onLogout).toHaveBeenCalled();
    expect(sessionStorage.getItem(`messenger-web-client:chats:${credentials.idInstance}`)).toBeNull();
  });
});

describe('ChatApp: мобильная навигация', () => {
  it('«Назад» закрывает чат, но оставляет его в списке и позволяет открыть снова', async () => {
    mockCheckAccount();
    const user = userEvent.setup();
    const { container } = render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);
    expect(container.firstElementChild).toHaveClass('chat-app--chat-open');

    await user.click(await screen.findByRole('button', { name: 'Назад к списку чатов' }));

    expect(container.firstElementChild).not.toHaveClass('chat-app--chat-open');
    expect(screen.getByText('Выберите чат или создайте новый')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /\+79001234567/ }));
    expect(screen.getByLabelText('Сообщение')).toBeInTheDocument();
  });
});

describe('ChatApp: входящие', () => {
  /** Отдаёт уведомления только после `gate.open()`, иначе они придут до создания чата и будут отброшены. */
  function mockNotifications(...bodies: unknown[]) {
    let call = 0;
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    server.use(
      http.get(`${base}/receiveNotification/fake-token`, async () => {
        await gate;
        const i = call++;
        if (i < bodies.length) return HttpResponse.json({ receiptId: i + 1, body: bodies[i] });
        await delay('infinite');
        return HttpResponse.json(null);
      }),
      http.delete(`${base}/deleteNotification/fake-token/:id`, () => HttpResponse.json({ result: true })),
    );
    return open;
  }
  const incoming = (idMessage: string, text: string) => ({
    typeWebhook: 'incomingMessageReceived',
    timestamp: 1,
    idMessage,
    senderData: { chatId: '10000000', sender: '10000000' },
    messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: text } },
  });

  it('показывает входящее сообщение один раз, даже если уведомление пришло дважды', async () => {
    mockCheckAccount();
    const openGate = mockNotifications(incoming('A1', 'Ответ собеседника'), incoming('A1', 'Ответ собеседника'));
    const user = userEvent.setup();
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);
    await createChat(user);

    await screen.findByLabelText('Сообщение');
    openGate();

    // Два текста: само сообщение и превью в списке чатов. Дубль уведомления третьего не добавил.
    expect(await screen.findAllByText('Ответ собеседника')).toHaveLength(2);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getAllByText('Ответ собеседника')).toHaveLength(2);
  });

  it('при 401 останавливает опрос и сообщает об этом', async () => {
    server.use(http.get(`${base}/receiveNotification/fake-token`, () => new HttpResponse(null, { status: 401 })));
    render(<ChatApp credentials={credentials} onLogout={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Получение сообщений остановлено');
  });
});
