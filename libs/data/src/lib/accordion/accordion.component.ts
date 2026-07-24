import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core';

import { ACCORDION_CONTEXT, type AccordionContext, type AccordionType } from './accordion.types';

/**
 * Accordion — container for collapsible items. Provides open-state to children via DI.
 *
 * @example
 * <ax-accordion type="single" collapsible>
 *   <ax-accordion-item value="a">…</ax-accordion-item>
 * </ax-accordion>
 */
@Component({
  selector: 'ax-accordion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', '[attr.data-type]': 'type()' },
  template: `<ng-content select="ax-accordion-item" />`,
  providers: [
    { provide: ACCORDION_CONTEXT, useExisting: forwardRef(() => AxAccordionComponent) },
  ],
})
export class AxAccordionComponent implements AccordionContext {
  /** 'single' allows one open panel; 'multiple' allows many. @default 'single' */
  readonly type = input<AccordionType>('single');
  /** In single mode, allow the open panel to be closed again. Ignored in multiple. @default false */
  readonly collapsible = input<boolean>(false);
  /** Open value(s). string|null in single, string[] in multiple. @default null */
  readonly value = model<string | string[] | null>(null);

  /** Normalised list of currently-open values. */
  readonly openValues = computed<readonly string[]>(() => {
    const v = this.value();
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  });

  toggle(itemValue: string): void {
    const isOpen = this.openValues().includes(itemValue);
    if (this.type() === 'multiple') {
      const next = isOpen
        ? this.openValues().filter((x) => x !== itemValue)
        : [...this.openValues(), itemValue];
      this.value.set(next);
      return;
    }
    // single
    if (isOpen) {
      this.value.set(this.collapsible() ? null : itemValue);
    } else {
      this.value.set(itemValue);
    }
  }
}
