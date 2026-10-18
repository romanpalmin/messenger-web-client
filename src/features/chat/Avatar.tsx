import { avatarHue } from './avatarHue';

interface Props {
  chatId: string;
  size?: number;
}

/** Круг с иконкой человека; цвет зависит от chatId. Декоративный: имя чата рядом уже есть текстом. */
export function Avatar({ chatId, size = 48 }: Props) {
  const hue = avatarHue(chatId);
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(160deg, hsl(${hue} 70% 62%), hsl(${hue} 60% 45%))`,
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="currentColor">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5z" />
      </svg>
    </span>
  );
}
