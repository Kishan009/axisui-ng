import { formatDate, parseDate } from './date-format';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('date-format', () => {
  it('formatDate fills yyyy/MM/dd zero-padded; null → empty', () => {
    expect(formatDate(d(2026, 6, 5), 'yyyy-MM-dd')).toBe('2026-06-05');
    expect(formatDate(d(2026, 12, 31), 'MM/dd/yyyy')).toBe('12/31/2026');
    expect(formatDate(null, 'yyyy-MM-dd')).toBe('');
  });

  it('parseDate accepts valid strings in the given pattern', () => {
    expect(formatDate(parseDate('2026-06-05', 'yyyy-MM-dd'), 'yyyy-MM-dd')).toBe('2026-06-05');
    expect(formatDate(parseDate('06/05/2026', 'MM/dd/yyyy'), 'yyyy-MM-dd')).toBe('2026-06-05');
    expect(formatDate(parseDate('  2026-6-5  ', 'yyyy-MM-dd'), 'yyyy-MM-dd')).toBe('2026-06-05');
  });

  it('parseDate rejects malformed and impossible dates', () => {
    expect(parseDate('bad', 'yyyy-MM-dd')).toBeNull();
    expect(parseDate('2026-13-01', 'yyyy-MM-dd')).toBeNull();
    expect(parseDate('2026-02-30', 'yyyy-MM-dd')).toBeNull();
    expect(parseDate('', 'yyyy-MM-dd')).toBeNull();
  });
});
