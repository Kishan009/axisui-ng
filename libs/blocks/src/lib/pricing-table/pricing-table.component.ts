import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';
import { AxIconComponent } from '@axisui-ng/icons';

import type { PricingTier } from '../blocks.types';

/**
 * Pricing table — tiered pricing cards composed from token-classed cards + a check
 * icon feature list + a ax-button CTA. The highlighted tier is emphasized with a
 * primary ring AND a text badge ([highlightLabel], default "Popular") so the
 * emphasis isn't color-only. Data-driven via [tiers]; emits (selectTier) on CTA click.
 */
@Component({
  selector: 'ax-pricing-table',
  standalone: true,
  imports: [AxButtonComponent, AxIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', class: 'block', '[attr.aria-label]': 'ariaLabel() || null' },
  template: `
    <ng-content />
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      @for (t of tiers(); track t.name) {
        <div
          class="flex flex-col rounded-card border border-border bg-card p-6 text-card-foreground"
          [class.ring-2]="t.highlighted"
          [class.ring-primary]="t.highlighted"
        >
          @if (t.highlighted) {
            <span class="mb-3 inline-flex w-fit items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {{ highlightLabel() }}
            </span>
          }
          <h3 class="text-lg font-semibold">{{ t.name }}</h3>
          <div class="mt-2 flex items-baseline gap-1">
            <span class="text-3xl font-bold">{{ t.price }}</span>
            @if (t.period) {
              <span class="text-sm text-muted-foreground">{{ t.period }}</span>
            }
          </div>
          <ul class="mt-4 flex flex-col gap-2">
            @for (feature of t.features; track feature) {
              <li class="flex items-center gap-2 text-sm">
                <span class="text-primary"><ax-icon name="check" [size]="16" aria-hidden="true" /></span>
                {{ feature }}
              </li>
            }
          </ul>
          <ax-button
            class="mt-6 w-full"
            [variant]="t.highlighted ? 'primary' : 'secondary'"
            (clickEvent)="selectTier.emit(t)"
          >
            {{ t.cta || 'Get started' }}
          </ax-button>
        </div>
      }
    </div>
  `,
})
export class AxPricingTableComponent {
  readonly tiers = input<PricingTier[]>([]);
  readonly ariaLabel = input('');
  /** Text badge on the highlighted tier — a non-color-only emphasis cue. @default 'Popular' */
  readonly highlightLabel = input('Popular');
  readonly selectTier = output<PricingTier>();
}
