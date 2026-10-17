import { delay, http, HttpResponse } from 'msw';
import { createApiClient } from '../../api/client';
import type { Credentials, NotificationBody } from '../../api/types';
import { server } from '../../test/server';
import { pollNotifications } from './polling';

const credentials: Credentials = {
  apiUrl: 'https://api.test.local',
  idInstance: '1000000001',
  apiTokenInstance: 'fake-token',
};
const base = 'https://api.test.local/waInstance1000000001';
const receiveUrl = `${base}/receiveNotification/fake-token`;
const client = createApiClient(credentials);

const incoming = (receiptId: number, idMessage: string) => ({
  receiptId,
  body: { typeWebhook: 'incomingMessageReceived', idMessage },
});

/** Отдаёт ответы по очереди, а когда они кончились — «вешает» запрос до отмены. */
function queueResponses(...responses: Array<() => Response | Promise<Response>>) {
  let calls = 0;
  let aborted = 0;
  server.use(
    http.get(receiveUrl, async ({ request }) => {
      const next = responses[calls++];
      if (next) return next();
      request.signal.addEventListener('abort', () => (aborted += 1));
      await delay('infinite');
      return HttpResponse.json(null);
    }),
  );
  return { calls: () => calls, aborted: () => aborted };
}

async function until(condition: () => boolean) {
  for (let i = 0; i < 200 && !condition(); i++) await new Promise((r) => setTimeout(r, 5));
  expect(condition()).toBe(true);
}

describe('pollNotifications', () => {
  it('передаёт уведомление обработчику и удаляет его по receiptId, пустую очередь пропускает', async () => {
    const received: NotificationBody[] = [];
    const deleted: string[] = [];
    queueResponses(
      () => HttpResponse.json(null),
      () => HttpResponse.json(incoming(7, 'm1')),
    );
    server.use(
      http.delete(`${base}/deleteNotification/fake-token/:receiptId`, ({ params }) => {
        deleted.push(String(params.receiptId));
        return HttpResponse.json({ result: true });
      }),
    );
    const controller = new AbortController();
    const done = pollNotifications({
      client,
      signal: controller.signal,
      onNotification: (body) => received.push(body),
    });

    await until(() => deleted.length === 1);
    controller.abort();
    await done;

    expect(received).toEqual([incoming(7, 'm1').body]);
    expect(deleted).toEqual(['7']);
  });

  it('останавливается по отмене, даже если запрос висит, и больше не делает запросов', async () => {
    const queue = queueResponses(); // первый же запрос зависает
    const controller = new AbortController();
    const done = pollNotifications({ client, signal: controller.signal, onNotification: () => {} });

    await until(() => queue.calls() === 1);
    controller.abort();
    await done; // цикл вышел, не дожидаясь ответа сервера

    await until(() => queue.aborted() === 1); // висящий запрос реально отменён
    await new Promise((r) => setTimeout(r, 30));
    expect(queue.calls()).toBe(1);
  });

  it('повторяет запрос после сбоя сервера и продолжает работу', async () => {
    const received: NotificationBody[] = [];
    queueResponses(
      () => new HttpResponse(null, { status: 500 }),
      () => HttpResponse.json(incoming(1, 'm1')),
    );
    server.use(http.delete(`${base}/deleteNotification/fake-token/1`, () => HttpResponse.json({ result: true })));
    const controller = new AbortController();
    const done = pollNotifications({
      client,
      signal: controller.signal,
      onNotification: (body) => received.push(body),
      retryDelayMs: 1,
    });

    await until(() => received.length === 1);
    controller.abort();
    await done;
  });

  it('при 401 сообщает onFatal и больше не повторяет запросы', async () => {
    const fatal: number[] = [];
    const queue = queueResponses(() => new HttpResponse(null, { status: 401 }));
    await pollNotifications({
      client,
      signal: new AbortController().signal,
      onNotification: () => {},
      onFatal: (error) => fatal.push(error.status),
      retryDelayMs: 1,
    });

    expect(fatal).toEqual([401]);
    expect(queue.calls()).toBe(1);
  });

  it('удаляет уведомление, даже если обработчик упал, и не зацикливается на нём', async () => {
    const deleted: string[] = [];
    queueResponses(() => HttpResponse.json(incoming(3, 'm1')));
    server.use(
      http.delete(`${base}/deleteNotification/fake-token/:receiptId`, ({ params }) => {
        deleted.push(String(params.receiptId));
        return HttpResponse.json({ result: true });
      }),
    );
    const controller = new AbortController();
    const done = pollNotifications({
      client,
      signal: controller.signal,
      onNotification: () => {
        throw new Error('сломанный обработчик');
      },
      retryDelayMs: 1,
    });

    await until(() => deleted.length === 1);
    controller.abort();
    await done;
    expect(deleted).toEqual(['3']);
  });
});
