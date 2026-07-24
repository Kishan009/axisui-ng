/**
 * Timeline — an ordered list of events with connected markers. Works in two
 * modes: projected `<ax-timeline-item>` children, or data-driven via `[items]`.
 * Supports vertical/horizontal orientation and an alternating (zig-zag) layout
 * for vertical timelines.
 *
 * @example Projected
 * <ax-timeline>
 *   <ax-timeline-item title="Created" time="Mon">Order placed</ax-timeline-item>
 *   <ax-timeline-item title="Shipped" time="Tue" color="success" />
 * </ax-timeline>
 *
 * @example Data-driven, alternating
 * <ax-timeline [items]="events" align="alternate" />
 */
import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { AxTimelineItemComponent } from './timeline-item.component';
import {
  TIMELINE_CONTEXT,
  type TimelineAlign,
  type TimelineContext,
  type TimelineItem,
  type TimelineOrientation,
} from './timeline.types';

@Component({
  selector: 'ax-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxTimelineItemComponent],
  providers: [{ provide: TIMELINE_CONTEXT, useExisting: forwardRef(() => AxTimelineComponent) }],
  host: {
    '[class]': 'classes()',
    '[attr.role]': "'list'",
    '[attr.data-orientation]': 'orientation()',
  },
  template: `
    @if (items(); as data) {
      @for (item of data; track $index) {
        <ax-timeline-item
          [title]="item.title"
          [time]="item.time ?? null"
          [description]="item.description ?? null"
          [icon]="item.icon ?? null"
          [color]="item.color ?? 'default'"
        />
      }
    } @else {
      <ng-content />
    }
  `,
})
export class AxTimelineComponent implements TimelineContext {
  /** Rail orientation. @default 'vertical' */
  readonly orientation = input<TimelineOrientation>('vertical');
  /** `start` (one side) or `alternate` (zig-zag; vertical only). @default 'start' */
  readonly align = input<TimelineAlign>('start');
  /** Data-driven items. When set, projected content is ignored. @default null */
  readonly items = input<TimelineItem[] | null>(null);

  private readonly alternate = computed(() => this.orientation() === 'vertical' && this.align() === 'alternate');

  protected readonly classes = computed(() =>
    cn(
      'flex',
      this.orientation() === 'vertical' ? 'flex-col' : 'flex-row',
      // hide the connector on the last item
      '[&>ax-timeline-item:last-child_[data-connector]]:hidden',
      // alternating: place even items' content on the opposite side
      this.alternate() && [
        '[&>ax-timeline-item:nth-child(even)>[data-content]]:col-start-3',
        '[&>ax-timeline-item:nth-child(even)>[data-content]]:text-start',
        '[&>ax-timeline-item:nth-child(odd)>[data-content]]:text-end',
      ]
    )
  );
}
