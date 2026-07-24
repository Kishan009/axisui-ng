import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AxIconComponent } from '@axisui-ng/icons';

import type { FeatureItem } from '../blocks.types';

/** Literal column classes so Tailwind can scan them. */
const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Feature grid — asymmetric product feature band. The first item leads (wider span +
 * larger type); remaining items alternate icon+text vs text-only so the grid does not
 * read as identical cards. Data-driven via [features]; projected default slot for an
 * optional heading. Token-classed.
 */
@Component({
  selector: 'ax-feature-grid',
  standalone: true,
  imports: [AxIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', class: 'block', '[attr.aria-label]': 'ariaLabel() || null' },
  template: `
    <ng-content />
    <div class="grid gap-px overflow-hidden rounded-card border border-border bg-border" [class]="gridClass()">
      @for (f of features(); track f.title; let i = $index) {
        <div [class]="itemClass(i)">
          @if (showIcon(i)) {
            <span class="shrink-0 text-primary" [class.mt-0.5]="isLead(i)">
              <ax-icon [name]="f.icon" [size]="isLead(i) ? 28 : 20" aria-hidden="true" />
            </span>
          }
          <div class="flex min-w-0 flex-col gap-1.5">
            <h3 [class]="titleClass(i)">{{ f.title }}</h3>
            <p [class]="descClass(i)">{{ f.description }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class AxFeatureGridComponent {
  readonly features = input<FeatureItem[]>([]);
  readonly columns = input<number>(0);
  readonly ariaLabel = input('');

  protected readonly gridClass = computed(() => COL_CLASS[this.columns()] ?? 'sm:grid-cols-2 lg:grid-cols-3');

  /** First feature spans two columns on multi-column layouts (Swiss modular lead). */
  protected isLead(index: number): boolean {
    return index === 0 && this.columns() !== 1;
  }

  /** Even indices keep an icon; odd indices are text-only for rhythm without twin cards. */
  protected showIcon(index: number): boolean {
    return index % 2 === 0;
  }

  protected itemClass(index: number): string {
    const base = 'flex bg-card text-card-foreground';
    if (this.isLead(index)) {
      return `${base} flex-col gap-3 p-6 sm:col-span-2 sm:flex-row sm:items-start sm:gap-5 sm:p-7`;
    }
    return this.showIcon(index)
      ? `${base} flex-col gap-2.5 p-5`
      : `${base} flex-col justify-center gap-1.5 p-5`;
  }

  protected titleClass(index: number): string {
    return this.isLead(index)
      ? 'text-lg font-semibold tracking-tight'
      : 'text-sm font-semibold tracking-tight';
  }

  protected descClass(index: number): string {
    return this.isLead(index)
      ? 'text-sm leading-relaxed text-muted-foreground'
      : 'text-sm text-muted-foreground';
  }
}
