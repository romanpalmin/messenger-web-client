import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import App from './App';
import { server } from './test/server';

beforeEach(() => sessionStorage.clear());

describe('App', () => {
  it('сначала показывает форму входа', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
  });

  it('после входа показывает заглушку и позволяет выйти', async () => {
    server.use(
      http.get('https://api.test.local/waInstance1000000001/getStateInstance/fake-token', () =>
        HttpResponse.json({ stateInstance: 'authorized' }),
      ),
    );
    const user = userEvent.setup();
    render(<App />);
    await user.clear(screen.getByLabelText('Адрес API'));
    await user.type(screen.getByLabelText('Адрес API'), 'https://api.test.local');
    await user.type(screen.getByLabelText('idInstance'), '1000000001');
    await user.type(screen.getByLabelText('apiTokenInstance'), 'fake-token');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    expect(await screen.findByText(/Вы вошли в инстанс 1000000001/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выйти' }));
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(sessionStorage.length).toBe(0);
  });
});
