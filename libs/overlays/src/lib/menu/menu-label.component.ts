import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A non-interactive group label. role=presentation keeps it out of the menu's child semantics. */
@Component({
  selector: 'ax-menu-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'presentation', class: 'block px-2 py-1.5 text-xs font-medium text-muted-foreground' },
  template: `<ng-content />`,
})
export class AxMenuLabelComponent {}
