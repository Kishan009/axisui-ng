import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SeparatorOrientation = 'horizontal' | 'vertical';

/**
 * Separator — a thin visual rule between content. The host element *is* the
 * rule (empty template). Decorative by default (role="none"); set
 * [decorative]="false" for a semantic separator that exposes role="separator"
 * + aria-orientation.
 *
 * Static structural classes live on the host `class`; orientation classes are
 * toggled individually (`[class.x]`) so consumer-supplied classes on
 * <ax-separator> are preserved rather than clobbered by a whole-string binding.
 *
 * @example
 * <ax-separator />
 * <ax-separator orientation="vertical" />
 * <ax-separator [decorative]="false" />
 */
@Component({
  selector: 'ax-separator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: '',
  host: {
    class: 'block shrink-0 bg-border',
    '[class.h-px]': "orientation() === 'horizontal'",
    '[class.w-full]': "orientation() === 'horizontal'",
    '[class.h-full]': "orientation() === 'vertical'",
    '[class.w-px]': "orientation() === 'vertical'",
    '[attr.role]': "decorative() ? 'none' : 'separator'",
    '[attr.aria-orientation]': "decorative() ? null : orientation()",
    '[attr.data-orientation]': 'orientation()',
  },
})
export class AxSeparatorComponent {
  /** Layout direction of the rule. @default 'horizontal' */
  readonly orientation = input<SeparatorOrientation>('horizontal');

  /** When true (default), the separator is presentational only (role="none"). @default true */
  readonly decorative = input<boolean>(true);
}
