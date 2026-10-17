import type { NotificationBody } from '../../api/types';
import { toReceivedAction } from './incoming';

const senderData = { chatId: '100', sender: '100' };

describe('toReceivedAction', () => {
  it('разбирает входящее текстовое сообщение', () => {
    const body: NotificationBody = {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 10,
      idMessage: 'A1',
      senderData,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    } as NotificationBody;
    expect(toReceivedAction(body)).toEqual({
      type: 'messageReceived',
      chatId: '100',
      idMessage: 'A1',
      text: 'Привет',
      timestamp: 10,
    });
  });

  it('разбирает extendedTextMessage (текст со ссылкой или ответ)', () => {
    const body = {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 11,
      idMessage: 'A2',
      senderData,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'см. ссылку' } },
    } as NotificationBody;
    expect(toReceivedAction(body)).toMatchObject({ idMessage: 'A2', text: 'см. ссылку' });
  });

  it('пропускает файлы, эхо своих отправок и служебные уведомления', () => {
    const file = {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1,
      idMessage: 'A3',
      senderData,
      messageData: { typeMessage: 'imageMessage' },
    } as NotificationBody;
    const echo = {
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 1,
      idMessage: 'A4',
      senderData,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'я' } },
    } as NotificationBody;
    expect(toReceivedAction(file)).toBeNull();
    expect(toReceivedAction(echo)).toBeNull();
    expect(toReceivedAction({ typeWebhook: 'stateInstanceChanged' })).toBeNull();
  });
});
