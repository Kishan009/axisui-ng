import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { type AxIconName } from '@axisui-ng/icons';

/**
 * Breadcrumb — a navigation trail. Project <ax-breadcrumb-item> children;
 * each item renders a leading separator (hidden on the first via CSS).
 *
 * @example
 * <ax-breadcrumb>
 *   <ax-breadcrumb-item><a routerLink="/">Home</a></ax-breadcrumb-item>
 *   <ax-breadcrumb-item [current]="true">Page</ax-breadcrumb-item>
 * </ax-breadcrumb>
 */
@Component({
  selector: 'ax-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'navigation', 'aria-label': 'Breadcrumb' },
  template: `
    <div role="list" class="flex flex-wrap items-center gap-1.5">
      <ng-content />
    </div>
  `,
})
export class AxBreadcrumbComponent {
  /** Separator icon between items (retained for theming; v1 items use chevron-right). @default 'chevron-right' */
  readonly separator = input<AxIconName>('chevron-right');
}
