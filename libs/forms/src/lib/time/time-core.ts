export interface TimeValue {
  hours: number; // 0–23 canonical
  minutes: number;
  seconds?: number;
}
export type TimeField = 'hours' | 'minutes' | 'seconds';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function to12(hours: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hours < 12 ? 'AM' : 'PM';
  const h = hours % 12;
  return { hour12: h === 0 ? 12 : h, period };
}

export function from12(hour12: number, period: 'AM' | 'PM'): number {
  const base = hour12 % 12;
  return period === 'PM' ? base + 12 : base;
}

export function formatTime(value: TimeValue | null, opts: { use24: boolean; withSeconds: boolean }): string {
  if (!value) return '';
  if (opts.use24) {
    const base = `${pad(value.hours)}:${pad(value.minutes)}`;
    return opts.withSeconds ? `${base}:${pad(value.seconds ?? 0)}` : base;
  }
  const { hour12, period } = to12(value.hours);
  const base = `${hour12}:${pad(value.minutes)}`;
  const withSec = opts.withSeconds ? `${base}:${pad(value.seconds ?? 0)}` : base;
  return `${withSec} ${period}`;
}

export function parseTime(text: string, opts: { use24: boolean; withSeconds: boolean }): TimeValue | null {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec(text.trim());
  if (!m) return null;
  let hours = parseInt(m[1] ?? '', 10);
  const minutes = parseInt(m[2] ?? '', 10);
  const seconds = m[3] !== undefined ? parseInt(m[3], 10) : undefined;
  const period = m[4] ? (m[4].toUpperCase() as 'AM' | 'PM') : undefined;
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (minutes > 59 || (seconds !== undefined && seconds > 59)) return null;
  if (period) {
    if (hours < 1 || hours > 12) return null;
    hours = from12(hours, period);
  } else if (hours > 23) {
    return null;
  }
  const result: TimeValue = { hours, minutes };
  if (opts.withSeconds) result.seconds = seconds ?? 0;
  return result;
}

export function incrementField(
  value: TimeValue,
  field: TimeField,
  delta: number,
  opts: { minuteStep: number; withSeconds: boolean }
): TimeValue {
  const next: TimeValue = {
    hours: value.hours,
    minutes: value.minutes,
    ...(value.seconds !== undefined ? { seconds: value.seconds } : {}),
  };
  if (field === 'hours') {
    next.hours = (value.hours + delta + 24) % 24;
  } else if (field === 'minutes') {
    next.minutes = ((value.minutes + delta * opts.minuteStep) % 60 + 60) % 60;
  } else {
    next.seconds = (((value.seconds ?? 0) + delta) % 60 + 60) % 60;
  }
  return next;
}

export function clampTime(value: TimeValue, min: TimeValue | null, max: TimeValue | null): TimeValue {
  const toSec = (t: TimeValue) => t.hours * 3600 + t.minutes * 60 + (t.seconds ?? 0);
  const cur = toSec(value);
  if (min && cur < toSec(min)) return { ...min };
  if (max && cur > toSec(max)) return { ...max };
  return value;
}
