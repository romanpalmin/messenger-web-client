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

  it('проводит сообщение через sending → sent и подменяет id на idMessage', () => {
    const sending = chatReducer(opened, {
      type: 'messageSending',
      chatId: '1',
      localId: 'local',
      text: 'Привет',
      timestamp: 100,
    });
    expect(sending.chats[0].messages[0]).toMatchObject({ id: 'local', status: 'sending', direction: 'out' });

    const sent = chatReducer(sending, { type: 'messageSent', chatId: '1', localId: 'local', idMessage: 'm1' });
    expect(sent.chats[0].messages[0]).toMatchObject({ id: 'm1', status: 'sent', text: 'Привет' });
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
});
