import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AxIconComponent, type AxIconName } from '@axisui-ng/icons';

/**
 * Empty — a centered empty/no-data state: icon, title, description, and projected
 * actions.
 *
 * @example
 * <ax-empty icon="search" title="No results" description="Try another search.">
 *   <ax-button>Clear filters</ax-button>
 * </ax-empty>
 */
@Component({
  selector: 'ax-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { class: 'flex flex-col items-center justify-center gap-2 p-8 text-center' },
  template: `
    <span class="text-muted-foreground" aria-hidden="true"><ax-icon [name]="icon()" [size]="40" /></span>
    @if (title()) {
      <p class="text-sm font-medium text-foreground">{{ title() }}</p>
    }
    @if (description()) {
      <p class="text-sm text-muted-foreground">{{ description() }}</p>
    }
    <div class="mt-2 flex flex-wrap items-center justify-center gap-2 [&_button]:cursor-pointer"><ng-content /></div>
  `,
})
export class AxEmptyComponent {
  /** Leading glyph. @default 'search' */
  readonly icon = input<AxIconName>('search');
  /** Headline. @default '' */
  readonly title = input<string>('');
  /** Supporting text. @default '' */
  readonly description = input<string>('');
}
