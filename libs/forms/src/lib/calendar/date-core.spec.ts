import {
  addDays, addMonths, applySelection, clampDay, compareDay, isDisabled, isInRange,
  isSameDay, monthMatrix, orderRange, type DateRange,
} from './date-core';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('date-core', () => {
  it('isSameDay / compareDay compare by y/m/d only', () => {
    expect(isSameDay(d(2026, 6, 12), new Date(2026, 5, 12, 9, 30))).toBe(true);
    expect(isSameDay(null, d(2026, 6, 12))).toBe(false);
    expect(compareDay(d(2026, 6, 11), d(2026, 6, 12))).toBe(-1);
    expect(compareDay(d(2026, 6, 12), d(2026, 6, 12))).toBe(0);
  });

  it('addDays / addMonths (with overflow clamp)', () => {
    expect(isSameDay(addDays(d(2026, 1, 31), 1), d(2026, 2, 1))).toBe(true);
    expect(isSameDay(addMonths(d(2026, 1, 31), 1), d(2026, 2, 28))).toBe(true);
  });

  it('clampDay bounds to min/max', () => {
    expect(isSameDay(clampDay(d(2026, 1, 1), d(2026, 6, 1), null), d(2026, 6, 1))).toBe(true);
    expect(isSameDay(clampDay(d(2026, 12, 1), null, d(2026, 6, 30)), d(2026, 6, 30))).toBe(true);
  });

  it('monthMatrix is 6x7 covering the month with spillover', () => {
    const weeks = monthMatrix(d(2026, 6, 15), 0);
    expect(weeks.length).toBe(6);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    // June 2026: June 1 is a Monday; with weekStartsOn=0 (Sun) first cell = May 31.
    expect(isSameDay(weeks[0][0], d(2026, 5, 31))).toBe(true);
  });

  it('isInRange / isDisabled', () => {
    expect(isInRange(d(2026, 6, 10), d(2026, 6, 1), d(2026, 6, 30))).toBe(true);
    expect(isInRange(d(2026, 7, 1), d(2026, 6, 1), d(2026, 6, 30))).toBe(false);
    expect(isDisabled(d(2026, 6, 10), d(2026, 6, 15), null)).toBe(true);
    expect(isDisabled(d(2026, 6, 20), null, d(2026, 6, 15))).toBe(true);
    expect(isDisabled(d(2026, 6, 10), null, null, (x) => x.getDate() === 10)).toBe(true);
  });

  it('applySelection single replaces', () => {
    expect(isSameDay(applySelection(d(2026, 6, 1), d(2026, 6, 2), 'single') as Date, d(2026, 6, 2))).toBe(true);
  });

  it('applySelection multiple toggles and sorts', () => {
    let v = applySelection(null, d(2026, 6, 5), 'multiple') as Date[];
    v = applySelection(v, d(2026, 6, 1), 'multiple') as Date[];
    expect(v.map((x) => x.getDate())).toEqual([1, 5]);
    v = applySelection(v, d(2026, 6, 5), 'multiple') as Date[]; // toggle off
    expect(v.map((x) => x.getDate())).toEqual([1]);
  });

  it('applySelection range starts then completes (ordered), then restarts', () => {
    const start = applySelection(null, d(2026, 6, 10), 'range') as DateRange;
    expect(isSameDay(start.start, d(2026, 6, 10))).toBe(true);
    expect(start.end).toBeNull();
    const complete = applySelection(start, d(2026, 6, 5), 'range') as DateRange; // earlier → ordered
    expect(isSameDay(complete.start, d(2026, 6, 5))).toBe(true);
    expect(isSameDay(complete.end, d(2026, 6, 10))).toBe(true);
    const restart = applySelection(complete, d(2026, 6, 20), 'range') as DateRange;
    expect(isSameDay(restart.start, d(2026, 6, 20))).toBe(true);
    expect(restart.end).toBeNull();
  });

  it('orderRange orders ascending', () => {
    const r = orderRange(d(2026, 6, 10), d(2026, 6, 1));
    expect(isSameDay(r.start, d(2026, 6, 1))).toBe(true);
    expect(isSameDay(r.end, d(2026, 6, 10))).toBe(true);
  });
});
