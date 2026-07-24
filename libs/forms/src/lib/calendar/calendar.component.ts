import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import {
  addDays,
  addMonths,
  applySelection,
  compareDay,
  isDisabled,
  isInRange,
  isSameDay,
  monthMatrix,
  startOfMonth,
  type CalendarMode,
  type CalendarValue,
  type DateRange,
  type WeekDay,
} from './date-core';

/**
 * Calendar — month grid with single/range/multiple selection, disabled
 * dates, and full keyboard navigation.
 *
 * @example
 * <ax-calendar [(value)]="date" />
 * <ax-calendar mode="range" [(value)]="range" />
 */
@Component({
  selector: 'ax-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { class: 'relative inline-block rounded-[var(--radius-md)] border border-border bg-background p-3' },
  template: `
    <div class="mb-2 flex items-center justify-between">
      <button type="button" class="cursor-pointer rounded-[var(--radius-sm)] p-1 outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Previous month" (click)="prevMonth()">
        <ax-icon name="chevron-left" />
      </button>
      <div aria-live="polite" class="text-sm font-medium">{{ monthLabel() }}</div>
      <button type="button" class="cursor-pointer rounded-[var(--radius-sm)] p-1 outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Next month" (click)="nextMonth()">
        <ax-icon name="chevron-right" />
      </button>
    </div>
    <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -- grid keydown is delegated from the focused day cell (roving tabindex); the grid itself is not a tab stop -->
    <div role="grid" class="select-none" (keydown)="onKeydown($event)">
      <div role="row" class="grid grid-cols-7">
        @for (wd of weekdayLabels(); track $index) {
          <div role="columnheader" class="py-1 text-center text-xs text-muted-foreground">{{ wd }}</div>
        }
      </div>
      @for (week of weeks(); track $index) {
        <div role="row" class="grid grid-cols-7">
          @for (day of week; track day.getTime()) {
            <button
              type="button"
              role="gridcell"
              [class]="dayClasses(day)"
              [attr.tabindex]="isSameDay(day, focusedDate()) ? 0 : -1"
              [attr.aria-selected]="isSelected(day)"
              [attr.aria-disabled]="isDayDisabled(day) ? 'true' : null"
              [attr.aria-label]="dayLabel(day)"
              [attr.data-outside]="day.getMonth() !== viewDate().getMonth() ? '' : null"
              [disabled]="isDayDisabled(day)"
              (click)="selectDay(day)"
              (mouseenter)="hoverDate.set(day)"
              (mouseleave)="hoverDate.set(null)"
            >
              {{ day.getDate() }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class AxCalendarComponent {
  /** Selection semantics. @default 'single' */
  readonly mode = input<CalendarMode>('single');
  /** Two-way value; shape depends on mode (Date / DateRange / Date[]). */
  readonly value = model<CalendarValue>(null);
  /** Inclusive lower bound. @default null */
  readonly min = input<Date | null>(null);
  /** Inclusive upper bound. @default null */
  readonly max = input<Date | null>(null);
  /** Extra per-day disable predicate. @default null */
  readonly disabledDates = input<((d: Date) => boolean) | null>(null);
  /** First day of week (0 = Sunday). @default 0 */
  readonly weekStartsOn = input<WeekDay>(0);
  /** Locale for Intl month/weekday names. @default undefined (browser) */
  readonly locale = input<string | undefined>(undefined);

  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly today = new Date();
  protected readonly viewDate = signal<Date>(startOfMonth(new Date()));
  protected readonly focusedDate = signal<Date>(new Date());
  protected readonly hoverDate = signal<Date | null>(null);
  protected readonly isSameDay = isSameDay;

  protected readonly weeks = computed(() => monthMatrix(this.viewDate(), this.weekStartsOn()));

  protected readonly weekdayLabels = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.locale(), { weekday: 'short' });
    const base = new Date(2023, 0, 1); // a Sunday
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) labels.push(fmt.format(addDays(base, (this.weekStartsOn() + i) % 7)));
    return labels;
  });

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { month: 'long', year: 'numeric' }).format(this.viewDate())
  );

  constructor() {
    // Seed view + focus from the bound value once (signal inputs are not
    // available in the constructor, so this runs on the first effect pass).
    let seeded = false;
    effect(() => {
      const seed = this.firstSelected(this.value());
      if (seeded) return;
      seeded = true;
      if (seed) {
        this.viewDate.set(startOfMonth(seed));
        this.focusedDate.set(seed);
      }
    });
    effect(() => {
      this.focusedDate(); // re-run when focus moves
      if (!isPlatformBrowser(this.platformId)) return;
      queueMicrotask(() => this.moveFocusToGrid());
    });
  }

  /** Move DOM focus to the roving day cell, but only while focus is already in the grid. */
  private moveFocusToGrid(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const host = this.hostRef.nativeElement;
    if (!host.contains(document.activeElement)) return; // don't steal focus on load
    const el = host.querySelector('button[role="gridcell"][tabindex="0"]') as HTMLElement | null;
    el?.focus();
  }

  protected isDayDisabled(day: Date): boolean {
    return isDisabled(day, this.min(), this.max(), this.disabledDates());
  }

  protected dayLabel(day: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'full' }).format(day);
  }

  protected isSelected(day: Date): boolean {
    const v = this.value();
    if (!v) return false;
    if (v instanceof Date) return isSameDay(v, day);
    if (Array.isArray(v)) return v.some((x) => isSameDay(x, day));
    return isSameDay(v.start, day) || isSameDay(v.end, day);
  }

  protected inRange(day: Date): boolean {
    const r = this.asRange(this.value());
    if (!r || !r.start) return false;
    if (r.end) return isInRange(day, r.start, r.end);
    const h = this.hoverDate();
    if (!h) return false;
    const ordered = compareDay(r.start, h) <= 0 ? { s: r.start, e: h } : { s: h, e: r.start };
    return isInRange(day, ordered.s, ordered.e);
  }

  protected dayClasses(day: Date): string {
    const selected = this.isSelected(day);
    const outside = day.getMonth() !== this.viewDate().getMonth();
    return cn(
      // Visual cell stays h-9/w-9; ::before expands the hit target toward 44px without growing the grid.
      "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-sm outline-none",
      "before:absolute before:inset-[-4px] before:content-['']",
      'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]',
      'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
      outside ? 'text-muted-foreground' : '',
      this.inRange(day) && !selected ? 'bg-accent' : '',
      isSameDay(day, this.today) && !selected ? 'font-semibold underline' : '',
      selected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''
    );
  }

  protected selectDay(day: Date): void {
    if (this.isDayDisabled(day)) return;
    this.value.set(applySelection(this.value(), day, this.mode()));
    this.focusedDate.set(day);
  }

  protected prevMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), -1));
  }
  protected nextMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), 1));
  }

  protected onKeydown(event: KeyboardEvent): void {
    const f = this.focusedDate();
    const dow = (f.getDay() - this.weekStartsOn() + 7) % 7;
    let next: Date;
    switch (event.key) {
      case 'ArrowLeft': next = addDays(f, -1); break;
      case 'ArrowRight': next = addDays(f, 1); break;
      case 'ArrowUp': next = addDays(f, -7); break;
      case 'ArrowDown': next = addDays(f, 7); break;
      case 'Home': next = addDays(f, -dow); break;
      case 'End': next = addDays(f, 6 - dow); break;
      case 'PageUp': next = addMonths(f, -1); break;
      case 'PageDown': next = addMonths(f, 1); break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this.isDayDisabled(f)) this.selectDay(f);
        return;
      default:
        return;
    }
    event.preventDefault();
    this.focusedDate.set(next);
    if (next.getMonth() !== this.viewDate().getMonth() || next.getFullYear() !== this.viewDate().getFullYear()) {
      this.viewDate.set(startOfMonth(next));
    }
  }

  private asRange(value: CalendarValue): DateRange | null {
    return value && !(value instanceof Date) && !Array.isArray(value) ? value : null;
  }

  private firstSelected(value: CalendarValue): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (Array.isArray(value)) return value[0] ?? null;
    return value.start ?? null;
  }
}
