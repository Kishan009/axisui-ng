/**
 * axVirtualViewport — the scroll container for a virtual list. Tracks scroll
 * offset + viewport height as signals and provides them (with the row height
 * registered by `*axVirtualFor`) via `VIRTUAL_VIEWPORT`. Exposes `scrollToIndex`.
 *
 * @example
 * <div axVirtualViewport #vp="axVirtualViewport" class="h-80 overflow-auto">
 *   <div *axVirtualFor="let row of rows(); itemSize: 40">{{ row }}</div>
 * </div>
 */
import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  forwardRef,
  inject,
  signal,
} from '@angular/core';

import { VIRTUAL_VIEWPORT, type VirtualViewportContext } from './virtual-scroll.types';

@Directive({
  selector: '[axVirtualViewport]',
  exportAs: 'axVirtualViewport',
  host: {
    class: 'relative block overflow-auto',
    '(scroll)': 'scrollTop.set(element.scrollTop)',
  },
  providers: [
    { provide: VIRTUAL_VIEWPORT, useExisting: forwardRef(() => AxVirtualViewportDirective) },
  ],
})
export class AxVirtualViewportDirective implements VirtualViewportContext {
  readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  readonly scrollTop = signal(0);
  readonly viewportSize = signal(0);
  readonly itemSize = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.viewportSize.set(this.element.clientHeight);
      this.scrollTop.set(this.element.scrollTop);
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.viewportSize.set(this.element.clientHeight));
        ro.observe(this.element);
        destroyRef.onDestroy(() => ro.disconnect());
      }
    });
  }

  /** Scroll so the row at `index` is at the top of the viewport. */
  scrollToIndex(index: number): void {
    this.element.scrollTop = Math.max(0, index) * this.itemSize();
  }

  /** Scroll to an absolute pixel offset. */
  scrollToOffset(px: number): void {
    this.element.scrollTop = Math.max(0, px);
  }
}
