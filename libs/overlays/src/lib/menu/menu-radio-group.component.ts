import { ChangeDetectionStrategy, Component, forwardRef, model } from '@angular/core';

import { MENU_RADIO_CONTEXT, type MenuRadioContext } from './menu.types';

/** Groups radio items; holds the selected value. */
@Component({
  selector: 'ax-menu-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group' },
  template: `<ng-content />`,
  providers: [{ provide: MENU_RADIO_CONTEXT, useExisting: forwardRef(() => AxMenuRadioGroupComponent) }],
})
export class AxMenuRadioGroupComponent implements MenuRadioContext {
  /** Selected value (two-way). @default null */
  readonly value = model<string | null>(null);
  select(next: string): void {
    this.value.set(next);
  }
}
