import { renderHook } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { createApiClient } from '../../api/client';
import type { NotificationBody } from '../../api/types';
import { server } from '../../test/server';
import { useNotifications } from './useNotifications';

const base = 'https://api.test.local/waInstance1000000001';
const client = createApiClient({
  apiUrl: 'https://api.test.local',
  idInstance: '1000000001',
  apiTokenInstance: 'fake-token',
});

async function until(condition: () => boolean) {
  for (let i = 0; i < 200 && !condition(); i++) await new Promise((r) => setTimeout(r, 5));
  expect(condition()).toBe(true);
}

describe('useNotifications', () => {
  it('получает уведомления, а после размонтирования перестаёт опрашивать сервис', async () => {
    let calls = 0;
    let aborted = false;
    const received: NotificationBody[] = [];
    server.use(
      http.get(`${base}/receiveNotification/fake-token`, async ({ request }) => {
        calls += 1;
        if (calls === 1) return HttpResponse.json({ receiptId: 5, body: { typeWebhook: 'stateInstanceChanged' } });
        request.signal.addEventListener('abort', () => (aborted = true));
        await delay('infinite');
        return HttpResponse.json(null);
      }),
      http.delete(`${base}/deleteNotification/fake-token/5`, () => HttpResponse.json({ result: true })),
    );

    const { unmount } = renderHook(() => useNotifications(client, (body) => received.push(body)));
    await until(() => received.length === 1 && calls === 2);

    expect(aborted).toBe(false); // пока компонент жив, запрос висит и ждёт сообщений
    unmount();
    await until(() => aborted); // cleanup отменил висящий запрос, а не оставил его «утекать»
    expect(calls).toBe(2); // и новых запросов после unmount нет
    expect(received).toEqual([{ typeWebhook: 'stateInstanceChanged' }]);
  });
});
