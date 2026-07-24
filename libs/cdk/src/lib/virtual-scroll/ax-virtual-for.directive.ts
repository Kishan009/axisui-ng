/**
 * *axVirtualFor — renders only the windowed rows of a large list inside a
 * `[axVirtualViewport]`. Fixed row height; signals-native (an `effect` recomputes
 * the window from the viewport's scroll/size). No `[style.*]` bindings — sizing
 * and offsets are applied with `Renderer2` (a single spacer creates the
 * scrollbar; each row is absolutely positioned by its index).
 *
 * @example
 * <div axVirtualViewport class="h-80">
 *   <div *axVirtualFor="let row of rows(); itemSize: 40; overscan: 6">{{ row }}</div>
 * </div>
 */
import {
  DestroyRef,
  Directive,
  type EmbeddedViewRef,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';

import { computeRange, totalSize } from './virtual-core';
import { VIRTUAL_VIEWPORT, type VirtualForContext } from './virtual-scroll.types';

/** Viewport height assumed before the real height is measured (SSR / first paint). */
const PREMEASURE_VIEWPORT = 600;

@Directive({
  selector: '[axVirtualFor][axVirtualForOf]',
})
export class AxVirtualForDirective<T> {
  /** The full data array. */
  readonly axVirtualForOf = input.required<readonly T[]>();
  /** Row height in px. */
  readonly axVirtualForItemSize = input.required<number>();
  /** Extra rows rendered beyond the viewport on each side. @default 4 */
  readonly axVirtualForOverscan = input<number>(4);

  private readonly ctx = inject(VIRTUAL_VIEWPORT);
  private readonly vcr = inject(ViewContainerRef);
  private readonly template = inject<TemplateRef<VirtualForContext<T>>>(TemplateRef);
  private readonly renderer = inject(Renderer2);

  private readonly views = new Map<number, EmbeddedViewRef<VirtualForContext<T>>>();
  private spacer: HTMLElement | null = null;
  private lastItems: readonly T[] | null = null;

  constructor() {
    effect(() => this.render());
    inject(DestroyRef).onDestroy(() => {
      this.views.forEach((v) => v.destroy());
      this.views.clear();
      this.spacer?.remove();
    });
  }

  private render(): void {
    const items = this.axVirtualForOf();
    const itemSize = this.axVirtualForItemSize();
    const overscan = this.axVirtualForOverscan();
    const count = items.length;

    // Register row height so the viewport's scrollToIndex works.
    this.ctx.itemSize.set(itemSize);

    // A new array identity -> rebuild from scratch (keeps contexts correct).
    if (items !== this.lastItems) {
      this.clear();
      this.lastItems = items;
    }

    this.ensureSpacer(totalSize(count, itemSize));

    const viewport = this.ctx.viewportSize() || PREMEASURE_VIEWPORT;
    const { start, end } = computeRange(this.ctx.scrollTop(), viewport, itemSize, count, overscan);

    // Drop views that fell out of the window.
    for (const [index, view] of this.views) {
      if (index < start || index >= end) {
        view.destroy();
        this.views.delete(index);
      }
    }
    // Create views that entered the window.
    for (let index = start; index < end; index++) {
      if (this.views.has(index)) continue;
      const view = this.vcr.createEmbeddedView(this.template, {
        $implicit: items[index] as T,
        index,
        count,
        first: index === 0,
        last: index === count - 1,
      });
      this.position(view, index * itemSize);
      this.views.set(index, view);
    }
  }

  private position(view: EmbeddedViewRef<VirtualForContext<T>>, top: number): void {
    const node = view.rootNodes[0] as HTMLElement | undefined;
    if (!node || node.nodeType !== 1) return;
    this.renderer.setStyle(node, 'position', 'absolute');
    this.renderer.setStyle(node, 'top', `${top}px`);
    this.renderer.setStyle(node, 'inset-inline-start', '0');
    this.renderer.setStyle(node, 'width', '100%');
  }

  private ensureSpacer(height: number): void {
    if (!this.spacer) {
      this.spacer = this.renderer.createElement('div') as HTMLElement;
      this.renderer.setStyle(this.spacer, 'width', '1px');
      this.renderer.setAttribute(this.spacer, 'aria-hidden', 'true');
      this.renderer.appendChild(this.ctx.element, this.spacer);
    }
    this.renderer.setStyle(this.spacer, 'height', `${height}px`);
  }

  private clear(): void {
    this.views.forEach((v) => v.destroy());
    this.views.clear();
  }

  /** Lets the template type-check the context (`index`, `first`, ...). */
  static ngTemplateContextGuard<T>(
    _dir: AxVirtualForDirective<T>,
    _ctx: unknown
  ): _ctx is VirtualForContext<T> {
    return true;
  }
}
