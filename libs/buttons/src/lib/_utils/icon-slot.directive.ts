/**
 * Icon slot marker directives.
 *
 * Components with icon slots (Button, IconButton, Toggle, ToggleGroup,
 * Input, Select, etc.) project content into named slots. To avoid
 * hard-coding which icon component consumers use, each slot is marked
 * with a directive selector rather than a structural directive.
 *
 * Usage:
 *   <ax-button>
 *     <ax-icon axButtonLeading name="plus" />
 *     Add item
 *   </ax-button>
 *
 * Why a marker directive and not a structural directive: structural
 * directives (prefix *) require a template, but the consumer is
 * putting a *real component* in the slot. We just need to mark it.
 */

import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[axButtonLeading]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"leading"',
    '[attr.aria-hidden]': 'ariaHidden()',
    '[attr.style]': 'iconSizeAttr()',
  },
})
export class AxButtonLeadingDirective {
  /** Override the icon size (otherwise inherited from the host button's data-size). */
  size = input<string | null>(null);

  /** Whether the icon is decorative (true when the button has visible text). */
  ariaHidden = input<boolean | string>('true');

  protected readonly el = inject(ElementRef<HTMLElement>);

  protected iconSize(): string {
    return this.size() ?? '1em';
  }

  protected iconSizeAttr(): string {
    return `--ax-icon-size: ${this.iconSize()}`;
  }
}

@Directive({
  selector: '[axButtonTrailing]',
  standalone: true,
  host: {
    '[attr.data-slot]': '"trailing"',
    '[attr.aria-hidden]': 'ariaHidden()',
    '[attr.style]': 'iconSizeAttr()',
  },
})
export class AxButtonTrailingDirective {
  size = input<string | null>(null);
  ariaHidden = input<boolean | string>('true');

  protected readonly el = inject(ElementRef<HTMLElement>);

  protected iconSize(): string {
    return this.size() ?? '1em';
  }

  protected iconSizeAttr(): string {
    return `--ax-icon-size: ${this.iconSize()}`;
  }
}
