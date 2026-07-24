import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';

/**
 * One breadcrumb entry. Always renders a leading [data-breadcrumb-separator] span,
 * hidden by default and shown only when the item is :not(:first-child) — so the
 * first item has no separator and the rest do.
 */
@Component({
  selector: 'ax-breadcrumb-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    role: 'listitem',
    class: 'flex items-center gap-1.5 text-sm text-muted-foreground [&:not(:first-child)>[data-breadcrumb-separator]]:flex [&>[data-breadcrumb-separator]]:hidden',
    '[attr.aria-current]': 'current() ? "page" : null',
    '[class.text-foreground]': 'current()',
    '[class.font-medium]': 'current()',
  },
  template: `
    <span data-breadcrumb-separator aria-hidden="true" class="items-center text-muted-foreground">
      <ax-icon name="chevron-right" [size]="14" />
    </span>
    <ng-content />
  `,
})
export class AxBreadcrumbItemComponent {
  /** Marks this as the current page (aria-current="page"). @default false */
  readonly current = input<boolean>(false);
}
