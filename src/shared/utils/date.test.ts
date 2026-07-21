import { describe, it, expect } from 'vitest';
import { getMonday, getWeekDays, formatDate, addWeeks, isSameDay } from './date';

describe('getMonday', () => {
  it('returns monday for a wednesday', () => {
    const wed = new Date(2026, 6, 22); // Wed Jul 22, 2026
    const mon = getMonday(wed);
    expect(formatDate(mon)).toBe('2026-07-20');
  });

  it('returns monday for a sunday', () => {
    const sun = new Date(2026, 6, 26); // Sun Jul 26 (0 = Sunday)
    const mon = getMonday(sun);
    expect(formatDate(mon)).toBe('2026-07-20');
  });

  it('returns same day for a monday', () => {
    const mon = new Date(2026, 6, 20);
    expect(formatDate(getMonday(mon))).toBe('2026-07-20');
  });
});

describe('getWeekDays', () => {
  it('returns 7 days starting from monday', () => {
    const mon = new Date(2026, 6, 20);
    const days = getWeekDays(mon);
    expect(days).toHaveLength(7);
    expect(formatDate(days[0])).toBe('2026-07-20');
    expect(formatDate(days[6])).toBe('2026-07-26');
  });
});

describe('addWeeks', () => {
  it('adds one week', () => {
    const mon = new Date(2026, 6, 20);
    const next = addWeeks(mon, 1);
    expect(formatDate(next)).toBe('2026-07-27');
  });

  it('subtracts one week', () => {
    const mon = new Date(2026, 6, 20);
    const prev = addWeeks(mon, -1);
    expect(formatDate(prev)).toBe('2026-07-13');
  });
});

describe('isSameDay', () => {
  it('matches same day', () => {
    expect(isSameDay(new Date(2026, 6, 20), new Date(2026, 6, 20))).toBe(true);
  });

  it('rejects different days', () => {
    expect(isSameDay(new Date(2026, 6, 20), new Date(2026, 6, 21))).toBe(false);
  });
});
