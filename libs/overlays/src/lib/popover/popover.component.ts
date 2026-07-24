import { ChangeDetectionStrategy, Component, TemplateRef, forwardRef, input, model, viewChild } from '@angular/core';

import { cn, type PlacementInput, OVERLAY_REF, type OverlayRefLike } from '@axisui-ng/overlays-core';

/**
 * Popover — non-modal floating panel anchored to a trigger via [axPopoverTriggerFor].
 * Holds its content in a template the trigger attaches to a CDK overlay.
 *
 * Provides OVERLAY_REF so projected `axOverlayClose` buttons can dismiss it (projected
 * content injects DI from its declaration site, i.e. this component's element injector).
 *
 * @example
 * <button [axPopoverTriggerFor]="p">Open</button>
 * <ax-popover #p placement="bottom-start">…</ax-popover>
 */
@Component({
  selector: 'ax-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: OVERLAY_REF, useExisting: forwardRef(() => AxPopoverComponent) }],
  template: `
    <ng-template>
      <div data-ax-overlay [attr.data-state]="open() ? 'open' : 'closed'" [class]="panelClasses">
        <ng-content />
      </div>
    </ng-template>
  `,
})
export class AxPopoverComponent implements OverlayRefLike {
  /** Whether the popover is open (two-way; usually driven by the trigger). @default false */
  readonly open = model<boolean>(false);
  /** Placement relative to the trigger. @default 'bottom' */
  readonly placement = input<PlacementInput>('bottom');

  /** The content template the trigger attaches to the overlay. */
  readonly contentTemplate = viewChild.required(TemplateRef);

  protected readonly panelClasses = cn(
    'min-w-48 rounded-[var(--radius-md)] border border-border bg-popover p-4',
    'text-popover-foreground shadow-md outline-none',
  );

  close(): void {
    this.open.set(false);
  }
}
