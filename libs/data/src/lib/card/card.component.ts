import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Card — structural surface with optional header/content/footer slots.
 * Slots are selected by attribute: [axCardHeader], [axCardContent], [axCardFooter].
 *
 * @example
 * <ax-card>
 *   <div axCardHeader>Title</div>
 *   <div axCardContent>…</div>
 *   <div axCardFooter><ax-button>OK</ax-button></div>
 * </ax-card>
 */
@Component({
  selector: 'ax-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ax-card block rounded-[var(--radius-card)] border border-border bg-card text-card-foreground' },
  template: `
    <div class="ax-card__header px-6 pt-6 [&:empty]:hidden">
      <ng-content select="[axCardHeader]" />
    </div>
    <div class="ax-card__content p-6 [&:empty]:hidden">
      <ng-content select="[axCardContent]" />
      <ng-content />
    </div>
    <div class="ax-card__footer flex items-center justify-end gap-2 px-6 pb-6 [&:empty]:hidden">
      <ng-content select="[axCardFooter]" />
    </div>
  `,
})
export class AxCardComponent {}
