import { ChangeDetectionStrategy, Component, TemplateRef, forwardRef, input, model, viewChild } from '@angular/core';

import { cn, type PlacementInput, OVERLAY_REF, type OverlayRefLike } from '@axisui-ng/overlays-core';

/**
 * HoverCard — non-modal rich preview shown on hover/focus.
 *
 * @example
 * <a [axHoverCardFor]="h">@user</a>
 * <ax-hover-card #h>…</ax-hover-card>
 */
@Component({
  selector: 'ax-hover-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: OVERLAY_REF, useExisting: forwardRef(() => AxHoverCardComponent) }],
  template: `
    <ng-template>
      <div data-ax-overlay [attr.data-state]="open() ? 'open' : 'closed'" [class]="panelClasses">
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class AxHoverCardComponent implements OverlayRefLike {
  readonly open = model<boolean>(false);
  /** Placement relative to the trigger. @default 'bottom' */
  readonly placement = input<PlacementInput>('bottom');
  /** Delay before opening (ms). @default 300 */
  readonly openDelay = input<number>(300);
  /** Delay before closing (ms). @default 150 */
  readonly closeDelay = input<number>(150);

  readonly contentTemplate = viewChild.required(TemplateRef);

  protected readonly panelClasses = cn(
    'w-64 rounded-[var(--radius-md)] border border-border bg-popover p-4',
    'text-popover-foreground shadow-md outline-none',
  );

  close(): void {
    this.open.set(false);
  }
}
