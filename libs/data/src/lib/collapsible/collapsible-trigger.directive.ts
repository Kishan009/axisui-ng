import { Directive, inject } from '@angular/core';

import { COLLAPSIBLE_CTX } from './collapsible.types';

/** Toggles the enclosing <ax-collapsible> and reflects aria-expanded / aria-controls. */
@Directive({
  selector: '[axCollapsibleTrigger]',
  host: {
    class:
      'cursor-pointer transition-colors duration-[var(--duration-fast)] ease-out-quart focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    '(click)': 'ctx.toggle()',
    '[attr.aria-expanded]': 'ctx.open()',
    '[attr.aria-controls]': 'ctx.contentId',
  },
})
export class AxCollapsibleTriggerDirective {
  protected readonly ctx = inject(COLLAPSIBLE_CTX);
}
