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
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { AxIconComponent } from '@axisui-ng/icons';
import { AxChipComponent } from '../chip/chip.component';
import type { ComboboxOption } from './combobox.types';

/**
 * Combobox — single/multi select with type-to-filter, CDK overlay dropdown.
 * Keyboard: ArrowDown/Enter open, Escape closes.
 *
 * @example
 * <ax-combobox [options]="countries" [(value)]="country" placeholder="Country" />
 */
@Component({
  selector: 'ax-combobox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxComboboxComponent),
      multi: true,
    },
  ],
  host: { class: 'block w-full' },
  imports: [OverlayModule, AxIconComponent, AxChipComponent],
  template: `
    <div cdkOverlayOrigin #origin="cdkOverlayOrigin" class="block w-full">
      @if (multiple() && chips()) {
        <div
          role="combobox"
          [attr.tabindex]="effectiveDisabled() ? -1 : 0"
          class="flex min-h-9 w-full cursor-pointer flex-wrap items-center gap-1 rounded-[var(--radius-field)] border border-input bg-background px-2 py-1 text-sm transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="open() ? 'ax-combobox-list' : null"
          [attr.aria-activedescendant]="open() ? activeOptionId() : null"
          [attr.aria-label]="ariaLabel() || triggerLabel()"
          [attr.aria-disabled]="effectiveDisabled() ? 'true' : null"
          (click)="toggle()"
          (keydown)="onKeyNav($event)"
        >
          @for (opt of selectedOptions(); track opt.value) {
            <ax-chip
              removable
              [removeAriaLabel]="'Remove ' + opt.label"
              (remove)="removeValue(opt.value)"
            >{{ opt.label }}</ax-chip>
          }
          @if (selectedOptions().length === 0) {
            <span class="text-muted-foreground">{{ placeholder() }}</span>
          }
          <ax-icon name="chevron-down" [size]="16" class="ms-auto" />
        </div>
      } @else {
        <button
          type="button"
          role="combobox"
          class="flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-field)] border border-input bg-background px-3 text-sm transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="open() ? 'ax-combobox-list' : null"
          [attr.aria-activedescendant]="open() ? activeOptionId() : null"
          [attr.aria-label]="ariaLabel() || triggerLabel()"
          [disabled]="effectiveDisabled()"
          (click)="toggle()"
          (keydown)="onKeyNav($event)"
        >
          <span [class.text-muted-foreground]="!hasSelection()">{{ triggerLabel() }}</span>
          <ax-icon name="chevron-down" [size]="16" />
        </button>
      }
    </div>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayWidth]="panelWidth()"
      [cdkConnectedOverlayMinWidth]="panelWidth()"
      (overlayOutsideClick)="close()"
    >
      <div
        id="ax-combobox-list"
        role="listbox"
        data-ax-overlay
        data-state="open"
        class="z-50 mt-1 max-h-60 w-full overflow-auto rounded-[var(--radius-md)] border border-border bg-popover p-1 text-popover-foreground shadow-md"
        [attr.aria-multiselectable]="multiple()"
      >
        <input
          class="mb-1 h-8 w-full rounded-[var(--radius-sm)] border border-input bg-background px-2 text-sm"
          [value]="query()"
          placeholder="Search…"
          aria-label="Filter options"
          role="combobox"
          [attr.aria-controls]="'ax-combobox-list'"
          [attr.aria-expanded]="open()"
          [attr.aria-activedescendant]="activeOptionId()"
          (input)="onSearch($event)"
          (keydown)="onKeyNav($event)"
        />
        @for (opt of filtered(); track opt.value; let i = $index) {
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- listbox uses aria-activedescendant: the trigger/input is focused and handles arrow/Enter; options are mouse targets only -->
          <div
            role="option"
            #optionEl
            [id]="optionId(i)"
            class="flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-sm transition-[background-color,color,transform] duration-[var(--duration-fast)] ease-out-quart hover:bg-accent hover:text-accent-foreground active:scale-[0.99] aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            [class.bg-accent]="i === activeIndex()"
            [class.text-accent-foreground]="i === activeIndex()"
            [attr.aria-selected]="isSelected(opt.value)"
            [attr.aria-disabled]="opt.disabled ? 'true' : null"
            (click)="select(opt)"
            (mouseenter)="activeIndex.set(i)"
          >
            <span>{{ opt.label }}</span>
            @if (isSelected(opt.value)) {
              <ax-icon name="check" [size]="16" />
            }
          </div>
        }
        @if (filtered().length === 0) {
          <div class="px-2 py-1.5 text-sm text-muted-foreground">No results</div>
        }
      </div>
    </ng-template>
  `,
})
export class AxComboboxComponent implements ControlValueAccessor {
  /** Options to choose from. */
  options = input.required<ComboboxOption[]>();
  /** Selected value(s): string|null when single, string[] when multiple. @default null */
  value = model<string | string[] | null>(null);
  /** Allow multiple selection. @default false */
  multiple = input<boolean>(false);
  /** With `multiple`, render the selection as removable chips in the trigger (MultiSelect). @default false */
  chips = input<boolean>(false);
  /** Placeholder when empty. @default '' */
  placeholder = input<string>('');
  /** Accessible label for the trigger. Falls back to the current selection/placeholder. @default '' */
  ariaLabel = input<string>('');
  /** Disabled state. @default false */
  disabled = input<boolean>(false);
  /** Emits the search text (for server-side filtering). */
  readonly searchChange = output<string>();

  protected readonly open = signal(false);
  protected readonly query = signal('');
  /** Index of the keyboard-active option within `filtered()` (-1 = none). */
  protected readonly activeIndex = signal(-1);
  /** Overlay pane width — matched to the trigger on open. */
  protected readonly panelWidth = signal<number | null>(null);

  private readonly overlayOrigin = viewChild.required(CdkOverlayOrigin);
  private readonly optionEls = viewChildren<ElementRef<HTMLElement>>('optionEl');

  protected optionId(i: number): string {
    return `ax-combobox-opt-${i}`;
  }

  /** id of the active option, for aria-activedescendant. */
  protected readonly activeOptionId = computed(() => {
    const i = this.activeIndex();
    return this.open() && i >= 0 && i < this.filtered().length ? this.optionId(i) : null;
  });

  constructor() {
    // Keep the active option scrolled into view (browser-only; no-op under SSR).
    effect(() => {
      const i = this.activeIndex();
      const els = this.optionEls();
      if (this.open() && i >= 0 && els[i]) {
        els[i].nativeElement.scrollIntoView?.({ block: 'nearest' });
      }
    });
  }

  /** Internal disabled state — set by CVA's setDisabledState. */
  protected readonly disabledState = signal<boolean>(false);
  /** Effective disabled state — the [disabled] input OR the CVA-managed state. */
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  protected readonly selectedValues = computed<string[]>(() => {
    const v = this.value();
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  });

  protected readonly hasSelection = computed(() => this.selectedValues().length > 0);

  protected readonly triggerLabel = computed(() => {
    const selected = this.selectedValues();
    if (selected.length === 0) return this.placeholder();
    const labels = this.options()
      .filter((o) => selected.includes(o.value))
      .map((o) => o.label);
    return labels.join(', ');
  });

  /** The currently-selected options (for chip rendering). */
  protected readonly selectedOptions = computed<ComboboxOption[]>(() => {
    const selected = this.selectedValues();
    return this.options().filter((o) => selected.includes(o.value));
  });

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(q));
  });

  protected isSelected(value: string): boolean {
    return this.selectedValues().includes(value);
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.effectiveDisabled()) return;
    const originEl = this.overlayOrigin().elementRef.nativeElement as HTMLElement;
    this.panelWidth.set(originEl.getBoundingClientRect().width);
    this.open.set(true);
    // Activate the first selected option if visible, else the first enabled one.
    const opts = this.filtered();
    const selected = opts.findIndex((o) => this.isSelected(o.value) && !o.disabled);
    this.activeIndex.set(selected >= 0 ? selected : opts.findIndex((o) => !o.disabled));
  }

  protected close(): void {
    this.open.set(false);
    this.query.set('');
    this.activeIndex.set(-1);
    this.panelWidth.set(null);
    this.onTouched();
  }

  protected onSearch(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.query.set(text);
    this.searchChange.emit(text);
    // Re-anchor the active option to the first enabled match.
    this.activeIndex.set(this.filtered().findIndex((o) => !o.disabled));
  }

  /** Move the active option by `delta`, skipping disabled options; stops at the ends. */
  private moveActive(delta: number): void {
    const opts = this.filtered();
    let i = this.activeIndex();
    for (;;) {
      i += delta;
      const opt = opts[i];
      if (!opt) return; // out of range — no enabled option that way, keep current
      if (!opt.disabled) {
        this.activeIndex.set(i);
        return;
      }
    }
  }

  /** Jump the active option to the first (`dir=1`) or last (`dir=-1`) enabled option. */
  private setActiveToEdge(dir: 1 | -1): void {
    const opts = this.filtered();
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

  protected select(opt: ComboboxOption): void {
    if (opt.disabled) return;
    if (this.multiple()) {
      const current = this.selectedValues();
      const next = current.includes(opt.value)
        ? current.filter((v) => v !== opt.value)
        : [...current, opt.value];
      this.value.set(next);
      this.onChange(next);
    } else {
      this.value.set(opt.value);
      this.onChange(opt.value);
      this.close();
    }
  }

  /** Remove a value from the (multiple) selection — used by the chips trigger. */
  protected removeValue(value: string): void {
    if (this.effectiveDisabled()) return;
    const next = this.selectedValues().filter((v) => v !== value);
    this.value.set(next);
    this.onChange(next);
  }

  protected onKeyNav(event: KeyboardEvent): void {
    if (!this.open()) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
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
      case 'Enter': {
        event.preventDefault();
        const opt = this.filtered()[this.activeIndex()];
        if (opt) this.select(opt);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string | string[] | null) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | string[] | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | string[] | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
