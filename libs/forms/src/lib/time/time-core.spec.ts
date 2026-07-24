import { clampTime, formatTime, from12, incrementField, parseTime, to12, type TimeValue } from './time-core';

describe('time-core', () => {
  it('parseTime 24h and 12h', () => {
    expect(parseTime('13:05', { use24: true, withSeconds: false })).toEqual({ hours: 13, minutes: 5 });
    expect(parseTime('1:05 PM', { use24: false, withSeconds: false })).toEqual({ hours: 13, minutes: 5 });
    expect(parseTime('12:00 AM', { use24: false, withSeconds: false })).toEqual({ hours: 0, minutes: 0 });
    expect(parseTime('13:05:30', { use24: true, withSeconds: true })).toEqual({ hours: 13, minutes: 5, seconds: 30 });
  });

  it('parseTime rejects invalid', () => {
    expect(parseTime('99:99', { use24: true, withSeconds: false })).toBeNull();
    expect(parseTime('nope', { use24: true, withSeconds: false })).toBeNull();
    expect(parseTime('13:00 PM', { use24: false, withSeconds: false })).toBeNull();
  });

  it('formatTime pads and applies AM/PM + seconds', () => {
    expect(formatTime({ hours: 13, minutes: 5 }, { use24: true, withSeconds: false })).toBe('13:05');
    expect(formatTime({ hours: 13, minutes: 5 }, { use24: false, withSeconds: false })).toBe('1:05 PM');
    expect(formatTime({ hours: 0, minutes: 0, seconds: 9 }, { use24: true, withSeconds: true })).toBe('00:00:09');
    expect(formatTime(null, { use24: true, withSeconds: false })).toBe('');
  });

  it('incrementField wraps within field bounds and respects minuteStep', () => {
    expect(incrementField({ hours: 23, minutes: 0 }, 'hours', 1, { minuteStep: 1, withSeconds: false })).toEqual({ hours: 0, minutes: 0 });
    expect(incrementField({ hours: 0, minutes: 0 }, 'minutes', -1, { minuteStep: 15, withSeconds: false })).toEqual({ hours: 0, minutes: 45 });
  });

  it('clampTime bounds to min/max', () => {
    const min: TimeValue = { hours: 9, minutes: 0 };
    const max: TimeValue = { hours: 17, minutes: 0 };
    expect(clampTime({ hours: 8, minutes: 0 }, min, max)).toEqual(min);
    expect(clampTime({ hours: 18, minutes: 0 }, min, max)).toEqual(max);
    expect(clampTime({ hours: 12, minutes: 0 }, min, max)).toEqual({ hours: 12, minutes: 0 });
  });

  it('to12 / from12 round-trip', () => {
    expect(to12(0)).toEqual({ hour12: 12, period: 'AM' });
    expect(to12(13)).toEqual({ hour12: 1, period: 'PM' });
    expect(from12(12, 'AM')).toBe(0);
    expect(from12(1, 'PM')).toBe(13);
  });
});
