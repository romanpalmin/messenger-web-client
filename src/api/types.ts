export interface Credentials {
  /** Хост API из личного кабинета, например https://api.green-api.com */
  apiUrl: string;
  idInstance: string;
  apiTokenInstance: string;
}

export type InstanceState =
  'notAuthorized' | 'authorized' | 'blocked' | 'suspended' | 'starting' | 'yellowCard' | 'pendingPayment';

export interface StateInstanceResponse {
  stateInstance: InstanceState;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  username?: string;
  phoneNumber?: number;
}

export interface ContactInfoResponse {
  chatId: string;
  /** Имя из профиля Telegram. */
  name?: string;
  /** Имя из телефонной книги инстанса (как собеседник сохранён у нас). */
  contactName?: string;
  /** Публичное имя вида «@username». */
  username?: string;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason?: string;
}

export interface TextMessageData {
  typeMessage: 'textMessage';
  textMessageData: { textMessage: string };
}

export interface ExtendedTextMessageData {
  typeMessage: 'extendedTextMessage';
  extendedTextMessageData: { text: string };
}

/** Остальные типы сообщений (файлы, опросы и т.д.) клиент не показывает. */
export interface OtherMessageData {
  typeMessage: string;
}

export type MessageData = TextMessageData | ExtendedTextMessageData | OtherMessageData;

export interface SenderData {
  chatId: string;
  sender: string;
  chatName?: string;
  senderName?: string;
}

export interface IncomingMessageNotification {
  typeWebhook: 'incomingMessageReceived';
  timestamp: number;
  idMessage: string;
  senderData: SenderData;
  messageData: MessageData;
}

export interface OutgoingMessageNotification {
  typeWebhook: 'outgoingMessageReceived' | 'outgoingAPIMessageReceived';
  timestamp: number;
  idMessage: string;
  senderData: SenderData;
  messageData: MessageData;
}

export interface OtherNotification {
  typeWebhook: string;
}

export type NotificationBody = IncomingMessageNotification | OutgoingMessageNotification | OtherNotification;

export interface ReceivedNotification {
  receiptId: number;
  body: NotificationBody;
}
