import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ACCORDION_CONTEXT } from './accordion.types';

let _accItemId = 0;

/**
 * AccordionItem — one collapsible row. Project a [axAccordionTrigger] (inline
 * content, NOT a button — this component supplies the button) and a
 * [axAccordionContent] panel.
 */
@Component({
  selector: 'ax-accordion-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block border-b border-border', '[attr.data-state]': 'open() ? "open" : "closed"' },
  template: `
    <button
      type="button"
      [id]="triggerId"
      [attr.aria-controls]="contentId"
      class="flex w-full cursor-pointer items-center justify-between py-4 text-start font-medium transition-colors duration-[var(--duration-fast)] ease-out-quart hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      [attr.aria-expanded]="open()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [disabled]="disabled()"
      (click)="onToggle()"
    >
      <ng-content select="[axAccordionTrigger]" />
    </button>
    <div
      [id]="contentId"
      role="region"
      [attr.aria-labelledby]="triggerId"
      class="grid grid-rows-[0fr] text-sm transition-[grid-template-rows] duration-[var(--duration)] ease-out-expo data-[state=open]:grid-rows-[1fr]"
      [attr.data-state]="open() ? 'open' : 'closed'"
      [attr.inert]="open() ? null : ''"
    >
      <div class="overflow-hidden">
        <div class="pb-4"><ng-content select="[axAccordionContent]" /></div>
      </div>
    </div>
  `,
})
export class AxAccordionItemComponent {
  private readonly ctx = inject(ACCORDION_CONTEXT);

  /** Unique value identifying this item within the accordion. */
  readonly value = input.required<string>();
  /** Disable this item. @default false */
  readonly disabled = input<boolean>(false);

  /** Stable ids linking the header button and its content region (aria-controls / aria-labelledby). */
  private readonly uid = `ax-accordion-${_accItemId++}`;
  protected readonly triggerId = `${this.uid}-trigger`;
  protected readonly contentId = `${this.uid}-content`;

  /** Whether this item is currently open. */
  readonly open = computed(() => this.ctx.openValues().includes(this.value()));

  protected onToggle(): void {
    if (this.disabled()) return;
    this.ctx.toggle(this.value());
  }
}
