import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AxIconComponent, type AxIconName } from '@axisui-ng/icons';

export type ResultStatus = 'success' | 'info' | 'warning' | 'error';

const RESULT_ICON: Record<ResultStatus, AxIconName> = {
  success: 'check-circle',
  info: 'info',
  warning: 'alert-triangle',
  error: 'x-circle',
};

const RESULT_COLOR: Record<ResultStatus, string> = {
  success: 'text-success',
  info: 'text-info',
  // --color-warning is a light amber fill; at 48px on a light surface it fails the
  // 3:1 non-text contrast bar (WCAG 1.4.11), so darken it (OKLCH, hue preserved).
  warning: 'text-[color-mix(in_oklch,var(--color-warning),black_28%)]',
  error: 'text-destructive',
};

/**
 * Result — a centered outcome/status display (success/info/warning/error) with a
 * status icon, title, description, and projected actions.
 *
 * @example
 * <ax-result status="error" title="404" description="Page not found.">
 *   <ax-button>Go home</ax-button>
 * </ax-result>
 */
@Component({
  selector: 'ax-result',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { role: 'status', class: 'flex flex-col items-center justify-center gap-2 p-8 text-center' },
  template: `
    <span [class]="iconColor()" aria-hidden="true"><ax-icon [name]="statusIcon()" [size]="48" /></span>
    @if (title()) {
      <p class="text-base font-medium text-foreground">{{ title() }}</p>
    }
    @if (description()) {
      <p class="text-sm text-muted-foreground">{{ description() }}</p>
    }
    <div class="mt-2 flex flex-wrap items-center justify-center gap-2 [&_button]:cursor-pointer"><ng-content /></div>
  `,
})
export class AxResultComponent {
  /** Outcome status → icon + color. @default 'info' */
  readonly status = input<ResultStatus>('info');
  /** Headline. @default '' */
  readonly title = input<string>('');
  /** Supporting text. @default '' */
  readonly description = input<string>('');

  protected readonly statusIcon = computed(() => RESULT_ICON[this.status()]);
  protected readonly iconColor = computed(() => RESULT_COLOR[this.status()]);
}
