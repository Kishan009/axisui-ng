/**
 * Format a statistic value. Strings pass through; numbers are formatted via
 * Intl.NumberFormat (grouping by default; `options` for currency/percent/etc.).
 */
export function formatStatValue(
  value: number | string,
  locale?: string,
  options?: Intl.NumberFormatOptions | null
): string {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat(locale, options ?? undefined).format(value);
}
