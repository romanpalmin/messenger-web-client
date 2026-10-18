import { clearChatState, loadChatState, saveChatState } from './chatStorage';
import { initialChatState } from './chatReducer';
import type { ChatState } from './types';

const state: ChatState = {
  activeChatId: '1@c.us',
  chats: [
    {
      chatId: '1@c.us',
      phone: 79001234567,
      messages: [
        { key: 'a', idMessage: 'm1', direction: 'in', text: 'Привет', timestamp: 100, status: 'sent' },
        { key: 'b', direction: 'out', text: 'Ответ', timestamp: 200, status: 'sending' },
      ],
    },
  ],
};

describe('chatStorage', () => {
  beforeEach(() => sessionStorage.clear());

  it('возвращает пустое состояние, если ничего не сохранено', () => {
    expect(loadChatState('1')).toBe(initialChatState);
  });

  it('сохраняет и читает чаты; «отправляется» после перезагрузки становится «не отправлено»', () => {
    saveChatState('1', state);

    const loaded = loadChatState('1');

    expect(loaded.activeChatId).toBe('1@c.us');
    expect(loaded.chats[0].messages[0]).toEqual(state.chats[0].messages[0]);
    expect(loaded.chats[0].messages[1]).toMatchObject({
      status: 'failed',
      error: expect.stringContaining('перезагружена'),
    });
  });

  it('чаты разных инстансов не смешиваются', () => {
    saveChatState('1', state);

    expect(loadChatState('2')).toBe(initialChatState);
  });

  it('не падает на повреждённых данных и данных неожиданной формы', () => {
    sessionStorage.setItem('messenger-web-client:chats:1', '{oops');
    expect(loadChatState('1')).toBe(initialChatState);

    sessionStorage.setItem('messenger-web-client:chats:1', JSON.stringify({ chats: [{ chatId: 1 }] }));
    expect(loadChatState('1')).toBe(initialChatState);
  });

  it('сбрасывает activeChatId, если такого чата нет в списке', () => {
    saveChatState('1', { ...state, activeChatId: 'нет такого' });

    expect(loadChatState('1').activeChatId).toBeNull();
  });

  it('clearChatState удаляет сохранённое', () => {
    saveChatState('1', state);
    clearChatState('1');

    expect(loadChatState('1')).toBe(initialChatState);
  });
});
