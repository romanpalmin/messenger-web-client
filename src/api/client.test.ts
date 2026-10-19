import { http, HttpResponse } from 'msw';
import { server } from '../test/server';
import { ApiError, createApiClient } from './client';
import type { Credentials } from './types';

const credentials: Credentials = {
  apiUrl: 'https://api.test.local/',
  idInstance: '1000000001',
  apiTokenInstance: 'fake-token',
};
const base = 'https://api.test.local/waInstance1000000001';

describe('createApiClient', () => {
  it('getStateInstance запрашивает состояние инстанса', async () => {
    server.use(
      http.get(`${base}/getStateInstance/fake-token`, () => HttpResponse.json({ stateInstance: 'authorized' })),
    );
    await expect(createApiClient(credentials).getStateInstance()).resolves.toEqual({ stateInstance: 'authorized' });
  });

  it('checkAccount отправляет номер числом и возвращает chatId', async () => {
    let received: unknown;
    server.use(
      http.post(`${base}/checkAccount/fake-token`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ exist: true, chatId: '10000000' });
      }),
    );
    await expect(createApiClient(credentials).checkAccount(79876543210)).resolves.toEqual({
      exist: true,
      chatId: '10000000',
    });
    expect(received).toEqual({ phoneNumber: 79876543210 });
  });

  it('getContactInfo отправляет chatId и возвращает профиль собеседника', async () => {
    let received: unknown;
    server.use(
      http.post(`${base}/getContactInfo/fake-token`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ chatId: '10000000', name: 'Анна Тестова', username: '@anna' });
      }),
    );
    await expect(createApiClient(credentials).getContactInfo('10000000')).resolves.toMatchObject({
      name: 'Анна Тестова',
    });
    expect(received).toEqual({ chatId: '10000000' });
  });

  it('sendMessage отправляет chatId и текст', async () => {
    let received: unknown;
    server.use(
      http.post(`${base}/sendMessage/fake-token`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ idMessage: 'm1' });
      }),
    );
    await expect(createApiClient(credentials).sendMessage('10000000', 'Привет')).resolves.toEqual({ idMessage: 'm1' });
    expect(received).toEqual({ chatId: '10000000', message: 'Привет' });
  });

  it('receiveNotification передаёт таймаут и возвращает null для пустой очереди', async () => {
    let timeout: string | null = null;
    server.use(
      http.get(`${base}/receiveNotification/fake-token`, ({ request }) => {
        timeout = new URL(request.url).searchParams.get('receiveTimeout');
        return HttpResponse.json(null);
      }),
    );
    await expect(createApiClient(credentials).receiveNotification(30)).resolves.toBeNull();
    expect(timeout).toBe('30');
  });

  it('receiveNotification возвращает уведомление с receiptId', async () => {
    const notification = { receiptId: 7, body: { typeWebhook: 'stateInstanceChanged' } };
    server.use(http.get(`${base}/receiveNotification/fake-token`, () => HttpResponse.json(notification)));
    await expect(createApiClient(credentials).receiveNotification()).resolves.toEqual(notification);
  });

  it('deleteNotification использует DELETE и receiptId в пути', async () => {
    server.use(http.delete(`${base}/deleteNotification/fake-token/7`, () => HttpResponse.json({ result: true })));
    await expect(createApiClient(credentials).deleteNotification(7)).resolves.toEqual({ result: true });
  });

  it('запрещает браузеру кешировать ответы (иначе 304 подменит очередь уведомлений)', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('null'));
    await createApiClient(credentials, fetchImpl).receiveNotification();
    expect(fetchImpl).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ cache: 'no-store' }));
  });

  it('кодирует idInstance и токен в пути', async () => {
    const odd: Credentials = { apiUrl: 'https://api.test.local', idInstance: '1', apiTokenInstance: 'a/b c' };
    server.use(
      http.get('https://api.test.local/waInstance1/getStateInstance/a%2Fb%20c', () =>
        HttpResponse.json({ stateInstance: 'authorized' }),
      ),
    );
    await expect(createApiClient(odd).getStateInstance()).resolves.toEqual({ stateInstance: 'authorized' });
  });

  it.each([
    [401, 'Неверный apiTokenInstance'],
    [403, 'Неверный idInstance или адрес API'],
    [466, 'Лимит бесплатного тарифа: обмен возможен только с тремя чатами'],
    [469, 'Telegram временно ограничил поиск аккаунтов, повторите через несколько часов'],
  ])('ошибка %i превращается в понятное сообщение', async (status, message) => {
    server.use(http.get(`${base}/getStateInstance/fake-token`, () => new HttpResponse(null, { status })));
    const error = await createApiClient(credentials)
      .getStateInstance()
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status, message });
  });

  it('берёт причину из тела ошибки и не светит токен', async () => {
    server.use(
      http.post(`${base}/sendMessage/fake-token`, () =>
        HttpResponse.json({ reason: 'bad request data' }, { status: 400 }),
      ),
    );
    const error = (await createApiClient(credentials)
      .sendMessage('1', 'x')
      .catch((e: unknown) => e)) as ApiError;
    expect(error.message).toBe('bad request data');
    expect(error.message).not.toContain('fake-token');
  });
});
