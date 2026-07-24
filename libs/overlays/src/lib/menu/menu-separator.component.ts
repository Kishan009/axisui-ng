import { ChangeDetectionStrategy, Component } from '@angular/core';

/** A horizontal divider between menu sections. */
@Component({
  selector: 'ax-menu-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'separator', class: 'my-1 block h-px bg-border' },
  template: ``,
})
export class AxMenuSeparatorComponent {}
