import { formatStatValue } from './statistic-format';

describe('formatStatValue', () => {
  it('passes strings through unchanged', () => {
    expect(formatStatValue('N/A')).toBe('N/A');
  });
  it('groups numbers (en-US)', () => {
    expect(formatStatValue(1234567, 'en-US')).toBe('1,234,567');
  });
  it('applies currency options', () => {
    expect(formatStatValue(1234.5, 'en-US', { style: 'currency', currency: 'USD' })).toBe('$1,234.50');
  });
  it('applies percent options', () => {
    expect(formatStatValue(0.42, 'en-US', { style: 'percent' })).toBe('42%');
  });
});
