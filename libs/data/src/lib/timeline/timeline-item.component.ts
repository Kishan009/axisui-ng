/**
 * TimelineItem — one event. Used both as a projected child
 * (`<ax-timeline-item title="…">body</ax-timeline-item>`) and rendered by
 * `ax-timeline` from a `[items]` array. Reads orientation/align from the
 * timeline context; renders a tinted marker, an optional connector to the next
 * item (`[data-connector]`, hidden on the last item by the parent), and a
 * content block (`[data-content]`).
 *
 * @example <ax-timeline-item title="Shipped" time="09:00" color="success">Left the warehouse</ax-timeline-item>
 */
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { AxIconComponent, type AxIconName } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import { TIMELINE_CONTEXT, type TimelineColor } from './timeline.types';

const MARKER_BG: Record<TimelineColor, string> = {
  default: 'bg-muted-foreground',
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

@Component({
  selector: 'ax-timeline-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    '[class]': 'hostClasses()',
    '[attr.role]': "'listitem'",
  },
  template: `
    <span [class]="markerWrapClasses()" aria-hidden="true">
      @if (icon()) {
        <span [class]="iconMarkerClasses()">
          <ax-icon [name]="icon()!" [size]="14" />
        </span>
      } @else {
        <span [class]="dotClasses()"></span>
      }
      <span data-connector [class]="connectorClasses()"></span>
    </span>

    <div data-content [class]="contentClasses()">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">{{ title() }}</span>
        @if (time()) {
          <span class="text-xs text-foreground/80">{{ time() }}</span>
        }
      </div>
      @if (description()) {
        <p class="mt-0.5 text-sm text-foreground/80">{{ description() }}</p>
      }
      <ng-content />
    </div>
  `,
})
export class AxTimelineItemComponent {
  /** Event title. */
  readonly title = input.required<string>();
  /** Optional timestamp/meta line. */
  readonly time = input<string | null>(null);
  /** Optional description line. */
  readonly description = input<string | null>(null);
  /** Optional marker icon (replaces the dot). */
  readonly icon = input<AxIconName | null>(null);
  /** Marker tint. @default 'default' */
  readonly color = input<TimelineColor>('default');

  private readonly ctx = inject(TIMELINE_CONTEXT);

  protected readonly isVertical = computed(() => this.ctx.orientation() === 'vertical');
  private readonly isAlternate = computed(() => this.isVertical() && this.ctx.align() === 'alternate');

  protected readonly hostClasses = computed(() => {
    if (this.isAlternate()) return 'grid grid-cols-[1fr_2rem_1fr] items-stretch';
    if (this.isVertical()) return 'flex gap-4';
    return 'flex min-w-32 flex-col items-center gap-2 text-center';
  });

  /** The marker + connector column (a grid/flex child of the host). */
  protected readonly markerWrapClasses = computed(() =>
    cn('flex items-stretch', this.isVertical() && 'flex-col items-center', this.isAlternate() && 'col-start-2')
  );

  protected readonly dotClasses = computed(() =>
    cn('z-10 box-content h-3 w-3 shrink-0 rounded-full ring-4 ring-background', MARKER_BG[this.color()])
  );

  protected readonly iconMarkerClasses = computed(() =>
    cn(
      'z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-background ring-4 ring-background',
      MARKER_BG[this.color()]
    )
  );

  protected readonly connectorClasses = computed(() =>
    cn('bg-border', this.isVertical() ? 'mt-1 w-px flex-1' : 'my-auto ms-1 h-px flex-1')
  );

  protected readonly contentClasses = computed(() =>
    cn(this.isVertical() ? 'pb-6' : 'pt-1', this.isAlternate() && 'col-start-1')
  );
}
