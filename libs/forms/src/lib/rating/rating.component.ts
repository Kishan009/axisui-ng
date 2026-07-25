/**
 * Rating — star-based rating input. Implements ControlValueAccessor so it works
 * with `[(ngModel)]` and `formControlName`, and exposes a two-way `[(value)]`.
 *
 * A11y: the host is a single WAI-ARIA `slider` (or `img` when readonly) with
 * `aria-valuemin/now/max` + `aria-valuetext`. Keyboard: ←/↓ decrease, →/↑
 * increase (by 0.5 when `allowHalf`), Home → 0, End → max. The stars themselves
 * are decorative (`<ax-icon aria-hidden>`); pointer interaction sets the value.
 *
 * @example
 * <ax-rating [(value)]="score" [max]="5" allowHalf ariaLabel="Quality" />
 * <ax-rating [value]="4" readonly variant="warning" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import { ratingVariants, type RatingSize, type RatingVariant } from './rating.variants';

const SIZE_PX: Record<RatingSize, number> = { sm: 16, md: 20, lg: 24 };

@Component({
  selector: 'ax-rating',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxRatingComponent), multi: true },
  ],
  host: {
    '[class]': 'classes()',
    '[attr.role]': "readonly() ? 'img' : 'slider'",
    '[attr.tabindex]': 'hostTabIndex()',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuemin]': 'readonly() ? null : 0',
    '[attr.aria-valuemax]': 'readonly() ? null : max()',
    '[attr.aria-valuenow]': 'readonly() ? null : value()',
    '[attr.aria-valuetext]': 'valueText()',
    '[attr.aria-disabled]': "effectiveDisabled() ? 'true' : null",
    '[attr.aria-readonly]': "readonly() ? 'true' : null",
    '(keydown)': 'onKeydown($event)',
    '(mouseleave)': 'hover.set(null)',
    '(blur)': 'onTouched()',
  },
  template: `
    @for (i of stars(); track i) {
      <!-- Touch target (S3): star icon stays 16–24px; ::before expands each star's pressable area to ≥44px. -->
      <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- keyboard is handled on the host role="slider" (arrows/Home/End); the stars are mouse targets only -->
      <span
        class="relative inline-flex leading-none before:absolute before:inset-[-12px] before:content-[''] transition-transform duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98]"
        [class.cursor-pointer]="interactive()"
        (click)="onStarClick(i, $event)"
        (mousemove)="onStarHover(i, $event)"
      >
        <ax-icon name="star" class="text-muted-foreground/30" [size]="px()" />
        <span
          class="pointer-events-none absolute inset-y-0 start-0 overflow-hidden transition-[width] duration-[var(--duration-fast)] ease-out-quart"
          [class]="widthClass(i)"
        >
          <ax-icon name="star" class="[&_svg]:fill-current" [size]="px()" />
        </span>
      </span>
    }
  `,
})
export class AxRatingComponent implements ControlValueAccessor {
  /** Filled-star colour. @default 'default' */
  variant = input<RatingVariant>('default');

  /** Star size (sm/md/lg). @default 'md' */
  size = input<RatingSize>('md');

  /** Number of stars. @default 5 */
  max = input<number>(5);

  /** Allow half-star (0.5) increments. @default false */
  allowHalf = input<boolean>(false);

  /** Display-only — no pointer/keyboard interaction. @default false */
  readonly = input<boolean>(false);

  /** Disabled (also driven by the parent form via setDisabledState). @default false */
  disabled = input<boolean>(false);

  /** Accessible label for the rating. @default 'Rating' */
  ariaLabel = input<string>('Rating');

  /** Current rating (two-way). @default 0 */
  value = model<number>(0);

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());

  /** Whether pointer/keyboard interaction is allowed. */
  protected readonly interactive = computed(() => !this.readonly() && !this.effectiveDisabled());

  /** Transient hover preview value (null when not hovering). */
  protected readonly hover = signal<number | null>(null);

  /** The value reflected in the stars (hover preview wins when present). */
  private readonly display = computed(() => this.hover() ?? this.value());

  /** Star indices, 1-based. */
  protected readonly stars = computed(() => Array.from({ length: Math.max(0, this.max()) }, (_, k) => k + 1));

  /** Star pixel size for the icon. */
  protected readonly px = computed(() => SIZE_PX[this.size()]);

  /** Host tabindex — focusable only when interactive. */
  protected readonly hostTabIndex = computed(() => (this.interactive() ? 0 : -1));

  /** SR value text, e.g. "3 of 5". */
  protected readonly valueText = computed(() => `${this.value()} of ${this.max()}`);

  protected readonly classes = computed(() =>
    cn(
      ratingVariants({ variant: this.variant(), size: this.size() }),
      this.effectiveDisabled() && 'cursor-not-allowed opacity-50',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-sm'
    )
  );

  /** Tailwind width class for star `i`'s filled overlay (0 / half / full). */
  protected widthClass(i: number): string {
    const frac = Math.min(1, Math.max(0, this.display() - (i - 1)));
    if (frac >= 0.75) return 'w-full';
    if (frac >= 0.25) return 'w-1/2';
    return 'w-0';
  }

  protected onStarClick(i: number, event: MouseEvent): void {
    if (!this.interactive()) return;
    this.setValue(this.valueFromPointer(i, event));
  }

  protected onStarHover(i: number, event: MouseEvent): void {
    if (!this.interactive()) return;
    this.hover.set(this.valueFromPointer(i, event));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const step = this.allowHalf() ? 0.5 : 1;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = this.value() + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = this.value() - step;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.setValue(next);
  }

  /** Resolve the value implied by a pointer event over star `i` (1-based). */
  private valueFromPointer(i: number, event: MouseEvent): number {
    if (!this.allowHalf()) return i;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const rtl = getComputedStyle(el).direction === 'rtl';
    const ratio = rtl
      ? (rect.right - event.clientX) / rect.width
      : (event.clientX - rect.left) / rect.width;
    return ratio < 0.5 ? i - 0.5 : i;
  }

  /** Clamp, store, and notify the form of a new value. */
  private setValue(raw: number): void {
    const clamped = Math.min(this.max(), Math.max(0, raw));
    this.hover.set(null);
    this.value.set(clamped);
    this.onChange(clamped);
  }

  private onChange: (value: number) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : 0);
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
