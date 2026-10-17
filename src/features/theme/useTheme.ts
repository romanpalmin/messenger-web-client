import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // хранилище недоступно (приватный режим): берём системную тему
  }
  return systemTheme();
}

/**
 * Тема интерфейса: выбор пользователя или системная настройка. Значение пишется в атрибут
 * `data-theme` на <html> — по нему CSS подменяет переменные цветов.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // не сохранилось — не страшно, тема останется до перезагрузки
    }
  }

  return { theme, toggle };
}
