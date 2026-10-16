import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/server';
import { LoginForm } from './LoginForm';

const stateUrl = 'https://api.test.local/waInstance1000000001/getStateInstance/fake-token';

async function fillAndSubmit() {
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Адрес API'));
  await user.type(screen.getByLabelText('Адрес API'), 'https://api.test.local');
  await user.type(screen.getByLabelText('idInstance'), '1000000001');
  await user.type(screen.getByLabelText('apiTokenInstance'), 'fake-token');
  await user.click(screen.getByRole('button', { name: 'Войти' }));
}

describe('LoginForm', () => {
  it('входит, если инстанс авторизован', async () => {
    server.use(http.get(stateUrl, () => HttpResponse.json({ stateInstance: 'authorized' })));
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    await fillAndSubmit();
    await vi.waitFor(() =>
      expect(onLogin).toHaveBeenCalledWith({
        apiUrl: 'https://api.test.local',
        idInstance: '1000000001',
        apiTokenInstance: 'fake-token',
      }),
    );
  });

  it('объясняет, что инстанс не авторизован', async () => {
    server.use(http.get(stateUrl, () => HttpResponse.json({ stateInstance: 'notAuthorized' })));
    const onLogin = vi.fn();
    render(<LoginForm onLogin={onLogin} />);
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Инстанс не авторизован');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('показывает ошибку неверного токена', async () => {
    server.use(http.get(stateUrl, () => new HttpResponse(null, { status: 401 })));
    render(<LoginForm onLogin={vi.fn()} />);
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный apiTokenInstance');
  });

  it('показывает ошибку сети', async () => {
    server.use(http.get(stateUrl, () => HttpResponse.error()));
    render(<LoginForm onLogin={vi.fn()} />);
    await fillAndSubmit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось связаться с сервером');
  });
});
