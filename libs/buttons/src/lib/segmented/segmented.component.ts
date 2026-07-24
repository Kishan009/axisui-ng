/**
 * Segmented — a single-select control rendered as a connected row of segments
 * (the iOS-style "segmented control"). Unlike ToggleGroup it is **always
 * single-select**, **data-driven** via an `options` input, and follows the
 * WAI-ARIA **radiogroup** pattern (one segment always tabbable; arrows move
 * *and* select, skipping disabled segments).
 *
 * Conventions: standalone, OnPush, signal APIs, SSR-safe (focus only runs in
 * keyboard handlers).
 *
 * @example
 * <ax-segmented
 *   [options]="[{label:'Day',value:'d'},{label:'Week',value:'w'},{label:'Month',value:'m'}]"
 *   [(value)]="range"
 *   ariaLabel="Date range"
 * />
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import { cn } from '../_utils/cn';
import { segmentItemVariants, segmentedVariants, type SegmentedSize } from './segmented.variants';
import type { SegmentedOption } from './segmented.types';

@Component({
  selector: 'ax-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.role]': '"radiogroup"',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-disabled]': "disabled() ? 'true' : null",
    '[attr.data-size]': 'size()',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <span
      aria-hidden="true"
      class="pointer-events-none absolute top-1 bottom-1 start-0 z-0 rounded-md bg-background shadow-sm transition-[transform,width] duration-[var(--duration)] ease-out-expo"
      [style]="thumbStyle()"
    ></span>
    @for (opt of options(); track opt.value) {
      <button
        type="button"
        role="radio"
        [class]="itemClass(opt)"
        [attr.aria-checked]="opt.value === value()"
        [attr.aria-label]="opt.label"
        [attr.tabindex]="tabindexFor(opt)"
        [disabled]="disabled() || !!opt.disabled"
        [attr.data-state]="opt.value === value() ? 'on' : 'off'"
        (click)="select(opt)"
      >
        {{ opt.label }}
      </button>
    }
  `,
})
export class AxSegmentedComponent {
  /** The segments to render. @default [] */
  options = input<readonly SegmentedOption[]>([]);

  /** Size — padding + text size cascade from this. @default 'md' */
  size = input<SegmentedSize>('md');

  /** Disable the whole control. @default false */
  disabled = input<boolean>(false);

  /** Accessible label for the group (required for a11y). */
  ariaLabel = input<string | null>(null);

  /** The selected value (two-way). @default null */
  value = model<string | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  /** Sliding-indicator geometry, measured from the active segment (browser-only). */
  protected readonly thumb = signal<{ x: number; w: number } | null>(null);
  protected readonly thumbStyle = computed<Record<string, string>>(() => {
    const t = this.thumb();
    return t ? { transform: `translateX(${t.x}px)`, width: `${t.w}px`, opacity: '1' } : { opacity: '0' };
  });

  constructor() {
    // Re-measure the indicator after renders that change selection / options / size.
    effect(() => {
      this.value();
      this.options();
      this.size();
      afterNextRender(() => this.measure(), { injector: this.injector });
    });
    // Keep it aligned when the track is resized.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(() => this.measure());
      ro.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => ro.disconnect());
    });
  }

  /** Measure the active segment and position the sliding indicator (RTL-aware). */
  private measure(): void {
    const host = this.host.nativeElement;
    const buttons = Array.from(host.querySelectorAll('button[role="radio"]')) as HTMLElement[];
    const idx = this.options().findIndex((o) => o.value === this.value());
    const active = idx >= 0 ? buttons[idx] ?? null : null;
    if (!active) {
      this.thumb.set(null);
      return;
    }
    const rtl = getComputedStyle(host).direction === 'rtl';
    const x = rtl ? -(host.clientWidth - active.offsetLeft - active.offsetWidth) : active.offsetLeft;
    this.thumb.set({ x, w: active.offsetWidth });
  }

  /** Index of the first non-disabled segment (gets the roving tabindex when nothing is selected). */
  private readonly firstEnabledIndex = computed(() =>
    this.options().findIndex((o) => !o.disabled)
  );

  protected readonly classes = computed(() => cn(segmentedVariants({ size: this.size() })));

  protected itemClass(opt: SegmentedOption): string {
    return cn(
      segmentItemVariants({
        size: this.size(),
        state: opt.value === this.value() ? 'on' : 'off',
      })
    );
  }

  /** Roving tabindex: the selected segment is tabbable; if none selected, the first enabled one is. */
  protected tabindexFor(opt: SegmentedOption): number {
    if (opt.disabled || this.disabled()) return -1;
    const selected = this.value();
    if (selected != null) return opt.value === selected ? 0 : -1;
    return this.options().indexOf(opt) === this.firstEnabledIndex() ? 0 : -1;
  }

  protected select(opt: SegmentedOption): void {
    if (this.disabled() || opt.disabled) return;
    this.value.set(opt.value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const opts = this.options();
    if (opts.length === 0) return;

    const current = this.currentIndex();
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = this.nextEnabled(current, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = this.nextEnabled(current, -1);
        break;
      case 'Home':
        next = this.nextEnabled(-1, 1);
        break;
      case 'End':
        next = this.nextEnabled(opts.length, -1);
        break;
      default:
        return;
    }
    if (next < 0) return;
    const opt = opts[next];
    if (!opt) return;
    event.preventDefault();
    this.value.set(opt.value);
    this.focusSegment(next);
  }

  /** Index the keyboard navigation starts from (selected segment, else first enabled). */
  private currentIndex(): number {
    const selected = this.value();
    const opts = this.options();
    const i = selected != null ? opts.findIndex((o) => o.value === selected) : -1;
    return i >= 0 ? i : this.firstEnabledIndex();
  }

  /** Next non-disabled index from `from` in `dir` (+1/-1), wrapping around. */
  private nextEnabled(from: number, dir: 1 | -1): number {
    const opts = this.options();
    const n = opts.length;
    for (let step = 1; step <= n; step++) {
      const i = (from + dir * step + n * step) % n;
      const o = opts[i];
      if (o && !o.disabled) return i;
    }
    return -1;
  }

  private focusSegment(index: number): void {
    const buttons = this.host.nativeElement.querySelectorAll('[role="radio"]');
    (buttons[index] as HTMLButtonElement | undefined)?.focus();
  }
}
