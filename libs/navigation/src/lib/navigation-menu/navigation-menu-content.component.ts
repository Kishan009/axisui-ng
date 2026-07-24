import { ChangeDetectionStrategy, Component, TemplateRef, viewChild } from '@angular/core';

import { cn } from '../_utils/cn';

/** The mega-menu panel for a NavigationMenu item. Held as a template the item attaches. */
@Component({
  selector: 'ax-navigation-menu-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template>
      <div data-ax-overlay data-state="open" [class]="panelClasses"><ng-content /></div>
    </ng-template>
  `,
})
export class AxNavigationMenuContentComponent {
  readonly contentTemplate = viewChild.required(TemplateRef);
  protected readonly panelClasses = cn(
    'mt-1 min-w-48 rounded-[var(--radius-md)] border border-border bg-popover p-4',
    'text-popover-foreground shadow-md outline-none',
  );
}
