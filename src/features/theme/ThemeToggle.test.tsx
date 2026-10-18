import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('по умолчанию берёт светлую тему (в jsdom нет системной тёмной) и ставит её на <html>', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('переключает тему и запоминает выбор', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Тёмная тема' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Светлая тема' })).toBeInTheDocument();
  });

  it('читает сохранённый выбор при следующем запуске', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
