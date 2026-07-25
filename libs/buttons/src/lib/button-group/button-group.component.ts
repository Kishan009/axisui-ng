/**
 * ButtonGroup — visually joins a row (or column) of buttons. Rounds
 * the outer corners of the first/last children, sharpens the inner
 * corners between siblings, and removes duplicate borders.
 *
 * Works with Button and IconButton (and Toggle, in Phase 1). Children
 * should be siblings; the group detects them via :dir / :first-child /
 * :last-child via Tailwind utilities.
 *
 * Conventions:
 *   - Standalone, OnPush
 *   - Signal inputs only
 *   - cn() for class composition (no cva — the group itself has no
 *     visual variants; children inherit theirs)
 *   - A11y: ButtonGroup uses role="group" with an optional aria-label.
 *     For a toolbar of toggles, use role="toolbar" (delegated to the
 *     ToggleGroup wrapper).
 *
 * @example
 * <div axButtonGroup ariaLabel="Text alignment">
 *   <ax-button>Left</ax-button>
 *   <ax-button>Center</ax-button>
 *   <ax-button>Right</ax-button>
 * </div>
 *
 * @example Vertical
 * <div axButtonGroup orientation="vertical" ariaLabel="Sort">
 *   <ax-button>Asc</ax-button>
 *   <ax-button>Desc</ax-button>
 * </div>
 */

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxButtonGroupOrientation = 'horizontal' | 'vertical';

@Component({
  selector: '[axButtonGroup]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.role]': '"group"',
    '[attr.data-orientation]': 'orientation()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `<ng-content></ng-content>`,
})
export class AxButtonGroupComponent {
  /** Layout direction. @default 'horizontal' */
  orientation = input<AxButtonGroupOrientation>('horizontal');

  /** Accessible label for the group. Required when the group has no visible heading. */
  ariaLabel = input<string | null>(null);

  /**
   * Resolved class string. Uses Tailwind's group-* and first/last: variants
   * to round only the outer corners and sharpen inner corners between siblings.
   */
  protected readonly classes = computed(() => {
    const o = this.orientation();
    // Target the inner <button> — ax-button / ax-icon-button wrap their
    // visual surface, so host-level radius/border utilities would miss.
    if (o === 'horizontal') {
      return cn([
        'inline-flex',
        '[&>*:not(:first-child):not(:last-child)_button]:rounded-none',
        '[&>*:first-child_button]:rounded-e-none',
        '[&>*:last-child_button]:rounded-s-none',
        '[&>*:not(:first-child)_button]:-ms-px',
      ]);
    }
    return cn([
      'inline-flex flex-col',
      '[&>*:not(:first-child):not(:last-child)_button]:rounded-none',
      '[&>*:first-child_button]:rounded-b-none',
      '[&>*:last-child_button]:rounded-t-none',
      '[&>*:not(:first-child)_button]:-mt-px',
    ]);
  });
}
