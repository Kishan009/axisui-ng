import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { animateOverlayClose, createConnectedOverlayRef, normalizePlacement } from '@axisui-ng/overlays';

import { AxCalendarComponent } from '../calendar/calendar.component';
import {
  applySelection,
  orderRange,
  type CalendarMode,
  type CalendarValue,
  type DateRange,
  type WeekDay,
} from '../calendar/date-core';
import { formatDate, parseDate } from '../calendar/date-format';

/**
 * DatePicker — a native input that opens a Calendar in a connected
 * overlay, with free-text parsing.
 *
 * @example
 * <ax-date-picker [(value)]="date" />
 * <ax-date-picker mode="range" [(value)]="range" format="MM/dd/yyyy" />
 */
@Component({
  selector: 'ax-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxCalendarComponent, AxIconComponent],
  host: { class: 'relative inline-block' },
  template: `
    <div class="relative">
      <input
        #inputEl
        type="text"
        [class]="inputClasses"
        [value]="displayValue()"
        [placeholder]="placeholder()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (focus)="open.set(true)"
        (click)="open.set(true)"
        (keydown.enter)="commit(); $event.preventDefault()"
        (blur)="commit()"
      />
      <button
        type="button"
        class="absolute end-1 top-1/2 -translate-y-1/2 cursor-pointer rounded-[var(--radius-sm)] p-1 outline-none transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Toggle calendar"
        (click)="open.set(!open())"
      >
        <ax-icon name="chevron-down" />
      </button>
    </div>
    <ng-template #calendarTpl>
      <div data-ax-overlay [attr.data-state]="open() ? 'open' : 'closed'" class="mt-1 rounded-[var(--radius-md)] border border-border bg-background shadow-md">
        <ax-calendar
          [mode]="mode()"
          [value]="value()"
          (valueChange)="onPick($event)"
          [min]="min()"
          [max]="max()"
          [disabledDates]="disabledDates()"
          [weekStartsOn]="weekStartsOn()"
          [locale]="locale()"
        />
      </div>
    </ng-template>
  `,
})
export class AxDatePickerComponent {
  /** Selection semantics. @default 'single' */
  readonly mode = input<CalendarMode>('single');
  /** Two-way value; shape depends on mode. */
  readonly value = model<CalendarValue>(null);
  /** Inclusive lower bound. @default null */
  readonly min = input<Date | null>(null);
  /** Inclusive upper bound. @default null */
  readonly max = input<Date | null>(null);
  /** Extra per-day disable predicate. @default null */
  readonly disabledDates = input<((d: Date) => boolean) | null>(null);
  /** First day of week (0 = Sunday). @default 0 */
  readonly weekStartsOn = input<WeekDay>(0);
  /** Locale for Intl names. @default undefined */
  readonly locale = input<string | undefined>(undefined);
  /** Display + parse pattern. @default 'yyyy-MM-dd' */
  readonly format = input<string>('yyyy-MM-dd');
  /** Input placeholder. @default '' */
  readonly placeholder = input<string>('');
  /** Accessible label for the input. @default 'Date' */
  readonly ariaLabel = input<string>('Date');
  /** Range display/parse separator. @default ' – ' */
  readonly rangeSeparator = input<string>(' – ');

  protected readonly open = signal(false);
  protected readonly invalid = signal(false);

  protected readonly inputClasses =
    'block w-full h-9 cursor-text ps-3 pe-9 text-sm bg-background text-foreground ' +
    'border border-input rounded-[var(--radius-field)] placeholder:text-muted-foreground ' +
    'transition-[color,border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive';

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly vcr = inject(ViewContainerRef);
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly calendarTpl = viewChild.required<TemplateRef<unknown>>('calendarTpl');
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  private overlayRef: OverlayRef | null = null;

  protected readonly displayValue = computed(() => this.formatValue(this.value()));

  constructor() {
    effect(() => (this.open() ? this.attach() : this.detach()));
    inject(DestroyRef).onDestroy(() => this.detach());
  }

  protected onPick(v: CalendarValue): void {
    this.value.set(v);
    this.invalid.set(false);
    if (this.mode() === 'single') {
      this.open.set(false);
    } else if (this.mode() === 'range') {
      const r = this.asRange(v);
      if (r?.start && r?.end) this.open.set(false);
    }
  }

  protected commit(): void {
    const text = this.inputEl().nativeElement.value;
    const mode = this.mode();
    if (!text.trim()) {
      this.value.set(mode === 'multiple' ? [] : null);
      this.invalid.set(false);
      return;
    }
    if (mode === 'range') {
      const parts = text.split(this.rangeSeparator());
      const a = parts.length === 2 ? parseDate(parts[0] ?? '', this.format()) : null;
      const b = parts.length === 2 ? parseDate(parts[1] ?? '', this.format()) : null;
      if (a && b) {
        this.value.set(orderRange(a, b));
        this.invalid.set(false);
      } else {
        this.invalid.set(true);
      }
      return;
    }
    const d = parseDate(text, this.format());
    if (!d) {
      this.invalid.set(true);
      return;
    }
    this.invalid.set(false);
    this.value.set(mode === 'multiple' ? applySelection(this.value(), d, 'multiple') : d);
  }

  private formatValue(v: CalendarValue): string {
    if (!v) return '';
    if (v instanceof Date) return formatDate(v, this.format());
    if (Array.isArray(v)) return v.map((d) => formatDate(d, this.format())).join(', ');
    if (v.start && v.end) return `${formatDate(v.start, this.format())}${this.rangeSeparator()}${formatDate(v.end, this.format())}`;
    if (v.start) return formatDate(v.start, this.format());
    return '';
  }

  private asRange(v: CalendarValue): DateRange | null {
    return v && !(v instanceof Date) && !Array.isArray(v) ? v : null;
  }

  private attach(): void {
    if (this.overlayRef) return;
    const origin = this.inputEl().nativeElement;
    this.overlayRef = createConnectedOverlayRef(this.overlay, this.dir, origin, normalizePlacement('bottom-start'));
    this.overlayRef.attach(new TemplatePortal(this.calendarTpl(), this.vcr));
    this.overlayRef.outsidePointerEvents().subscribe((e) => {
      if (!this.hostRef.nativeElement.contains(e.target)) this.open.set(false);
    });
    this.overlayRef.keydownEvents().subscribe((e) => {
      if (e.key === 'Escape') this.open.set(false);
    });
  }

  private detach(): void {
    if (this.overlayRef) animateOverlayClose(this.overlayRef);
    this.overlayRef = null;
  }
}
