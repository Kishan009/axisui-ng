import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import { SPLITTER_CONTEXT } from './splitter.types';

/**
 * Resize handle / gutter. One implementation, two modes:
 *  - auto: a panel renders it with an explicit [boundary].
 *  - manual: the consumer places it between panels; its boundary is its order
 *    among the root's direct-child handles.
 * role="separator" with arrow / Home / End keyboard and pointer-capture drag.
 */
@Component({
  selector: 'ax-splitter-handle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  host: {
    role: 'separator',
    tabindex: '0',
    // The visible gutter stays `gutterSize` thin, but a `::before` pseudo-element
    // expands the pressable/touch area across the main axis toward the 44px target
    // (Apple HIG) so a coarse pointer can actually grab it. With the default 4px
    // gutter, ±20px (`-inset-*-5`) yields a 44px hit area without widening the visual gutter.
    class:
      "group relative shrink-0 grow-0 self-stretch bg-border touch-none select-none outline-none transition-colors duration-[var(--duration-fast)] ease-out-quart hover:bg-primary/40 active:bg-primary/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 before:absolute before:content-['']",
    '[class.cursor-col-resize]': "ctx.orientation() === 'horizontal'",
    '[class.cursor-row-resize]': "ctx.orientation() === 'vertical'",
    '[class.before:inset-y-0]': "ctx.orientation() === 'horizontal'",
    '[class.before:-inset-x-5]': "ctx.orientation() === 'horizontal'",
    '[class.before:inset-x-0]': "ctx.orientation() === 'vertical'",
    '[class.before:-inset-y-5]': "ctx.orientation() === 'vertical'",
    '[attr.aria-orientation]': "ctx.orientation() === 'horizontal' ? 'vertical' : 'horizontal'",
    '[attr.aria-label]': 'ctx.ariaLabel() || null',
    '[attr.aria-valuenow]': 'valueNow()',
    '[attr.aria-valuemin]': 'valueMin()',
    '[attr.aria-valuemax]': 'valueMax()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(keydown)': 'onKeydown($event)',
    '(dblclick)': 'onDblClick()',
  },
})
export class AxSplitterHandleComponent {
  /** Boundary index when a panel renders this handle (auto mode). Null → resolve by order. */
  readonly boundary = input<number | null>(null);

  protected readonly ctx = inject(SPLITTER_CONTEXT);
  private readonly host = inject(ElementRef<HTMLElement>).nativeElement;

  protected readonly index = computed(() => this.boundary() ?? this.ctx.handleIndex(this));
  protected readonly valueNow = computed(() => Math.round(this.ctx.effectiveSizes()[this.index()] ?? 0));
  protected readonly valueMin = computed(() => Math.round(this.ctx.mins()[this.index()] ?? 0));
  protected readonly valueMax = computed(() => Math.round(this.ctx.maxes()[this.index()] ?? 100));

  private dragging = false;
  private startCoord = 0;

  constructor() {
    const renderer = inject(Renderer2);
    // Gutter thickness on the main axis; the cross axis stretches via self-stretch.
    effect(() => {
      const px = `${this.ctx.gutterSize()}px`;
      const horizontal = this.ctx.orientation() === 'horizontal';
      renderer.setStyle(this.host, horizontal ? 'width' : 'height', px);
      renderer.removeStyle(this.host, horizontal ? 'height' : 'width');
    });
  }

  onPointerDown(e: PointerEvent): void {
    this.dragging = true;
    this.startCoord = this.ctx.orientation() === 'horizontal' ? e.clientX : e.clientY;
    this.host.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const coord = this.ctx.orientation() === 'horizontal' ? e.clientX : e.clientY;
    const deltaPx = coord - this.startCoord;
    this.startCoord = coord;
    this.ctx.resizeBoundary(this.index(), deltaPx);
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.host.hasPointerCapture(e.pointerId)) this.host.releasePointerCapture(e.pointerId);
    this.ctx.endResize(this.index());
  }

  onKeydown(e: KeyboardEvent): void {
    const horizontal = this.ctx.orientation() === 'horizontal';
    const dec = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const inc = horizontal ? 'ArrowRight' : 'ArrowDown';
    switch (e.key) {
      case dec:
        this.ctx.nudgeBoundary(this.index(), -1);
        break;
      case inc:
        this.ctx.nudgeBoundary(this.index(), 1);
        break;
      case 'Home':
        this.ctx.extendBoundary(this.index(), 'min');
        break;
      case 'End':
        this.ctx.extendBoundary(this.index(), 'max');
        break;
      case 'Enter':
        this.ctx.toggleBoundaryCollapse(this.index());
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  onDblClick(): void {
    this.ctx.toggleBoundaryCollapse(this.index());
  }
}
