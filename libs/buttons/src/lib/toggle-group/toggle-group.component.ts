/**
 * ToggleGroup — a set of Toggles that act as a single-select or
 * multi-select control. Implements WAI-ARIA tab-like roving
 * tabindex (without the tab role — these are toggles, not tabs).
 *
 * For an actual Tabs control, use Tabs in Phase 2. This group
 * emits a value (string or string[]) and handles Arrow/Home/End
 * for keyboard nav.
 *
 * Conventions:
 *   - Standalone, OnPush
 *   - Signal inputs/outputs + model() for the value
 *   - Projected Toggle children are queried via contentChildren()
 *   - role="group" with an aria-label
 *   - Host listeners are in the `host: {}` object, not @HostListener
 *
 * @example Single select
 * <ax-toggle-group type="single" [(value)]="align" ariaLabel="Alignment">
 *   <ax-toggle value="left">Left</ax-toggle>
 *   <ax-toggle value="center">Center</ax-toggle>
 *   <ax-toggle value="right">Right</ax-toggle>
 * </ax-toggle-group>
 *
 * @example Multi select
 * <ax-toggle-group type="multiple" [(value)]="formats" ariaLabel="Formats">
 *   <ax-toggle value="bold">B</ax-toggle>
 *   <ax-toggle value="italic">I</ax-toggle>
 *   <ax-toggle value="underline">U</ax-toggle>
 * </ax-toggle-group>
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  contentChildren,
  effect,
  inject,
  input,
  model,
} from '@angular/core';

import { AxToggleComponent } from '../toggle/toggle.component';

export type AxToggleGroupType = 'single' | 'multiple';

@Component({
  selector: 'ax-toggle-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ax-toggle-group]': 'true',
    '[attr.role]': '"group"',
    '[attr.data-type]': 'type()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-label]': 'ariaLabel()',
    '(keydown)': 'onKeydown($event)',
    '(click)': 'onClick($event)',
  },
  template: `<ng-content></ng-content>`,
})
export class AxToggleGroupComponent {
  /** Selection type. 'single' = radio-like, 'multiple' = checkbox-like. @default 'single' */
  type = input<AxToggleGroupType>('single');

  /** Layout orientation. @default 'horizontal' */
  orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Accessible label for the group. */
  ariaLabel = input<string | null>(null);

  /** The selected value(s). For 'single' it's a string | null; for 'multiple' it's string[]. */
  value = model<string | string[] | null>(null);

  /** Projected Toggle children. */
  private readonly toggles = contentChildren(AxToggleComponent);

  /** Index of the toggle that currently has roving tabindex. */
  private activeIndex = 0;

  protected readonly host = inject(ElementRef<HTMLElement>);

  constructor() {
    // Sync pressed state on every child Toggle with the value model.
    effect(() => {
      const val = this.value();
      const selected: string[] = Array.isArray(val) ? val : val != null ? [val] : [];
      for (const toggle of this.toggles()) {
        const tv = toggle.value();
        if (tv != null) {
          toggle.pressed.set(selected.includes(tv));
        }
      }
    });

    // Apply roving tabindex to the children.
    effect(() => {
      const list = this.toggles();
      list.forEach((t, i) => {
        t.tabIndex.set(i === this.activeIndex ? 0 : -1);
      });
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    const list = this.toggles();
    if (list.length === 0) return;

    const isHorizontal = this.orientation() === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    let next = this.activeIndex;
    switch (event.key) {
      case prevKey:
        next = (this.activeIndex - 1 + list.length) % list.length;
        break;
      case nextKey:
        next = (this.activeIndex + 1) % list.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = list.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.activeIndex = next;
    list.forEach((t, i) => t.tabIndex.set(i === next ? 0 : -1));
    const btn = this.host.nativeElement.querySelectorAll('ax-toggle button')[next] as HTMLButtonElement | undefined;
    btn?.focus();
  }

  protected onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const toggleEl = target.closest('ax-toggle');
    if (!toggleEl) return;
    const all = Array.from(this.host.nativeElement.querySelectorAll('ax-toggle'));
    const index = all.indexOf(toggleEl);
    if (index < 0) return;
    this.activeIndex = index;
    this.toggles().forEach((t, i) => t.tabIndex.set(i === index ? 0 : -1));

    const toggles = this.toggles();
    const target_toggle = toggles[index];
    if (!target_toggle) return;
    const tv = target_toggle.value();
    if (tv == null) return;

    if (this.type() === 'single') {
      this.value.set(tv);
    } else {
      const current = Array.isArray(this.value()) ? (this.value() as string[]) : [];
      const idx = current.indexOf(tv);
      const next = idx >= 0 ? current.filter((_, i) => i !== idx) : [...current, tv];
      this.value.set(next);
    }
  }
}
