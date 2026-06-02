import { formatRelativeTimePt } from './format-relative-time-pt';

describe('formatRelativeTimePt', () => {
  const now = new Date('2026-06-02T12:00:00.000Z');

  it('returns "Agora" for timestamps under one minute ago', () => {
    const date = new Date('2026-06-02T11:59:30.000Z');
    expect(formatRelativeTimePt(date, now)).toBe('Agora');
  });

  it('returns hours ago for same-day timestamps', () => {
    const date = new Date('2026-06-02T10:00:00.000Z');
    expect(formatRelativeTimePt(date, now)).toBe('Há 2 horas');
  });

  it('returns "Ontem" for previous day', () => {
    const date = new Date('2026-06-01T12:00:00.000Z');
    expect(formatRelativeTimePt(date, now)).toBe('Ontem');
  });
});
