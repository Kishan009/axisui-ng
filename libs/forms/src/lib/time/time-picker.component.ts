import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

import { from12, incrementField, to12, type TimeField, type TimeValue } from './time-core';

/**
 * TimePicker — segmented spinbutton time-of-day control. Independent of
 * the date model.
 *
 * @example
 * <ax-time-picker [(value)]="time" />
 * <ax-time-picker [(value)]="time" [use24]="false" [withSeconds]="true" />
 */
@Component({
  selector: 'ax-time-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'relative inline-flex h-9 items-center gap-0.5 rounded-[var(--radius-field)] border border-input bg-background ps-3 pe-3 text-sm',
  },
  template: `
    <input
      role="spinbutton"
      inputmode="numeric"
      class="w-7 cursor-text bg-transparent text-center tabular-nums outline-none transition-[box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-[var(--radius-sm)]"
      aria-label="Hours"
      [attr.aria-valuenow]="displayHours()"
      [attr.aria-valuemin]="use24() ? 0 : 1"
      [attr.aria-valuemax]="use24() ? 23 : 12"
      [attr.aria-valuetext]="pad(displayHours())"
      [value]="pad(displayHours())"
      (keydown)="onKeydown($event, 'hours')"
      (input)="onInput($event, 'hours')"
      (focus)="select($event)"
    />
    <span aria-hidden="true">:</span>
    <input
      role="spinbutton"
      inputmode="numeric"
      class="w-7 cursor-text bg-transparent text-center tabular-nums outline-none transition-[box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-[var(--radius-sm)]"
      aria-label="Minutes"
      [attr.aria-valuenow]="current().minutes"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="59"
      [attr.aria-valuetext]="pad(current().minutes)"
      [value]="pad(current().minutes)"
      (keydown)="onKeydown($event, 'minutes')"
      (input)="onInput($event, 'minutes')"
      (focus)="select($event)"
    />
    @if (withSeconds()) {
      <span aria-hidden="true">:</span>
      <input
        role="spinbutton"
        inputmode="numeric"
        class="w-7 cursor-text bg-transparent text-center tabular-nums outline-none transition-[box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-[var(--radius-sm)]"
        aria-label="Seconds"
        [attr.aria-valuenow]="current().seconds ?? 0"
        [attr.aria-valuemin]="0"
        [attr.aria-valuemax]="59"
        [attr.aria-valuetext]="pad(current().seconds ?? 0)"
        [value]="pad(current().seconds ?? 0)"
        (keydown)="onKeydown($event, 'seconds')"
        (input)="onInput($event, 'seconds')"
        (focus)="select($event)"
      />
    }
    @if (!use24()) {
      <button
        type="button"
        class="ms-1 cursor-pointer rounded-[var(--radius-sm)] px-1.5 py-0.5 text-xs font-medium outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-period
        aria-label="Toggle AM/PM"
        (click)="togglePeriod()"
      >
        {{ period() }}
      </button>
    }
  `,
})
export class AxTimePickerComponent {
  /** Two-way value. @default null */
  readonly value = model<TimeValue | null>(null);
  /** 24-hour mode. When false, shows a 12-hour view + AM/PM toggle. @default true */
  readonly use24 = input<boolean>(true);
  /** Show a seconds segment. @default false */
  readonly withSeconds = input<boolean>(false);
  /** Minute increment step. @default 1 */
  readonly minuteStep = input<number>(1);

  /** Current value with defaults filled (never null for the template). */
  protected readonly current = computed<TimeValue>(() => {
    const v = this.value();
    if (v) return v;
    return this.withSeconds() ? { hours: 0, minutes: 0, seconds: 0 } : { hours: 0, minutes: 0 };
  });

  protected readonly displayHours = computed(() =>
    this.use24() ? this.current().hours : to12(this.current().hours).hour12
  );
  protected readonly period = computed(() => to12(this.current().hours).period);

  protected pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected select(event: Event): void {
    (event.target as HTMLInputElement).select();
  }

  protected onKeydown(event: KeyboardEvent, field: TimeField): void {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? 1 : -1;
    this.value.set(
      incrementField(this.current(), field, delta, { minuteStep: this.minuteStep(), withSeconds: this.withSeconds() })
    );
  }

  protected onInput(event: Event, field: TimeField): void {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    if (!raw) return;
    const n = parseInt(raw, 10);
    const cur = this.current();
    const next: TimeValue = {
      hours: cur.hours,
      minutes: cur.minutes,
      ...(cur.seconds !== undefined ? { seconds: cur.seconds } : {}),
    };
    if (field === 'hours') {
      if (this.use24()) next.hours = Math.min(n, 23);
      else next.hours = from12(Math.min(Math.max(n, 1), 12), this.period());
    } else if (field === 'minutes') {
      next.minutes = Math.min(n, 59);
    } else {
      next.seconds = Math.min(n, 59);
    }
    this.value.set(next);
  }

  protected togglePeriod(): void {
    const cur = this.current();
    const { hour12 } = to12(cur.hours);
    const nextPeriod = this.period() === 'AM' ? 'PM' : 'AM';
    this.value.set({
      hours: from12(hour12, nextPeriod),
      minutes: cur.minutes,
      ...(cur.seconds !== undefined ? { seconds: cur.seconds } : {}),
    });
  }
}
