import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { TABS_CONTEXT } from './tabs.types';

/**
 * TabPanel — content for one tab. Hidden (not removed) when inactive,
 * preserving DOM state.
 */
@Component({
  selector: 'ax-tab-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    class: 'mt-2 focus-visible:outline-none',
    '[id]': 'ctx.panelId(value())',
    '[attr.aria-labelledby]': 'ctx.tabId(value())',
    '[hidden]': '!active()',
    '[attr.tabindex]': '0',
  },
  template: `<ng-content />`,
})
export class AxTabPanelComponent {
  // Non-private so the host bindings can build the shared trigger/panel ids.
  protected readonly ctx = inject(TABS_CONTEXT);

  /** The value this panel belongs to. */
  readonly value = input.required<string>();

  readonly active = computed(() => this.ctx.value() === this.value());
}
