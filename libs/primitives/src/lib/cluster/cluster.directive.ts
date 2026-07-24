/**
 * Cluster — a horizontally-flowing layout that wraps when items don't fit.
 * Each child hugs its content; the cluster's `gap` controls spacing.
 *
 * Use Cluster for: button rows, tag lists, pill groups, inline form controls.
 * Don't use it for: vertical layouts (use Stack), grid layouts (use Grid).
 *
 * @example
 * <div axCluster gap="2" justify="start">
 *   <ax-button>Save</ax-button>
 *   <ax-button variant="ghost">Cancel</ax-button>
 * </div>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxClusterJustify = 'start' | 'center' | 'end' | 'between';
export type AxClusterAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type AxClusterGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16';

@Directive({
  selector: '[axCluster]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-cluster]': 'true',
  },
})
export class AxClusterDirective {
  /** Gap between items. @default '2' */
  gap = input<AxClusterGap>('2');

  /** Cross-axis alignment. @default 'center' */
  align = input<AxClusterAlign>('center');

  /** Main-axis distribution. @default 'start' */
  justify = input<AxClusterJustify>('start');

  protected readonly classes = computed(() =>
    cn([
      'flex flex-wrap',
      `gap-${this.gap()}`,
      `items-${this.align()}`,
      `justify-${this.justify()}`,
    ])
  );
}
