import { avatarHue } from './avatarHue';

describe('avatarHue', () => {
  it('для одного chatId всегда один и тот же оттенок в пределах круга', () => {
    const hue = avatarHue('79001234567@c.us');

    expect(avatarHue('79001234567@c.us')).toBe(hue);
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it('разные чаты обычно получают разные оттенки', () => {
    expect(avatarHue('79001234567')).not.toBe(avatarHue('79001234568'));
  });
});
