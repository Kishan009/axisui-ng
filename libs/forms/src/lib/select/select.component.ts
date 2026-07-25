/**
 * Select — single-value listbox with the same field chrome as Input
 * (`inputVariants`) and a token-styled overlay panel (matches Combobox).
 *
 * Native `<select>` popups cannot be styled to the design system; this uses a
 * custom trigger + CDK connected overlay instead. For type-to-filter / multi,
 * use Combobox.
 */

import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '../_utils/cn';
import { AX_FORM_FIELD_CONTROL, type AxFormFieldControl } from '../form-field/form-field-control';
import { inputVariants, type InputSize } from '../input/input.variants';

export interface AxSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

let selectSeq = 0;

@Component({
  selector: 'ax-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OverlayModule, AxIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxSelectComponent),
      multi: true,
    },
    {
      provide: AX_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => AxSelectComponent),
    },
  ],
  host: {
    class: 'ax-select block w-full',
    '[attr.data-size]': 'size()',
  },
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin" class="relative w-full">
      <button
        type="button"
        role="combobox"
        [id]="id() ?? undefined"
        [class]="triggerClasses()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? listId : null"
        [attr.aria-activedescendant]="open() ? activeOptionId() : null"
        [attr.aria-label]="ariaLabel() || triggerLabel()"
        [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
        [attr.aria-describedby]="effectiveDescribedBy()"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-haspopup]="'listbox'"
        [disabled]="effectiveDisabled()"
        (click)="toggle()"
        (keydown)="onKeyNav($event)"
        (blur)="onTriggerBlur()"
      >
        <span class="min-w-0 flex-1 truncate text-start" [class.text-muted-foreground]="!hasSelection()">
          {{ triggerLabel() }}
        </span>
        <ax-icon
          name="chevron-down"
          [size]="16"
          class="shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)] ease-out-quart"
          [class.rotate-180]="open()"
        />
      </button>
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      [cdkConnectedOverlayOffsetY]="4"
      (overlayOutsideClick)="onOutsideClick($event)"
    >
      <div
        [id]="listId"
        role="listbox"
        data-ax-overlay
        data-state="open"
        class="z-50 max-h-60 w-full overflow-auto rounded-[var(--radius-field)] border border-border bg-popover p-1 text-popover-foreground shadow-md"
      >
        @for (opt of options(); track opt.value; let i = $index) {
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- listbox uses aria-activedescendant: trigger stays focused; options are pointer targets -->
          <div
            role="option"
            #optionEl
            [id]="optionId(i)"
            class="flex cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent hover:text-accent-foreground active:scale-[0.99] aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            [class.bg-accent]="i === activeIndex()"
            [class.text-accent-foreground]="i === activeIndex()"
            [attr.aria-selected]="isSelected(opt.value)"
            [attr.aria-disabled]="opt.disabled ? 'true' : null"
            (click)="select(opt)"
            (mouseenter)="activeIndex.set(i)"
          >
            <span class="min-w-0 truncate">{{ opt.label }}</span>
            @if (isSelected(opt.value)) {
              <ax-icon name="check" [size]="16" class="shrink-0" />
            }
          </div>
        }
      </div>
    </ng-template>
  `,
})
export class AxSelectComponent implements ControlValueAccessor, AxFormFieldControl {
  value = model<string | null>(null);
  options = input.required<AxSelectOption[]>();

  /** id of the trigger button. Set to match a `ax-form-field`'s `forId`. */
  id = input<string | null>(null);

  size = input<InputSize>('md');
  placeholder = input<string>('');
  required = input<boolean>(false);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  ariaLabel = input<string | null>(null);
  describedBy = input<string | null>(null);

  protected readonly open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly panelWidth = signal<number | null>(null);

  protected readonly listId = `ax-select-list-${selectSeq++}`;
  private readonly overlayOrigin = viewChild.required(CdkOverlayOrigin);
  private readonly optionEls = viewChildren<ElementRef<HTMLElement>>('optionEl');

  /** aria state pushed down by a parent FormField (auto-wiring). */
  private readonly fieldDescribedBy = signal<string | null>(null);
  private readonly fieldInvalid = signal<boolean>(false);

  protected readonly effectiveDescribedBy = computed<string | null>(
    () => this.describedBy() ?? this.fieldDescribedBy(),
  );
  protected readonly effectiveInvalid = computed<boolean>(() => this.invalid() || this.fieldInvalid());

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  protected readonly hasSelection = computed(() => {
    const v = this.value();
    return v != null && v !== '';
  });

  protected readonly triggerLabel = computed(() => {
    const v = this.value();
    if (v == null || v === '') return this.placeholder() || 'Select…';
    return this.options().find((o) => o.value === v)?.label ?? (this.placeholder() || 'Select…');
  });

  protected readonly triggerClasses = computed(() =>
    cn(
      inputVariants({ size: this.size() }),
      'inline-flex cursor-pointer items-center justify-between gap-2 text-start',
      'hover:bg-accent/40 active:scale-[0.99]',
      'disabled:cursor-not-allowed',
      this.open() && 'ring-2 ring-ring ring-offset-2',
    ),
  );

  protected readonly activeOptionId = computed(() => {
    const i = this.activeIndex();
    return this.open() && i >= 0 && i < this.options().length ? this.optionId(i) : null;
  });

  constructor() {
    effect(() => {
      const i = this.activeIndex();
      const els = this.optionEls();
      if (this.open() && i >= 0 && els[i]) {
        els[i].nativeElement.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  protected optionId(i: number): string {
    return `${this.listId}-opt-${i}`;
  }

  protected isSelected(value: string): boolean {
    return this.value() === value;
  }

  protected toggle(): void {
    if (this.open()) this.close();
    else this.openPanel();
  }

  protected openPanel(): void {
    if (this.effectiveDisabled()) return;
    const originEl = this.overlayOrigin().elementRef.nativeElement as HTMLElement;
    this.panelWidth.set(originEl.getBoundingClientRect().width);
    this.open.set(true);
    const opts = this.options();
    const selected = opts.findIndex((o) => this.isSelected(o.value) && !o.disabled);
    this.activeIndex.set(selected >= 0 ? selected : opts.findIndex((o) => !o.disabled));
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.activeIndex.set(-1);
    this.panelWidth.set(null);
    this.onTouched();
  }

  /** Ignore outside clicks on the trigger — (click) toggle owns open/close. */
  protected onOutsideClick(event: MouseEvent): void {
    const originEl = this.overlayOrigin().elementRef.nativeElement as HTMLElement;
    const target = event.target;
    if (target instanceof Node && originEl.contains(target)) return;
    this.close();
  }

  protected select(opt: AxSelectOption): void {
    if (opt.disabled) return;
    this.value.set(opt.value);
    this.onChange(opt.value);
    this.close();
  }

  protected onTriggerBlur(): void {
    // Touched when the panel is closed; while open, focus stays on the trigger
    // for aria-activedescendant, so blur only fires after close / tab-away.
    if (!this.open()) this.onTouched();
  }

  protected onKeyNav(event: KeyboardEvent): void {
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.openPanel();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.setActiveToEdge(1);
        break;
      case 'End':
        event.preventDefault();
        this.setActiveToEdge(-1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const opt = this.options()[this.activeIndex()];
        if (opt) this.select(opt);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  private moveActive(delta: number): void {
    const opts = this.options();
    let i = this.activeIndex();
    for (;;) {
      i += delta;
      const opt = opts[i];
      if (!opt) return;
      if (!opt.disabled) {
        this.activeIndex.set(i);
        return;
      }
    }
  }

  private setActiveToEdge(dir: 1 | -1): void {
    const opts = this.options();
    if (dir === 1) {
      const i = opts.findIndex((o) => !o.disabled);
      if (i >= 0) this.activeIndex.set(i);
    } else {
      for (let i = opts.length - 1; i >= 0; i--) {
        if (!opts[i]?.disabled) {
          this.activeIndex.set(i);
          return;
        }
      }
    }
  }

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  _setFieldDescribedBy(id: string | null): void {
    this.fieldDescribedBy.set(id);
  }

  _setFieldInvalid(invalid: boolean): void {
    this.fieldInvalid.set(invalid);
  }
}
