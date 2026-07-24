export type CalendarMode = 'single' | 'range' | 'multiple';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface DateRange {
  start: Date | null;
  end: Date | null;
}
export type CalendarValue = Date | DateRange | Date[] | null;

export function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function compareDay(a: Date, b: Date): -1 | 0 | 1 {
  if (a.getFullYear() !== b.getFullYear()) return a.getFullYear() < b.getFullYear() ? -1 : 1;
  if (a.getMonth() !== b.getMonth()) return a.getMonth() < b.getMonth() ? -1 : 1;
  if (a.getDate() !== b.getDate()) return a.getDate() < b.getDate() ? -1 : 1;
  return 0;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  const firstOfTarget = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const daysInTarget = new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth() + 1, 0).getDate();
  return new Date(firstOfTarget.getFullYear(), firstOfTarget.getMonth(), Math.min(d.getDate(), daysInTarget));
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function clampDay(d: Date, min: Date | null, max: Date | null): Date {
  if (min && compareDay(d, min) < 0) return new Date(min.getFullYear(), min.getMonth(), min.getDate());
  if (max && compareDay(d, max) > 0) return new Date(max.getFullYear(), max.getMonth(), max.getDate());
  return d;
}

export function orderRange(a: Date, b: Date): DateRange {
  return compareDay(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a };
}

export function isInRange(d: Date, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false;
  return compareDay(d, start) >= 0 && compareDay(d, end) <= 0;
}

export function isDisabled(
  d: Date,
  min: Date | null,
  max: Date | null,
  predicate?: ((d: Date) => boolean) | null
): boolean {
  if (min && compareDay(d, min) < 0) return true;
  if (max && compareDay(d, max) > 0) return true;
  return predicate ? predicate(d) : false;
}

export function monthMatrix(viewDate: Date, weekStartsOn: WeekDay): Date[][] {
  const first = startOfMonth(viewDate);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  const gridStart = addDays(first, -offset);
  const weeks: Date[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let dow = 0; dow < 7; dow++) row.push(addDays(gridStart, w * 7 + dow));
    weeks.push(row);
  }
  return weeks;
}

function asRange(value: CalendarValue): DateRange | null {
  return value && !(value instanceof Date) && !Array.isArray(value) ? value : null;
}

export function applySelection(value: CalendarValue, day: Date, mode: CalendarMode): CalendarValue {
  if (mode === 'single') return day;
  if (mode === 'multiple') {
    const arr = Array.isArray(value) ? value : [];
    const exists = arr.some((x) => isSameDay(x, day));
    const next = exists ? arr.filter((x) => !isSameDay(x, day)) : [...arr, day];
    return [...next].sort(compareDay);
  }
  const range = asRange(value);
  if (!range || !range.start || (range.start && range.end)) return { start: day, end: null };
  return orderRange(range.start, day);
}
