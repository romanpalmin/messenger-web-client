import { useTheme } from './useTheme';

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 22,
  height: 22,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Кнопка в правом верхнем углу: на ней то, что будет включено при нажатии (в светлой теме — луна и «Тёмная»). */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const toDark = theme === 'light';
  return (
    <button type="button" className="theme-toggle" onClick={toggle} title="Переключить тему">
      {toDark ? (
        <svg {...ICON_PROPS}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        <svg {...ICON_PROPS}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
      <span className="theme-toggle__label">{toDark ? 'Тёмная тема' : 'Светлая тема'}</span>
    </button>
  );
}
