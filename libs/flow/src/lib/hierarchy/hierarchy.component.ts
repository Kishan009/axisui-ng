/**
 * Hierarchy — renders a single-parent tree of consumer-templated node cards,
 * positioned by the pure `hierarchy-core` layout and joined by SVG connectors.
 * One primitive covers brackets, org charts and decision trees: they differ
 * only in `direction` and the card template. The whole diagram is a single
 * `<svg>` (connectors as `<path>`, cards in `<foreignObject>`) so it scales
 * via its `viewBox` and positions without inline styles.
 *
 * A11y: the svg is a labelled `group`; each card is a real `<button>` whose
 * accessible name comes from the projected content; connectors are decorative.
 *
 * @example
 * <ax-hierarchy [data]="rounds" preset="bracket">
 *   <ng-template #node let-n>
 *     <span>{{ n.data.home }}</span> vs <span>{{ n.data.away }}</span>
 *   </ng-template>
 * </ax-hierarchy>
 */
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';

import {
  type HierarchyBox,
  layoutHierarchy,
  presetDefaults,
} from './hierarchy-core';
import type {
  HierarchyConnector,
  HierarchyDirection,
  HierarchyNode,
  HierarchyNodeClick,
  HierarchyNodeContext,
  HierarchyPreset,
} from './hierarchy.types';

@Component({
  selector: 'ax-hierarchy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class:
      'block overflow-auto [animation:ax-hierarchy-in_var(--duration)_var(--ease-out-quart)]',
  },
  template: `
    <svg
      [attr.width]="layout().width"
      [attr.height]="layout().height"
      [attr.viewBox]="'0 0 ' + layout().width + ' ' + layout().height"
      role="group"
      [attr.aria-label]="ariaLabel()"
      [attr.data-direction]="resolvedDirection()"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g aria-hidden="true" class="text-border">
        @for (edge of layout().edges; track edge.from + '>' + edge.to) {
          <path
            [attr.d]="edge.path"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
          />
        }
      </g>
      @for (box of layout().boxes; track box.id) {
        <foreignObject
          [attr.x]="box.x"
          [attr.y]="box.y"
          [attr.width]="box.w"
          [attr.height]="box.h"
        >
          <div xmlns="http://www.w3.org/1999/xhtml" class="h-full w-full">
            <button
              type="button"
              class="h-full w-full cursor-pointer rounded-lg border border-border bg-card px-3 text-start text-card-foreground transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              [attr.data-depth]="box.depth"
              (click)="onNodeClick(box)"
            >
              @if (nodeTemplate(); as tpl) {
                <ng-container
                  [ngTemplateOutlet]="tpl"
                  [ngTemplateOutletContext]="contextFor(box)"
                />
              }
            </button>
          </div>
        </foreignObject>
      }
    </svg>
  `,
})
export class AxHierarchyComponent<T = unknown> {
  /** The forest of root nodes to lay out. */
  readonly data = input<readonly HierarchyNode<T>[]>([]);
  /** Bundle of sensible defaults; explicit inputs below still win. */
  readonly preset = input<HierarchyPreset | null>(null);
  /** Growth direction; falls back to the preset's, else `tb`. */
  readonly direction = input<HierarchyDirection | null>(null);
  /** Connector style; falls back to the preset's, else `elbow`. */
  readonly connector = input<HierarchyConnector | null>(null);
  /** Card width in px. @default 180 */
  readonly nodeWidth = input(180);
  /** Card height in px. @default 64 */
  readonly nodeHeight = input(64);
  /** Gap between depth levels in px. @default 48 */
  readonly levelGap = input(48);
  /** Gap between siblings in px. @default 16 */
  readonly siblingGap = input(16);
  /** Accessible label for the diagram. @default 'Hierarchy' */
  readonly ariaLabel = input('Hierarchy');

  /** Consumer card template; receives a {@link HierarchyNodeContext}. */
  readonly nodeTemplate = contentChild<TemplateRef<HierarchyNodeContext<T>>>(TemplateRef);

  /** Emits when a node card is activated. */
  readonly nodeClick = output<HierarchyNodeClick<T>>();

  protected readonly resolvedDirection = computed<HierarchyDirection>(() => {
    const explicit = this.direction();
    if (explicit) return explicit;
    const preset = this.preset();
    return preset ? presetDefaults(preset).direction : 'tb';
  });

  private readonly resolvedConnector = computed<HierarchyConnector>(() => {
    const explicit = this.connector();
    if (explicit) return explicit;
    const preset = this.preset();
    return preset ? presetDefaults(preset).connector : 'elbow';
  });

  protected readonly layout = computed(() =>
    layoutHierarchy(this.data(), {
      direction: this.resolvedDirection(),
      connector: this.resolvedConnector(),
      nodeWidth: this.nodeWidth(),
      nodeHeight: this.nodeHeight(),
      levelGap: this.levelGap(),
      siblingGap: this.siblingGap(),
    })
  );

  protected contextFor(box: HierarchyBox<T>): HierarchyNodeContext<T> {
    return {
      $implicit: box.node,
      depth: box.depth,
      expanded: box.expanded,
      hasChildren: box.hasChildren,
    };
  }

  protected onNodeClick(box: HierarchyBox<T>): void {
    this.nodeClick.emit({ node: box.node, depth: box.depth });
  }
}
