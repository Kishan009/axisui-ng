import { ChangeDetectionStrategy, Component, forwardRef, model } from '@angular/core';

import { COLLAPSIBLE_CTX, type CollapsibleContext } from './collapsible.types';

let nextId = 0;

/**
 * Collapsible — a single disclosure: a projected trigger ([axCollapsibleTrigger])
 * toggles a content region. CSS-only. (Accordion remains the multi-section component.)
 *
 * @example
 * <ax-collapsible [(open)]="open">
 *   <button axCollapsibleTrigger>Details</button>
 *   <p>More details…</p>
 * </ax-collapsible>
 */
@Component({
  selector: 'ax-collapsible',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  providers: [{ provide: COLLAPSIBLE_CTX, useExisting: forwardRef(() => AxCollapsibleComponent) }],
  template: `
    <ng-content select="[axCollapsibleTrigger]" />
    <div
      [id]="contentId"
      role="region"
      class="grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--duration)] ease-out-expo data-[state=open]:grid-rows-[1fr]"
      [attr.data-state]="open() ? 'open' : 'closed'"
      [attr.inert]="open() ? null : ''"
    >
      <div class="overflow-hidden">
        <ng-content />
      </div>
    </div>
  `,
})
export class AxCollapsibleComponent implements CollapsibleContext {
  /** Two-way open state. @default false */
  readonly open = model<boolean>(false);
  readonly contentId = `ax-collapsible-${nextId++}`;

  toggle(): void {
    this.open.update((v) => !v);
  }
}
