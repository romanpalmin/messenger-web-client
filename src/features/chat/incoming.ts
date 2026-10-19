import type { NotificationBody } from '../../api/types';
import type { ChatAction } from './chatReducer';

/**
 * Превращает уведомление GREEN-API в действие редьюсера. Нужны только входящие текстовые сообщения:
 * файлы, опросы, смена состояния инстанса и эхо наших же отправок (outgoing*) пропускаем.
 */
export function toReceivedAction(body: NotificationBody): ChatAction | null {
  if (body.typeWebhook !== 'incomingMessageReceived') return null;
  const { idMessage, timestamp, senderData, messageData } = body as Extract<
    NotificationBody,
    { typeWebhook: 'incomingMessageReceived' }
  >;
  let text: string | undefined;
  if (messageData.typeMessage === 'textMessage' && 'textMessageData' in messageData) {
    text = messageData.textMessageData.textMessage;
  } else if (messageData.typeMessage === 'extendedTextMessage' && 'extendedTextMessageData' in messageData) {
    text = messageData.extendedTextMessageData.text;
  }
  if (!text) return null;
  // групповые чаты (WhatsApp) в клиенте не поддерживаются: личные переписки по номеру
  if (senderData.chatId.endsWith('@g.us')) return null;
  const name = senderData.senderName || senderData.chatName || undefined;
  return { type: 'messageReceived', chatId: senderData.chatId, name, idMessage, text, timestamp };
}
