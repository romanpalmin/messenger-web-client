import { chatReducer, initialChatState } from './chatReducer';
import type { ChatState } from './types';

const opened = chatReducer(initialChatState, { type: 'chatOpened', chatId: '1', phone: 79001234567 });

describe('chatReducer', () => {
  it('открывает чат и делает его активным', () => {
    expect(opened.activeChatId).toBe('1');
    expect(opened.chats).toEqual([{ chatId: '1', phone: 79001234567, messages: [] }]);
  });

  it('не дублирует чат с тем же chatId, но выбирает его', () => {
    const second = chatReducer(opened, { type: 'chatOpened', chatId: '2', phone: 79007654321 });
    const again = chatReducer(second, { type: 'chatOpened', chatId: '1', phone: 79001234567 });
    expect(again.chats).toHaveLength(2);
    expect(again.activeChatId).toBe('1');
  });

  it('игнорирует выбор несуществующего чата', () => {
    expect(chatReducer(opened, { type: 'chatSelected', chatId: 'nope' })).toBe(opened);
  });

  it('закрывает чат, не удаляя его из списка; повторное закрытие возвращает то же состояние', () => {
    const closed = chatReducer(opened, { type: 'chatClosed' });

    expect(closed.activeChatId).toBeNull();
    expect(closed.chats).toBe(opened.chats);
    expect(chatReducer(closed, { type: 'chatClosed' })).toBe(closed);
  });

  it('проводит сообщение через sending → sent: ключ остаётся, idMessage добавляется', () => {
    const sending = chatReducer(opened, {
      type: 'messageSending',
      chatId: '1',
      localId: 'local',
      text: 'Привет',
      timestamp: 100,
    });
    expect(sending.chats[0].messages[0]).toMatchObject({ key: 'local', status: 'sending', direction: 'out' });
    expect(sending.chats[0].messages[0].idMessage).toBeUndefined();

    const sent = chatReducer(sending, { type: 'messageSent', chatId: '1', localId: 'local', idMessage: 'm1' });
    expect(sent.chats[0].messages[0]).toMatchObject({
      key: 'local',
      idMessage: 'm1',
      status: 'sent',
      text: 'Привет',
    });
  });

  it('помечает сообщение как failed с текстом ошибки', () => {
    let state: ChatState = chatReducer(opened, {
      type: 'messageSending',
      chatId: '1',
      localId: 'local',
      text: 'Привет',
      timestamp: 100,
    });
    state = chatReducer(state, { type: 'messageFailed', chatId: '1', localId: 'local', error: 'нет сети' });
    expect(state.chats[0].messages[0]).toMatchObject({ status: 'failed', error: 'нет сети' });
  });

  it('не трогает сообщения других чатов', () => {
    let state = chatReducer(opened, { type: 'chatOpened', chatId: '2', phone: 79007654321 });
    state = chatReducer(state, { type: 'messageSending', chatId: '2', localId: 'x', text: 'Эй', timestamp: 1 });
    expect(state.chats[0].messages).toEqual([]);
    expect(state.chats[1].messages).toHaveLength(1);
  });

  it('chatNamed задаёт имя; то же имя или неизвестный чат не меняют состояние', () => {
    const named = chatReducer(opened, { type: 'chatNamed', chatId: '1', name: 'Анна' });
    expect(named.chats[0].name).toBe('Анна');
    expect(chatReducer(named, { type: 'chatNamed', chatId: '1', name: 'Анна' })).toBe(named);
    expect(chatReducer(named, { type: 'chatNamed', chatId: 'nope', name: 'Борис' })).toBe(named);
  });

  describe('messageReceived', () => {
    const received = { type: 'messageReceived', chatId: '1', idMessage: 'A1', text: 'Привет', timestamp: 5 } as const;

    it('добавляет входящее сообщение в открытый чат', () => {
      const next = chatReducer(opened, received);
      expect(next.chats[0].messages).toEqual([
        { key: 'A1', idMessage: 'A1', direction: 'in', text: 'Привет', timestamp: 5, status: 'sent' },
      ]);
    });

    it('дедуплицирует по idMessage: повтор не меняет состояние', () => {
      const once = chatReducer(opened, received);
      expect(chatReducer(once, received)).toBe(once);
    });

    it('запоминает имя собеседника в чате, созданном по номеру, и не перезаписывает уже известное', () => {
      const named = chatReducer(opened, { ...received, name: 'Анна' });
      expect(named.chats[0]).toMatchObject({ phone: 79001234567, name: 'Анна' });
      const again = chatReducer(named, { ...received, idMessage: 'A2', name: 'Анна Т.' });
      expect(again.chats[0].name).toBe('Анна');
    });

    it('создаёт чат, если пишет собеседник, которого не открывали, и не делает его активным', () => {
      const next = chatReducer(opened, { ...received, chatId: 'other', name: 'Анна' });
      expect(next.activeChatId).toBe('1');
      expect(next.chats).toHaveLength(2);
      expect(next.chats[1]).toMatchObject({
        chatId: 'other',
        name: 'Анна',
        messages: [{ idMessage: 'A1', text: 'Привет' }],
      });
      expect(next.chats[1].phone).toBeUndefined();
    });

    it('повтор уведомления от нового собеседника не создаёт второй чат и второе сообщение', () => {
      const once = chatReducer(opened, { ...received, chatId: 'other' });
      expect(chatReducer(once, { ...received, chatId: 'other' })).toBe(once);
    });

    it('когда номер этого собеседника введут вручную, чат получает номер и не дублируется', () => {
      const fromIncoming = chatReducer(opened, { ...received, chatId: 'other', name: 'Анна' });
      const next = chatReducer(fromIncoming, { type: 'chatOpened', chatId: 'other', phone: 79005550000 });
      expect(next.chats).toHaveLength(2);
      expect(next.chats[1]).toMatchObject({ chatId: 'other', phone: 79005550000, name: 'Анна' });
      expect(next.chats[1].messages).toHaveLength(1);
      expect(next.activeChatId).toBe('other');
    });
  });
});
